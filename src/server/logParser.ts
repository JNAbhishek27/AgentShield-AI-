import { LogEntry, ErrorGroup } from './types.ts';

export interface LogParseResult {
  entries: LogEntry[];
  errorGroups: ErrorGroup[];
  totalErrors: number;
  totalWarnings: number;
  totalInfos: number;
  spikeRatio: number;
  baselineHourlyErrors: number;
  peakHourlyErrors: number;
  detectedServices: string[];
}

export function parseRawLogs(rawContent: string, defaultService = 'app-service'): LogParseResult {
  const lines = rawContent.split(/\r?\n/);
  const entries: LogEntry[] = [];
  let currentEntry: Partial<LogEntry> | null = null;
  let currentStackTrace: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Try parsing as JSON first
    if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
      try {
        const json = JSON.parse(line);
        if (currentEntry) {
          finalizeEntry(currentEntry, currentStackTrace, entries);
          currentEntry = null;
          currentStackTrace = [];
        }

        const sev = normalizeSeverity(json.level || json.severity || json.log_level || (json.error ? 'ERROR' : 'INFO'));
        entries.push({
          id: `log-${entries.length + 1}`,
          timestamp: json.timestamp || json.time || json.ts || new Date().toISOString(),
          severity: sev,
          service: json.service || json.app || defaultService,
          message: json.message || json.msg || JSON.stringify(json),
          rawLine: line,
          lineNumber: i + 1,
          requestId: json.requestId || json.req_id || json.trace_id,
          stackTrace: json.stack ? (Array.isArray(json.stack) ? json.stack : [json.stack]) : undefined,
          metadata: json
        });
        continue;
      } catch {
        // Fall through to text regex parsing
      }
    }

    // Check if line looks like continuation of stack trace (e.g., "  at ...", "Caused by: ...", "File ...")
    const isStackTraceContinuation = /^\s+(at\s+|File\s+"|line\s+\d+|Traceback|Caused by:|\.{3}\s+\d+\s+more)/.test(line);

    if (isStackTraceContinuation && currentEntry) {
      currentStackTrace.push(line.trim());
      continue;
    }

    // New log line pattern: ISO timestamp or [TIMESTAMP]
    const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)/)
      || line.match(/^\[(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?)\]/);

    if (timestampMatch || !currentEntry) {
      if (currentEntry) {
        finalizeEntry(currentEntry, currentStackTrace, entries);
        currentStackTrace = [];
      }

      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      const afterTime = timestampMatch ? line.slice(timestampMatch[0].length).trim() : line;

      // Extract severity
      const sevMatch = afterTime.match(/\b(FATAL|CRITICAL|ERROR|WARN|WARNING|INFO|DEBUG)\b/i);
      const severity = sevMatch ? normalizeSeverity(sevMatch[1]) : 'INFO';

      // Extract service name if in brackets or formatted as [service-name] or service=xyz
      const serviceMatch = line.match(/\[([a-zA-Z0-9_\-]+)\]/) || line.match(/service=([a-zA-Z0-9_\-]+)/);
      const service = serviceMatch ? serviceMatch[1] : defaultService;

      // Extract requestId if present
      const reqIdMatch = line.match(/(?:reqId|requestId|traceId|req_id|request_id)[=:\s]+([a-zA-Z0-9_\-]+)/i);
      const requestId = reqIdMatch ? reqIdMatch[1] : undefined;

      currentEntry = {
        id: `log-${entries.length + 1}`,
        timestamp,
        severity,
        service,
        message: line,
        rawLine: line,
        lineNumber: i + 1,
        requestId,
      };
    } else {
      // Append text to message
      currentEntry.message += '\n' + line;
    }
  }

  if (currentEntry) {
    finalizeEntry(currentEntry, currentStackTrace, entries);
  }

  // Error grouping and fingerprinting
  const errorGroupsMap = new Map<string, ErrorGroup>();
  const detectedServices = new Set<string>();

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfos = 0;

  for (const entry of entries) {
    detectedServices.add(entry.service);

    if (entry.severity === 'ERROR' || entry.severity === 'FATAL') {
      totalErrors++;
      const fp = generateFingerprint(entry.message);
      if (!errorGroupsMap.has(fp)) {
        errorGroupsMap.set(fp, {
          fingerprint: fp,
          messageTemplate: cleanTemplate(entry.message),
          count: 0,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          service: entry.service,
          sampleLogIds: [],
          severity: entry.severity
        });
      }
      const group = errorGroupsMap.get(fp)!;
      group.count++;
      group.lastSeen = entry.timestamp;
      if (group.sampleLogIds.length < 5) {
        group.sampleLogIds.push(entry.id);
      }
    } else if (entry.severity === 'WARN') {
      totalWarnings++;
    } else {
      totalInfos++;
    }
  }

  // Calculate baseline spike ratio:
  // Baseline assumption for normal healthy window vs peak surge
  const baselineHourlyErrors = 5;
  const peakHourlyErrors = Math.max(totalErrors, 1);
  const spikeRatio = Number((peakHourlyErrors / baselineHourlyErrors).toFixed(1));

  return {
    entries,
    errorGroups: Array.from(errorGroupsMap.values()).sort((a, b) => b.count - a.count),
    totalErrors,
    totalWarnings,
    totalInfos,
    spikeRatio,
    baselineHourlyErrors,
    peakHourlyErrors,
    detectedServices: Array.from(detectedServices)
  };
}

function finalizeEntry(entry: Partial<LogEntry>, stack: string[], list: LogEntry[]) {
  if (stack.length > 0) {
    entry.stackTrace = [...stack];
  }
  list.push(entry as LogEntry);
}

function normalizeSeverity(str?: string): LogEntry['severity'] {
  if (!str) return 'INFO';
  const upper = str.toUpperCase();
  if (upper.includes('FATAL') || upper.includes('CRIT')) return 'FATAL';
  if (upper.includes('ERR')) return 'ERROR';
  if (upper.includes('WARN')) return 'WARN';
  if (upper.includes('DEBUG')) return 'DEBUG';
  return 'INFO';
}

function generateFingerprint(msg: string): string {
  // Normalize out IDs, IPs, UUIDs, numbers to find error template
  const normalized = msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>')
    .replace(/\b0x[0-9a-fA-F]+\b/g, '<HEX>')
    .replace(/\b\d{4,}\b/g, '<NUM>')
    .slice(0, 180);
  
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `fp-${Math.abs(hash).toString(16)}`;
}

function cleanTemplate(msg: string): string {
  const firstLine = msg.split('\n')[0];
  return firstLine
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '{uuid}')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '{ip}')
    .slice(0, 140);
}

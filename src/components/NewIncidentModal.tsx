import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api.ts';
import { Incident } from '../types.ts';

interface NewIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated: (newIncident: Incident) => void;
}

const SAMPLE_LOG_PRESETS = [
  {
    name: 'Preset: DB Connection Pool Exhaustion',
    service: 'checkout-service',
    severity: 'Critical',
    title: 'HTTP 500 Spike on Checkout Service: Connection Pool Exhaustion',
    logs: `2026-10-11T20:10:00Z [checkout-service] INFO POST /checkout 200 OK 42ms
2026-10-11T20:10:15Z [checkout-service] WARN Database pool reached 10/10 active connections
2026-10-11T20:10:20Z [checkout-service] ERROR TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool
  at Pool.acquire (/app/node_modules/pg-pool/index.js:312:15)
  at DatabaseService.executeTransaction (/app/src/db/service.ts:84:22)
2026-10-11T20:10:21Z [checkout-service] ERROR HTTP 500 Internal Server Error returned to user
2026-10-11T20:10:25Z [checkout-service] FATAL Database connection starvation: 52 requests blocked in pool backlog
2026-10-11T20:10:30Z [checkout-service] INFO GET /healthz 200 OK host healthy`
  },
  {
    name: 'Preset: Redis vs Read-Replica Replication Lag',
    service: 'catalog-service',
    severity: 'High',
    title: 'Catalog Query Latency Spike: Revised from Redis to Read-Replica Lock Contention',
    logs: `2026-10-11T16:10:01Z [catalog-service] INFO GET /items/featured 200 OK 12ms
2026-10-11T16:10:14Z [catalog-service] WARN Redis cache read latency degraded: 142ms for key catalog:featured
2026-10-11T16:10:15Z [catalog-service] ERROR Read replica query timeout: SELECT * FROM items WHERE category_id = 92 timed out after 4000ms
2026-10-11T16:10:20Z [catalog-service] INFO REDIS INFO: connected_clients=24, used_memory_human=1.2G, hit_ratio=99.6%
2026-10-11T16:10:22Z [catalog-service] ERROR pg_stat_replication lag detected: 48.2 seconds lag on replica node-read-02
2026-10-11T16:10:24Z [catalog-service] ERROR Table lock detected on catalog_items: Migration CREATE INDEX CONCURRENTLY blocked by long running uncommitted transaction PID 9184`
  },
  {
    name: 'Preset: V8 Heap Out of Memory',
    service: 'report-generator',
    severity: 'High',
    title: 'V8 Heap Memory Saturation and SIGABRT Crash in export worker',
    logs: `2026-10-11T12:00:00Z [report-generator] INFO Worker started export job 8812
2026-10-11T12:01:10Z [report-generator] WARN V8 Heap used: 1680MB / 2048MB (82% threshold)
2026-10-11T12:01:25Z [report-generator] ERROR <--- Last few GCs ---> [1:0x559e120] 84210 ms: Mark-sweep 1980.2 (2048.0) -> 1940.1 (2048.0) MB, 1420.4 / 0.0 ms allocation failure
2026-10-11T12:01:30Z [report-generator] FATAL JavaScript heap out of memory. Allocation failed - JavaScript heap out of memory
2026-10-11T12:01:31Z [report-generator] FATAL Process exited with exit code 134 (SIGABRT)`
  }
];

export const NewIncidentModal: React.FC<NewIncidentModalProps> = ({
  isOpen,
  onClose,
  onIncidentCreated
}) => {
  const [title, setTitle] = useState('');
  const [service, setService] = useState('checkout-service');
  const [severity, setSeverity] = useState('Critical');
  const [rawLogs, setRawLogs] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof SAMPLE_LOG_PRESETS[0]) => {
    setTitle(preset.title);
    setService(preset.service);
    setSeverity(preset.severity);
    setRawLogs(preset.logs);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawLogs(text);
      if (!title) {
        setTitle(`Production Incident Ingested from ${file.name}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !service.trim() || !rawLogs.trim()) {
      setErrorMsg('Please provide a title, service name, and log content.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await api.createIncident({
        title,
        severity,
        affectedService: service,
        rawLogs
      });
      onIncidentCreated(created);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to ingest incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-[#0d1527] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Ingest Incident & Logs</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300">
              {errorMsg}
            </div>
          )}

          {/* Quick Preset Presets */}
          <div>
            <span className="block text-slate-400 font-medium mb-1.5">
              Quick Load Sample Incident Preset:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_LOG_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-[11px] font-medium transition"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Incident Title
              </label>
              <input
                type="text"
                placeholder="e.g. HTTP 500 Connection Pool Exhaustion on payment-gateway"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Affected Service
              </label>
              <input
                type="text"
                placeholder="e.g. payment-gateway"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Upload Log / JSON File (Max 10MB)
              </label>
              <input
                type="file"
                accept=".log,.txt,.json"
                onChange={handleFileUpload}
                className="w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[11px] file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Raw Log Text / JSON Records
            </label>
            <textarea
              rows={8}
              placeholder="Paste raw log lines or JSON lines with timestamps, stack traces, and error events..."
              value={rawLogs}
              onChange={(e) => setRawLogs(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded font-mono text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-sm transition"
            >
              {isSubmitting ? 'Ingesting...' : 'Ingest & Parse Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

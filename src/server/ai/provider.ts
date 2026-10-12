export interface InvestigationContext {
  incidentTitle: string;
  severity: string;
  affectedService: string;
  errorCount: number;
  spikeRatio: number;
  recentLogs: Array<{
    id: string;
    lineNumber: number;
    timestamp: string;
    severity: string;
    service: string;
    message: string;
    stackTrace?: string[];
  }>;
  recentChanges?: string;
  documentationSnippets?: Array<{ title: string; excerpt: string; source: string }>;
  existingHypotheses?: any[];
}

export interface InvestigationAIResponse {
  hypotheses: Array<{
    title: string;
    explanation: string;
    category: 'database' | 'memory_leak' | 'network_timeout' | 'auth_failure' | 'concurrency' | 'dependency_failure' | 'config_drift';
    modelConfidenceScore: number;
    supportingEvidence: Array<{
      sourceLocation: string;
      excerpt: string;
      relevanceExplanation: string;
    }>;
    contradictingEvidence: Array<{
      sourceLocation: string;
      excerpt: string;
      relevanceExplanation: string;
    }>;
    missingInformation: string[];
    recommendedDiagnosticStep: string;
  }>;
  executiveSummary: string;
  uncertaintyFactors: string[];
  recommendedImmediateAction: string;
  tokensUsed?: number;
  latencyMs: number;
  provider: string;
  model: string;
}

export interface PatchContext {
  incidentTitle: string;
  rootCause: string;
  affectedFile: string;
  currentCode: string;
  errorLogExcerpt: string;
}

export interface PatchAIResponse {
  title: string;
  explanation: string;
  targetFile: string;
  diff: string;
  patchedCode: string;
  unitTestCode: string;
  tokensUsed?: number;
  latencyMs: number;
  provider: string;
  model: string;
}

export interface AIProvider {
  id: 'nebius' | 'mock';
  displayName: string;
  model: string;
  isConfigured(): boolean;
  checkHealth(): Promise<{ ok: boolean; message: string; latencyMs?: number }>;
  investigate(ctx: InvestigationContext): Promise<InvestigationAIResponse>;
  generatePatch(ctx: PatchContext): Promise<PatchAIResponse>;
}

export class NebiusAIProvider implements AIProvider {
  id: 'nebius' = 'nebius';
  displayName = 'Nebius Token Factory (NVIDIA Open-Source)';
  baseUrl: string;
  apiKey: string;
  model: string;

  constructor() {
    this.baseUrl = (process.env.NEBIUS_BASE_URL || 'https://api.studio.nebius.ai/v1').replace(/\/+$/, '');
    this.apiKey = process.env.NEBIUS_API_KEY || '';
    this.model = process.env.NEBIUS_MODEL || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey !== 'your-nebius-token-factory-api-key' && this.apiKey.trim().length > 5);
  }

  async checkHealth(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
    if (!this.isConfigured()) {
      return {
        ok: false,
        message: 'NEBIUS_API_KEY is not set or using placeholder. Set your Nebius Token Factory API key to enable live NVIDIA Nemotron inference.'
      };
    }

    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const text = await response.text();
        return {
          ok: false,
          message: `Nebius API responded with status ${response.status}: ${text.slice(0, 150)}`,
          latencyMs
        };
      }

      return {
        ok: true,
        message: `Connected to Nebius Token Factory (${this.model})`,
        latencyMs
      };
    } catch (err: any) {
      return {
        ok: false,
        message: `Nebius connection error: ${err.message || 'Unknown network error'}`
      };
    }
  }

  async investigate(ctx: InvestigationContext): Promise<InvestigationAIResponse> {
    const startTime = Date.now();

    const systemPrompt = `You are AgentShield, an evidence-driven AI incident investigator.
Analyze the incident logs and context.
CRITICAL RULES:
1. ONLY cite real log lines and line numbers provided in the input. NEVER invent line numbers or fabricate log lines.
2. Formulate 2-3 distinct hypotheses with clear supporting AND contradicting evidence.
3. Explicitly report uncertainty and missing information.
4. Respond in valid JSON matching this structure:
{
  "hypotheses": [
    {
      "title": "string",
      "explanation": "string",
      "category": "database" | "memory_leak" | "network_timeout" | "auth_failure" | "concurrency" | "dependency_failure" | "config_drift",
      "modelConfidenceScore": 0-100,
      "supportingEvidence": [
        {
          "sourceLocation": "file:line",
          "excerpt": "quoted log line",
          "relevanceExplanation": "why this supports"
        }
      ],
      "contradictingEvidence": [
        {
          "sourceLocation": "file:line",
          "excerpt": "quoted log line",
          "relevanceExplanation": "why this contradicts or limits"
        }
      ],
      "missingInformation": ["item1", "item2"],
      "recommendedDiagnosticStep": "string"
    }
  ],
  "executiveSummary": "string",
  "uncertaintyFactors": ["string"],
  "recommendedImmediateAction": "string"
}`;

    const userPrompt = `INCIDENT DETAILS:
Title: ${ctx.incidentTitle}
Severity: ${ctx.severity}
Service: ${ctx.affectedService}
Total Errors: ${ctx.errorCount} (Spike ratio: ${ctx.spikeRatio}x baseline)

LOG SAMPLES (${ctx.recentLogs.length} entries):
${ctx.recentLogs.map(l => `[Line ${l.lineNumber}] [${l.timestamp}] [${l.severity}] [${l.service}] ${l.message}`).join('\n')}

RECENT CHANGES:
${ctx.recentChanges || 'No recent code commits deployed in the last 2 hours.'}

Produce the structured evidence-driven investigation JSON.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(30000),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Nebius API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    const tokensUsed = data.usage?.total_tokens;

    return {
      hypotheses: parsed.hypotheses || [],
      executiveSummary: parsed.executiveSummary || 'Investigation completed by NVIDIA Nemotron.',
      uncertaintyFactors: parsed.uncertaintyFactors || [],
      recommendedImmediateAction: parsed.recommendedImmediateAction || 'Review connection pool parameters and inspect slow query log.',
      tokensUsed,
      latencyMs,
      provider: this.displayName,
      model: this.model
    };
  }

  async generatePatch(ctx: PatchContext): Promise<PatchAIResponse> {
    const startTime = Date.now();

    const systemPrompt = `You are AgentShield Code Remediation Agent.
Propose a safe, minimal code patch that resolves the confirmed root cause without introducing regressions.
CRITICAL RULES:
1. Provide a unified git diff format.
2. Provide the complete patched file content.
3. Provide an isolated unit test that proves the fix.
4. Output JSON:
{
  "title": "string",
  "explanation": "string",
  "targetFile": "string",
  "diff": "string",
  "patchedCode": "string",
  "unitTestCode": "string"
}`;

    const userPrompt = `INCIDENT: ${ctx.incidentTitle}
CONFIRMED ROOT CAUSE: ${ctx.rootCause}
TARGET FILE: ${ctx.affectedFile}
CURRENT CODE:
${ctx.currentCode}

ERROR LOG EXCERPT:
${ctx.errorLogExcerpt}

Generate the minimal safe remediation patch and unit test in JSON.`;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
      signal: AbortSignal.timeout(30000),
    });

    const latencyMs = Date.now() - startTime;
    if (!response.ok) {
      throw new Error(`Nebius API error (${response.status}): ${await response.text()}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      title: parsed.title || 'Remediate resource timeout and connection leak',
      explanation: parsed.explanation || 'Fix connection exhaustion and ensure proper release.',
      targetFile: ctx.affectedFile,
      diff: parsed.diff || '',
      patchedCode: parsed.patchedCode || ctx.currentCode,
      unitTestCode: parsed.unitTestCode || '',
      tokensUsed: data.usage?.total_tokens,
      latencyMs,
      provider: this.displayName,
      model: this.model
    };
  }
}

export class DeterministicMockProvider implements AIProvider {
  id: 'mock' = 'mock';
  displayName = 'Deterministic Mock Provider (NVIDIA Nemotron Simulation)';
  model = 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF [Simulated]';

  isConfigured(): boolean {
    return true;
  }

  async checkHealth(): Promise<{ ok: boolean; message: string; latencyMs?: number }> {
    return {
      ok: true,
      message: 'Deterministic Mock Provider is ready. Reproducible evidence-grounded hypotheses active.',
      latencyMs: 12
    };
  }

  async investigate(ctx: InvestigationContext): Promise<InvestigationAIResponse> {
    const start = Date.now();
    // Simulate real inference delay for realism
    await new Promise(r => setTimeout(r, 650));

    // Analyze actual logs in context to find real line numbers and patterns
    const dbLines = ctx.recentLogs.filter(l => /pool|timeout|connection|deadlock|postgres|database/i.test(l.message));
    const memoryLines = ctx.recentLogs.filter(l => /heap|memory|out of memory|oom|garbage|leak/i.test(l.message));
    const authLines = ctx.recentLogs.filter(l => /auth|token|jwt|unauthorized|forbidden|clock skew/i.test(l.message));
    const rateLimitLines = ctx.recentLogs.filter(l => /429|rate limit|quota|throttle/i.test(l.message));
    const tlsLines = ctx.recentLogs.filter(l => /certificate|ssl|tls|expired/i.test(l.message));

    let primaryCategory: 'database' | 'memory_leak' | 'network_timeout' | 'auth_failure' | 'concurrency' | 'dependency_failure' | 'config_drift' = 'database';
    let primaryTitle = 'Database Connection Pool Exhaustion under Peak Traffic';
    let primaryExplanation = 'Connection pool limit (default 10) was exceeded during checkout surge, causing pending queries to block until the 5000ms acquisition timeout expired.';
    let primarySupport = dbLines.slice(0, 3).map(l => ({
      sourceLocation: `${l.service}.log:${l.lineNumber}`,
      excerpt: l.message.split('\n')[0],
      relevanceExplanation: `Direct error log showing connection timeout and pool exhaustion at line ${l.lineNumber}.`
    }));

    if (memoryLines.length > dbLines.length) {
      primaryCategory = 'memory_leak';
      primaryTitle = 'Heap Memory Saturation Causing Stop-the-World GC Freezes';
      primaryExplanation = 'Unbounded in-memory report streaming buffered 140MB of raw records into a single JSON array, causing V8 GC pauses exceeding health check tolerances.';
      primarySupport = memoryLines.slice(0, 3).map(l => ({
        sourceLocation: `${l.service}.log:${l.lineNumber}`,
        excerpt: l.message.split('\n')[0],
        relevanceExplanation: `Evidence of memory saturation and heavy garbage collection pause.`
      }));
    } else if (authLines.length > dbLines.length) {
      primaryCategory = 'auth_failure';
      primaryTitle = 'JWT Signing Key Clock Skew after NTP Drift';
      primaryExplanation = 'Recent host time-sync mismatch caused token validation to fail with "nbf/iat in the future" for incoming authorization headers.';
      primarySupport = authLines.slice(0, 3).map(l => ({
        sourceLocation: `${l.service}.log:${l.lineNumber}`,
        excerpt: l.message.split('\n')[0],
        relevanceExplanation: `Log indicates auth token verification rejection.`
      }));
    } else if (tlsLines.length > 0) {
      primaryCategory = 'dependency_failure';
      primaryTitle = 'Internal TLS Certificate Expiration on Payment Gateway Mutual-TLS';
      primaryExplanation = 'The service client failed to negotiate mTLS handshake due to expired intermediate certificate authority.';
      primarySupport = tlsLines.slice(0, 3).map(l => ({
        sourceLocation: `${l.service}.log:${l.lineNumber}`,
        excerpt: l.message.split('\n')[0],
        relevanceExplanation: `Evidence shows SSL handshake failure.`
      }));
    } else if (rateLimitLines.length > 0) {
      primaryCategory = 'network_timeout';
      primaryTitle = 'Upstream Third-Party Rate Limit Throttle with Linear Backoff Trap';
      primaryExplanation = 'Downstream workers failed to implement exponential jitter, causing thundering-herd 429 cascades.';
      primarySupport = rateLimitLines.slice(0, 3).map(l => ({
        sourceLocation: `${l.service}.log:${l.lineNumber}`,
        excerpt: l.message.split('\n')[0],
        relevanceExplanation: `429 Too Many Requests response observed in logs.`
      }));
    }

    if (primarySupport.length === 0 && ctx.recentLogs.length > 0) {
      const topLog = ctx.recentLogs[0];
      primarySupport.push({
        sourceLocation: `${topLog.service}.log:${topLog.lineNumber}`,
        excerpt: topLog.message.split('\n')[0],
        relevanceExplanation: `Observed error trace on line ${topLog.lineNumber}.`
      });
    }

    // Check for contradictory evidence
    const contradictingLines = ctx.recentLogs.filter(l => /healthy|ping 200|redis ok|db idle/i.test(l.message));
    const contradictionEvidence = contradictingLines.slice(0, 2).map(l => ({
      sourceLocation: `${l.service}.log:${l.lineNumber}`,
      excerpt: l.message.split('\n')[0],
      relevanceExplanation: 'Health-check endpoint reported 200 OK intermittently, suggesting failure is localized to checkout worker threads rather than total host crash.'
    }));

    const hypotheses = [
      {
        title: primaryTitle,
        explanation: primaryExplanation,
        category: primaryCategory,
        modelConfidenceScore: 88,
        supportingEvidence: primarySupport,
        contradictingEvidence: contradictionEvidence,
        missingInformation: [
          'PostgreSQL pg_stat_activity view snapshot at T+0s peak to verify active client connection count',
          'Network packet capture between application pod and database VPC endpoint'
        ],
        recommendedDiagnosticStep: 'Inspect connection pool idle timeout and increase max_connections with connection pooling proxy (PgBouncer).'
      },
      {
        title: 'Network Packet Loss on Internal VPC Peering Bridge',
        explanation: 'Intermittent socket resets could mimic database pool acquisition timeouts if syn-ack packets were dropped.',
        category: 'network_timeout' as const,
        modelConfidenceScore: 32,
        supportingEvidence: [],
        contradictingEvidence: [
          {
            sourceLocation: 'system_metrics.prom:§latency',
            excerpt: 'VPC intra-zone latency stayed at 0.42ms without packet retransmissions',
            relevanceExplanation: 'Network infrastructure metrics contradict generalized routing or physical packet loss hypothesis.'
          }
        ],
        missingInformation: [
          'Interface drop counters on AWS ENI / cloud vNIC'
        ],
        recommendedDiagnosticStep: 'Run mtr / traceroute between pods during load test to rule out networking route tables.'
      }
    ];

    return {
      hypotheses,
      executiveSummary: `AgentShield investigated ${ctx.errorCount} errors (${ctx.spikeRatio}x baseline) across ${ctx.affectedService}. Identified ${primaryTitle} as probable root cause with ${primarySupport.length} verified log citations.`,
      uncertaintyFactors: [
        'No direct database engine metrics (pg_stat_activity) available in ingested logs',
        'Uncertain whether pool exhaustion was triggered by slow query locks or connection leak in unclosed transaction block'
      ],
      recommendedImmediateAction: 'Increase connection pool max capacity from 10 to 50 and wrap database checkout calls in guaranteed finally { client.release() } blocks.',
      tokensUsed: 620,
      latencyMs: Date.now() - start,
      provider: this.displayName,
      model: this.model
    };
  }

  async generatePatch(ctx: PatchContext): Promise<PatchAIResponse> {
    const start = Date.now();
    await new Promise(r => setTimeout(r, 450));

    const diff = `--- a/src/db/pool.ts
+++ b/src/db/pool.ts
@@ -12,8 +12,12 @@ export const pool = new Pool({
   host: process.env.DB_HOST,
   database: process.env.DB_NAME,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
-  max: 10,
-  connectionTimeoutMillis: 2000,
+  max: 50,
+  min: 5,
+  idleTimeoutMillis: 10000,
+  connectionTimeoutMillis: 5000,
+  statement_timeout: 3000,
+  allowExitOnIdle: true
 });
+
+export async function withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
+  const client = await pool.connect();
+  try {
+    await client.query('BEGIN');
+    const result = await fn(client);
+    await client.query('COMMIT');
+    return result;
+  } catch (err) {
+    await client.query('ROLLBACK');
+    throw err;
+  } finally {
+    client.release();
+  }
+}`;

    const patchedCode = `import { Pool } from 'pg';

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'prod_db',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD,
  max: 50,
  min: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 3000,
  allowExitOnIdle: true
});

export async function withTransaction<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release(); // Guaranteed connection release prevents leaks
  }
}
`;

    const unitTestCode = `describe('Database Pool Resilience Test', () => {
  it('should acquire and release connections under concurrent load without exhausting pool', async () => {
    const promises = Array.from({ length: 40 }).map(async (_, idx) => {
      return withTransaction(async (client) => {
        return { success: true, worker: idx };
      });
    });
    const results = await Promise.all(promises);
    expect(results.length).toBe(40);
    expect(pool.totalCount).toBeLessThanOrEqual(50);
  });
});`;

    return {
      title: 'Enlarge Pool Size and Implement Safe withTransaction Release Wrapper',
      explanation: 'Expands pool capacity to 50 connections, sets defensive 5s acquisition timeout with 3s statement timeout, and enforces client.release() in a finally block to eliminate connection leakage.',
      targetFile: ctx.affectedFile || 'src/db/pool.ts',
      diff,
      patchedCode,
      unitTestCode,
      tokensUsed: 480,
      latencyMs: Date.now() - start,
      provider: this.displayName,
      model: this.model
    };
  }
}

export class AIProviderManager {
  private activeProvider: AIProvider;
  private nebiusProvider: NebiusAIProvider;
  private mockProvider: DeterministicMockProvider;

  constructor() {
    this.nebiusProvider = new NebiusAIProvider();
    this.mockProvider = new DeterministicMockProvider();

    const envPref = (process.env.AI_PROVIDER || '').toLowerCase();
    if (envPref === 'nebius' && this.nebiusProvider.isConfigured()) {
      this.activeProvider = this.nebiusProvider;
    } else {
      this.activeProvider = this.mockProvider;
    }
  }

  getActiveProvider(): AIProvider {
    return this.activeProvider;
  }

  setActiveProvider(id: 'nebius' | 'mock'): boolean {
    if (id === 'nebius') {
      this.activeProvider = this.nebiusProvider;
      return true;
    } else {
      this.activeProvider = this.mockProvider;
      return true;
    }
  }

  getProvidersInfo() {
    return [
      {
        id: this.mockProvider.id,
        displayName: this.mockProvider.displayName,
        model: this.mockProvider.model,
        configured: true,
        active: this.activeProvider.id === 'mock',
      },
      {
        id: this.nebiusProvider.id,
        displayName: this.nebiusProvider.displayName,
        model: this.nebiusProvider.model,
        configured: this.nebiusProvider.isConfigured(),
        active: this.activeProvider.id === 'nebius',
        baseUrl: this.nebiusProvider.baseUrl,
      }
    ];
  }

  updateNebiusConfig(apiKey?: string, baseUrl?: string, model?: string) {
    if (apiKey !== undefined) this.nebiusProvider.apiKey = apiKey;
    if (baseUrl !== undefined) this.nebiusProvider.baseUrl = baseUrl.replace(/\/+$/, '');
    if (model !== undefined) this.nebiusProvider.model = model;
  }
}

export const aiProviderManager = new AIProviderManager();

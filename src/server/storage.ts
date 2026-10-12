import fs from 'node:fs';
import path from 'node:path';
import {
  Incident,
  AuditRecord,
  EvaluationRunSummary
} from './types.ts';
import { parseRawLogs } from './logParser.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');
const EVALS_FILE = path.join(DATA_DIR, 'evaluations.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export class StorageRepository {
  private incidents: Map<string, Incident> = new Map();
  private auditRecords: AuditRecord[] = [];
  private evaluationRuns: EvaluationRunSummary[] = [];

  constructor() {
    ensureDataDir();
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(INCIDENTS_FILE)) {
        const raw = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
        const list: Incident[] = JSON.parse(raw);
        for (const inc of list) {
          this.incidents.set(inc.id, inc);
        }
      } else {
        this.seedDemoIncidents();
        this.saveIncidentsToDisk();
      }

      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        this.auditRecords = JSON.parse(raw);
      }

      if (fs.existsSync(EVALS_FILE)) {
        const raw = fs.readFileSync(EVALS_FILE, 'utf-8');
        this.evaluationRuns = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load storage from disk, resetting seeds:', err);
      this.seedDemoIncidents();
      this.saveIncidentsToDisk();
    }
  }

  private saveIncidentsToDisk() {
    ensureDataDir();
    const list = Array.from(this.incidents.values());
    const tempFile = `${INCIDENTS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(list, null, 2), 'utf-8');
    fs.renameSync(tempFile, INCIDENTS_FILE);
  }

  private saveAuditToDisk() {
    ensureDataDir();
    const tempFile = `${AUDIT_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.auditRecords, null, 2), 'utf-8');
    fs.renameSync(tempFile, AUDIT_FILE);
  }

  private saveEvalsToDisk() {
    ensureDataDir();
    const tempFile = `${EVALS_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.evaluationRuns, null, 2), 'utf-8');
    fs.renameSync(tempFile, EVALS_FILE);
  }

  public getIncidents(): Incident[] {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getIncident(id: string): Incident | undefined {
    return this.incidents.get(id);
  }

  public saveIncident(incident: Incident): Incident {
    this.incidents.set(incident.id, incident);
    this.saveIncidentsToDisk();
    return incident;
  }

  public deleteIncident(id: string): boolean {
    const deleted = this.incidents.delete(id);
    if (deleted) {
      this.saveIncidentsToDisk();
    }
    return deleted;
  }

  public getAuditRecords(incidentId?: string): AuditRecord[] {
    if (incidentId) {
      return this.auditRecords.filter(r => r.incidentId === incidentId);
    }
    return [...this.auditRecords].reverse();
  }

  public addAuditRecord(record: AuditRecord): void {
    this.auditRecords.push(record);
    // Keep max 1000 records
    if (this.auditRecords.length > 1000) {
      this.auditRecords.shift();
    }
    this.saveAuditToDisk();
  }

  public getEvaluationRuns(): EvaluationRunSummary[] {
    return [...this.evaluationRuns].reverse();
  }

  public addEvaluationRun(run: EvaluationRunSummary): void {
    this.evaluationRuns.push(run);
    this.saveEvalsToDisk();
  }

  public resetDemoData() {
    this.incidents.clear();
    this.seedDemoIncidents();
    this.saveIncidentsToDisk();
  }

  private seedDemoIncidents() {
    // ----------------------------------------------------
    // Demo Incident 1: DB Connection Pool Exhaustion (INC-8942)
    // ----------------------------------------------------
    const inc1RawLogs = `2026-10-11T19:42:01.120Z [payment-gateway] INFO [req_id=f4a10e82] POST /v1/charges 200 OK duration=48ms
2026-10-11T19:42:04.412Z [payment-gateway] INFO [req_id=a992bc11] POST /v1/charges 200 OK duration=52ms
2026-10-11T19:42:15.010Z [payment-gateway] WARN [req_id=b331ea01] Database pool usage reached 8/10 active connections
2026-10-11T19:42:18.841Z [payment-gateway] WARN [req_id=c77432f9] Database pool usage reached 10/10 active connections. Queueing incoming checkout requests.
2026-10-11T19:42:23.901Z [payment-gateway] ERROR [req_id=e91024aa] TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool
  at Pool.acquire (/app/node_modules/pg-pool/index.js:312:15)
  at DatabaseService.executeTransaction (/app/src/db/service.ts:84:22)
  at ChargeHandler.processPayment (/app/src/controllers/charge.ts:45:11)
2026-10-11T19:42:24.112Z [payment-gateway] ERROR [req_id=ab8120fa] HTTP 500 Internal Server Error returned to client: Database acquisition timeout
2026-10-11T19:42:25.040Z [payment-gateway] ERROR [req_id=cb9310de] TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool
  at Pool.acquire (/app/node_modules/pg-pool/index.js:312:15)
  at DatabaseService.executeTransaction (/app/src/db/service.ts:84:22)
2026-10-11T19:42:26.510Z [payment-gateway] ERROR [req_id=d01284ba] KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) or forgetting to commit/rollback?
2026-10-11T19:42:28.190Z [payment-gateway] ERROR [req_id=aa3910ff] TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool
2026-10-11T19:42:30.400Z [payment-gateway] FATAL [req_id=f9910011] Database connection starvation: 48 requests waiting in backlog, 0 idle connections
2026-10-11T19:42:32.100Z [payment-gateway] INFO [req_id=sys-health] GET /healthz 200 OK { "status": "UP", "uptime": 48210 }
2026-10-11T19:42:35.800Z [payment-gateway] ERROR [req_id=b9841280] TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool
2026-10-11T19:42:40.220Z [payment-gateway] ERROR [req_id=cd884102] HTTP 500 Internal Server Error returned to client: Database acquisition timeout`;

    const inc1Parsed = parseRawLogs(inc1RawLogs, 'payment-gateway');

    const inc1: Incident = {
      id: 'INC-8942',
      title: 'HTTP 500 Spike & Database Connection Pool Exhaustion on payment-gateway',
      severity: 'Critical',
      status: 'Awaiting Approval',
      affectedService: 'payment-gateway',
      createdAt: '2026-10-11T19:42:00.000Z',
      isDemo: true,
      demoKey: 'demo-db-pool',
      timeWindow: {
        start: '2026-10-11T19:40:00.000Z',
        end: '2026-10-11T19:45:00.000Z'
      },
      metrics: {
        errorCount: inc1Parsed.totalErrors,
        errorSpikeRatio: 8.4,
        p99LatencyMs: 5120,
        affectedRequestCount: 142
      },
      logs: inc1Parsed.entries,
      errorGroups: inc1Parsed.errorGroups,
      investigationSteps: [
        {
          stepNumber: 1,
          name: 'Parse Incident Logs & Metrics',
          status: 'completed',
          startedAt: '2026-10-11T19:43:00.000Z',
          completedAt: '2026-10-11T19:43:02.000Z',
          summary: `Extracted ${inc1Parsed.entries.length} log lines. Detected 8.4x error spike on payment-gateway.`
        },
        {
          stepNumber: 2,
          name: 'Cluster Error Traces & Stack Frames',
          status: 'completed',
          startedAt: '2026-10-11T19:43:02.000Z',
          completedAt: '2026-10-11T19:43:03.000Z',
          summary: 'Identified primary cluster: pg-pool ResourceRequest timeout (5000ms acquisition limit).'
        },
        {
          stepNumber: 3,
          name: 'Search Architecture Docs & Past Runbooks',
          status: 'completed',
          startedAt: '2026-10-11T19:43:03.000Z',
          completedAt: '2026-10-11T19:43:04.000Z',
          summary: 'Matched runbook RB-402: "Database Pool Exhaustion Under Flash Sale Traffic".'
        },
        {
          stepNumber: 4,
          name: 'Generate Candidate Hypotheses via NVIDIA Nemotron',
          status: 'completed',
          startedAt: '2026-10-11T19:43:04.000Z',
          completedAt: '2026-10-11T19:43:06.000Z',
          summary: 'Generated 2 hypotheses: (1) Pool size saturation + unreleased transaction, (2) Upstream network timeout.'
        },
        {
          stepNumber: 5,
          name: 'Weight & Rank Evidence Citations',
          status: 'completed',
          startedAt: '2026-10-11T19:43:06.000Z',
          completedAt: '2026-10-11T19:43:07.000Z',
          summary: 'Hypothesis 1 confirmed with 4 direct log citations. Hypothesis 2 contradicted by health check.'
        },
        {
          stepNumber: 6,
          name: 'Synthesize Safe Patch & Run Sandbox Tests',
          status: 'completed',
          startedAt: '2026-10-11T19:43:07.000Z',
          completedAt: '2026-10-11T19:43:09.000Z',
          summary: 'Proposed pool configuration update and transactional client.release() wrapper. Unit tests passed.'
        },
        {
          stepNumber: 7,
          name: 'Compile Audit Trail & Await Human Approval',
          status: 'completed',
          startedAt: '2026-10-11T19:43:09.000Z',
          completedAt: '2026-10-11T19:43:10.000Z',
          summary: 'Incident report generated. Awaiting authorized engineering sign-off.'
        }
      ],
      hypotheses: [
        {
          id: 'hyp-1',
          title: 'Database Connection Pool Exhaustion under Peak Traffic Surge',
          explanation: 'Connection pool default max capacity of 10 was reached at 19:42:18Z. High-concurrency checkout volume queued requests until the 5000ms acquisition limit expired, returning HTTP 500s.',
          category: 'database',
          deterministicConfidenceScore: 92,
          modelConfidenceScore: 89,
          supportingEvidenceIds: ['ev-1', 'ev-2', 'ev-3'],
          contradictingEvidenceIds: ['ev-4'],
          missingInformation: [
            'Direct pg_stat_activity connection table snapshot during the incident window',
            'Database CPU and IOPS utilization graph from cloud provider RDS'
          ],
          recommendedDiagnosticStep: 'Increase connection pool max capacity from 10 to 50, configure PgBouncer connection multiplexing, and ensure withTransaction releases clients on error.',
          status: 'confirmed'
        },
        {
          id: 'hyp-2',
          title: 'Total Host Infrastructure Crash / Network Severance',
          explanation: 'Physical server network failure or total container crash causing complete communication outage.',
          category: 'network_timeout',
          deterministicConfidenceScore: 18,
          modelConfidenceScore: 22,
          supportingEvidenceIds: [],
          contradictingEvidenceIds: ['ev-4'],
          missingInformation: [
            'VPC flow logs and container runtime health check stats'
          ],
          recommendedDiagnosticStep: 'Review load balancer target group healthy host count.',
          status: 'refuted'
        }
      ],
      evidence: [
        {
          id: 'ev-1',
          sourceType: 'log',
          sourceLocation: 'payment-gateway.log:4',
          timestamp: '2026-10-11T19:42:18.841Z',
          excerpt: 'Database pool usage reached 10/10 active connections. Queueing incoming checkout requests.',
          relevanceExplanation: 'Deterministic log proof that the pool reached 100% capacity prior to timeouts.',
          supportsHypothesisId: 'hyp-1',
          verified: true
        },
        {
          id: 'ev-2',
          sourceType: 'log',
          sourceLocation: 'payment-gateway.log:5',
          timestamp: '2026-10-11T19:42:23.901Z',
          excerpt: 'TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool',
          relevanceExplanation: 'Direct stack trace showing pool acquisition timeout in DatabaseService.executeTransaction.',
          supportsHypothesisId: 'hyp-1',
          verified: true
        },
        {
          id: 'ev-3',
          sourceType: 'log',
          sourceLocation: 'payment-gateway.log:8',
          timestamp: '2026-10-11T19:42:26.510Z',
          excerpt: 'KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full.',
          relevanceExplanation: 'Secondary query builder confirms pool starvation and possible missing transaction commit/rollback.',
          supportsHypothesisId: 'hyp-1',
          verified: true
        },
        {
          id: 'ev-4',
          sourceType: 'log',
          sourceLocation: 'payment-gateway.log:11',
          timestamp: '2026-10-11T19:42:32.100Z',
          excerpt: 'GET /healthz 200 OK { "status": "UP", "uptime": 48210 }',
          relevanceExplanation: 'Proves the host container was alive and responding to non-database health endpoints, refuting total host crash.',
          contradictsHypothesisId: 'hyp-2',
          verified: true
        }
      ],
      proposedPatches: [
        {
          id: 'patch-1',
          title: 'Scale Connection Pool to 50 & Wrap withTransaction Release',
          explanation: 'Expands pool maximum from 10 to 50 connections, sets defensive 5s acquisition timeout, and wraps transactional code in guaranteed finally block to prevent connection leaks.',
          targetFile: 'src/db/pool.ts',
          diff: `--- a/src/db/pool.ts
+++ b/src/db/pool.ts
@@ -10,7 +10,11 @@ export const pool = new Pool({
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
 });`,
          originalCode: `export const pool = new Pool({
   host: process.env.DB_HOST,
   database: process.env.DB_NAME,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   max: 10,
   connectionTimeoutMillis: 2000,
 });`,
          patchedCode: `export const pool = new Pool({
   host: process.env.DB_HOST,
   database: process.env.DB_NAME,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   max: 50,
   min: 5,
   idleTimeoutMillis: 10000,
   connectionTimeoutMillis: 5000,
   statement_timeout: 3000,
   allowExitOnIdle: true
 });`,
          staticValidation: {
            passed: true,
            checks: [
              { name: 'TypeScript Syntax & AST Check', passed: true, details: 'Valid TypeScript, no AST parse errors' },
              { name: 'Security & Sanitization', passed: true, details: 'No unescaped SQL injections or secret leaks' },
              { name: 'Resource Leak Guard', passed: true, details: 'Guaranteed finally release verified' }
            ]
          },
          testExecution: {
            executed: true,
            passed: true,
            exitCode: 0,
            durationMs: 380,
            output: 'PASS src/db/pool.spec.ts\n  ✓ should handle 40 concurrent database requests without timeout (182 ms)\n  ✓ should release connections on simulated query error (45 ms)\n\nTest Suites: 1 passed, 1 total\nTests:       2 passed, 2 total\nSnapshots:   0 total\nTime:        0.380 s',
            isolationType: 'Isolated Node.js VM Subprocess Sandbox (No Network Egress)'
          },
          status: 'validated'
        }
      ],
      approvalHistory: [],
      rootCauseConfidence: {
        score: 92,
        explanation: 'Confirmed by multiple independent log citations (pool saturation warning, Knex error, pg-pool timeout). Refuted network partition via successful /healthz probes.',
        uncertaintyFactors: [
          'Direct pg_stat_activity view snapshot at T+0s peak unavailable',
          'Exact unreleased transaction handler not yet isolated to single endpoint'
        ]
      }
    };

    // ----------------------------------------------------
    // Demo Incident 2: Hypothesis Revision on New Evidence (INC-7104)
    // ----------------------------------------------------
    const inc2RawLogs = `2026-10-11T16:10:01.000Z [catalog-service] INFO [req_id=c1092] GET /items/featured 200 OK 12ms
2026-10-11T16:10:14.000Z [catalog-service] WARN [req_id=c1095] Redis cache read latency degraded: 142ms for key catalog:featured
2026-10-11T16:10:15.000Z [catalog-service] ERROR [req_id=c1102] Read replica query timeout: SELECT * FROM items WHERE category_id = 92 timed out after 4000ms
2026-10-11T16:10:18.000Z [catalog-service] ERROR [req_id=c1110] Read replica query timeout: SELECT * FROM items WHERE category_id = 92 timed out after 4000ms
2026-10-11T16:10:20.000Z [catalog-service] INFO [req_id=ops-diag] REDIS INFO: connected_clients=24, used_memory_human=1.2G, instantaneous_ops_per_sec=4500, hit_ratio=99.6%
2026-10-11T16:10:22.000Z [catalog-service] ERROR [req_id=c1125] pg_stat_replication lag detected: 48.2 seconds lag on replica node-read-02
2026-10-11T16:10:24.000Z [catalog-service] ERROR [req_id=c1130] Table lock detected on catalog_items: Migration CREATE INDEX CONCURRENTLY blocked by long running uncommitted transaction PID 9184`;

    const inc2Parsed = parseRawLogs(inc2RawLogs, 'catalog-service');

    const inc2: Incident = {
      id: 'INC-7104',
      title: 'Catalog Query Latency Spike: Revised from Redis Outage to Read-Replica Lock Contention',
      severity: 'High',
      status: 'Investigating',
      affectedService: 'catalog-service',
      createdAt: '2026-10-11T16:10:00.000Z',
      isDemo: true,
      demoKey: 'demo-hypothesis-revision',
      timeWindow: {
        start: '2026-10-11T16:08:00.000Z',
        end: '2026-10-11T16:15:00.000Z'
      },
      metrics: {
        errorCount: inc2Parsed.totalErrors,
        errorSpikeRatio: 6.2,
        p99LatencyMs: 4200,
        affectedRequestCount: 94
      },
      logs: inc2Parsed.entries,
      errorGroups: inc2Parsed.errorGroups,
      investigationSteps: [
        {
          stepNumber: 1,
          name: 'Parse Incident Logs & Metrics',
          status: 'completed',
          startedAt: '2026-10-11T16:11:00.000Z',
          completedAt: '2026-10-11T16:11:01.000Z',
          summary: 'Ingested 7 log entries. Identified degraded response times.'
        },
        {
          stepNumber: 2,
          name: 'Evaluate Initial Cache Degradation Hypothesis',
          status: 'completed',
          startedAt: '2026-10-11T16:11:01.000Z',
          completedAt: '2026-10-11T16:11:02.000Z',
          summary: 'Initial warning at 16:10:14 suggested Redis failure. Retrying diagnosis...'
        },
        {
          stepNumber: 3,
          name: 'Inspect Diagnostic Probes & Refute Initial Cause',
          status: 'completed',
          startedAt: '2026-10-11T16:11:02.000Z',
          completedAt: '2026-10-11T16:11:03.000Z',
          summary: 'REDIS INFO diagnostic proved 99.6% hit ratio. Refuted Redis hypothesis.'
        },
        {
          stepNumber: 4,
          name: 'Revise Hypothesis to Read-Replica Lock Contention',
          status: 'completed',
          startedAt: '2026-10-11T16:11:03.000Z',
          completedAt: '2026-10-11T16:11:04.000Z',
          summary: 'Discovered 48s replication lag and lock contention caused by uncommitted migration.'
        }
      ],
      hypotheses: [
        {
          id: 'hyp-revised-1',
          title: 'Postgres Read-Replica Replication Lag & Lock Contention from Uncommitted DDL',
          explanation: 'A migration script executed an index build that blocked on long-running uncommitted transaction PID 9184, accumulating 48.2s of replication lag and causing read timeouts.',
          category: 'database',
          deterministicConfidenceScore: 94,
          modelConfidenceScore: 91,
          supportingEvidenceIds: ['ev-201', 'ev-202'],
          contradictingEvidenceIds: [],
          missingInformation: [
            'Query text being executed by PID 9184 before termination'
          ],
          recommendedDiagnosticStep: 'Terminate blocking PID 9184 via pg_terminate_backend(9184) and reschedule CREATE INDEX CONCURRENTLY outside peak hours.',
          status: 'confirmed'
        },
        {
          id: 'hyp-revised-2',
          title: 'Upstream Redis Cache Cluster Degradation',
          explanation: 'Initial suspicion that Redis cache cluster had evictions or high memory fragmentation causing fallback to database.',
          category: 'dependency_failure',
          deterministicConfidenceScore: 8,
          modelConfidenceScore: 12,
          supportingEvidenceIds: ['ev-203'],
          contradictingEvidenceIds: ['ev-204'],
          missingInformation: [],
          recommendedDiagnosticStep: 'Disproven by REDIS INFO stats showing 99.6% hit ratio.',
          status: 'refuted'
        }
      ],
      evidence: [
        {
          id: 'ev-201',
          sourceType: 'log',
          sourceLocation: 'catalog-service.log:6',
          timestamp: '2026-10-11T16:10:22.000Z',
          excerpt: 'pg_stat_replication lag detected: 48.2 seconds lag on replica node-read-02',
          relevanceExplanation: 'Direct evidence of catastrophic replication delay.',
          supportsHypothesisId: 'hyp-revised-1',
          verified: true
        },
        {
          id: 'ev-202',
          sourceType: 'log',
          sourceLocation: 'catalog-service.log:7',
          timestamp: '2026-10-11T16:10:24.000Z',
          excerpt: 'Table lock detected on catalog_items: Migration CREATE INDEX CONCURRENTLY blocked by long running uncommitted transaction PID 9184',
          relevanceExplanation: 'Identifies the exact blocking transaction and locking resource.',
          supportsHypothesisId: 'hyp-revised-1',
          verified: true
        },
        {
          id: 'ev-203',
          sourceType: 'log',
          sourceLocation: 'catalog-service.log:2',
          timestamp: '2026-10-11T16:10:14.000Z',
          excerpt: 'Redis cache read latency degraded: 142ms for key catalog:featured',
          relevanceExplanation: 'Initial misleading warning that prompted the original cache hypothesis.',
          supportsHypothesisId: 'hyp-revised-2',
          verified: true
        },
        {
          id: 'ev-204',
          sourceType: 'log',
          sourceLocation: 'catalog-service.log:5',
          timestamp: '2026-10-11T16:10:20.000Z',
          excerpt: 'REDIS INFO: connected_clients=24, used_memory_human=1.2G, instantaneous_ops_per_sec=4500, hit_ratio=99.6%',
          relevanceExplanation: 'Contradicts Redis degradation hypothesis by demonstrating healthy memory and near-perfect hit ratio.',
          contradictsHypothesisId: 'hyp-revised-2',
          verified: true
        }
      ],
      proposedPatches: [
        {
          id: 'patch-201',
          title: 'Add Statement Timeout to DDL Migrations & Terminate Lock Blocks',
          explanation: 'Enforces lock_timeout = "3s" on migrations to prevent indefinite table locking, and adds replica lag fallback routing to primary.',
          targetFile: 'src/db/replicaRouter.ts',
          diff: `--- a/src/db/replicaRouter.ts
+++ b/src/db/replicaRouter.ts
@@ -15,4 +15,9 @@ export function selectReplica(replicas: ReplicaNode[]): ReplicaNode {
-  return replicas[Math.floor(Math.random() * replicas.length)];
+  const healthy = replicas.filter(r => r.replicationLagSeconds < 5);
+  if (healthy.length === 0) {
+    console.warn('All replicas lagging > 5s, routing read query to primary database');
+    return getPrimaryNode();
+  }
+  return healthy[0];
 }`,
          originalCode: `export function selectReplica(replicas: ReplicaNode[]): ReplicaNode {
   return replicas[Math.floor(Math.random() * replicas.length)];
}`,
          patchedCode: `export function selectReplica(replicas: ReplicaNode[]): ReplicaNode {
   const healthy = replicas.filter(r => r.replicationLagSeconds < 5);
   if (healthy.length === 0) {
     console.warn('All replicas lagging > 5s, routing read query to primary database');
     return getPrimaryNode();
   }
   return healthy[0];
}`,
          staticValidation: {
            passed: true,
            checks: [
              { name: 'TypeScript AST Check', passed: true, details: 'Type check passed' },
              { name: 'Fallback Circuit Breaker Check', passed: true, details: 'Primary failover verified' }
            ]
          },
          testExecution: {
            executed: true,
            passed: true,
            exitCode: 0,
            durationMs: 290,
            output: 'PASS src/db/replicaRouter.spec.ts\n  ✓ routes to primary when replicas exceed 5s replication lag (110 ms)\n\nTests: 1 passed, 1 total',
            isolationType: 'Isolated Node.js VM Subprocess Sandbox'
          },
          status: 'validated'
        }
      ],
      approvalHistory: [],
      rootCauseConfidence: {
        score: 94,
        explanation: 'Hypothesis revision verified by definitive pg_stat_replication logs and REDIS INFO health counters.',
        uncertaintyFactors: [
          'Root cause of transaction PID 9184 delay requires historical query audit log'
        ]
      }
    };

    // ----------------------------------------------------
    // Demo Incident 3: Memory Leak / GC Freezes (INC-9318)
    // ----------------------------------------------------
    const inc3RawLogs = `2026-10-11T12:00:00.000Z [report-generator] INFO Worker started export job 8812
2026-10-11T12:01:10.000Z [report-generator] WARN V8 Heap used: 1680MB / 2048MB (82% threshold)
2026-10-11T12:01:25.000Z [report-generator] ERROR <--- Last few GCs ---> [1:0x559e120] 84210 ms: Mark-sweep 1980.2 (2048.0) -> 1940.1 (2048.0) MB, 1420.4 / 0.0 ms (average mu = 0.120, current mu = 0.021) allocation failure scavenge might not succeed
2026-10-11T12:01:30.000Z [report-generator] FATAL JavaScript heap out of memory. Allocation failed - JavaScript heap out of memory
2026-10-11T12:01:31.000Z [report-generator] FATAL Process exited with exit code 134 (SIGABRT)`;

    const inc3Parsed = parseRawLogs(inc3RawLogs, 'report-generator');

    const inc3: Incident = {
      id: 'INC-9318',
      title: 'V8 Heap Memory Saturation and SIGABRT Crash in report-generator Export Worker',
      severity: 'High',
      status: 'Resolved',
      affectedService: 'report-generator',
      createdAt: '2026-10-11T12:00:00.000Z',
      resolvedAt: '2026-10-11T12:20:00.000Z',
      isDemo: true,
      demoKey: 'demo-memory-leak',
      timeWindow: {
        start: '2026-10-11T11:58:00.000Z',
        end: '2026-10-11T12:05:00.000Z'
      },
      metrics: {
        errorCount: inc3Parsed.totalErrors,
        errorSpikeRatio: 5.0,
        p99LatencyMs: 8200,
        affectedRequestCount: 18
      },
      logs: inc3Parsed.entries,
      errorGroups: inc3Parsed.errorGroups,
      investigationSteps: [
        {
          stepNumber: 1,
          name: 'Parse Incident Logs & Metrics',
          status: 'completed',
          summary: 'Detected V8 Heap OOM crash with exit code 134.'
        },
        {
          stepNumber: 2,
          name: 'Cluster Error Traces',
          status: 'completed',
          summary: 'Identified Mark-sweep allocation failure taking 1420ms GC pause.'
        },
        {
          stepNumber: 3,
          name: 'Search Documentation & Runbooks',
          status: 'completed',
          summary: 'Referenced streaming guidelines: "Node.js Stream Transforms vs Array Buffering".'
        },
        {
          stepNumber: 4,
          name: 'Generate Remediation Patch',
          status: 'completed',
          summary: 'Replaced Array.push() buffering with pipeline(createReadStream, csvTransform, res).'
        },
        {
          stepNumber: 5,
          name: 'Human Review & Approval',
          status: 'completed',
          summary: 'Approved by lead DevOps engineer and deployed to staging.'
        }
      ],
      hypotheses: [
        {
          id: 'hyp-301',
          title: 'Unbuffered In-Memory Array Aggregation during Bulk Export',
          explanation: 'The CSV export endpoint loaded 2.5M records into an in-memory array before serializing, exceeding the 2GB max_old_space_size container limit.',
          category: 'memory_leak',
          deterministicConfidenceScore: 98,
          modelConfidenceScore: 96,
          supportingEvidenceIds: ['ev-301', 'ev-302'],
          contradictingEvidenceIds: [],
          missingInformation: [
            'Heap dump snapshot .heapsnapshot prior to termination'
          ],
          recommendedDiagnosticStep: 'Convert endpoint to Node.js stream pipeline using JSONStream and csv-stringify stream transforms.',
          status: 'confirmed'
        }
      ],
      evidence: [
        {
          id: 'ev-301',
          sourceType: 'log',
          sourceLocation: 'report-generator.log:3',
          timestamp: '2026-10-11T12:01:25.000Z',
          excerpt: 'Mark-sweep 1980.2 (2048.0) -> 1940.1 (2048.0) MB, 1420.4 / 0.0 ms allocation failure',
          relevanceExplanation: 'Deterministic V8 garbage collector diagnostic proving heap exhaustion at 2048MB boundary.',
          supportsHypothesisId: 'hyp-301',
          verified: true
        },
        {
          id: 'ev-302',
          sourceType: 'log',
          sourceLocation: 'report-generator.log:4',
          timestamp: '2026-10-11T12:01:30.000Z',
          excerpt: 'JavaScript heap out of memory. Allocation failed - JavaScript heap out of memory',
          relevanceExplanation: 'Fatal OOM termination string.',
          supportsHypothesisId: 'hyp-301',
          verified: true
        }
      ],
      proposedPatches: [
        {
          id: 'patch-301',
          title: 'Stream Export Results with pipeline()',
          explanation: 'Uses Node.js stream pipeline to stream records row-by-row, bounding heap usage to < 40MB regardless of dataset size.',
          targetFile: 'src/services/exportService.ts',
          diff: `--- a/src/services/exportService.ts
+++ b/src/services/exportService.ts
@@ -20,6 +20,4 @@ export async function exportReport(query, res) {
-  const rows = await db.select('*').from('transactions');
-  const csv = stringify(rows);
-  res.send(csv);
+  const stream = db.select('*').from('transactions').stream();
+  await pipeline(stream, new CsvTransformer(), res);
 }`,
          originalCode: `export async function exportReport(query, res) {
   const rows = await db.select('*').from('transactions');
   const csv = stringify(rows);
   res.send(csv);
}`,
          patchedCode: `export async function exportReport(query, res) {
   const stream = db.select('*').from('transactions').stream();
   await pipeline(stream, new CsvTransformer(), res);
}`,
          staticValidation: {
            passed: true,
            checks: [
              { name: 'Stream Backpressure Validation', passed: true, details: 'pipeline() correctly propagates backpressure and handles error events' }
            ]
          },
          testExecution: {
            executed: true,
            passed: true,
            exitCode: 0,
            durationMs: 420,
            output: 'PASS src/services/exportService.spec.ts\n  ✓ handles 100,000 streamed records under 35MB heap memory (280 ms)\n\nTests: 1 passed, 1 total',
            isolationType: 'Isolated Node.js VM Subprocess Sandbox'
          },
          status: 'applied_simulation'
        }
      ],
      approvalHistory: [
        {
          id: 'appr-301',
          actionProposed: 'Apply streaming memory patch to report-generator worker',
          reviewerDecision: 'Approve',
          reviewerName: 'Sarah Chen (Staff DevOps)',
          timestamp: '2026-10-11T12:15:00.000Z',
          associatedEvidenceIds: ['ev-301', 'ev-302'],
          testResultsSummary: 'Unit tests passed with < 35MB heap retention verified in sandbox.',
          comment: 'Essential fix. Memory pressure eliminated.'
        }
      ],
      rootCauseConfidence: {
        score: 98,
        explanation: 'Direct V8 GC output and heap exhaustion crash log leave zero ambiguity regarding memory exhaustion.',
        uncertaintyFactors: []
      }
    };

    this.incidents.set(inc1.id, inc1);
    this.incidents.set(inc2.id, inc2);
    this.incidents.set(inc3.id, inc3);

    // Initial audit log
    this.auditRecords = [
      {
        id: 'aud-101',
        timestamp: '2026-10-11T19:43:00.000Z',
        incidentId: 'INC-8942',
        agentAction: 'INGEST_LOGS',
        toolInvoked: 'logParser.parseRawLogs',
        inputParameters: { lineCount: 14, defaultService: 'payment-gateway' },
        outputSummary: 'Parsed 14 log lines, detected 7 errors and 8.4x error spike',
        providerUsed: 'system',
        modelUsed: 'deterministic-regex-ast',
        latencyMs: 14,
        actor: 'system'
      },
      {
        id: 'aud-102',
        timestamp: '2026-10-11T19:43:04.000Z',
        incidentId: 'INC-8942',
        agentAction: 'HYPOTHESIS_GENERATION',
        toolInvoked: 'aiProvider.investigate',
        inputParameters: { incidentId: 'INC-8942', severity: 'Critical' },
        outputSummary: 'Generated 2 hypotheses with supporting/contradicting evidence',
        providerUsed: 'Nebius Token Factory (NVIDIA Open-Source)',
        modelUsed: 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
        latencyMs: 1240,
        tokensUsed: 620,
        actor: 'agent'
      },
      {
        id: 'aud-103',
        timestamp: '2026-10-11T19:43:08.000Z',
        incidentId: 'INC-8942',
        agentAction: 'RUN_SANDBOX_TESTS',
        toolInvoked: 'patchLab.executeSandboxTest',
        inputParameters: { patchId: 'patch-1', suite: 'src/db/pool.spec.ts' },
        outputSummary: 'Executed 2 tests in isolated VM sandbox: 2 passed, exitCode 0',
        providerUsed: 'sandbox-runner',
        modelUsed: 'node-isolated-vm',
        latencyMs: 380,
        actor: 'agent'
      }
    ];
  }
}

export const storageRepo = new StorageRepository();

import { Incident } from '../types.ts';

export const DEMO_INCIDENTS: Incident[] = [
  {
    id: 'INC-8942',
    title: 'HTTP 500 Spike & Connection Pool Exhaustion after Deploy v2.4.1',
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
      errorCount: 142,
      errorSpikeRatio: 8.4,
      p99LatencyMs: 5120,
      affectedRequestCount: 142
    },
    logs: [
      {
        id: 'log-1',
        lineNumber: 1,
        timestamp: '2026-10-11T19:42:01.120Z',
        severity: 'INFO',
        service: 'payment-gateway',
        message: 'POST /v1/charges 200 OK duration=48ms',
        rawLine: '2026-10-11T19:42:01.120Z [payment-gateway] INFO [req_id=f4a10e82] POST /v1/charges 200 OK duration=48ms',
        requestId: 'f4a10e82'
      },
      {
        id: 'log-2',
        lineNumber: 2,
        timestamp: '2026-10-11T19:42:04.412Z',
        severity: 'INFO',
        service: 'payment-gateway',
        message: 'POST /v1/charges 200 OK duration=52ms',
        rawLine: '2026-10-11T19:42:04.412Z [payment-gateway] INFO [req_id=a992bc11] POST /v1/charges 200 OK duration=52ms',
        requestId: 'a992bc11'
      },
      {
        id: 'log-3',
        lineNumber: 3,
        timestamp: '2026-10-11T19:42:15.010Z',
        severity: 'WARN',
        service: 'payment-gateway',
        message: 'Database pool usage reached 8/10 active connections',
        rawLine: '2026-10-11T19:42:15.010Z [payment-gateway] WARN [req_id=b331ea01] Database pool usage reached 8/10 active connections',
        requestId: 'b331ea01'
      },
      {
        id: 'log-4',
        lineNumber: 4,
        timestamp: '2026-10-11T19:42:18.841Z',
        severity: 'WARN',
        service: 'payment-gateway',
        message: 'Database pool usage reached 10/10 active connections. Queueing incoming checkout requests.',
        rawLine: '2026-10-11T19:42:18.841Z [payment-gateway] WARN [req_id=c77432f9] Database pool usage reached 10/10 active connections. Queueing incoming checkout requests.',
        requestId: 'c77432f9'
      },
      {
        id: 'log-5',
        lineNumber: 5,
        timestamp: '2026-10-11T19:42:23.901Z',
        severity: 'ERROR',
        service: 'payment-gateway',
        message: 'TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool\n  at Pool.acquire (/app/node_modules/pg-pool/index.js:312:15)\n  at DatabaseService.executeTransaction (/app/src/db/service.ts:84:22)',
        rawLine: '2026-10-11T19:42:23.901Z [payment-gateway] ERROR [req_id=e91024aa] TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool',
        requestId: 'e91024aa',
        stackTrace: [
          'at Pool.acquire (/app/node_modules/pg-pool/index.js:312:15)',
          'at DatabaseService.executeTransaction (/app/src/db/service.ts:84:22)'
        ]
      },
      {
        id: 'log-6',
        lineNumber: 6,
        timestamp: '2026-10-11T19:42:24.112Z',
        severity: 'ERROR',
        service: 'payment-gateway',
        message: 'HTTP 500 Internal Server Error returned to client: Database acquisition timeout',
        rawLine: '2026-10-11T19:42:24.112Z [payment-gateway] ERROR [req_id=ab8120fa] HTTP 500 Internal Server Error returned to client: Database acquisition timeout',
        requestId: 'ab8120fa'
      },
      {
        id: 'log-7',
        lineNumber: 7,
        timestamp: '2026-10-11T19:42:26.510Z',
        severity: 'ERROR',
        service: 'payment-gateway',
        message: 'KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full. Are you missing a .transacting(trx) or forgetting to commit/rollback?',
        rawLine: '2026-10-11T19:42:26.510Z [payment-gateway] ERROR [req_id=d01284ba] KnexTimeoutError: Knex: Timeout acquiring a connection.',
        requestId: 'd01284ba'
      },
      {
        id: 'log-8',
        lineNumber: 8,
        timestamp: '2026-10-11T19:42:30.400Z',
        severity: 'FATAL',
        service: 'payment-gateway',
        message: 'Database connection starvation: 48 requests waiting in backlog, 0 idle connections',
        rawLine: '2026-10-11T19:42:30.400Z [payment-gateway] FATAL [req_id=f9910011] Database connection starvation: 48 requests waiting in backlog, 0 idle connections',
        requestId: 'f9910011'
      },
      {
        id: 'log-9',
        lineNumber: 9,
        timestamp: '2026-10-11T19:42:32.100Z',
        severity: 'INFO',
        service: 'payment-gateway',
        message: 'GET /healthz 200 OK { "status": "UP", "uptime": 48210 }',
        rawLine: '2026-10-11T19:42:32.100Z [payment-gateway] INFO [req_id=sys-health] GET /healthz 200 OK { "status": "UP", "uptime": 48210 }',
        requestId: 'sys-health'
      }
    ],
    errorGroups: [
      {
        fingerprint: 'fp-pg-pool-timeout',
        messageTemplate: 'TimeoutError: ResourceRequest timed out after 5000ms waiting for available client in pool',
        count: 112,
        firstSeen: '2026-10-11T19:42:23.901Z',
        lastSeen: '2026-10-11T19:42:40.220Z',
        service: 'payment-gateway',
        sampleLogIds: ['log-5', 'log-7'],
        severity: 'ERROR'
      }
    ],
    investigationSteps: [
      {
        stepNumber: 1,
        name: 'Parse Incident Logs & Compute Anomaly Metrics',
        status: 'completed',
        summary: 'Extracted 9 log entries. Detected 8.4x baseline error surge on payment-gateway post-deploy.'
      },
      {
        stepNumber: 2,
        name: 'Cluster Error Traces & Stack Frames',
        status: 'completed',
        summary: 'Identified pg-pool ResourceRequest timeout cluster (5000ms acquisition limit).'
      },
      {
        stepNumber: 3,
        name: 'Search Knowledge Base & Runbooks',
        status: 'completed',
        summary: 'Matched runbook RB-402: "Database Pool Exhaustion Under Flash Sale Traffic".'
      },
      {
        stepNumber: 4,
        name: 'Generate Candidate Hypotheses via AI Engine',
        status: 'completed',
        summary: 'Formulated 2 hypotheses: (1) Pool size saturation + unreleased client, (2) Total host crash.'
      },
      {
        stepNumber: 5,
        name: 'Evaluate Evidence & Check Contradictions',
        status: 'completed',
        summary: 'Confirmed hypothesis 1 with 3 direct citations. Refuted hypothesis 2 using healthy /healthz probe.'
      },
      {
        stepNumber: 6,
        name: 'Synthesize Remediation Patch & Run Static Checks',
        status: 'completed',
        summary: 'Drafted connection pool expansion and withTransaction release wrapper. Static checks passed.'
      },
      {
        stepNumber: 7,
        name: 'Run Sandbox Test & Await Human Approval',
        status: 'completed',
        summary: 'Simulated test runner passed (Exit code 0). Paused: Awaiting human sign-off.'
      }
    ],
    hypotheses: [
      {
        id: 'hyp-1',
        title: 'Database Connection Pool Exhaustion under Peak Traffic',
        explanation: 'Connection pool default max capacity of 10 was saturated at 19:42:18Z following deployment v2.4.1. Incoming queries queued until the 5000ms acquisition timeout expired, causing cascading HTTP 500 errors.',
        category: 'database',
        deterministicConfidenceScore: 92,
        modelConfidenceScore: 89,
        supportingEvidenceIds: ['ev-1', 'ev-2', 'ev-3'],
        contradictingEvidenceIds: ['ev-4'],
        missingInformation: [
          'Direct pg_stat_activity view snapshot during peak window',
          'RDS database host CPU / disk IOPS metrics'
        ],
        recommendedDiagnosticStep: 'Increase connection pool max capacity from 10 to 50, configure PgBouncer pooling proxy, and wrap transactions in guaranteed finally release blocks.',
        status: 'confirmed'
      },
      {
        id: 'hyp-2',
        title: 'Total Host Infrastructure Crash / Network Severance',
        explanation: 'Suspected physical network partition or container hypervisor crash causing complete communication outage.',
        category: 'network_timeout',
        deterministicConfidenceScore: 18,
        modelConfidenceScore: 22,
        supportingEvidenceIds: [],
        contradictingEvidenceIds: ['ev-4'],
        missingInformation: ['VPC flow logs and container runtime health check stats'],
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
        sourceLocation: 'payment-gateway.log:7',
        timestamp: '2026-10-11T19:42:26.510Z',
        excerpt: 'KnexTimeoutError: Knex: Timeout acquiring a connection. The pool is probably full.',
        relevanceExplanation: 'Secondary query builder confirms pool starvation and possible missing transaction commit/rollback.',
        supportsHypothesisId: 'hyp-1',
        verified: true
      },
      {
        id: 'ev-4',
        sourceType: 'log',
        sourceLocation: 'payment-gateway.log:9',
        timestamp: '2026-10-11T19:42:32.100Z',
        excerpt: 'GET /healthz 200 OK { "status": "UP", "uptime": 48210 }',
        relevanceExplanation: 'Contradicts host crash hypothesis by proving container runtime is alive and responding to non-database health endpoints.',
        contradictsHypothesisId: 'hyp-2',
        verified: true
      }
    ],
    proposedPatches: [
      {
        id: 'patch-1',
        title: 'Scale Connection Pool to 50 & Enforce Guaranteed Release Wrapper',
        explanation: 'Expands pool maximum from 10 to 50 connections, sets defensive 5s acquisition timeout with 3s statement timeout, and wraps transactional code in guaranteed finally release block.',
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
            { name: 'TypeScript Syntax & AST Balance', passed: true, details: 'Valid TypeScript, braces and brackets structurally balanced' },
            { name: 'Privileged API Guard', passed: true, details: 'No unauthorized child process execution or eval() calls' },
            { name: 'Timeout Constraints Check', passed: true, details: 'All connection acquisition timeouts bounded to < 10000ms' }
          ]
        },
        testExecution: {
          executed: true,
          passed: true,
          exitCode: 0,
          durationMs: 380,
          output: `=== Simulated Sandbox Test Runner ===
[NOTE: Simulated results in local environment - no production systems modified]
Suite: tests/pool_concurrency.test.ts

  PASS  Connection Pool Concurrency
    ✓ initializes pool with max capacity of 50 connections (42ms)
    ✓ acquires and releases 40 concurrent clients without timeout (180ms)
    ✓ verifies transaction rollback on query rejection (32ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Time:        0.380s
Ran all test suites in isolated sandbox.`,
          isolationType: 'Isolated Node.js VM Subprocess Sandbox (Simulated Environment)'
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
  },
  {
    id: 'INC-7104',
    title: 'Catalog Latency Surge: Revised from Redis Cache to Postgres Replica Lag',
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
      errorCount: 68,
      errorSpikeRatio: 6.2,
      p99LatencyMs: 4200,
      affectedRequestCount: 94
    },
    logs: [
      {
        id: 'log-201',
        lineNumber: 1,
        timestamp: '2026-10-11T16:10:01.000Z',
        severity: 'INFO',
        service: 'catalog-service',
        message: 'GET /items/featured 200 OK 12ms',
        rawLine: '2026-10-11T16:10:01.000Z [catalog-service] INFO [req_id=c1092] GET /items/featured 200 OK 12ms',
        requestId: 'c1092'
      },
      {
        id: 'log-202',
        lineNumber: 2,
        timestamp: '2026-10-11T16:10:14.000Z',
        severity: 'WARN',
        service: 'catalog-service',
        message: 'Redis cache read latency degraded: 142ms for key catalog:featured',
        rawLine: '2026-10-11T16:10:14.000Z [catalog-service] WARN [req_id=c1095] Redis cache read latency degraded: 142ms for key catalog:featured',
        requestId: 'c1095'
      },
      {
        id: 'log-203',
        lineNumber: 3,
        timestamp: '2026-10-11T16:10:15.000Z',
        severity: 'ERROR',
        service: 'catalog-service',
        message: 'Read replica query timeout: SELECT * FROM items WHERE category_id = 92 timed out after 4000ms',
        rawLine: '2026-10-11T16:10:15.000Z [catalog-service] ERROR [req_id=c1102] Read replica query timeout',
        requestId: 'c1102'
      },
      {
        id: 'log-204',
        lineNumber: 4,
        timestamp: '2026-10-11T16:10:20.000Z',
        severity: 'INFO',
        service: 'catalog-service',
        message: 'REDIS INFO: connected_clients=24, used_memory_human=1.2G, instantaneous_ops_per_sec=4500, hit_ratio=99.6%',
        rawLine: '2026-10-11T16:10:20.000Z [catalog-service] INFO [req_id=ops-diag] REDIS INFO: hit_ratio=99.6%',
        requestId: 'ops-diag'
      },
      {
        id: 'log-205',
        lineNumber: 5,
        timestamp: '2026-10-11T16:10:22.000Z',
        severity: 'ERROR',
        service: 'catalog-service',
        message: 'pg_stat_replication lag detected: 48.2 seconds lag on replica node-read-02',
        rawLine: '2026-10-11T16:10:22.000Z [catalog-service] ERROR [req_id=c1125] pg_stat_replication lag detected: 48.2 seconds lag',
        requestId: 'c1125'
      },
      {
        id: 'log-206',
        lineNumber: 6,
        timestamp: '2026-10-11T16:10:24.000Z',
        severity: 'ERROR',
        service: 'catalog-service',
        message: 'Table lock detected on catalog_items: Migration CREATE INDEX CONCURRENTLY blocked by long running uncommitted transaction PID 9184',
        rawLine: '2026-10-11T16:10:24.000Z [catalog-service] ERROR [req_id=c1130] Table lock detected on catalog_items',
        requestId: 'c1130'
      }
    ],
    errorGroups: [],
    investigationSteps: [
      {
        stepNumber: 1,
        name: 'Parse Incident Logs & Metrics',
        status: 'completed',
        summary: 'Ingested 6 log entries. Identified degraded response times on catalog queries.'
      },
      {
        stepNumber: 2,
        name: 'Evaluate Initial Cache Degradation Hypothesis',
        status: 'completed',
        summary: 'Initial warning at 16:10:14 suggested Redis failure. Retrying diagnosis...'
      },
      {
        stepNumber: 3,
        name: 'Inspect Diagnostic Probes & Refute Initial Cause',
        status: 'completed',
        summary: 'REDIS INFO diagnostic proved 99.6% hit ratio. Refuted Redis degradation hypothesis.'
      },
      {
        stepNumber: 4,
        name: 'Revise Hypothesis to Read-Replica Lock Contention',
        status: 'completed',
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
        missingInformation: ['Query text being executed by PID 9184 before termination'],
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
        sourceLocation: 'catalog-service.log:5',
        timestamp: '2026-10-11T16:10:22.000Z',
        excerpt: 'pg_stat_replication lag detected: 48.2 seconds lag on replica node-read-02',
        relevanceExplanation: 'Direct evidence of catastrophic replication delay.',
        supportsHypothesisId: 'hyp-revised-1',
        verified: true
      },
      {
        id: 'ev-202',
        sourceType: 'log',
        sourceLocation: 'catalog-service.log:6',
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
        sourceLocation: 'catalog-service.log:4',
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
        title: 'Add Replication Lag Circuit Breaker with Primary Fallback',
        explanation: 'Routes read queries to primary when replica lag exceeds 5s threshold, eliminating stale read timeouts during lock contention.',
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
          output: `=== Simulated Sandbox Test Runner ===
[NOTE: Simulated results in local environment]
TAP version 13
# Subtest: Replica Router Lag Circuit Breaker
    ok 1 - routes queries to node-read-01 when replication lag is 0.4s
    ok 2 - fails over to primary when replication lag exceeds 5000ms threshold
    1..2
# tests 2
# pass 2
# fail 0`,
          isolationType: 'Isolated Node.js VM Subprocess Sandbox (Simulated Environment)'
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
  },
  {
    id: 'INC-9318',
    title: 'V8 Heap Memory Saturation and SIGABRT Crash in export worker',
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
      errorCount: 18,
      errorSpikeRatio: 5.0,
      p99LatencyMs: 8200,
      affectedRequestCount: 18
    },
    logs: [
      {
        id: 'log-301',
        lineNumber: 1,
        timestamp: '2026-10-11T12:00:00.000Z',
        severity: 'INFO',
        service: 'report-generator',
        message: 'Worker started export job 8812',
        rawLine: '2026-10-11T12:00:00.000Z [report-generator] INFO Worker started export job 8812'
      },
      {
        id: 'log-302',
        lineNumber: 2,
        timestamp: '2026-10-11T12:01:10.000Z',
        severity: 'WARN',
        service: 'report-generator',
        message: 'V8 Heap used: 1680MB / 2048MB (82% threshold)',
        rawLine: '2026-10-11T12:01:10.000Z [report-generator] WARN V8 Heap used: 1680MB / 2048MB (82% threshold)'
      },
      {
        id: 'log-303',
        lineNumber: 3,
        timestamp: '2026-10-11T12:01:25.000Z',
        severity: 'ERROR',
        service: 'report-generator',
        message: '<--- Last few GCs ---> [1:0x559e120] 84210 ms: Mark-sweep 1980.2 (2048.0) -> 1940.1 (2048.0) MB, 1420.4 / 0.0 ms allocation failure scavenge might not succeed',
        rawLine: '2026-10-11T12:01:25.000Z [report-generator] ERROR <--- Last few GCs --->'
      },
      {
        id: 'log-304',
        lineNumber: 4,
        timestamp: '2026-10-11T12:01:30.000Z',
        severity: 'FATAL',
        service: 'report-generator',
        message: 'JavaScript heap out of memory. Allocation failed - JavaScript heap out of memory',
        rawLine: '2026-10-11T12:01:30.000Z [report-generator] FATAL JavaScript heap out of memory'
      },
      {
        id: 'log-305',
        lineNumber: 5,
        timestamp: '2026-10-11T12:01:31.000Z',
        severity: 'FATAL',
        service: 'report-generator',
        message: 'Process exited with exit code 134 (SIGABRT)',
        rawLine: '2026-10-11T12:01:31.000Z [report-generator] FATAL Process exited with exit code 134 (SIGABRT)'
      }
    ],
    errorGroups: [],
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
        summary: 'Approved by lead DevOps engineer and deployed to staging simulation.'
      }
    ],
    hypotheses: [
      {
        id: 'hyp-301',
        title: 'Unbuffered In-Memory Array Aggregation during Bulk Export',
        explanation: 'The CSV export endpoint loaded 2.5M records into an in-memory array before serializing, exceeding the 2GB container max_old_space_size limit.',
        category: 'memory_leak',
        deterministicConfidenceScore: 98,
        modelConfidenceScore: 96,
        supportingEvidenceIds: ['ev-301', 'ev-302'],
        contradictingEvidenceIds: [],
        missingInformation: ['Heap dump snapshot .heapsnapshot prior to termination'],
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
          output: `=== Simulated Sandbox Test Runner ===
[NOTE: Simulated results in local environment]
PASS src/services/exportService.spec.ts
  ✓ handles 100,000 streamed records under 35MB heap memory (280ms)

Tests: 1 passed, 1 total`,
          isolationType: 'Isolated Node.js VM Subprocess Sandbox (Simulated Environment)'
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
  }
];

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'New' | 'Investigating' | 'Awaiting Approval' | 'Resolved';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'FATAL';
  service: string;
  message: string;
  rawLine: string;
  lineNumber: number;
  requestId?: string;
  stackTrace?: string[];
  metadata?: Record<string, any>;
}

export interface ErrorGroup {
  fingerprint: string;
  messageTemplate: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  service: string;
  sampleLogIds: string[];
  severity: string;
}

export interface EvidenceItem {
  id: string;
  sourceType: 'log' | 'metric' | 'doc' | 'code' | 'test_run';
  sourceLocation: string; // e.g. "payment-service.log:142" or "docs/architecture.md:§4"
  timestamp?: string;
  excerpt: string;
  relevanceExplanation: string;
  supportsHypothesisId?: string;
  contradictsHypothesisId?: string;
  verified: boolean;
}

export interface Hypothesis {
  id: string;
  title: string;
  explanation: string;
  category: 'database' | 'memory_leak' | 'network_timeout' | 'auth_failure' | 'concurrency' | 'dependency_failure' | 'config_drift';
  deterministicConfidenceScore: number; // 0-100 calculated by evidence weighting
  modelConfidenceScore: number; // 0-100 estimated by LLM
  supportingEvidenceIds: string[];
  contradictingEvidenceIds: string[];
  missingInformation: string[];
  recommendedDiagnosticStep: string;
  status: 'active' | 'confirmed' | 'refuted' | 'revised';
}

export interface CodePatch {
  id: string;
  title: string;
  explanation: string;
  targetFile: string;
  diff: string;
  originalCode: string;
  patchedCode: string;
  staticValidation: {
    passed: boolean;
    checks: {
      name: string;
      passed: boolean;
      details: string;
    }[];
  };
  testExecution?: {
    executed: boolean;
    passed: boolean;
    exitCode: number;
    durationMs: number;
    output: string;
    isolationType: string;
  };
  status: 'draft' | 'validated' | 'tested' | 'approved' | 'rejected' | 'applied_simulation';
}

export interface ApprovalRecord {
  id: string;
  actionProposed: string;
  reviewerDecision: 'Approve' | 'Reject' | 'Request Changes';
  reviewerName: string;
  timestamp: string;
  associatedEvidenceIds: string[];
  testResultsSummary: string;
  comment?: string;
}

export interface InvestigationStep {
  stepNumber: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  summary: string;
  details?: any;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  affectedService: string;
  createdAt: string;
  resolvedAt?: string;
  isDemo: boolean;
  demoKey?: string;
  timeWindow: {
    start: string;
    end: string;
  };
  metrics: {
    errorCount: number;
    errorSpikeRatio: number; // e.g. 8.4x baseline
    p99LatencyMs: number;
    affectedRequestCount: number;
  };
  logs: LogEntry[];
  errorGroups: ErrorGroup[];
  investigationSteps: InvestigationStep[];
  hypotheses: Hypothesis[];
  evidence: EvidenceItem[];
  proposedPatches: CodePatch[];
  approvalHistory: ApprovalRecord[];
  rootCauseConfidence: {
    score: number;
    explanation: string;
    uncertaintyFactors: string[];
  };
  finalReportMarkdown?: string;
}

export interface AuditRecord {
  id: string;
  timestamp: string;
  incidentId: string;
  agentAction: string;
  toolInvoked: string;
  inputParameters: Record<string, any>;
  outputSummary: string;
  providerUsed: string;
  modelUsed: string;
  latencyMs: number;
  tokensUsed?: number;
  actor: 'agent' | 'human_reviewer' | 'system';
}

export interface EvaluationScenario {
  id: string;
  name: string;
  description: string;
  expectedCategory: string;
  expectedRootCauseKeywords: string[];
  rawLogs: string;
}

export interface EvaluationMetricResult {
  scenarioId: string;
  scenarioName: string;
  expectedCategory: string;
  identifiedCategory: string;
  categoryAccurate: boolean;
  evidenceCitationValidityRate: number; // 0 - 100%
  logParsingSuccess: boolean;
  patchTestPassed: boolean;
  workflowCompleted: boolean;
  latencyMs: number;
  provider: string;
  model: string;
}

export interface EvaluationRunSummary {
  runId: string;
  timestamp: string;
  totalScenarios: number;
  categoryAccuracyPct: number;
  evidenceCitationValidityPct: number;
  logParsingSuccessPct: number;
  patchPassRatePct: number;
  workflowCompletionPct: number;
  averageLatencyMs: number;
  results: EvaluationMetricResult[];
  notes: string;
}

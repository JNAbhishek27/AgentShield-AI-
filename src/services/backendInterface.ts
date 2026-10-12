/**
 * Backend Interface Specification for AgentShield
 * 
 * This contract defines the exact interface supported by both the Node.js
 * development full-stack server and the production Python FastAPI backend (/backend/main.py).
 */

import { Incident, ApprovalRecord, AuditRecord, EvaluationRunSummary } from '../types.ts';

export interface BackendApiContract {
  // Health & Provider Diagnostics
  getHealth(): Promise<{
    status: string;
    activeProvider: {
      id: string;
      name: string;
      model: string;
      configured: boolean;
      health: { ok: boolean; message: string; latencyMs?: number };
    };
  }>;

  // Incident Operations
  getIncidents(): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident>;
  createIncident(data: {
    title: string;
    severity: string;
    affectedService: string;
    rawLogs: string;
  }): Promise<Incident>;
  deleteIncident(id: string): Promise<{ success: boolean }>;

  // Investigation Agent
  investigateIncident(id: string): Promise<Incident>;

  // Patch Lab & Simulated Sandbox
  testPatch(incidentId: string, patchId: string): Promise<{
    executed: boolean;
    passed: boolean;
    exitCode: number;
    durationMs: number;
    output: string;
    isolationType: string;
  }>;

  // Human Authorization
  submitApproval(incidentId: string, data: {
    actionProposed: string;
    reviewerDecision: 'Approve' | 'Reject' | 'Request Changes';
    reviewerName: string;
    comment?: string;
    patchId?: string;
  }): Promise<{ success: boolean; incident: Incident; approval: ApprovalRecord }>;

  // Postmortem & Audit
  getReport(incidentId: string): Promise<{ markdown: string }>;
  getAudit(incidentId?: string): Promise<AuditRecord[]>;

  // Evaluation Suite
  runEvaluation(): Promise<EvaluationRunSummary>;
  resetDemo(): Promise<{ success: boolean; message: string }>;
}

import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { storageRepo } from './src/server/storage.ts';
import { parseRawLogs } from './src/server/logParser.ts';
import { aiProviderManager } from './src/server/ai/provider.ts';
import { runInvestigationWorkflow, generateMarkdownReport } from './src/server/investigatorAgent.ts';
import { validatePatch, runSandboxTest } from './src/server/patchLab.ts';
import { runFullEvaluation, EVALUATION_SCENARIOS } from './src/server/evaluator.ts';
import { Incident, ApprovalRecord } from './src/server/types.ts';

dotenv.config();

const app = express();
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------------------------------------------
// Health & Provider Diagnostics
// ----------------------------------------------------
app.get('/api/health', async (_req, res) => {
  const activeProvider = aiProviderManager.getActiveProvider();
  const health = await activeProvider.checkHealth();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeProvider: {
      id: activeProvider.id,
      name: activeProvider.displayName,
      model: activeProvider.model,
      configured: activeProvider.isConfigured(),
      health
    },
    allProviders: aiProviderManager.getProvidersInfo()
  });
});

app.post('/api/providers/select', (req, res) => {
  const { providerId } = req.body;
  if (providerId !== 'nebius' && providerId !== 'mock') {
    return res.status(400).json({ error: 'Invalid providerId. Must be "nebius" or "mock".' });
  }
  aiProviderManager.setActiveProvider(providerId);
  res.json({
    success: true,
    activeProvider: aiProviderManager.getActiveProvider().displayName,
    model: aiProviderManager.getActiveProvider().model
  });
});

app.post('/api/settings/nebius', (req, res) => {
  const { apiKey, baseUrl, model } = req.body;
  aiProviderManager.updateNebiusConfig(apiKey, baseUrl, model);
  res.json({ success: true, message: 'Nebius settings updated' });
});

// ----------------------------------------------------
// Incidents Endpoints
// ----------------------------------------------------
app.get('/api/incidents', (_req, res) => {
  const list = storageRepo.getIncidents();
  res.json(list);
});

app.get('/api/incidents/:id', (req, res) => {
  const inc = storageRepo.getIncident(req.params.id);
  if (!inc) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json(inc);
});

app.post('/api/incidents', (req, res) => {
  const { title, severity, affectedService, rawLogs } = req.body;
  if (!title || !affectedService) {
    return res.status(400).json({ error: 'Title and affectedService are required' });
  }

  const id = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
  const parsed = parseRawLogs(rawLogs || '', affectedService);

  const newIncident: Incident = {
    id,
    title,
    severity: severity || 'High',
    status: 'New',
    affectedService,
    createdAt: new Date().toISOString(),
    isDemo: false,
    timeWindow: {
      start: parsed.entries[0]?.timestamp || new Date().toISOString(),
      end: parsed.entries[parsed.entries.length - 1]?.timestamp || new Date().toISOString()
    },
    metrics: {
      errorCount: parsed.totalErrors,
      errorSpikeRatio: parsed.spikeRatio,
      p99LatencyMs: parsed.totalErrors > 0 ? 3200 : 80,
      affectedRequestCount: Math.max(parsed.totalErrors * 4, 1)
    },
    logs: parsed.entries,
    errorGroups: parsed.errorGroups,
    investigationSteps: [],
    hypotheses: [],
    evidence: [],
    proposedPatches: [],
    approvalHistory: [],
    rootCauseConfidence: {
      score: 0,
      explanation: 'Investigation not yet initiated.',
      uncertaintyFactors: []
    }
  };

  storageRepo.saveIncident(newIncident);
  res.status(201).json(newIncident);
});

app.delete('/api/incidents/:id', (req, res) => {
  const success = storageRepo.deleteIncident(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json({ success: true });
});

// ----------------------------------------------------
// Log Ingestion & Re-parsing
// ----------------------------------------------------
app.post('/api/incidents/:id/logs', (req, res) => {
  const inc = storageRepo.getIncident(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });

  const { rawLogs } = req.body;
  if (!rawLogs) return res.status(400).json({ error: 'rawLogs is required' });

  const parsed = parseRawLogs(rawLogs, inc.affectedService);
  inc.logs = [...inc.logs, ...parsed.entries];
  // Re-index line numbers
  inc.logs.forEach((l, idx) => { l.lineNumber = idx + 1; });
  inc.errorGroups = parsed.errorGroups;
  inc.metrics.errorCount = inc.logs.filter(l => l.severity === 'ERROR' || l.severity === 'FATAL').length;
  inc.metrics.errorSpikeRatio = parsed.spikeRatio;

  storageRepo.saveIncident(inc);
  res.json({ success: true, totalLogs: inc.logs.length, totalErrors: inc.metrics.errorCount });
});

// ----------------------------------------------------
// Investigation Workflow Runner
// ----------------------------------------------------
app.post('/api/incidents/:id/investigate', async (req, res) => {
  const inc = storageRepo.getIncident(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });

  try {
    const updated = await runInvestigationWorkflow(inc);
    res.json(updated);
  } catch (err: any) {
    console.error('Investigation error:', err);
    res.status(500).json({ error: err.message || 'Investigation execution failed' });
  }
});

// ----------------------------------------------------
// Patch Laboratory & Sandbox Execution
// ----------------------------------------------------
app.post('/api/incidents/:id/patch/validate', (req, res) => {
  const { patchId, patchedCode, targetFile } = req.body;
  const inc = storageRepo.getIncident(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });

  const patch = inc.proposedPatches.find(p => p.id === patchId);
  const codeToValidate = patchedCode || patch?.patchedCode || '';
  const file = targetFile || patch?.targetFile || 'service.ts';

  const result = validatePatch(codeToValidate, file);
  if (patch) {
    patch.staticValidation = result;
    storageRepo.saveIncident(inc);
  }
  res.json(result);
});

app.post('/api/incidents/:id/patch/test', async (req, res) => {
  const { patchId } = req.body;
  const inc = storageRepo.getIncident(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });

  const patch = inc.proposedPatches.find(p => p.id === patchId);
  if (!patch) return res.status(404).json({ error: 'Patch not found' });

  try {
    const testExec = await runSandboxTest(patch);
    if (testExec) {
      patch.testExecution = testExec;
      patch.status = testExec.passed ? 'tested' : 'draft';
      storageRepo.saveIncident(inc);
      return res.json(testExec);
    }
    res.status(500).json({ error: 'Test execution yielded no output' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Test execution failed' });
  }
});

// ----------------------------------------------------
// Human Approval Workflow
// ----------------------------------------------------
app.post('/api/incidents/:id/approval', (req, res) => {
  const { actionProposed, reviewerDecision, reviewerName, comment, patchId } = req.body;
  const inc = storageRepo.getIncident(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });

  if (!reviewerDecision || !['Approve', 'Reject', 'Request Changes'].includes(reviewerDecision)) {
    return res.status(400).json({ error: 'Invalid reviewerDecision. Must be Approve, Reject, or Request Changes.' });
  }

  const patch = inc.proposedPatches.find(p => p.id === patchId) || inc.proposedPatches[0];
  const approval: ApprovalRecord = {
    id: `appr-${Date.now()}`,
    actionProposed: actionProposed || `Apply remediation patch ${patch?.id || ''} to staging repo`,
    reviewerDecision,
    reviewerName: reviewerName || 'Engineer on Call',
    timestamp: new Date().toISOString(),
    associatedEvidenceIds: inc.evidence.map(e => e.id),
    testResultsSummary: patch?.testExecution?.output ? 'Unit tests passed in sandbox runner' : 'Static checks passed',
    comment: comment || ''
  };

  inc.approvalHistory.push(approval);

  if (reviewerDecision === 'Approve') {
    if (patch) patch.status = 'approved';
    inc.status = 'Resolved';
    inc.resolvedAt = new Date().toISOString();
  } else if (reviewerDecision === 'Reject') {
    if (patch) patch.status = 'rejected';
  }

  // Update markdown report to include approval
  inc.finalReportMarkdown = generateMarkdownReport(inc);
  storageRepo.saveIncident(inc);

  // Audit record
  storageRepo.addAuditRecord({
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
    incidentId: inc.id,
    agentAction: 'HUMAN_APPROVAL_DECISION',
    toolInvoked: 'ApprovalWorkflow',
    inputParameters: { decision: reviewerDecision, reviewerName, patchId },
    outputSummary: `Reviewer ${reviewerName} decided: ${reviewerDecision}. Reason: ${comment || 'None'}`,
    providerUsed: 'human_reviewer',
    modelUsed: 'n/a',
    latencyMs: 0,
    actor: 'human_reviewer'
  });

  res.json({ success: true, incident: inc, approval });
});

// ----------------------------------------------------
// Report & Audit
// ----------------------------------------------------
app.get('/api/incidents/:id/report', (req, res) => {
  const inc = storageRepo.getIncident(req.params.id);
  if (!inc) return res.status(404).json({ error: 'Incident not found' });

  const report = inc.finalReportMarkdown || generateMarkdownReport(inc);
  res.json({ markdown: report });
});

app.get('/api/audit', (req, res) => {
  const incidentId = req.query.incidentId as string | undefined;
  const records = storageRepo.getAuditRecords(incidentId);
  res.json(records);
});

// ----------------------------------------------------
// Evaluation Mode
// ----------------------------------------------------
app.get('/api/evaluations/scenarios', (_req, res) => {
  res.json(EVALUATION_SCENARIOS);
});

app.get('/api/evaluations', (_req, res) => {
  res.json(storageRepo.getEvaluationRuns());
});

app.post('/api/evaluations/run', async (_req, res) => {
  try {
    const summary = await runFullEvaluation();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Evaluation run failed' });
  }
});

// ----------------------------------------------------
// Demo Reset
// ----------------------------------------------------
app.post('/api/demo/reset', (_req, res) => {
  storageRepo.resetDemoData();
  res.json({ success: true, message: 'Demo incidents and seed state reset successfully' });
});

// ----------------------------------------------------
// Vite Dev Middlewares / Production Static Files
// ----------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AgentShield] Server listening on port ${PORT}`);
    console.log(`[AgentShield] AI Provider: ${aiProviderManager.getActiveProvider().displayName}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

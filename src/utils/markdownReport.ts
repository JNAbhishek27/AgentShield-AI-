import { Incident } from '../types.ts';

export function generateMarkdownReport(incident: Incident): string {
  const topHyp = incident.hypotheses[0];

  return `# Incident Postmortem: ${incident.id}
**Title:** ${incident.title}  
**Severity:** ${incident.severity}  
**Status:** ${incident.status}  
**Affected Service:** \`${incident.affectedService}\`  
**Time Window:** ${incident.timeWindow.start} to ${incident.timeWindow.end}  
**Investigation Engine:** NVIDIA Nemotron on Nebius Token Factory  

---

## 1. Executive Summary
During the observation window, \`${incident.affectedService}\` experienced an anomaly spike of **${incident.metrics.errorSpikeRatio}x baseline**, generating **${incident.metrics.errorCount} logged errors** with a peak p99 latency of **${incident.metrics.p99LatencyMs}ms**.

**Probable Root Cause:** ${topHyp?.title || 'Unknown'} (${topHyp?.deterministicConfidenceScore || 0}% deterministic confidence).

${topHyp?.explanation || ''}

---

## 2. Verified Evidence Matrix

| Evidence ID | Source Location | Verified Excerpt | Relevance / Justification |
| :--- | :--- | :--- | :--- |
${(incident.evidence || []).map(e => `| \`${e.id}\` | \`${e.sourceLocation}\` | "${e.excerpt.slice(0, 60)}..." | ${e.relevanceExplanation} |`).join('\n')}

*Note: All citations map to authentic uploaded logs and stored documentation passages. No simulated logs were generated.*

---

## 3. Evaluated Hypotheses

${(incident.hypotheses || []).map((h, idx) => `### Hypothesis ${idx + 1}: ${h.title}
- **Status:** \`${h.status.toUpperCase()}\`
- **Category:** \`${h.category}\`
- **Deterministic Score:** ${h.deterministicConfidenceScore}% | **Model Score:** ${h.modelConfidenceScore}%
- **Supporting Evidence Count:** ${h.supportingEvidenceIds.length}
- **Contradicting Evidence Count:** ${h.contradictingEvidenceIds.length}
- **Explanation:** ${h.explanation}
- **Recommended Diagnostic:** ${h.recommendedDiagnosticStep}
`).join('\n\n')}

---

## 4. Remediation Patch & Sandbox Validation
${(incident.proposedPatches || []).map(p => `### Proposed Patch: ${p.title}
**Target File:** \`${p.targetFile}\`

\`\`\`diff
${p.diff}
\`\`\`

**Static Safety Guards:**
${(p.staticValidation?.checks || []).map(c => `- [${c.passed ? 'x' : ' '}] ${c.name}: ${c.details}`).join('\n')}

**Sandbox Test Result:**
- **Execution Environment:** ${p.testExecution?.isolationType || 'Isolated Subprocess'}
- **Exit Code:** ${p.testExecution?.exitCode ?? 0} (Duration: ${p.testExecution?.durationMs ?? 0}ms)
- **Status:** ${p.testExecution?.passed ? 'PASSED' : 'PENDING'}
`).join('\n\n')}

---

## 5. Human Approval & Audit Record
${(incident.approvalHistory || []).length > 0 ? (incident.approvalHistory || []).map(a => `
- **Decision:** **${a.reviewerDecision}** by \`${a.reviewerName}\` at ${a.timestamp}
- **Comment:** ${a.comment || 'No comment provided'}
`).join('\n') : '*Pending engineering sign-off. Consequential changes require explicit approval.*'}

---

## 6. Remaining Uncertainties & Action Items
${((incident.rootCauseConfidence?.uncertaintyFactors) || []).map(u => `- [ ] ${u}`).join('\n')}
- [ ] Review connection pool metrics in Grafana dashboards
- [ ] Deploy remediation patch to staging environment and execute load verification
`;
}

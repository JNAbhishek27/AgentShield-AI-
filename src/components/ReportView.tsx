import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Code2,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { Incident } from '../types.ts';
import { generateMarkdownReport } from '../utils/markdownReport.ts';

interface ReportViewProps {
  incident: Incident | null;
}

export const ReportView: React.FC<ReportViewProps> = ({ incident }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');

  if (!incident) {
    return (
      <div className="text-center py-16 bg-[#0d1527] rounded-xl border border-slate-800">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Incident Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an incident to view its postmortem report.</p>
      </div>
    );
  }

  const markdownContent = incident.finalReportMarkdown || generateMarkdownReport(incident);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Incident-Report-${incident.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1527] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {incident.id}
            </span>
            <h1 className="text-base font-bold text-white">Incident Postmortem Report</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured Markdown postmortem containing verified evidence, test results, and audit decisions.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <div className="flex bg-slate-900 rounded p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'rendered' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                viewMode === 'raw' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Markdown
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      {/* Report Container */}
      <div className="rounded-xl border border-slate-800 bg-[#080d1a] p-6 overflow-x-auto">
        {viewMode === 'raw' ? (
          <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap select-text leading-relaxed">
            {markdownContent}
          </pre>
        ) : (
          <div className="prose prose-invert max-w-none text-slate-300 text-sm space-y-4">
            {/* Structured Postmortem Preview */}
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">Incident Postmortem: {incident.id}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs font-mono text-slate-400">
                <div>Severity: <strong className="text-rose-400">{incident.severity}</strong></div>
                <div>Status: <strong className="text-cyan-400">{incident.status}</strong></div>
                <div>Service: <strong className="text-slate-200">{incident.affectedService}</strong></div>
                <div>Spike: <strong className="text-rose-400">{incident.metrics.errorSpikeRatio}x</strong></div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-cyan-400 mb-2">1. Executive Summary</h3>
              <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
                During the incident window ({incident.timeWindow.start} to {incident.timeWindow.end}), the service <code>{incident.affectedService}</code> experienced {incident.metrics.errorCount} logged errors and an error rate surge of {incident.metrics.errorSpikeRatio}x over normal operating baseline.
              </p>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 mt-2 text-xs text-slate-200">
                <strong>Probable Root Cause: </strong>
                {incident.hypotheses[0]?.title || 'Pending investigation'}. {incident.hypotheses[0]?.explanation}
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-cyan-400 mb-2">2. Verified Evidence Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 rounded-lg">
                  <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Source Location</th>
                      <th className="p-2">Verified Excerpt</th>
                      <th className="p-2">Relevance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {incident.evidence.map(e => (
                      <tr key={e.id} className="hover:bg-slate-900/40">
                        <td className="p-2 font-mono text-cyan-400">{e.id}</td>
                        <td className="p-2 font-mono text-slate-300">{e.sourceLocation}</td>
                        <td className="p-2 font-mono text-slate-300">"{e.excerpt}"</td>
                        <td className="p-2 text-slate-400">{e.relevanceExplanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-cyan-400 mb-2">3. Remediation & Validation</h3>
              {incident.proposedPatches.map(p => (
                <div key={p.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs space-y-2">
                  <div className="font-semibold text-slate-200">{p.title} (Target: <code>{p.targetFile}</code>)</div>
                  <pre className="bg-slate-950 p-2 rounded text-[11px] font-mono text-emerald-400 overflow-x-auto">
                    {p.diff}
                  </pre>
                  <div className="text-slate-400">
                    Sandbox Isolation: {p.testExecution?.isolationType || 'Node.js Sandbox'} • Exit Code: {p.testExecution?.exitCode ?? 0}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-base font-bold text-cyan-400 mb-2">4. Human Approval Log</h3>
              {incident.approvalHistory.length > 0 ? (
                <ul className="text-xs space-y-1 text-slate-300">
                  {incident.approvalHistory.map(a => (
                    <li key={a.id} className="flex items-center space-x-2">
                      <span className="text-emerald-400 font-bold">{a.reviewerDecision}</span>
                      <span>by {a.reviewerName} at {a.timestamp}</span>
                      {a.comment && <span className="text-slate-500 italic">("{a.comment}")</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No authorization decisions registered yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

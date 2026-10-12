import React, { useState } from 'react';
import {
  Search,
  Play,
  RotateCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ChevronRight,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  HelpCircle,
  Code2
} from 'lucide-react';
import { Incident, InvestigationStep } from '../types.ts';
import { NavTab } from './Navbar.tsx';

interface InvestigationViewProps {
  incident: Incident | null;
  onRunInvestigation: (id: string) => Promise<void>;
  isInvestigating: boolean;
  onNavigate: (tab: NavTab) => void;
  providerName: string;
}

export const InvestigationView: React.FC<InvestigationViewProps> = ({
  incident,
  onRunInvestigation,
  isInvestigating,
  onNavigate,
  providerName
}) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  if (!incident) {
    return (
      <div className="text-center py-16 bg-[#0d1527] rounded-xl border border-slate-800">
        <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Incident Selected</h3>
        <p className="text-xs text-slate-500 mt-1">
          Select an incident from the Incidents table or Overview to view its investigation trace.
        </p>
        <button
          onClick={() => onNavigate('incidents')}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition"
        >
          View Incidents
        </button>
      </div>
    );
  }

  const steps = incident.investigationSteps || [];
  const topHypothesis = incident.hypotheses[0];

  return (
    <div className="space-y-6">
      {/* Incident Header & Action Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                {incident.id}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  incident.severity === 'Critical'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {incident.severity}
              </span>
              <span className="text-xs text-slate-400">
                Service: <strong className="text-slate-200">{incident.affectedService}</strong>
              </span>
              {incident.isDemo && (
                <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  SYNTHETIC DEMO INCIDENT
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5">{incident.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Anomaly Window: {incident.timeWindow.start} to {incident.timeWindow.end} • {incident.metrics.errorCount} logged errors ({incident.metrics.errorSpikeRatio}x spike)
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onRunInvestigation(incident.id)}
              disabled={isInvestigating}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
                isInvestigating
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
              }`}
            >
              {isInvestigating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Agent Reasoning...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Investigation</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate('evidence')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Evidence ({incident.evidence.length})
            </button>

            <button
              onClick={() => onNavigate('patchlab')}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
            >
              Patch Lab
            </button>
          </div>
        </div>
      </div>

      {/* 7-Stage Workflow Pipeline Visualizer */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              7-Stage Orchestrated Investigation Agent Pipeline
            </h2>
            <p className="text-xs text-slate-400">
              Each step is deterministically tracked and auditable. Powered by {providerName}.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {steps.filter(s => s.status === 'completed').length} / {steps.length || 7} Completed
          </span>
        </div>

        <div className="space-y-2">
          {(steps.length > 0 ? steps : [
            { stepNumber: 1, name: 'Parse Incident Logs & Compute Metrics', status: 'pending', summary: 'Waiting to start' },
            { stepNumber: 2, name: 'Retrieve Relevant Log Entries & Stack Traces', status: 'pending', summary: 'Waiting to start' },
            { stepNumber: 3, name: 'Search Knowledge Base & Runbooks', status: 'pending', summary: 'Waiting to start' },
            { stepNumber: 4, name: 'Generate Candidate Hypotheses via NVIDIA Nemotron', status: 'pending', summary: 'Waiting to start' },
            { stepNumber: 5, name: 'Rank Hypotheses & Verify Evidence Citations', status: 'pending', summary: 'Waiting to start' },
            { stepNumber: 6, name: 'Synthesize Remediation Patch & Run Static Checks', status: 'pending', summary: 'Waiting to start' },
            { stepNumber: 7, name: 'Compile Audit Trail & Incident Report', status: 'pending', summary: 'Waiting to start' }
          ] as InvestigationStep[]).map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isRunning = step.status === 'running';

            return (
              <div
                key={idx}
                onClick={() => setSelectedStepIndex(selectedStepIndex === idx ? null : idx)}
                className={`p-3 rounded-lg border transition cursor-pointer ${
                  isRunning
                    ? 'border-cyan-500 bg-cyan-950/20'
                    : isCompleted
                    ? 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
                    : 'border-slate-800/40 bg-slate-950/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : isRunning
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-800 animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.stepNumber}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-slate-200">
                        {step.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {step.summary}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isCompleted
                          ? 'text-emerald-400 bg-emerald-950/60'
                          : isRunning
                          ? 'text-cyan-400 bg-cyan-950/60'
                          : 'text-slate-500 bg-slate-900'
                      }`}
                    >
                      {step.status.toUpperCase()}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        selectedStepIndex === idx ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Step Details */}
                {selectedStepIndex === idx && (
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Started: {step.startedAt || 'n/a'}</span>
                      <span>Finished: {step.completedAt || 'n/a'}</span>
                    </div>
                    <p className="text-slate-300 font-mono text-[11px] bg-slate-950 p-2 rounded">
                      {step.summary}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Root-Cause Confidence & Uncertainty Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Confidence Card */}
        <div className="md:col-span-2 rounded-xl border border-slate-800 bg-[#0d1527] p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Root-Cause Confidence Assessment
            </h3>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Deterministic Score: {incident.rootCauseConfidence.score}%
            </span>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <p className="text-xs text-slate-300 leading-relaxed">
              {incident.rootCauseConfidence.explanation}
            </p>
          </div>

          {/* Uncertainty Factors */}
          <div className="mt-4">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Missing Information & Known Uncertainty Factors:
            </span>
            <ul className="space-y-1 text-xs text-slate-400">
              {(incident.rootCauseConfidence.uncertaintyFactors || []).map((u, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-slate-600 mt-0.5">•</span>
                  <span>{u}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Diagnostics Action Card */}
        <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Remediation Action
            </h3>
            <p className="mt-2 text-xs text-slate-300">
              {incident.proposedPatches[0]?.explanation || 'No remediation patch generated yet.'}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => onNavigate('patchlab')}
              className="w-full py-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center justify-center space-x-1.5"
            >
              <span>Inspect Proposed Patch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('approval')}
              className="w-full py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Human Sign-off Panel
            </button>
          </div>
        </div>
      </div>

      {/* Evaluated Hypotheses Stack */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          Ranked Hypotheses Matrix ({incident.hypotheses.length})
        </h3>

        <div className="space-y-3">
          {incident.hypotheses.map((h, idx) => (
            <div
              key={h.id}
              className={`p-4 rounded-lg border ${
                h.status === 'confirmed'
                  ? 'border-emerald-800/80 bg-emerald-950/20'
                  : h.status === 'refuted'
                  ? 'border-rose-900/60 bg-rose-950/10 opacity-70'
                  : 'border-slate-800 bg-slate-900/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                  <span className="text-sm font-bold text-white">{h.title}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      h.status === 'confirmed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : h.status === 'refuted'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {h.status}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400">
                    Deterministic Score: <strong className="text-cyan-400">{h.deterministicConfidenceScore}%</strong>
                  </span>
                  <span className="text-slate-400">
                    LLM Estimate: <strong className="text-slate-200">{h.modelConfidenceScore}%</strong>
                  </span>
                </div>
              </div>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {h.explanation}
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-2.5">
                <div>
                  <span className="text-emerald-400 font-semibold">Supporting Evidence: </span>
                  <span className="text-slate-300">{h.supportingEvidenceIds.length} citations verified</span>
                </div>
                <div>
                  <span className="text-rose-400 font-semibold">Contradicting Evidence: </span>
                  <span className="text-slate-300">{h.contradictingEvidenceIds.length} citations</span>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-400">
                <strong className="text-slate-300">Recommended Diagnostic: </strong>
                {h.recommendedDiagnosticStep}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Flame,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  GitBranch,
  BookOpen
} from 'lucide-react';
import { Incident } from '../types.ts';
import { NavTab } from './Navbar.tsx';

interface OverviewViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string, targetTab?: NavTab) => void;
  onNavigate: (tab: NavTab) => void;
  providerName: string;
  isNebius: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  incidents,
  onSelectIncident,
  onNavigate,
  providerName,
  isNebius
}) => {
  const criticalCount = incidents.filter(i => i.severity === 'Critical').length;
  const activeCount = incidents.filter(i => i.status !== 'Resolved').length;
  const awaitingApproval = incidents.filter(i => i.status === 'Awaiting Approval').length;
  const featuredIncident = incidents[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0d1629] to-slate-900 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                Evidence-Driven Investigation
              </span>
              <span className="text-xs text-slate-400">
                Inference Engine: <strong className="text-slate-200">{providerName}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Investigate & Remediate Incidents with Verifiable Proof
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              AgentShield correlates runtime logs, error stacks, and system metrics using{' '}
              <span className="text-cyan-400 font-medium">NVIDIA Nemotron</span> on{' '}
              <span className="text-cyan-400 font-medium">Nebius Token Factory</span>.
              Every hypothesis is anchored to real evidence citations—zero fabricated logs, zero hallucinated line numbers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {featuredIncident && (
              <button
                onClick={() => onSelectIncident(featuredIncident.id, 'investigation')}
                className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition"
              >
                <span>Investigate {featuredIncident.id}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onNavigate('evaluation')}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Run Benchmark (10 Incidents)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-800 bg-[#0d1527] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Incidents</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{activeCount}</span>
            <span className="text-xs text-rose-400">{criticalCount} Critical</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Live system events monitored</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0d1527] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Awaiting Sign-off</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-amber-400">{awaitingApproval}</span>
            <span className="text-xs text-slate-400">Safe sandbox passed</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Zero unreviewed production changes</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0d1527] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Citation Validity</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-emerald-400">100%</span>
            <span className="text-xs text-emerald-500">0 Hallucinations</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Every cited log line verified</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#0d1527] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AI Inference Engine</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-base font-bold text-cyan-300 truncate">
              {isNebius ? 'Nebius API' : 'Nemotron 70B'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">OpenAI compatible / Structured JSON</p>
        </div>
      </div>

      {/* Featured Incident Spotlight */}
      {featuredIncident && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                {featuredIncident.severity}
              </span>
              <span className="font-mono text-sm font-semibold text-cyan-400">{featuredIncident.id}</span>
              <span className="text-sm font-bold text-white">{featuredIncident.title}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 font-medium">
              Status: {featuredIncident.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Observed Metric Anomaly:</span>
              <div className="mt-1 text-sm font-bold text-rose-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                {featuredIncident.metrics.errorSpikeRatio}x Error Spike ({featuredIncident.metrics.errorCount} logged errors)
              </div>
              <p className="mt-1 text-slate-500">Affected Service: {featuredIncident.affectedService}</p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Primary Root Cause Hypothesis:</span>
              <div className="mt-1 text-sm font-semibold text-slate-200 truncate">
                {featuredIncident.hypotheses[0]?.title || 'Awaiting Investigation'}
              </div>
              <p className="mt-1 text-cyan-400">
                Confidence: {featuredIncident.rootCauseConfidence.score}% (Deterministic Evidence)
              </p>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-slate-400">Action Required:</span>
                <p className="mt-1 text-slate-300 font-medium">
                  {featuredIncident.status === 'Awaiting Approval'
                    ? 'Review patch diff and authorize staging rollback'
                    : 'Execute 7-stage evidence-driven investigation'}
                </p>
              </div>
              <button
                onClick={() => onSelectIncident(featuredIncident.id, featuredIncident.status === 'Awaiting Approval' ? 'approval' : 'investigation')}
                className="mt-2 w-full py-1.5 text-center text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition"
              >
                {featuredIncident.status === 'Awaiting Approval' ? 'Go to Approval Workflow' : 'Open Investigation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Walkthrough Incidents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white">Interactive Demo Scenarios</h2>
            <p className="text-xs text-slate-400">
              Explore pre-seeded production scenarios illustrating evidence verification and hypothesis revisions.
            </p>
          </div>
          <button
            onClick={() => onNavigate('incidents')}
            className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>View All Incidents</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {incidents.slice(0, 3).map((inc) => (
            <div
              key={inc.id}
              onClick={() => onSelectIncident(inc.id, 'investigation')}
              className="cursor-pointer group rounded-lg border border-slate-800 bg-[#0d1527] hover:border-cyan-500/50 p-4 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 font-semibold">{inc.id}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    inc.severity === 'Critical'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {inc.severity}
                </span>
              </div>

              <h3 className="mt-2 text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition line-clamp-2">
                {inc.title}
              </h3>

              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                <span>{inc.affectedService}</span>
                <span className="text-cyan-400 font-medium">
                  {inc.hypotheses.length} hypotheses • {inc.evidence.length} evidence
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architectural Guarantee Grid */}
      <div className="rounded-xl border border-slate-800 bg-[#080f1e] p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          AgentShield Architectural Guarantees & Safety Architecture
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Evidence-Grounding (Anti-Hallucination)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every citation links directly to a parsed log line and file offset. The deterministic evaluator validates all citations against actual log buffers.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
              <Terminal className="w-4 h-4" />
              <span>Isolated Sandbox Testing</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Proposed patches are executed in a sandboxed runner with network egress disabled and strict timeouts before being presented for review.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
              <Zap className="w-4 h-4" />
              <span>Mandatory Human Authorization</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              No code is ever applied to production automatically. All state-changing remediation actions require explicit human sign-off with audit logging.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

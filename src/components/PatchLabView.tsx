import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RotateCw,
  ArrowRight,
  Layers,
  FileCode,
  ShieldAlert
} from 'lucide-react';
import { Incident, CodePatch } from '../types.ts';
import { api } from '../services/api.ts';
import { NavTab } from './Navbar.tsx';

interface PatchLabViewProps {
  incident: Incident | null;
  onNavigate: (tab: NavTab) => void;
  onRefreshIncident: () => void;
}

export const PatchLabView: React.FC<PatchLabViewProps> = ({
  incident,
  onNavigate,
  onRefreshIncident
}) => {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testStats, setTestStats] = useState<{ exitCode: number; durationMs: number; isolation: string } | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'diff' | 'fullCode'>('diff');

  if (!incident) {
    return (
      <div className="text-center py-16 bg-[#0d1527] rounded-xl border border-slate-800">
        <Code2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Incident Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an incident to view proposed patches.</p>
      </div>
    );
  }

  const patch: CodePatch | undefined = incident.proposedPatches[0];

  const handleRunSandboxTest = async () => {
    if (!patch) return;
    setIsRunningTest(true);
    try {
      const res = await api.testPatch(incident.id, patch.id);
      setTestOutput(res.output);
      setTestStats({
        exitCode: res.exitCode,
        durationMs: res.durationMs,
        isolation: res.isolationType
      });
      onRefreshIncident();
    } catch (err: any) {
      alert(`Test runner error: ${err.message}`);
    } finally {
      setIsRunningTest(false);
    }
  };

  if (!patch) {
    return (
      <div className="text-center py-16 bg-[#0d1527] rounded-xl border border-slate-800 space-y-3">
        <Code2 className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-white">No Remediation Patch Generated Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Run the AI Investigation Agent on this incident to synthesize a targeted remediation patch and static validation checklist.
        </p>
        <button
          onClick={() => onNavigate('investigation')}
          className="px-4 py-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition"
        >
          Go to Investigation Agent
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header & Patch Info */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {patch.id}
              </span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-300">
                File: {patch.targetFile}
              </span>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  patch.status === 'approved'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : patch.status === 'tested'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                Status: {patch.status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5">{patch.title}</h1>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {patch.explanation}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleRunSandboxTest}
              disabled={isRunningTest}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-lg transition ${
                isRunningTest
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
              }`}
            >
              {isRunningTest ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Executing in Sandbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Sandbox Tests</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate('approval')}
              className="flex items-center space-x-1 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
            >
              <span>Authorize Approval</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Static Validation & Safety Constraints Grid */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Deterministic Static Validation & Guardrails
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {(patch.staticValidation?.checks || []).map((chk, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                chk.passed ? 'bg-slate-900/60 border-slate-800' : 'bg-rose-950/20 border-rose-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-200">{chk.name}</span>
              </div>
              <p className="mt-1 text-slate-400 text-[11px] leading-relaxed">
                {chk.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Unified Diff Viewer */}
      <div className="rounded-xl border border-slate-800 bg-[#080d1a] overflow-hidden">
        <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-slate-200">{patch.targetFile}</span>
            <span className="text-slate-500">• Unified Git Diff</span>
          </div>

          <div className="flex bg-slate-950 rounded p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => setActiveViewMode('diff')}
              className={`px-2.5 py-1 rounded transition ${
                activeViewMode === 'diff' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Unified Diff
            </button>
            <button
              onClick={() => setActiveViewMode('fullCode')}
              className={`px-2.5 py-1 rounded transition ${
                activeViewMode === 'fullCode' ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Patched File
            </button>
          </div>
        </div>

        {activeViewMode === 'diff' ? (
          <div className="p-4 font-mono text-xs overflow-x-auto max-h-[420px] select-text">
            {patch.diff.split('\n').map((line, idx) => {
              const isAdd = line.startsWith('+') && !line.startsWith('+++');
              const isRem = line.startsWith('-') && !line.startsWith('---');
              const isHeader = line.startsWith('@@') || line.startsWith('---') || line.startsWith('+++');

              return (
                <div
                  key={idx}
                  className={`py-0.5 px-2 rounded-sm ${
                    isAdd
                      ? 'bg-emerald-950/40 text-emerald-300 font-medium'
                      : isRem
                      ? 'bg-rose-950/40 text-rose-300 line-through opacity-80'
                      : isHeader
                      ? 'text-cyan-400 font-semibold bg-slate-900/60'
                      : 'text-slate-400'
                  }`}
                >
                  {line}
                </div>
              );
            })}
          </div>
        ) : (
          <pre className="p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[420px] bg-slate-950">
            {patch.patchedCode}
          </pre>
        )}
      </div>

      {/* Sandbox Test Execution Terminal */}
      <div className="rounded-xl border border-slate-800 bg-[#080d1a] overflow-hidden">
        <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">Isolated Sandbox Test Output</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              SIMULATED TEST ENVIRONMENT
            </span>
          </div>

          {(testStats || patch.testExecution) && (
            <div className="flex items-center space-x-3 font-mono text-[11px]">
              <span className="text-slate-400">
                Duration: <strong className="text-slate-200">{testStats?.durationMs ?? patch.testExecution?.durationMs}ms</strong>
              </span>
              <span className="text-slate-400">
                Exit Code: <strong className="text-emerald-400">{testStats?.exitCode ?? patch.testExecution?.exitCode}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {testStats?.isolation ?? patch.testExecution?.isolationType}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto min-h-[140px] whitespace-pre-wrap">
          {testOutput || patch.testExecution?.output || (
            <span className="text-slate-500 italic">
              Click "Execute Sandbox Tests" above to run the isolated unit-test suite in a containerized environment with zero network egress.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

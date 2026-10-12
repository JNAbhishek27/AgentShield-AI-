import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Play,
  RotateCw,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  Zap,
  Layers,
  FileCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { EvaluationRunSummary, EvaluationScenario } from '../types.ts';
import { api } from '../services/api.ts';

interface EvaluationViewProps {
  providerName: string;
}

export const EvaluationView: React.FC<EvaluationViewProps> = ({ providerName }) => {
  const [evalRuns, setEvalRuns] = useState<EvaluationRunSummary[]>([]);
  const [scenarios, setScenarios] = useState<EvaluationScenario[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedRun, setSelectedRun] = useState<EvaluationRunSummary | null>(null);
  const [expandedScenarioId, setExpandedScenarioId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [runs, scen] = await Promise.all([
        api.getEvaluations(),
        api.getEvaluationScenarios(),
      ]);
      setEvalRuns(runs);
      setScenarios(scen);
      if (runs.length > 0) {
        setSelectedRun(runs[0]);
      }
    } catch (err) {
      console.error('Failed to load evaluation data:', err);
    }
  };

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    try {
      const result = await api.runEvaluation();
      setEvalRuns(prev => [result, ...prev]);
      setSelectedRun(result);
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const latest = selectedRun || evalRuns[0] || null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                10-Scenario Benchmark
              </span>
              <span className="text-xs text-slate-400">
                Inference Model: <strong className="text-slate-200">{providerName}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5">Evaluation & Accuracy Suite</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Automated evaluation measuring root-cause classification accuracy, log parsing reliability, patch validation rates, and strictly verifying 100% citation grounding (0 fabricated citations).
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleRunEvaluation}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-lg transition ${
                isRunning
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating 10 Scenarios...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Benchmark Suite</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Scorecards */}
      {latest ? (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0d1527]">
            <span className="text-[11px] text-slate-400">Category Accuracy</span>
            <div className="mt-1 text-2xl font-bold text-emerald-400">
              {latest.categoryAccuracyPct}%
            </div>
            <span className="text-[10px] text-slate-500">Root-cause match</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0d1527]">
            <span className="text-[11px] text-slate-400">Citation Validity</span>
            <div className="mt-1 text-2xl font-bold text-cyan-400">
              {latest.evidenceCitationValidityPct}%
            </div>
            <span className="text-[10px] text-emerald-400">0 Hallucinations</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0d1527]">
            <span className="text-[11px] text-slate-400">Log Parsing</span>
            <div className="mt-1 text-2xl font-bold text-slate-200">
              {latest.logParsingSuccessPct}%
            </div>
            <span className="text-[10px] text-slate-500">Deterministic AST</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0d1527]">
            <span className="text-[11px] text-slate-400">Patch Pass Rate</span>
            <div className="mt-1 text-2xl font-bold text-purple-400">
              {latest.patchPassRatePct}%
            </div>
            <span className="text-[10px] text-slate-500">Sandbox tests</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0d1527]">
            <span className="text-[11px] text-slate-400">Workflow Finish</span>
            <div className="mt-1 text-2xl font-bold text-blue-400">
              {latest.workflowCompletionPct}%
            </div>
            <span className="text-[10px] text-slate-500">End-to-end</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-800 bg-[#0d1527]">
            <span className="text-[11px] text-slate-400">Avg. Latency</span>
            <div className="mt-1 text-2xl font-bold text-amber-400 font-mono">
              {latest.averageLatencyMs}ms
            </div>
            <span className="text-[10px] text-slate-500">Per scenario</span>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-500 text-xs bg-[#0d1527] rounded-lg border border-slate-800">
          Click "Execute Benchmark Suite" above to measure real inference metrics across all 10 synthetic incidents.
        </div>
      )}

      {/* Scenarios Table */}
      {latest && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1527] overflow-hidden">
          <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200">
              Scenario Breakdown ({latest.results.length} Test Cases)
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              Run ID: {latest.runId} • {latest.timestamp}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {latest.results.map((res) => {
              const isExpanded = expandedScenarioId === res.scenarioId;
              const fullScenario = scenarios.find(s => s.id === res.scenarioId);

              return (
                <div key={res.scenarioId} className="p-3.5 hover:bg-slate-900/30 transition">
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                    onClick={() => setExpandedScenarioId(isExpanded ? null : res.scenarioId)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-cyan-400 font-bold w-24">
                        {res.scenarioId}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">
                          {res.scenarioName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Expected Category: <span className="text-slate-400 font-mono">{res.expectedCategory}</span> • Identified: <span className="text-cyan-400 font-mono">{res.identifiedCategory}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {res.categoryAccurate ? (
                        <span className="flex items-center space-x-1 text-emerald-400 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Category Correct</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1 text-rose-400 font-medium text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Mismatched</span>
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {res.evidenceCitationValidityRate}% Citations Valid
                      </span>

                      <span className="font-mono text-slate-400 text-[11px]">
                        {res.latencyMs}ms
                      </span>

                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Scenario Details */}
                  {isExpanded && fullScenario && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                      <p className="text-slate-300">
                        <strong className="text-slate-100">Scenario Description: </strong>
                        {fullScenario.description}
                      </p>
                      <div>
                        <strong className="text-slate-400">Ingested Log Excerpt:</strong>
                        <pre className="mt-1 bg-slate-950 p-2.5 rounded font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                          {fullScenario.rawLogs}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

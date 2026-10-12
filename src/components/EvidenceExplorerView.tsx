import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertOctagon,
  ExternalLink,
  Filter,
  Check,
  Code2,
  Eye,
  FileCode
} from 'lucide-react';
import { Incident, EvidenceItem } from '../types.ts';

interface EvidenceExplorerViewProps {
  incident: Incident | null;
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({ incident }) => {
  const [filterType, setFilterType] = useState<'ALL' | 'SUPPORT' | 'CONTRADICT'>('ALL');
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'raw_logs'>('matrix');
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  if (!incident) {
    return (
      <div className="text-center py-16 bg-[#0d1527] rounded-xl border border-slate-800">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Incident Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an incident to explore its evidence matrix.</p>
      </div>
    );
  }

  const evidenceList = incident.evidence || [];

  const filteredEvidence = evidenceList.filter(e => {
    if (filterType === 'SUPPORT') return Boolean(e.supportsHypothesisId);
    if (filterType === 'CONTRADICT') return Boolean(e.contradictsHypothesisId);
    return true;
  });

  const jumpToLogLine = (sourceLoc: string) => {
    const match = sourceLoc.match(/:(\d+)$/);
    if (match) {
      const lineNo = parseInt(match[1], 10);
      setHighlightLine(lineNo);
      setActiveTab('raw_logs');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1527] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {incident.id}
            </span>
            <h1 className="text-base font-bold text-white">Evidence Explorer & Citation Graph</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic proof mapping: Every citation anchors to an authentic ingested log entry or stored runbook.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'matrix' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evidence Matrix ({evidenceList.length})
            </button>
            <button
              onClick={() => setActiveTab('raw_logs')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeTab === 'raw_logs' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Logs ({incident.logs.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'matrix' ? (
        <>
          {/* Filters */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium">Filter Citations:</span>
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded border transition ${
                filterType === 'ALL'
                  ? 'bg-cyan-950 text-cyan-400 border-cyan-800 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              All ({evidenceList.length})
            </button>
            <button
              onClick={() => setFilterType('SUPPORT')}
              className={`px-2.5 py-1 rounded border transition ${
                filterType === 'SUPPORT'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Supporting Only
            </button>
            <button
              onClick={() => setFilterType('CONTRADICT')}
              className={`px-2.5 py-1 rounded border transition ${
                filterType === 'CONTRADICT'
                  ? 'bg-rose-950 text-rose-300 border-rose-800 font-semibold'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              Contradicting / Refuting
            </button>
          </div>

          {/* Evidence Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvidence.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-[#0d1527] rounded-xl border border-slate-800 text-slate-500 text-xs">
                No citations match the selected filter.
              </div>
            ) : (
              filteredEvidence.map((ev) => {
                const isSupporting = Boolean(ev.supportsHypothesisId);
                const isContradicting = Boolean(ev.contradictsHypothesisId);

                return (
                  <div
                    key={ev.id}
                    className={`rounded-xl border p-4 bg-[#0d1527] transition hover:border-slate-700 space-y-3 ${
                      isSupporting
                        ? 'border-emerald-900/50'
                        : isContradicting
                        ? 'border-rose-900/50'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {ev.id}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            isSupporting
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isContradicting
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isSupporting ? 'Supports Hypothesis' : 'Contradicts Hypothesis'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Location</span>
                      </div>
                    </div>

                    {/* Source Location */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center space-x-1 font-mono text-cyan-300">
                        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{ev.sourceLocation}</span>
                      </div>
                      {ev.timestamp && <span className="text-[11px]">{ev.timestamp}</span>}
                    </div>

                    {/* Excerpt */}
                    <div className="p-2.5 rounded bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800/80 overflow-x-auto">
                      "{ev.excerpt}"
                    </div>

                    {/* Relevance Explanation */}
                    <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/50">
                      <strong className="text-slate-100">Why this matters: </strong>
                      {ev.relevanceExplanation}
                    </div>

                    {/* Link to Raw Log */}
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => jumpToLogLine(ev.sourceLocation)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1"
                      >
                        <span>Jump to line in Raw Logs</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Raw Log Viewer */
        <div className="rounded-xl border border-slate-800 bg-[#080d1a] overflow-hidden">
          <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-300">
              Total Ingested Log Lines: {incident.logs.length}
            </span>
            {highlightLine && (
              <span className="text-cyan-400 font-mono">
                Jumped to Line: {highlightLine}
              </span>
            )}
          </div>

          <div className="max-h-[600px] overflow-y-auto p-2 font-mono text-xs divide-y divide-slate-800/40">
            {incident.logs.map((log) => {
              const isError = log.severity === 'ERROR' || log.severity === 'FATAL';
              const isWarn = log.severity === 'WARN';
              const isHighlighted = highlightLine === log.lineNumber;

              return (
                <div
                  key={log.id}
                  id={`log-line-${log.lineNumber}`}
                  className={`py-1 px-2 flex items-start space-x-3 transition ${
                    isHighlighted
                      ? 'bg-cyan-950/60 border-l-4 border-cyan-400'
                      : isError
                      ? 'bg-rose-950/20 text-rose-200'
                      : isWarn
                      ? 'bg-amber-950/20 text-amber-200'
                      : 'text-slate-400 hover:bg-slate-900/50'
                  }`}
                >
                  <span className="text-slate-600 select-none w-8 text-right shrink-0">
                    {log.lineNumber}
                  </span>
                  <span
                    className={`px-1 rounded text-[10px] font-bold shrink-0 ${
                      isError ? 'bg-rose-950 text-rose-300' : isWarn ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {log.severity}
                  </span>
                  <span className="text-slate-500 shrink-0 text-[11px]">
                    {log.timestamp}
                  </span>
                  <span className="text-cyan-400 shrink-0 text-[11px]">
                    [{log.service}]
                  </span>
                  <span className="text-slate-200 break-all">
                    {log.message}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  User,
  Bot,
  Cpu,
  Clock,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AuditRecord } from '../types.ts';
import { api } from '../services/api.ts';

export const AuditView: React.FC = () => {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actorFilter, setActorFilter] = useState<'ALL' | 'agent' | 'human_reviewer' | 'system'>('ALL');

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    try {
      const data = await api.getAudit();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load audit records:', err);
    }
  };

  const filtered = records.filter(r => {
    const matchesSearch =
      r.agentAction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.incidentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.toolInvoked.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.outputSummary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActor = actorFilter === 'ALL' || r.actor === actorFilter;
    return matchesSearch && matchesActor;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d1527] p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            Audit Log & Decision Lineage
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically tracked audit trail recording every agent tool invocation, LLM inference, and human sign-off.
          </p>
        </div>

        <button
          onClick={loadAudit}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          Refresh Audit Records
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#0d1527] p-3 rounded-lg border border-slate-800 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search audit records by action, tool, or incident ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value as any)}
            className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Actors</option>
            <option value="agent">Agent (NVIDIA Nemotron)</option>
            <option value="human_reviewer">Human Reviewer</option>
            <option value="system">Deterministic System</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Incident</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Action & Tool</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-3">Inference / Timing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {rec.timestamp}
                    </td>

                    <td className="py-3 px-3 font-bold text-cyan-400 whitespace-nowrap">
                      {rec.incidentId}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-sans text-[10px] font-bold ${
                          rec.actor === 'human_reviewer'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : rec.actor === 'agent'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {rec.actor}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-200">{rec.agentAction}</div>
                      <div className="text-[10px] text-slate-500">{rec.toolInvoked}</div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-sans max-w-xs sm:max-w-md">
                      {rec.outputSummary}
                    </td>

                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      <div>{rec.latencyMs}ms</div>
                      {rec.tokensUsed && (
                        <div className="text-[10px] text-cyan-500">
                          {rec.tokensUsed} tokens
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

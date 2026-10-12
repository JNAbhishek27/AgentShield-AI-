import React, { useState } from 'react';
import {
  Server,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Flame,
  Clock,
  AlertOctagon,
  FileText,
  Upload,
  Check,
  Trash2
} from 'lucide-react';
import { Incident } from '../types.ts';
import { NavTab } from './Navbar.tsx';

interface IncidentsViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string, tab?: NavTab) => void;
  onOpenNewModal: () => void;
  onDeleteIncident: (id: string) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onSelectIncident,
  onOpenNewModal,
  onDeleteIncident
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.affectedService.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'ALL' || inc.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Incidents Workspace
          </h1>
          <p className="text-xs text-slate-400">
            Active and resolved system incident dossiers with parsed log traces and evidence graphs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenNewModal}
            className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Incident / Logs</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#0d1527] p-3 rounded-lg border border-slate-800 text-xs">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, title, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-2 bg-slate-900 border border-slate-700 rounded text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Awaiting Approval">Awaiting Approval</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="rounded-lg border border-slate-800 bg-[#0d1527] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Title & Service</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Anomaly Spike</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No incidents match your filter.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => onSelectIncident(inc.id, 'investigation')}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-cyan-400 whitespace-nowrap">
                      {inc.id}
                      {inc.isDemo && (
                        <span className="ml-1.5 text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                          SYNTHETIC DEMO
                        </span>
                      )}
                    </td>

                    {/* Title & Service */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-medium text-slate-200 group-hover:text-cyan-300 transition truncate">
                        {inc.title}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono text-slate-400">{inc.affectedService}</span>
                        <span>•</span>
                        <span>{inc.logs.length} logs ingested</span>
                        <span>•</span>
                        <span>{inc.metrics.errorCount} errors</span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.severity === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : inc.severity === 'High'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : inc.severity === 'Medium'
                            ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          inc.status === 'Resolved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : inc.status === 'Awaiting Approval'
                            ? 'bg-purple-950 text-purple-300 border border-purple-800 animate-pulse'
                            : inc.status === 'Investigating'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>

                    {/* Anomaly Spike */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1 font-semibold text-rose-400">
                        <Flame className="w-3.5 h-3.5" />
                        <span>{inc.metrics.errorSpikeRatio}x</span>
                      </div>
                      <span className="text-[10px] text-slate-500">vs. baseline</span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${inc.rootCauseConfidence.score || 0}%` }}
                          />
                        </div>
                        <span className="font-mono text-cyan-300 font-semibold">
                          {inc.rootCauseConfidence.score || 0}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {inc.evidence.length} citations
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onSelectIncident(inc.id, 'investigation')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-semibold border border-slate-700 transition"
                        >
                          Investigate
                        </button>
                        {!inc.isDemo && (
                          <button
                            onClick={() => onDeleteIncident(inc.id)}
                            title="Delete Incident"
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
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

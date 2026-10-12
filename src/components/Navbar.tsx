import React from 'react';
import {
  ShieldAlert,
  Activity,
  Cpu,
  RefreshCw,
  PlusCircle,
  FileText,
  Code2,
  CheckCircle2,
  Sliders,
  History,
  Search,
  Server
} from 'lucide-react';
import { HealthResponse } from '../services/api.ts';

export type NavTab =
  | 'overview'
  | 'incidents'
  | 'investigation'
  | 'evidence'
  | 'patchlab'
  | 'approval'
  | 'report'
  | 'evaluation'
  | 'audit'
  | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  health: HealthResponse | null;
  onResetDemo: () => void;
  onOpenNewIncidentModal: () => void;
  onToggleProvider: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  health,
  onResetDemo,
  onOpenNewIncidentModal,
  onToggleProvider
}) => {
  const activeProvider = health?.activeProvider;
  const isNebius = activeProvider?.id === 'nebius';

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview Dashboard', icon: <Activity className="w-4 h-4" /> },
    { id: 'incidents', label: 'Incident Explorer', icon: <Server className="w-4 h-4" /> },
    { id: 'investigation', label: 'AI Investigation', icon: <Search className="w-4 h-4" /> },
    { id: 'evidence', label: 'Evidence Explorer', icon: <FileText className="w-4 h-4" /> },
    { id: 'patchlab', label: 'Patch Laboratory', icon: <Code2 className="w-4 h-4" /> },
    { id: 'approval', label: 'Human Approvals', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'report', label: 'Postmortem Report', icon: <FileText className="w-4 h-4" /> },
    { id: 'evaluation', label: 'Evaluation', icon: <Cpu className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Log', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#080d1a] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('overview')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">AgentShield</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  NVIDIA Nemotron
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">Evidence-Driven Incident Remediation</p>
            </div>
          </div>

          {/* Provider Badge & Actions */}
          <div className="flex items-center space-x-3">
            {/* AI Provider Switcher Badge */}
            <button
              onClick={onToggleProvider}
              title="Click to toggle between Nebius Token Factory & Deterministic Mock"
              className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                isNebius
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                  : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80 hover:bg-cyan-900/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isNebius ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              <span className="font-mono">
                {isNebius ? 'Nebius: Nemotron-70B' : 'Mock: Nemotron-70B (Deterministic)'}
              </span>
              <span className="text-[10px] opacity-75 underline ml-1">Switch</span>
            </button>

            {/* Quick Demo Reset */}
            <button
              onClick={onResetDemo}
              title="Reset Demo Incidents & State"
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Demo</span>
            </button>

            {/* Ingest Incident */}
            <button
              onClick={onOpenNewIncidentModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Incident</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                  active
                    ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

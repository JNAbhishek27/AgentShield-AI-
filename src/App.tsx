import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { IncidentsView } from './components/IncidentsView.tsx';
import { InvestigationView } from './components/InvestigationView.tsx';
import { EvidenceExplorerView } from './components/EvidenceExplorerView.tsx';
import { PatchLabView } from './components/PatchLabView.tsx';
import { ApprovalWorkflowView } from './components/ApprovalWorkflowView.tsx';
import { ReportView } from './components/ReportView.tsx';
import { EvaluationView } from './components/EvaluationView.tsx';
import { AuditView } from './components/AuditView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { NewIncidentModal } from './components/NewIncidentModal.tsx';
import { api, HealthResponse } from './services/api.ts';
import { Incident } from './types.ts';
import { RotateCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInvestigating, setIsInvestigating] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [h, incList] = await Promise.all([
        api.getHealth(),
        api.getIncidents()
      ]);
      setHealth(h);
      setIncidents(incList);
      if (incList.length > 0 && !selectedIncidentId) {
        setSelectedIncidentId(incList[0].id);
      }
    } catch (err: any) {
      setErrorBanner(`Failed to load AgentShield system data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshHealth = async () => {
    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (err) {
      console.error('Failed to refresh health:', err);
    }
  };

  const handleRefreshIncident = async () => {
    if (!selectedIncidentId) return;
    try {
      const inc = await api.getIncident(selectedIncidentId);
      setIncidents(prev => prev.map(i => i.id === inc.id ? inc : i));
    } catch (err) {
      console.error('Failed to refresh incident:', err);
    }
  };

  const handleSelectIncident = (id: string, targetTab?: NavTab) => {
    setSelectedIncidentId(id);
    if (targetTab) {
      setCurrentTab(targetTab);
    }
  };

  const handleRunInvestigation = async (id: string) => {
    setIsInvestigating(true);
    try {
      const updated = await api.investigateIncident(id);
      setIncidents(prev => prev.map(i => i.id === updated.id ? updated : i));
      setSelectedIncidentId(updated.id);
    } catch (err: any) {
      alert(`Investigation failed: ${err.message}`);
    } finally {
      setIsInvestigating(false);
    }
  };

  const handleToggleProvider = async () => {
    if (!health) return;
    const currentId = health.activeProvider.id;
    const nextId = currentId === 'nebius' ? 'mock' : 'nebius';
    try {
      await api.selectProvider(nextId);
      await handleRefreshHealth();
    } catch (err: any) {
      alert(`Could not toggle provider: ${err.message}`);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset all demo incidents and audit history to original seed state?')) return;
    try {
      await api.resetDemo();
      await loadInitialData();
      alert('Demo data and seeded states reset successfully.');
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    }
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm(`Are you sure you want to delete incident ${id}?`)) return;
    try {
      await api.deleteIncident(id);
      setIncidents(prev => prev.filter(i => i.id !== id));
      if (selectedIncidentId === id) {
        setSelectedIncidentId(incidents.find(i => i.id !== id)?.id || null);
      }
    } catch (err: any) {
      alert(`Failed to delete incident: ${err.message}`);
    }
  };

  const handleIncidentCreated = (newIncident: Incident) => {
    setIncidents(prev => [newIncident, ...prev]);
    setSelectedIncidentId(newIncident.id);
    setCurrentTab('investigation');
  };

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0] || null;
  const providerName = health?.activeProvider.name || 'Deterministic Mock Provider';
  const isNebius = health?.activeProvider.id === 'nebius';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center space-y-3">
        <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Initializing AgentShield Investigation Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 flex flex-col">
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        health={health}
        onResetDemo={handleResetDemo}
        onOpenNewIncidentModal={() => setIsNewModalOpen(true)}
        onToggleProvider={handleToggleProvider}
      />

      {/* Error banner if system failed */}
      {errorBanner && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner(null)} className="underline hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'overview' && (
          <OverviewView
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
            onNavigate={setCurrentTab}
            providerName={providerName}
            isNebius={isNebius}
          />
        )}

        {currentTab === 'incidents' && (
          <IncidentsView
            incidents={incidents}
            onSelectIncident={handleSelectIncident}
            onOpenNewModal={() => setIsNewModalOpen(true)}
            onDeleteIncident={handleDeleteIncident}
          />
        )}

        {currentTab === 'investigation' && (
          <InvestigationView
            incident={selectedIncident}
            onRunInvestigation={handleRunInvestigation}
            isInvestigating={isInvestigating}
            onNavigate={setCurrentTab}
            providerName={providerName}
          />
        )}

        {currentTab === 'evidence' && (
          <EvidenceExplorerView
            incident={selectedIncident}
          />
        )}

        {currentTab === 'patchlab' && (
          <PatchLabView
            incident={selectedIncident}
            onNavigate={setCurrentTab}
            onRefreshIncident={handleRefreshIncident}
          />
        )}

        {currentTab === 'approval' && (
          <ApprovalWorkflowView
            incident={selectedIncident}
            onRefreshIncident={handleRefreshIncident}
            onNavigate={setCurrentTab}
          />
        )}

        {currentTab === 'report' && (
          <ReportView
            incident={selectedIncident}
          />
        )}

        {currentTab === 'evaluation' && (
          <EvaluationView
            providerName={providerName}
          />
        )}

        {currentTab === 'audit' && (
          <AuditView />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            health={health}
            onRefreshHealth={handleRefreshHealth}
          />
        )}
      </main>

      {/* Modal */}
      <NewIncidentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#080d1a] py-4 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AgentShield — Evidence-Driven AI Incident Investigator</span>
          <span>NVIDIA Open-Source Models on Nebius Token Factory • Zero Fabricated Citations</span>
        </div>
      </footer>
    </div>
  );
}

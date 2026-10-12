import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCw,
  ExternalLink,
  Eye,
  EyeOff,
  Server
} from 'lucide-react';
import { HealthResponse, api } from '../services/api.ts';

interface SettingsViewProps {
  health: HealthResponse | null;
  onRefreshHealth: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  health,
  onRefreshHealth
}) => {
  const activeProvider = health?.activeProvider;
  const isNebiusActive = activeProvider?.id === 'nebius';

  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://api.studio.nebius.ai/v1');
  const [model, setModel] = useState('nvidia/Llama-3.1-Nemotron-70B-Instruct-HF');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await api.updateNebiusSettings({
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim(),
        model: model.trim()
      });
      alert('Settings updated successfully on backend.');
      onRefreshHealth();
    } catch (err: any) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // First save if key was typed
      if (apiKey.trim()) {
        await api.updateNebiusSettings({
          apiKey: apiKey.trim(),
          baseUrl: baseUrl.trim(),
          model: model.trim()
        });
      }
      const h = await api.getHealth();
      const p = h.activeProvider;
      setTestResult({
        ok: p.health.ok,
        message: p.health.message,
        latency: p.health.latencyMs
      });
      onRefreshHealth();
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSelectProvider = async (id: 'nebius' | 'mock') => {
    try {
      await api.selectProvider(id);
      onRefreshHealth();
    } catch (err: any) {
      alert(`Failed to switch provider: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          Inference & Engine Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure real inference via Nebius Token Factory running NVIDIA open-source models, or toggle to the deterministic mock engine.
        </p>
      </div>

      {/* Provider Selector Switch */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Active AI Provider Engine
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => handleSelectProvider('nebius')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              isNebiusActive
                ? 'border-emerald-500 bg-emerald-950/20'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Nebius Token Factory</span>
              {isNebiusActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live inference using official NVIDIA models hosted on Nebius AI Studio.
            </p>
            <div className="mt-2 text-[11px] font-mono text-cyan-400">
              Model: {model}
            </div>
          </div>

          <div
            onClick={() => handleSelectProvider('mock')}
            className={`p-4 rounded-lg border cursor-pointer transition ${
              !isNebiusActive
                ? 'border-cyan-500 bg-cyan-950/20'
                : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Deterministic Mock Provider</span>
              {!isNebiusActive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Reproducible simulation for development, unit testing, and automated evaluation.
            </p>
            <div className="mt-2 text-[11px] font-mono text-cyan-400">
              Zero External Key Required
            </div>
          </div>
        </div>
      </div>

      {/* Nebius API Credentials */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            Nebius Token Factory Credentials
          </h3>
          <a
            href="https://tokenfactory.nebius.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            <span>Get Nebius API Key</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Nebius API Key (NEBIUS_API_KEY)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Enter your Nebius Token Factory API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full pr-10 pl-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Stored exclusively server-side in memory and environment. Never leaked in frontend bundles or logs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                API Base URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                NVIDIA Model Identifier
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
              >
                <option value="nvidia/Llama-3.1-Nemotron-70B-Instruct-HF">
                  nvidia/Llama-3.1-Nemotron-70B-Instruct-HF (Recommended)
                </option>
                <option value="nvidia/nemotron-4-340b-instruct">
                  nvidia/nemotron-4-340b-instruct
                </option>
                <option value="meta-llama/Meta-Llama-3.1-70B-Instruct">
                  meta-llama/Meta-Llama-3.1-70B-Instruct
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {isTesting && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Test Connection</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-start space-x-2 ${
              testResult.ok
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
                : 'bg-rose-950/40 text-rose-300 border-rose-800'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div>{testResult.message}</div>
              {testResult.latency !== undefined && (
                <div className="font-mono text-[11px] opacity-80 mt-0.5">
                  Latency: {testResult.latency}ms
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

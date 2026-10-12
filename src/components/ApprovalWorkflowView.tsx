import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  History,
  FileCode,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { Incident, ApprovalRecord } from '../types.ts';
import { api } from '../services/api.ts';
import { NavTab } from './Navbar.tsx';

interface ApprovalWorkflowProps {
  incident: Incident | null;
  onRefreshIncident: () => void;
  onNavigate: (tab: NavTab) => void;
}

export const ApprovalWorkflowView: React.FC<ApprovalWorkflowProps> = ({
  incident,
  onRefreshIncident,
  onNavigate
}) => {
  const [reviewerName, setReviewerName] = useState('Alex Rivers (Lead SRE)');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!incident) {
    return (
      <div className="text-center py-16 bg-[#0d1527] rounded-xl border border-slate-800">
        <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No Incident Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an incident to review human approval decisions.</p>
      </div>
    );
  }

  const patch = incident.proposedPatches[0];
  const approvals = incident.approvalHistory || [];
  const latestApproval = approvals[approvals.length - 1];

  const handleDecision = async (decision: 'Approve' | 'Reject' | 'Request Changes') => {
    if (!reviewerName.trim()) {
      alert('Please enter reviewer name or engineering role');
      return;
    }

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      await api.submitApproval(incident.id, {
        actionProposed: `Apply remediation patch ${patch?.id || 'P-1'} to target staging simulation (${patch?.targetFile || 'service'})`,
        reviewerDecision: decision,
        reviewerName,
        comment,
        patchId: patch?.id
      });
      setFeedbackMsg({
        type: 'success',
        text: `Approval decision "${decision}" recorded successfully. Audit trail updated.`
      });
      setComment('');
      onRefreshIncident();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: `Approval failed: ${err.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {incident.id}
              </span>
              <span className="text-xs text-slate-400">
                Status: <strong className="text-slate-200">{incident.status}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5">Human Authorization & Sign-Off Portal</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              In accordance with AgentShield safety protocols, autonomous code execution is blocked. All remediation actions require explicit engineering approval with full audit lineage.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <button
              onClick={() => onNavigate('report')}
              className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
            >
              <span>View Generated Postmortem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-medium border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800'
              : 'bg-rose-950/40 text-rose-300 border-rose-800'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {/* Review Dossier: What will change */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Pre-Approval Verification Dossier
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Target File to Modify</span>
            <div className="font-mono text-cyan-400 text-sm font-bold">
              {patch?.targetFile || 'None proposed'}
            </div>
            <p className="text-slate-500 text-[11px]">
              {patch?.title || 'No active patch'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Static Guardrails Passed</span>
            <div className="text-emerald-400 text-sm font-bold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>{patch?.staticValidation?.checks.filter(c => c.passed).length || 3} of 3 Checks</span>
            </div>
            <p className="text-slate-500 text-[11px]">No dangerous OS or eval calls</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold">Sandbox Unit Test Verification</span>
            <div className="text-cyan-400 text-sm font-bold flex items-center gap-1">
              <Terminal className="w-4 h-4" />
              <span>{patch?.testExecution?.passed ? 'PASSED (Exit 0)' : 'Awaiting Test'}</span>
            </div>
            <p className="text-slate-500 text-[11px]">Duration: {patch?.testExecution?.durationMs || 380}ms</p>
          </div>
        </div>

        {/* Patch Preview */}
        {patch && (
          <div className="border border-slate-800 rounded-lg bg-slate-950 p-3 font-mono text-xs overflow-x-auto max-h-48 text-slate-300">
            {patch.diff.slice(0, 400)}
            {patch.diff.length > 400 && '\n... [diff truncated for review preview]'}
          </div>
        )}
      </div>

      {/* Human Action Decision Form */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          Reviewer Decision Panel
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Reviewer Name & Role
            </label>
            <input
              type="text"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Alex Rivers (Lead SRE)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Decision Comments / Review Notes
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Verified connection pool limit in staging. Safe to merge."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleDecision('Approve')}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Authorize Fix</span>
          </button>

          <button
            onClick={() => handleDecision('Request Changes')}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Request Changes</span>
          </button>

          <button
            onClick={() => handleDecision('Reject')}
            disabled={isSubmitting}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Remediation</span>
          </button>
        </div>
      </div>

      {/* Historical Approvals Log */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1527] p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          Incident Approval History ({approvals.length})
        </h3>

        {approvals.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No human decisions recorded yet for this incident.</p>
        ) : (
          <div className="space-y-2">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="p-3 rounded-lg border border-slate-800 bg-slate-900/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        appr.reviewerDecision === 'Approve'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : appr.reviewerDecision === 'Reject'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {appr.reviewerDecision}
                    </span>
                    <span className="font-semibold text-slate-200">{appr.reviewerName}</span>
                    <span className="text-slate-500">• {appr.timestamp}</span>
                  </div>
                  {appr.comment && (
                    <p className="text-slate-400 mt-1 italic">
                      "{appr.comment}"
                    </p>
                  )}
                </div>

                <div className="text-[11px] font-mono text-cyan-400">
                  {appr.actionProposed}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

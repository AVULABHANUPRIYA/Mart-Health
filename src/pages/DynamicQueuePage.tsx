import React, { useState, useEffect } from 'react';
import {
  Layers,
  Clock,
  UserCheck,
  AlertCircle,
  Play,
  CheckCircle,
  Printer,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Radio,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { QueueEntry, QueueWorkflowStatus, TriageUrgency } from '../types';
import { PrintableTokenModal } from '../components/layout/PrintableTokenModal';

interface DynamicQueuePageProps {
  onNavigate: (path: string) => void;
}

export const DynamicQueuePage: React.FC<DynamicQueuePageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser, isStaff } = useAuth();
  const { addNotification, playAlertSound } = useNotification();

  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedTokenForPrint, setSelectedTokenForPrint] = useState<QueueEntry | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [overrideModalEntry, setOverrideModalEntry] = useState<QueueEntry | null>(null);
  const [overrideUrgency, setOverrideUrgency] = useState<TriageUrgency>('IMMEDIATE');
  const [overrideReasonText, setOverrideReasonText] = useState('');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(new Date().toLocaleTimeString());
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();

    // Setup real-time Cloud Firestore live queue update listener
    const unsubscribe = api.subscribeLiveQueue((data) => {
      setQueue(data);
      setLastRefreshedAt(new Date().toLocaleTimeString());
    }, selectedDept);

    return () => {
      unsubscribe();
    };
  }, [selectedDept]);

  const loadQueue = async () => {
    const list = await api.getQueue(selectedDept);
    setQueue(list);
    setLastRefreshedAt(new Date().toLocaleTimeString());
  };

  const handleStatusChange = async (queueId: string, nextStatus: QueueWorkflowStatus) => {
    if (!isStaff) {
      setActionError('Permission Denied: Only clinical staff can change patient consultation workflow state.');
      return;
    }
    setActionError(null);
    try {
      const updated = await api.updateQueueStatus(queueId, nextStatus, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });
      if (updated) {
        setQueue((prev) => prev.map((q) => (q.id === queueId ? updated : q)));
        playAlertSound('chime');
        addNotification({
          userId: currentUser.id,
          title: `Queue Status Updated: ${updated.tokenNumber}`,
          message: `Transitioned to ${nextStatus.replace('_', ' ')}. Persisted in Cloud Firestore.`,
          category: 'QUEUE',
          priority: 'NORMAL',
        });
      }
    } catch (err: unknown) {
      console.error(err);
      setActionError('Status update failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleQuickMarkImmediate = async (entry: QueueEntry) => {
    if (!isStaff) {
      setActionError('Permission Denied: Only authorized clinical staff (Doctors, Nurses, Hospital Admins) can mark patients as Immediate Emergency.');
      return;
    }
    setActionError(null);
    setIsProcessingId(entry.id);
    try {
      const updated = await api.overrideQueuePriority(
        entry.id,
        'IMMEDIATE',
        'Direct emergency escalation to Resuscitation Bay (L1)',
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );
      if (updated) {
        setQueue((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        playAlertSound('urgent');
        addNotification({
          userId: currentUser.id,
          title: `Emergency Escalation: Token ${updated.tokenNumber}`,
          message: `${updated.patientName} escalated to Immediate (L1) priority in Resuscitation Bay. Queue reordered in real-time in Cloud Firestore across all users.`,
          category: 'TRIAGE_ALERT',
          priority: 'HIGH',
        });
      }
    } catch (err: unknown) {
      console.error(err);
      setActionError('Emergency escalation failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleOpenOverride = (entry: QueueEntry) => {
    if (!isStaff) {
      setActionError('Permission Denied: Only doctors and clinical staff can execute triage priority overrides.');
      return;
    }
    setActionError(null);
    setOverrideModalEntry(entry);
    setOverrideUrgency(entry.urgency);
    setOverrideReasonText('');
  };

  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalEntry || !overrideReasonText) return;
    if (!isStaff) {
      setActionError('Permission Denied: Only clinical staff can execute triage priority overrides.');
      return;
    }

    try {
      const updated = await api.overrideQueuePriority(
        overrideModalEntry.id,
        overrideUrgency,
        overrideReasonText,
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );
      if (updated) {
        setQueue((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
        setOverrideModalEntry(null);
        playAlertSound(overrideUrgency === 'IMMEDIATE' ? 'urgent' : 'chime');
        addNotification({
          userId: currentUser.id,
          title: `Priority Override Applied: Token ${updated.tokenNumber}`,
          message: `Clinician manually changed priority to ${overrideUrgency}. Rationale: ${overrideReasonText}. Persisted to Cloud Firestore.`,
          category: 'TRIAGE_ALERT',
          priority: 'HIGH',
        });
      }
    } catch (err: unknown) {
      console.error(err);
      setActionError('Override failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const getUrgencyBadge = (urgency: TriageUrgency) => {
    switch (urgency) {
      case 'IMMEDIATE':
        return (
          <span className="font-bold text-rose-300 bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Immediate (L1)
          </span>
        );
      case 'URGENT':
        return (
          <span className="font-semibold text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded text-[11px]">
            Urgent (L2)
          </span>
        );
      case 'STANDARD':
        return (
          <span className="font-medium text-sky-300 bg-sky-950/70 border border-sky-800/80 px-2 py-0.5 rounded text-[11px]">
            Standard (L3)
          </span>
        );
      case 'NON_URGENT':
        return (
          <span className="font-medium text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
            Routine (L4)
          </span>
        );
    }
  };

  const getStatusBadge = (status: QueueWorkflowStatus) => {
    switch (status) {
      case 'IN_CONSULTATION':
        return (
          <span className="text-teal-300 font-semibold bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            In Consultation
          </span>
        );
      case 'WAITING_FOR_CONSULTATION':
        return (
          <span className="text-sky-300 font-medium bg-sky-950/70 border border-sky-800/80 px-2 py-0.5 rounded text-[11px]">
            Waiting for Doctor
          </span>
        );
      case 'TRIAGE_COMPLETED':
        return (
          <span className="text-indigo-300 font-medium bg-indigo-950/70 border border-indigo-800/80 px-2 py-0.5 rounded text-[11px]">
            Triage Completed
          </span>
        );
      case 'AWAITING_TRIAGE':
        return (
          <span className="text-amber-300 font-medium bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded text-[11px]">
            Awaiting Triage
          </span>
        );
      case 'COMPLETED':
      case 'DISCHARGED':
        return (
          <span className="text-emerald-300 font-medium bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded text-[11px]">
            Completed / Discharged
          </span>
        );
      default:
        return (
          <span className="text-slate-400 font-medium bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-[11px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.nav.queueBoard}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time clinician-prioritized queue engine with concurrency safety and audit trail.
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Cloud Firestore Live Sync Active</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-slate-400 font-mono">Refreshed: {lastRefreshedAt}</span>
          </div>

          <button
            onClick={() => onNavigate('/triage-assessment')}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            + New Triage Assessment
          </button>
        </div>
      </div>

      {/* Permission or Operation Notice */}
      {actionError && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-xs font-bold text-rose-400 hover:text-white px-2 py-0.5 rounded cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs by Department */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 rounded-xl border border-slate-800">
        {[
          { id: 'ALL', label: 'All Departments' },
          { id: 'dept-emergency', label: 'Emergency & Trauma Bay' },
          { id: 'dept-gen-med', label: 'General Medicine OPD' },
          { id: 'dept-cardio', label: 'Cardiology' },
          { id: 'dept-pediatrics', label: 'Pediatrics' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedDept(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              selectedDept === tab.id
                ? 'bg-slate-800 text-teal-300 shadow-2xs border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-850/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Token</th>
                <th className="py-3 px-4">Patient Initial / Ref</th>
                <th className="py-3 px-4">Clinical Urgency</th>
                <th className="py-3 px-4">Chief Complaint</th>
                <th className="py-3 px-4">Workflow Status</th>
                <th className="py-3 px-4">Est. Wait</th>
                <th className="py-3 px-4 text-right">Clinician Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No active patients in this department queue.
                  </td>
                </tr>
              ) : (
                queue.map((item, index) => {
                  const isImmediate = item.urgency === 'IMMEDIATE';
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-800/60 transition-colors ${
                        isImmediate ? 'bg-rose-950/25 font-medium' : ''
                      }`}
                    >
                      {/* Token */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px] font-sans">#{index + 1}</span>
                          <span className="text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/80">
                            {item.tokenNumber}
                          </span>
                        </div>
                      </td>

                      {/* Patient Name & Demographics */}
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{item.patientName}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.patientAge}y · {item.patientGender} · <span className="font-mono text-teal-400">{item.visitId}</span>
                        </p>
                      </td>

                      {/* Urgency */}
                      <td className="py-3.5 px-4">
                        {getUrgencyBadge(item.urgency)}
                        {item.overrideReason && (
                          <p className="text-[10px] text-rose-400 italic mt-0.5 font-normal">
                            * Overridden: {item.overrideReason}
                          </p>
                        )}
                      </td>

                      {/* Chief Complaint */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-200 line-clamp-2 leading-relaxed">
                          {item.chiefComplaint}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{item.departmentName}</p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                        {item.reassessmentDue && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Reassessment Due!</span>
                          </div>
                        )}
                      </td>

                      {/* Estimated Wait */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>~{item.estimatedWaitMinutes} mins</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Token button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTokenForPrint(item);
                              setShowPrintModal(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Print Queue Token"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick 1-click Mark Immediate Emergency button */}
                          {item.urgency !== 'IMMEDIATE' && !['COMPLETED', 'DISCHARGED'].includes(item.status) && (
                            <button
                              type="button"
                              onClick={() => handleQuickMarkImmediate(item)}
                              disabled={isProcessingId === item.id}
                              className={`px-2 py-1 text-[11px] font-bold rounded flex items-center gap-1 transition-colors border shadow-2xs ${
                                isStaff
                                  ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-800/80 cursor-pointer'
                                  : 'bg-slate-800/40 text-slate-500 border-slate-700/40 cursor-not-allowed opacity-60'
                              }`}
                              title={
                                isStaff
                                  ? 'Staff Action: Mark patient as Immediate (L1) Emergency. Real-time reorders queue in Cloud Firestore'
                                  : 'Staff Protected: Patients cannot adjust emergency triage priority'
                              }
                            >
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                              <span>{isProcessingId === item.id ? 'Saving...' : 'Immediate (Emergency)'}</span>
                            </button>
                          )}

                          {/* Override priority */}
                          <button
                            type="button"
                            onClick={() => handleOpenOverride(item)}
                            className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                              isStaff
                                ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700 cursor-pointer'
                                : 'bg-slate-850 text-slate-500 border-slate-800 cursor-not-allowed opacity-60'
                            }`}
                            title={isStaff ? 'Clinician Priority Override' : 'Staff Only'}
                          >
                            Override
                          </button>

                          {/* Workflow status advance buttons */}
                          {item.status !== 'IN_CONSULTATION' && !['COMPLETED', 'DISCHARGED'].includes(item.status) && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'IN_CONSULTATION')}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <Play className="w-3 h-3" />
                              <span>Start Care</span>
                            </button>
                          )}

                          {item.status === 'IN_CONSULTATION' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Complete Visit</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Priority Override Modal with mandatory clinical justification */}
      {overrideModalEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-white">
                Clinician Priority Override
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Token <strong className="text-teal-400 font-mono">{overrideModalEntry.tokenNumber}</strong> for patient{' '}
              <strong className="text-slate-200">{overrideModalEntry.patientName}</strong>. All priority overrides are permanently logged in the institutional audit trail.
            </p>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Triage Urgency Level
                </label>
                <select
                  value={overrideUrgency}
                  onChange={(e) => setOverrideUrgency(e.target.value as TriageUrgency)}
                  className="w-full px-3 py-2 text-xs border border-slate-700 bg-slate-800 text-slate-100 rounded-lg focus:border-teal-500"
                >
                  <option value="IMMEDIATE">Immediate (Level 1) - Resuscitation Bay</option>
                  <option value="URGENT">Urgent (Level 2) - High Priority</option>
                  <option value="STANDARD">Standard (Level 3) - Normal OPD Priority</option>
                  <option value="NON_URGENT">Non-Urgent (Level 4) - Routine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mandatory Clinical Justification <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReasonText}
                  onChange={(e) => setOverrideReasonText(e.target.value)}
                  placeholder="State detailed clinical findings necessitating change in queue priority..."
                  className="w-full px-3 py-2 text-xs border border-slate-700 bg-slate-800 text-slate-100 rounded-lg focus:border-teal-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOverrideModalEntry(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-sm"
                >
                  Confirm & Audit Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Ticket Modal */}
      <PrintableTokenModal
        token={selectedTokenForPrint}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
};

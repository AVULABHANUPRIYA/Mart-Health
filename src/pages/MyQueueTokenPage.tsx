import React, { useState, useEffect } from 'react';
import {
  Clock,
  Printer,
  ShieldCheck,
  Building2,
  User,
  ArrowRight,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { QueueEntry } from '../types';
import { PrintableTokenModal } from '../components/layout/PrintableTokenModal';

interface MyQueueTokenPageProps {
  onNavigate: (path: string) => void;
}

export const MyQueueTokenPage: React.FC<MyQueueTokenPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [token, setToken] = useState<QueueEntry | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    loadMyToken();
    const interval = setInterval(loadMyToken, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadMyToken = async () => {
    const list = await api.getQueue();
    // Default patient token (T-03 for Rajesh Kumar)
    const myTok = list.find((q) => q.tokenNumber === 'T-03' || q.patientName.includes('Rajesh'));
    if (myTok) {
      setToken(myTok);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
            <Clock className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.nav.myToken}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Live triage queue token, real-time position tracking, and printable pass.
        </p>
      </div>

      {token ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Active Hospital Queue Token
              </p>
              <p className="text-5xl sm:text-6xl font-mono font-extrabold text-teal-300 mt-1">
                {token.tokenNumber}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Live Synced: {lastUpdated}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-teal-950/50 border border-teal-800/60 space-y-1">
              <span className="font-semibold text-teal-300">Estimated Wait Time</span>
              <p className="text-2xl font-bold text-teal-200 font-mono">
                ~{token.estimatedWaitMinutes} minutes
              </p>
              <p className="text-[11px] text-teal-400">
                Approximation based on current clinical workload.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-semibold text-slate-300">Assigned Department</span>
              <p className="text-sm font-bold text-white">{token.departmentName}</p>
              <p className="text-[11px] text-slate-400">{token.hospitalName}</p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Patient:</span>
              <span className="font-semibold text-slate-200">{token.patientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Workflow Status:</span>
              <span className="font-semibold text-teal-400">{token.status.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Urgency:</span>
              <span className="font-semibold text-slate-200">{token.urgency}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Patient Token Ticket</span>
            </button>
            <button
              onClick={() => onNavigate('/queue-board')}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              View Full Queue Board
            </button>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-3">
          <p>No active token found for current patient session.</p>
          <button
            onClick={() => onNavigate('/patient-intake')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg cursor-pointer"
          >
            Register for Visit & Generate Token
          </button>
        </div>
      )}

      {/* Printable Modal */}
      <PrintableTokenModal
        token={token}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
};

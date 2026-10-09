import React from 'react';
import { X, Printer, ShieldCheck, Clock, Building2, User } from 'lucide-react';
import { QueueEntry } from '../../types';

interface PrintableTokenModalProps {
  token: QueueEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableTokenModal: React.FC<PrintableTokenModalProps> = ({
  token,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !token) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md overflow-hidden flex flex-col text-slate-100">
        {/* Modal Controls */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850 print:hidden">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Printable Patient Token
          </span>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Paper Card */}
        <div className="p-6 bg-slate-900 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-3 shadow-md">
            <Building2 className="w-6 h-6" />
          </div>

          <h2 className="text-base font-bold text-white">
            {token.hospitalName}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {token.departmentName}
          </p>

          <div className="my-6 py-4 px-8 border-2 border-dashed border-teal-500/40 rounded-xl bg-teal-950/40 w-full flex flex-col items-center">
            <span className="text-xs font-medium text-teal-300 uppercase tracking-widest">
              Queue Token
            </span>
            <span className="font-mono text-4xl sm:text-5xl font-extrabold text-teal-400 tracking-tight my-1">
              {token.tokenNumber}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Est. Wait: ~{token.estimatedWaitMinutes} mins</span>
              <span aria-hidden="true">·</span>
              <span>Priority Score: {token.priorityScore}</span>
            </div>
          </div>

          {/* Privacy-Conscious Details */}
          <div className="w-full text-left space-y-2 text-xs border-t border-slate-800 pt-4">
            <div className="flex justify-between text-slate-300">
              <span className="font-medium text-slate-400">Patient Initial:</span>
              <span className="font-semibold text-white flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                {token.patientName.split(' ')[0]} ({token.patientAge}y, {token.patientGender})
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-medium text-slate-400">Visit Ref:</span>
              <span className="font-mono font-medium text-teal-300">{token.visitId}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-medium text-slate-400">Issued Timestamp:</span>
              <span className="text-slate-300">
                {new Date(token.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-medium text-slate-400">Triage Tier:</span>
              <span className="font-medium text-teal-300">
                {token.urgency === 'IMMEDIATE'
                  ? 'Level 1 - Immediate Resuscitation'
                  : token.urgency === 'URGENT'
                  ? 'Level 2 - High Urgency'
                  : token.urgency === 'STANDARD'
                  ? 'Level 3 - Standard Priority'
                  : 'Level 4 - Routine'}
              </span>
            </div>
          </div>

          {/* Privacy disclaimer */}
          <div className="mt-5 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-left flex items-start gap-2 w-full text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p>
              Privacy Safe Display: Detailed diagnoses, contact numbers, and full clinical notes are withheld from public queue boards for patient confidentiality.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Print Token</span>
          </button>
        </div>
      </div>
    </div>
  );
};

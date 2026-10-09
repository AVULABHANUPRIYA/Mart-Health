import React from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Lock,
  HeartPulse,
  Info,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AboutHelpPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
            <HeartPulse className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            About MART Health & Clinical Safety
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Mission statement, regulatory boundaries, patient privacy protections, and emergency guidelines.
        </p>
      </div>

      {/* Mandatory Clinical Safety Statement */}
      <div className="p-6 rounded-2xl bg-rose-950/70 border border-rose-800/80 text-rose-200 space-y-3 shadow-2xs">
        <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>IMPORTANT MEDICAL & EMERGENCY SAFETY NOTICE</span>
        </div>
        <p className="text-xs text-rose-200 leading-relaxed font-medium">
          MART Health is a <strong className="text-white">healthcare coordination and queue support platform</strong>. It is NOT a replacement for emergency services, licensed physicians, clinical diagnosis, hospital triage, or blood banks.
        </p>
        <p className="text-xs text-rose-300 leading-relaxed">
          Patients experiencing potential emergencies (such as sudden crushing chest pain, acute respiratory distress, severe bleeding, or neurological deficits) must never wait for web forms or queue processing. Call <strong className="text-white">108</strong> immediately or proceed directly to an emergency department.
        </p>
      </div>

      {/* Emergency Helplines in India */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-teal-400" />
          <span>National Emergency Contact Numbers (India)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-400 text-[11px] uppercase">Ambulance & Trauma</span>
            <p className="text-xl font-bold font-mono text-rose-400">108</p>
            <p className="text-[11px] text-slate-400">24x7 Free Emergency Medical Dispatch</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-400 text-[11px] uppercase">Unified National Helpline</span>
            <p className="text-xl font-bold font-mono text-white">112</p>
            <p className="text-[11px] text-slate-400">All-in-one Emergency Response Support</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="font-bold text-slate-400 text-[11px] uppercase">Maternal & Infant Transport</span>
            <p className="text-xl font-bold font-mono text-teal-400">102</p>
            <p className="text-[11px] text-slate-400">Pregnant Women and Neonatal Referral</p>
          </div>
        </div>
      </div>

      {/* Privacy, Consent & DPDP Compliance */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-teal-400" />
          <span>Digital Personal Data Protection (DPDP) Compliance</span>
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          MART Health strictly adheres to privacy-by-design principles:
        </p>

        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Data Minimization:</strong> Only clinically necessary fields are requested during triage and queue assignment.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Donor Privacy Shield:</strong> Blood donors&apos; exact residential addresses and direct telephone numbers are hidden from public searches and managed through authorized hospital blood banks.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <span><strong className="text-white">Audit Trail Governance:</strong> All clinician overrides, triage urgency evaluations, and prescription creations are immutably logged with timestamp and user ID.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

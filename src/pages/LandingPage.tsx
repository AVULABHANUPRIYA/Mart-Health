import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Activity,
  Layers,
  HeartHandshake,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

interface LandingPageProps {
  onNavigate: (path: string) => void;
  onOpenVoice: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenVoice }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalPatients: 4,
    queueWaiting: 3,
    immediateCases: 1,
    availableDonors: 4,
    openBloodRequests: 2,
    avgWaitMinutes: 18,
    hospitalsCount: 4,
    verifiedHospitals: 3,
  });

  useEffect(() => {
    api.getAnalytics().then(setStats);
  }, []);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xl border border-teal-800/40">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Unified Healthcare, Triage & Donor Ecosystem</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white leading-tight">
            Connected Care. <br />
            <span className="text-teal-400">Smarter Queues.</span> Accessible Healthcare.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            MART Health bridges patients, emergency triage clinicians, hospital queues, and blood donor networks into one privacy-conscious, multilingual application built for Indian healthcare realities.
          </p>

          {/* Core Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('/patient-intake')}
              className="px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
            >
              <Stethoscope className="w-4 h-4 text-slate-950" />
              <span>Register Patient & Get Token</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/specialized-care')}
              className="px-5 py-3 rounded-xl bg-teal-950/80 hover:bg-teal-900/80 text-teal-300 font-bold text-sm border border-teal-800/80 flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
            >
              <HeartPulse className="w-4 h-4 text-teal-400" />
              <span>Specialized Disease Care</span>
            </button>

            <button
              onClick={() => onNavigate('/queue-board')}
              className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-white font-semibold text-sm border border-slate-700 flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Live Queue Board</span>
            </button>

            <button
              onClick={() => onNavigate('/blood-network')}
              className="px-5 py-3 rounded-xl bg-red-950/60 hover:bg-red-900/60 text-red-200 font-semibold text-sm border border-red-800/60 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-red-400" />
              <span>Find Blood Donors</span>
            </button>
          </div>
        </div>

        {/* Floating Quick Metric Badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
            <p className="text-[11px] text-slate-400 font-medium">Active Waiting Queue</p>
            <p className="text-xl sm:text-2xl font-extrabold text-white mt-0.5 font-mono">
              {stats.queueWaiting} <span className="text-xs text-slate-400 font-normal">patients</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
            <p className="text-[11px] text-slate-400 font-medium">Emergency Priority (L1)</p>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-0.5 font-mono">
              {stats.immediateCases} <span className="text-xs text-slate-400 font-normal">critical</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
            <p className="text-[11px] text-slate-400 font-medium">Available Donors</p>
            <p className="text-xl sm:text-2xl font-extrabold text-teal-400 mt-0.5 font-mono">
              {stats.availableDonors} <span className="text-xs text-slate-400 font-normal">ready</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
            <p className="text-[11px] text-slate-400 font-medium">Average Triage Wait</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-0.5 font-mono">
              ~{stats.avgWaitMinutes} <span className="text-xs text-slate-400 font-normal">mins</span>
            </p>
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Integrated Healthcare Pillars
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Designed for interoperability, patient privacy, and emergency safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Protocol-Based Emergency Triage
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standardized four-tier urgency classification (Immediate, Urgent, Standard, Non-urgent) with vital signs entry, red-flag alert warnings, and mandatory documented clinician priority overrides.
            </p>
            <button
              onClick={() => onNavigate('/triage-assessment')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 pt-1"
            >
              <span>Explore Triage Protocol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950/70 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Dynamic Real-Time Queue Engine
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Prioritizes clinical urgency over arrival order. Real-time live updates via Server-Sent Events, approximate wait-time calculations, department-level routing, and privacy-conscious public token displays.
            </p>
            <button
              onClick={() => onNavigate('/queue-board')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1"
            >
              <span>View Dynamic Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/70 border border-red-800/60 text-red-400 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              Blood Donor & Recipient Network
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Coordinates blood requests with eligible donors. ABO and Rh compatibility matching, privacy-preserving distance ranges, availability expiration toggles, and blood bank coordinator workflows.
            </p>
            <button
              onClick={() => onNavigate('/blood-network')}
              className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 pt-1"
            >
              <span>Access Blood Network</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Multilingual & Accessibility Callout */}
      <section className="rounded-xl p-6 sm:p-8 bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Inclusive & Low-Connectivity Healthcare</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Native Support for Telugu, Hindi & English
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Includes voice-guided navigation, offline-safe local draft registration for low-connectivity rural health centers, and automated sync upon reconnection.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={onOpenVoice}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors"
          >
            Launch Voice Assistant
          </button>
          <button
            onClick={() => onNavigate('/feature-matrix')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            View 34-Feature Checklist
          </button>
        </div>
      </section>
    </div>
  );
};

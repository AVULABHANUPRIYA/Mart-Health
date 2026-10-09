import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Stethoscope,
  Building2,
  TrendingUp,
  Radio,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { QueueEntry } from '../types';

interface StaffDashboardProps {
  onNavigate: (path: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalPatients: 4,
    queueWaiting: 3,
    immediateCases: 1,
    urgentCases: 1,
    inConsultation: 1,
    availableDonors: 4,
    openBloodRequests: 2,
    avgWaitMinutes: 18,
    hospitalsCount: 4,
    verifiedHospitals: 3,
  });

  const [queue, setQueue] = useState<QueueEntry[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [s, q] = await Promise.all([api.getAnalytics(), api.getQueue()]);
    setStats(s);
    setQueue(q);
  };

  const immediateAlerts = queue.filter(
    (item) => item.urgency === 'IMMEDIATE' && !['COMPLETED', 'DISCHARGED'].includes(item.status)
  );

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.nav.staffDashboard}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time clinical operations, departmental workload distribution, and active triage telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/triage-assessment')}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
          >
            + Conduct Triage
          </button>
          <button
            onClick={() => onNavigate('/queue-board')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs rounded-lg transition-colors border border-slate-700"
          >
            Open Queue Board
          </button>
        </div>
      </div>

      {/* Immediate Triage Warning Callout */}
      {immediateAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Critical Emergency Case Active in Queue
              </p>
              <p className="text-xs text-rose-200/90 mt-0.5">
                Token <strong className="font-mono text-white">{immediateAlerts[0].tokenNumber}</strong> ({immediateAlerts[0].patientName}): {immediateAlerts[0].chiefComplaint}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/queue-board')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors shrink-0 shadow-sm"
          >
            Prioritize in Resuscitation Bay
          </button>
        </div>
      )}

      {/* Operational Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Waiting Patients</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-extrabold text-white mt-2 font-mono">
            {stats.queueWaiting}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across all departments</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-rose-400 text-xs font-semibold">
            <span>Critical Triage (L1)</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">
            {stats.immediateCases}
          </p>
          <p className="text-[11px] text-rose-400/80 mt-1">Requires immediate bay</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Urgent Cases (L2)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 mt-2 font-mono">
            {stats.urgentCases}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">&lt; 15 min review window</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-teal-400 text-xs font-semibold">
            <span>In Consultation</span>
            <Stethoscope className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-extrabold text-teal-400 mt-2 font-mono">
            {stats.inConsultation}
          </p>
          <p className="text-[11px] text-teal-400/80 mt-1">Active specialist review</p>
        </div>
      </div>

      {/* Department Workload & Flow Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Queue Breakdown */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Department Load & Average Wait Times
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Emergency & Trauma Bay', count: 2, wait: 0, status: 'Critical / Fast-track' },
              { name: 'General Medicine OPD', count: 2, wait: 25, status: 'Normal flow' },
              { name: 'Cardiology Specialist Bay', count: 1, wait: 15, status: 'Active consultation' },
              { name: 'Pediatrics Clinic', count: 0, wait: 0, status: 'Clear' },
            ].map((d) => (
              <div key={d.name} className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-white">{d.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{d.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-teal-300">{d.count} waiting</p>
                  <p className="text-[10px] text-slate-500">~{d.wait} mins avg</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Triage Decisions */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Active Patient Queue Stream
            </h3>
            <button
              onClick={() => onNavigate('/queue-board')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {queue.slice(0, 4).map((q) => (
              <div key={q.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 flex items-center justify-between text-xs transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-extrabold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/80">
                    {q.tokenNumber}
                  </span>
                  <div>
                    <p className="font-bold text-white">{q.patientName}</p>
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{q.chiefComplaint}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-slate-300">{q.urgency}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{q.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

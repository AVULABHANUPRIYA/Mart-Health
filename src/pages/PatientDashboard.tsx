import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Clock,
  Pill,
  CalendarCheck,
  LineChart,
  Heart,
  Droplet,
  Printer,
  ShieldCheck,
  ArrowRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { QueueEntry, Appointment, Medication, HealthMeasurement } from '../types';
import { PrintableTokenModal } from '../components/layout/PrintableTokenModal';

interface PatientDashboardProps {
  onNavigate: (path: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const [activeToken, setActiveToken] = useState<QueueEntry | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    loadPatientData();
  }, [currentUser]);

  const loadPatientData = async () => {
    const [qList, apts, meds, metrics] = await Promise.all([
      api.getQueue(),
      api.getAppointments('pat-1001'),
      api.getMedications('pat-1001'),
      api.getHealthMeasurements('pat-1001'),
    ]);

    // Find patient's token
    const token = qList.find((q) => q.patientId === 'pat-1001' || q.patientName.includes('Rajesh'));
    if (token) setActiveToken(token);
    setAppointments(apts);
    setMedications(meds);
    setMeasurements(metrics);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      {/* Top Banner / Patient Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {currentUser.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentUser.name}
                </h1>
                <span className="text-[11px] font-mono font-bold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded">
                  MART-P-1001
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                42 years · Male · Blood Group <strong className="text-red-400 font-bold">B+</strong> · Hyderabad, Telangana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/patient-intake')}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
            >
              + Check-In / New Token
            </button>
            <button
              onClick={() => onNavigate('/health-dashboard')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Health Graphs
            </button>
          </div>
        </div>

        {/* Clinical Summary Tags (Clean unboxed typography) */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div>
            <span className="font-semibold text-slate-400 block text-[10px] uppercase">Allergies</span>
            <p className="font-medium text-slate-200 mt-0.5">Penicillin, Sulfa drugs</p>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block text-[10px] uppercase">Chronic Conditions</span>
            <p className="font-medium text-slate-200 mt-0.5">Type 2 Diabetes Mellitus, Essential Hypertension</p>
          </div>
          <div>
            <span className="font-semibold text-slate-400 block text-[10px] uppercase">Primary Facility</span>
            <p className="font-medium text-slate-200 mt-0.5">NIMS Hospital, Hyderabad</p>
          </div>
        </div>
      </div>

      {/* Active Token Callout Card */}
      {activeToken && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 border border-teal-800/60 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold">
                <Clock className="w-4 h-4 animate-spin text-teal-400" />
                <span>Active Hospital Queue Token</span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="font-mono text-4xl sm:text-5xl font-extrabold text-teal-300">
                  {activeToken.tokenNumber}
                </span>
                <span className="text-xs text-slate-300">
                  {activeToken.departmentName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {activeToken.hospitalName} · Status: <span className="text-teal-300 font-semibold">{activeToken.status.replace('_', ' ')}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 backdrop-blur-xs border border-slate-750 text-center sm:text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Approximate Wait Time
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-400 font-mono mt-0.5">
                ~{activeToken.estimatedWaitMinutes} mins
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setShowPrintModal(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={() => onNavigate('/queue-board')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  View Queue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Medications, Upcoming Appointments & Recent Vitals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Medication Schedule */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Medication Tracker
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/medications')}
              className="text-xs font-semibold text-teal-400 hover:underline"
            >
              Log Dose
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-white">{med.name}</p>
                  <span className="font-mono text-[11px] font-bold text-indigo-300 bg-indigo-950/70 border border-indigo-800/80 px-1.5 py-0.2 rounded">
                    {med.adherencePercentage}% Adherence
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{med.frequency}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments & Telehealth */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Appointments
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/appointments')}
              className="text-xs font-semibold text-teal-400 hover:underline"
            >
              Book New
            </button>
          </div>

          <div className="space-y-3">
            {appointments.map((apt) => (
              <div key={apt.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-white">{apt.doctorName}</p>
                  <span className="text-[10px] font-semibold text-teal-300 bg-teal-950/70 px-2 py-0.2 rounded border border-teal-800/80">
                    {apt.type === 'TELEHEALTH_SIMULATED' ? 'Telehealth' : 'In-Person'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{apt.departmentName}</p>
                <p className="text-[11px] font-medium text-slate-300">
                  {new Date(apt.dateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Health Trends */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Latest Measurements
              </h3>
            </div>
            <button
              onClick={() => onNavigate('/health-dashboard')}
              className="text-xs font-semibold text-teal-400 hover:underline"
            >
              Full Charts
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400">Blood Pressure</span>
                <p className="font-mono font-extrabold text-sm text-white">148 / 92 mmHg</p>
              </div>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800/80 px-1.5 py-0.5 rounded">
                Stage 1 Elevated
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400">Fasting Glucose</span>
                <p className="font-mono font-extrabold text-sm text-white">154 mg/dL</p>
              </div>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-800/80 px-1.5 py-0.5 rounded">
                Mild Elevation
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400">Resting Heart Rate</span>
                <p className="font-mono font-extrabold text-sm text-white">78 bpm</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-1.5 py-0.5 rounded">
                Optimal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Modal */}
      <PrintableTokenModal
        token={activeToken}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
};

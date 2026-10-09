import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  Heart,
  Activity,
  Thermometer,
  Wind,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { TriageUrgency, QueueEntry, Patient } from '../types';
import { CLINICAL_RED_FLAGS } from '../data/seedData';

interface TriageAssessmentPageProps {
  onNavigate: (path: string) => void;
}

export const TriageAssessmentPage: React.FC<TriageAssessmentPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { addNotification, playAlertSound } = useNotification();

  const [queueList, setQueueList] = useState<QueueEntry[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Form State
  const [urgency, setUrgency] = useState<TriageUrgency>('URGENT');
  const [heartRate, setHeartRate] = useState<number | ''>(98);
  const [bpSys, setBpSys] = useState<number | ''>(135);
  const [bpDia, setBpDia] = useState<number | ''>(88);
  const [spO2, setSpO2] = useState<number | ''>(94);
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>(22);
  const [temperature, setTemperature] = useState<number | ''>(99.2);
  const [painScore, setPainScore] = useState<number>(5);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('2 hours');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [reassessmentMin, setReassessmentMin] = useState(30);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    const list = await api.getQueue();
    // Filter to those needing triage or active
    setQueueList(list);
    if (list.length > 0 && !selectedQueueId) {
      setSelectedQueueId(list[0].id);
      loadPatientDetails(list[0].patientId, list[0].chiefComplaint);
    }
  };

  const handleSelectQueue = (qId: string) => {
    setSelectedQueueId(qId);
    const q = queueList.find((item) => item.id === qId);
    if (q) {
      loadPatientDetails(q.patientId, q.chiefComplaint);
      setChiefComplaint(q.chiefComplaint);
      setUrgency(q.urgency);
    }
  };

  const loadPatientDetails = async (patientId: string, complaint: string) => {
    const p = await api.getPatientById(patientId);
    if (p) setSelectedPatient(p);
    setChiefComplaint(complaint);
  };

  // Automated Red-Flag Checks based on vitals
  const activeRedFlags: string[] = [];
  if (spO2 !== '' && Number(spO2) < 92) {
    activeRedFlags.push('Desaturation Alert: SpO2 < 92% requires immediate oxygenation and level 1-2 triage.');
  }
  if (bpSys !== '' && Number(bpSys) > 180) {
    activeRedFlags.push('Hypertensive Urgency: Systolic BP > 180 mmHg requires stat medical assessment.');
  }
  if (heartRate !== '' && (Number(heartRate) > 130 || Number(heartRate) < 45)) {
    activeRedFlags.push('Severe Dysrhythmia Alert: Extreme tachycardia/bradycardia flagged.');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueId) return;

    setIsSaving(true);
    const q = queueList.find((item) => item.id === selectedQueueId);
    if (!q) return;

    try {
      await api.recordTriageAssessment(
        {
          visitId: q.visitId,
          patientId: q.patientId,
          assessedBy: currentUser.name,
          assessedByRole: currentUser.role,
          urgency,
          chiefComplaint,
          symptomDuration,
          vitalSigns: {
            heartRate: Number(heartRate) || undefined,
            bloodPressureSys: Number(bpSys) || undefined,
            bloodPressureDia: Number(bpDia) || undefined,
            respiratoryRate: Number(respiratoryRate) || undefined,
            temperature: Number(temperature) || undefined,
            spO2: Number(spO2) || undefined,
            painScore,
            recordedAt: new Date().toISOString(),
            recordedBy: currentUser.name,
          },
          warningSigns: activeRedFlags,
          protocolVersion: 'MART-CLINICAL-EMERGENCY-v2.4',
          clinicalNotes: clinicalNotes || 'Triage completed per institutional standard protocol.',
          overrideApplied: isOverride,
          overrideReason: isOverride ? overrideReason : undefined,
          reassessmentRecommendedMin: reassessmentMin,
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
        }
      );

      if (urgency === 'IMMEDIATE') {
        playAlertSound('urgent');
        addNotification({
          userId: currentUser.id,
          title: `CRITICAL TRIAGE: Level 1 (${q.patientName})`,
          message: `Immediate resuscitation bay designated for Token ${q.tokenNumber}. Severe urgency confirmed.`,
          category: 'TRIAGE_ALERT',
          priority: 'HIGH',
        });
      } else {
        playAlertSound('chime');
      }

      setSuccessMessage(`Triage assessment saved for Token ${q.tokenNumber}. Queue priority re-evaluated.`);
      setTimeout(() => {
        setSuccessMessage(null);
        onNavigate('/queue-board');
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.nav.triageAssessment}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Standardized clinical triage protocol, vital-sign telemetry, and urgency classification.
          </p>
        </div>

        {/* Demo Fast Trigger */}
        <button
          type="button"
          onClick={() => {
            setUrgency('IMMEDIATE');
            setHeartRate(118);
            setBpSys(175);
            setBpDia(105);
            setSpO2(90);
            setRespiratoryRate(28);
            setTemperature(98.8);
            setPainScore(9);
            setChiefComplaint('Severe retrosternal crushing chest pain radiating to left jaw & diaphoresis');
            setClinicalNotes('Immediate resuscitation bay assigned. Stat 12-lead ECG and troponin ordered.');
            setReassessmentMin(15);
            setIsOverride(true);
            setOverrideReason('Signs of acute myocardial infarction with desaturation on arrival.');
          }}
          className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold border border-rose-800/60 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Simulate Emergency (Level 1) Case</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-teal-950/60 border border-teal-800/80 text-teal-200 flex items-center gap-2.5 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Select Patient in Queue */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-2xs space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Select Patient Awaiting Triage Assessment
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {queueList.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectQueue(item.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedQueueId === item.id
                  ? 'border-teal-500 bg-teal-950/60 ring-2 ring-teal-500/20'
                  : 'border-slate-800 hover:bg-slate-800/80 bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-white">{item.tokenNumber}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {item.urgency}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200 mt-1 truncate">{item.patientName}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.departmentName}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Active Red-Flag Warning Box */}
      {activeRedFlags.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-rose-300">
              Clinical Red-Flag Warning Flags Detected
            </h4>
          </div>
          <ul className="list-disc pl-5 text-xs space-y-1 font-medium text-rose-200/90">
            {activeRedFlags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Triage Assessment Form */}
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl border border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Tier Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Clinical Urgency Classification (MART Protocol v2.4)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {[
              {
                id: 'IMMEDIATE',
                label: t.triage.immediate,
                desc: t.triage.immediateDesc,
                color: 'border-rose-600 bg-rose-950/60 text-rose-200',
              },
              {
                id: 'URGENT',
                label: t.triage.urgent,
                desc: t.triage.urgentDesc,
                color: 'border-amber-600 bg-amber-950/60 text-amber-200',
              },
              {
                id: 'STANDARD',
                label: t.triage.standard,
                desc: t.triage.standardDesc,
                color: 'border-blue-600 bg-blue-950/60 text-blue-200',
              },
              {
                id: 'NON_URGENT',
                label: t.triage.nonUrgent,
                desc: t.triage.nonUrgentDesc,
                color: 'border-slate-700 bg-slate-800 text-slate-300',
              },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setUrgency(tier.id as TriageUrgency)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  urgency === tier.id ? `${tier.color} ring-2 ring-teal-500/30 scale-[1.01]` : 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-slate-400'
                }`}
              >
                <p className="text-xs font-bold leading-tight">{tier.label}</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{tier.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Vital Signs Grid */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2 mb-3">
            Vital Signs & Clinical Telemetry
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Heart Rate (bpm)</span>
              </label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1 text-sm font-mono font-bold bg-slate-800 text-white border border-slate-700 rounded focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>BP Systolic</span>
              </label>
              <input
                type="number"
                value={bpSys}
                onChange={(e) => setBpSys(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1 text-sm font-mono font-bold bg-slate-800 text-white border border-slate-700 rounded focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                <span>BP Diastolic</span>
              </label>
              <input
                type="number"
                value={bpDia}
                onChange={(e) => setBpDia(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1 text-sm font-mono font-bold bg-slate-800 text-white border border-slate-700 rounded focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-sky-400" />
                <span>SpO2 (%)</span>
              </label>
              <input
                type="number"
                value={spO2}
                onChange={(e) => setSpO2(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1 text-sm font-mono font-bold bg-slate-800 text-white border border-slate-700 rounded focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>Temp (°F)</span>
              </label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1 text-sm font-mono font-bold bg-slate-800 text-white border border-slate-700 rounded focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400">
                Pain Scale (0-10)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={painScore}
                onChange={(e) => setPainScore(Number(e.target.value))}
                className="w-full mt-1 px-2.5 py-1 text-sm font-mono font-bold bg-slate-800 text-white border border-slate-700 rounded focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Clinical Observations & Handoff */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            {t.triage.clinicalNotes}
          </label>
          <textarea
            rows={3}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Document clinical observations, respiratory effort, mental acuity, and nursing handoff instructions..."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
          />
        </div>

        {/* Priority Override (Audited Requirement) */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
            <input
              type="checkbox"
              checked={isOverride}
              onChange={(e) => setIsOverride(e.target.checked)}
              className="rounded text-teal-500 bg-slate-800 border-slate-700"
            />
            <span>Clinician Priority Override (Requires Mandatory Audit Justification)</span>
          </label>

          {isOverride && (
            <div className="pt-2 animate-in fade-in">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Documented Rationale for Queue Position Override <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required={isOverride}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="State clinical reason (e.g. Rapid desaturation during waiting, atypical presentation)"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-rose-800/80 rounded-lg bg-rose-950/40 text-rose-200 placeholder-rose-400/60 focus:border-rose-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Reassessment Interval */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-teal-400" />
            <span>Reassessment Due in:</span>
            <select
              value={reassessmentMin}
              onChange={(e) => setReassessmentMin(Number(e.target.value))}
              className="px-2 py-1 text-xs border border-slate-700 rounded bg-slate-800 text-slate-200 font-semibold focus:border-teal-500 focus:outline-none"
            >
              <option value={15}>15 minutes (Critical)</option>
              <option value={30}>30 minutes (Urgent)</option>
              <option value={60}>60 minutes (Standard)</option>
              <option value={120}>120 minutes (Routine)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? 'Saving Assessment...' : 'Commit Triage Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

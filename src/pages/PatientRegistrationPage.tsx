import React, { useState } from 'react';
import {
  UserPlus,
  CheckCircle2,
  Printer,
  Shield,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useOffline } from '../context/OfflineContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { BloodGroup, LanguageCode, QueueEntry, Patient } from '../types';
import { PrintableTokenModal } from '../components/layout/PrintableTokenModal';

interface PatientRegistrationPageProps {
  onNavigate: (path: string) => void;
}

export const PatientRegistrationPage: React.FC<PatientRegistrationPageProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { isOnline, queueOfflineAction } = useOffline();
  const { addNotification } = useNotification();

  // Form State
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('B+');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [allergies, setAllergies] = useState('');
  const [existingConditions, setExistingConditions] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomOnset, setSymptomOnset] = useState('2 hours ago');
  const [departmentId, setDepartmentId] = useState('dept-emergency');
  const [consentGiven, setConsentGiven] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<QueueEntry | null>(null);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Duplicate detection check
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    if (val.length >= 10) {
      const existing = await api.getPatients(val);
      if (existing.length > 0) {
        setDuplicateWarning(`Patient already registered with phone ${val}: ${existing[0].fullName} (${existing[0].identifier})`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !age || !chiefComplaint) {
      return;
    }

    setIsSubmitting(true);

    const patientPayload = {
      fullName,
      dateOfBirth: new Date(Date.now() - Number(age) * 365.25 * 24 * 3600 * 1000).toISOString().split('T')[0],
      age: Number(age),
      gender,
      phone,
      emergencyContact: {
        name: emergencyName || 'Relative',
        phone: emergencyPhone || phone,
        relation: emergencyRelation || 'Family',
      },
      preferredLanguage: language as LanguageCode,
      bloodGroup,
      city,
      address: `${city}, India`,
      allergies: allergies ? allergies.split(',').map((s) => s.trim()) : [],
      existingConditions: existingConditions ? existingConditions.split(',').map((s) => s.trim()) : [],
      currentMedications: currentMedications ? currentMedications.split(',').map((s) => s.trim()) : [],
      consentGiven,
    };

    const departmentNames: Record<string, string> = {
      'dept-emergency': 'Emergency & Trauma Bay',
      'dept-gen-med': 'General Medicine OPD',
      'dept-cardio': 'Cardiology Clinic',
      'dept-pediatrics': 'Pediatrics & Neonatal Care',
    };

    if (!isOnline) {
      // Offline mode handling (Module 18)
      queueOfflineAction('PATIENT_REGISTRATION', patientPayload);
      const mockToken: QueueEntry = {
        id: `q-offline-${Date.now()}`,
        visitId: `vis-offline-${Date.now()}`,
        patientId: `pat-offline-${Date.now()}`,
        patientName: fullName,
        patientAge: Number(age),
        patientGender: gender,
        tokenNumber: `OFF-${Math.floor(10 + Math.random() * 90)}`,
        hospitalId: 'hosp-1',
        hospitalName: "NIMS Hospital, Hyderabad",
        departmentId,
        departmentName: departmentNames[departmentId] || 'General Medicine OPD',
        registeredAt: new Date().toISOString(),
        urgency: 'STANDARD',
        status: 'AWAITING_TRIAGE',
        priorityScore: 500,
        estimatedWaitMinutes: 20,
        arrivalOrder: 99,
        chiefComplaint,
        reassessmentDue: false,
        staffAlertAcknowledged: false,
        lastUpdatedAt: new Date().toISOString(),
      };
      setGeneratedToken(mockToken);
      setIsSubmitting(false);
      addNotification({
        userId: 'usr-patient-1',
        title: 'Offline Draft Saved',
        message: `Patient ${fullName} registered in local offline draft. Token ${mockToken.tokenNumber} issued. Sync queued.`,
        category: 'SYSTEM',
        priority: 'NORMAL',
      });
      return;
    }

    try {
      const result = await api.registerPatient(patientPayload, {
        hospitalId: 'hosp-1',
        hospitalName: "NIMS Hospital, Hyderabad",
        departmentId,
        departmentName: departmentNames[departmentId] || 'General Medicine OPD',
        chiefComplaint: `${chiefComplaint} (Onset: ${symptomOnset})`,
      });

      setCreatedPatient(result.patient);
      if (result.queueEntry) {
        setGeneratedToken(result.queueEntry);
        addNotification({
          userId: 'usr-patient-1',
          title: `Queue Token ${result.queueEntry.tokenNumber} Generated`,
          message: `Patient ${fullName} successfully registered at ${result.queueEntry.hospitalName}. Token assigned.`,
          category: 'QUEUE',
          priority: 'NORMAL',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.nav.patientIntake}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fast clinical intake, triage preparation, and instant priority token generation.
          </p>
        </div>

        {/* Quick Fill Demo Button for Hackathon Judges */}
        <button
          type="button"
          onClick={() => {
            setFullName('K. S. Narayana Raju');
            setAge(58);
            setGender('MALE');
            setPhone('+91 98480 99887');
            setCity('Hyderabad');
            setBloodGroup('O+');
            setEmergencyName('K. S. Radhika');
            setEmergencyPhone('+91 98480 11223');
            setEmergencyRelation('Spouse');
            setAllergies('Sulphonamides');
            setExistingConditions('Hypertension, Mild Asthma');
            setCurrentMedications('Amlodipine 5mg OD');
            setChiefComplaint('Sudden onset palpitations, severe breathlessness on exertion for 2 hours');
            setSymptomOnset('2 hours ago');
            setDepartmentId('dept-emergency');
          }}
          className="px-3 py-1.5 rounded-lg bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 text-xs font-semibold border border-teal-800/60 flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>Quick Fill Demo Data</span>
        </button>
      </div>

      {/* Duplicate Warning if phone exists */}
      {duplicateWarning && (
        <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-300">Potential Duplicate Record Detected</p>
            <p className="mt-0.5 text-amber-200/90">{duplicateWarning}</p>
          </div>
        </div>
      )}

      {/* Success Confirmation Card if Token is Generated */}
      {generatedToken ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-teal-800/80 shadow-md space-y-6">
          <div className="flex items-center gap-3 text-teal-400">
            <CheckCircle2 className="w-8 h-8 text-teal-400 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-white">
                Registration Successful & Token Assigned
              </h2>
              <p className="text-xs text-slate-400">
                Patient added to triage & queue system at {generatedToken.hospitalName}.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-teal-950/50 border border-teal-800/70 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <p className="text-xs font-semibold text-teal-300 uppercase tracking-widest">
                Assigned Queue Token
              </p>
              <p className="text-4xl sm:text-5xl font-mono font-extrabold text-teal-300 mt-1">
                {generatedToken.tokenNumber}
              </p>
              <p className="text-xs text-slate-300 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>{generatedToken.departmentName}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Est. Wait: ~{generatedToken.estimatedWaitMinutes} mins</span>
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>View & Print Patient Ticket</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/queue-board')}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Track on Dynamic Queue Board
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
            <Shield className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p>
              Patient confidentiality protected: Public token displays will only reflect token{' '}
              <strong className="text-teal-300">{generatedToken.tokenNumber}</strong> and approximate wait time.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setGeneratedToken(null);
                setCreatedPatient(null);
                setFullName('');
                setPhone('');
                setChiefComplaint('');
              }}
              className="text-xs font-semibold text-teal-400 hover:underline"
            >
              + Register Another Patient
            </button>
          </div>
        </div>
      ) : (
        /* Intake Form */
        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl border border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
              1. Patient Demographics & Contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Venkata Subba Rao"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Age <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Mobile Phone <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+91 98490 12345"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Reason for Visit & Intake */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
              2. Reason for Visit & Symptoms
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Symptoms / Chief Complaint <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Describe main reason for care (e.g. severe central chest pain radiating to left arm, shortness of breath)"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Symptom Onset / Duration
                </label>
                <input
                  type="text"
                  value={symptomOnset}
                  onChange={(e) => setSymptomOnset(e.target.value)}
                  placeholder="e.g. 45 minutes ago"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hospital Department Routing
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none"
                >
                  <option value="dept-emergency">Emergency & Trauma Bay (Immediate / Urgent Triage)</option>
                  <option value="dept-gen-med">General Medicine OPD</option>
                  <option value="dept-cardio">Cardiology Specialist Clinic</option>
                  <option value="dept-pediatrics">Pediatrics Department</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Medical History & Allergies */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2">
              3. Clinical History & Allergies
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Known Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Aspirin"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pre-existing Conditions
                </label>
                <input
                  type="text"
                  value={existingConditions}
                  onChange={(e) => setExistingConditions(e.target.value)}
                  placeholder="e.g. Diabetes, Hypertension"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Current Medications
                </label>
                <input
                  type="text"
                  value={currentMedications}
                  onChange={(e) => setCurrentMedications(e.target.value)}
                  placeholder="e.g. Metformin 500mg, Telmisartan 40mg"
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:outline-none placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Consent & Submission */}
          <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-teal-500 focus:ring-teal-500"
              />
              <span>
                I consent to registration and emergency triage queue coordination under DPDP safety guidelines.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting || !consentGiven}
              className="w-full sm:w-auto px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Complete Intake & Generate Token'}
            </button>
          </div>
        </form>
      )}

      {/* Printable Modal */}
      <PrintableTokenModal
        token={generatedToken}
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
      />
    </div>
  );
};

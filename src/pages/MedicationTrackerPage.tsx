import React, { useState, useEffect } from 'react';
import {
  Pill,
  CheckCircle2,
  XCircle,
  Clock,
  Bell,
  Plus,
  Calendar,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Medication, MedicationAdherenceLog } from '../types';

export const MedicationTrackerPage: React.FC = () => {
  const { t } = useLanguage();
  const { addNotification, playAlertSound } = useNotification();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [adherenceLogs, setAdherenceLogs] = useState<MedicationAdherenceLog[]>([]);

  // Add Medication State
  const [showAddModal, setShowAddModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('500 mg');
  const [frequency, setFrequency] = useState('Twice daily after meals');
  const [prescribedBy, setPrescribedBy] = useState('Dr. Ananya Sharma');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    const list = await api.getMedications('pat-1001');
    setMedications(list);
  };

  const handleLogDose = async (medId: string, timeSlot: 'MORNING' | 'NIGHT', status: 'TAKEN' | 'SKIPPED') => {
    try {
      const log = await api.logMedicationAdherence(medId, 'pat-1001', timeSlot, status);
      setAdherenceLogs((prev) => [log, ...prev]);
      playAlertSound('chime');

      const med = medications.find((m) => m.id === medId);
      addNotification({
        userId: 'usr-patient-1',
        title: `Dose Logged: ${status === 'TAKEN' ? 'Taken' : 'Skipped'}`,
        message: `${med?.name || 'Medication'} logged as ${status.toLowerCase()} for ${timeSlot.toLowerCase()} dose.`,
        category: 'MEDICATION',
        priority: 'NORMAL',
      });
      loadMedications(); // Refresh adherence %
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName) return;

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      patientId: 'pat-1001',
      name: medName,
      dosage,
      frequency,
      timing: ['MORNING', 'NIGHT'],
      prescribedBy,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      notes,
      refillReminder: true,
      adherencePercentage: 100,
    };

    setMedications((prev) => [...prev, newMed]);
    setShowAddModal(false);
    setMedName('');
    addNotification({
      userId: 'usr-patient-1',
      title: 'Medication Added to Regimen',
      message: `${medName} (${dosage}) added to daily schedule.`,
      category: 'MEDICATION',
      priority: 'NORMAL',
    });
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-400">
              <Pill className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.nav.medications}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Prescription dosing schedule, timely reminder chimes, and adherence percentage tracking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prescribed Medicine</span>
        </button>
      </div>

      {/* Medication Regimen Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {medications.map((med) => (
          <div
            key={med.id}
            className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-base">{med.name}</h3>
                  <p className="text-xs text-indigo-400 font-semibold">{med.dosage}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-extrabold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded">
                    {med.adherencePercentage}%
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Adherence</p>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <p><strong className="text-slate-400">Frequency:</strong> {med.frequency}</p>
                <p><strong className="text-slate-400">Prescriber:</strong> {med.prescribedBy}</p>
                {med.notes && <p className="italic text-slate-400 text-[11px] mt-1">{med.notes}</p>}
              </div>

              {/* Timing slots */}
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400 font-medium">Slots:</span>
                {med.timing.map((slot) => (
                  <span key={slot} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                    {slot}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Action Dose Log Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => handleLogDose(med.id, 'MORNING', 'TAKEN')}
                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark Taken</span>
              </button>

              <button
                onClick={() => handleLogDose(med.id, 'MORNING', 'SKIPPED')}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs rounded-lg transition-colors border border-slate-700"
              >
                Skip
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md p-6 space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-white">
              Add Prescription to Regimen
            </h3>

            <form onSubmit={handleAddMedication} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Medicine Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Tab. Atorvastatin 20mg"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Prescribing Doctor</label>
                <input
                  type="text"
                  value={prescribedBy}
                  onChange={(e) => setPrescribedBy(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instructions / Meal Note</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Take after dinner with water"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

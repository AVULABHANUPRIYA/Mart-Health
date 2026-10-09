import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Activity,
  Heart,
  Droplet,
  Weight,
  Plus,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { HealthMeasurement } from '../types';

export const HealthDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();

  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'HEART_RATE' | 'WEIGHT'>('BLOOD_PRESSURE');

  // New Measurement Log Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newValue, setNewValue] = useState<number | ''>(140);
  const [newValueSecondary, setNewValueSecondary] = useState<number | ''>(88);
  const [unit, setUnit] = useState('mmHg');
  const [clinicalNote, setClinicalNote] = useState('');

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    const list = await api.getHealthMeasurements('pat-1001');
    setMeasurements(list);
  };

  const filtered = measurements.filter((m) => m.type === selectedMetric);

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newValue === '') return;

    try {
      const added = await api.addHealthMeasurement({
        patientId: 'pat-1001',
        type: selectedMetric,
        value: Number(newValue),
        valueSecondary: selectedMetric === 'BLOOD_PRESSURE' && newValueSecondary !== '' ? Number(newValueSecondary) : undefined,
        unit: selectedMetric === 'BLOOD_PRESSURE' ? 'mmHg' : selectedMetric === 'BLOOD_GLUCOSE' ? 'mg/dL' : selectedMetric === 'HEART_RATE' ? 'bpm' : 'kg',
        referenceRangeText: selectedMetric === 'BLOOD_PRESSURE' ? 'Normal: < 120/80 mmHg' : 'Target: 70 - 100 mg/dL',
        clinicalNote: clinicalNote || 'Recorded by patient',
        source: 'PATIENT_REPORTED',
      });

      setMeasurements((prev) => [added, ...prev]);
      setShowAddModal(false);
      addNotification({
        userId: 'usr-patient-1',
        title: 'Health Measurement Recorded',
        message: `New ${selectedMetric.replace('_', ' ')}: ${newValue}${added.valueSecondary ? '/' + added.valueSecondary : ''} ${added.unit}`,
        category: 'SYSTEM',
        priority: 'NORMAL',
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Helper SVG Line Chart Generator
  const renderSVGChart = () => {
    const dataPoints = [...filtered].reverse();
    if (dataPoints.length === 0) {
      return (
        <div className="py-12 text-center text-xs text-slate-400">
          No historical data recorded for this health metric.
        </div>
      );
    }

    const width = 640;
    const height = 240;
    const padding = 40;

    const values = dataPoints.map((d) => d.value);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;

    const getX = (idx: number) => padding + (idx * (width - 2 * padding)) / Math.max(1, dataPoints.length - 1);
    const getY = (val: number) => height - padding - ((val - minVal) / (maxVal - minVal || 1)) * (height - 2 * padding);

    const pointsStr = dataPoints.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

    return (
      <div className="w-full overflow-x-auto bg-slate-950/60 rounded-xl p-4 border border-slate-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible font-sans">
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="1" />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />

          {/* Reference baseline line */}
          {selectedMetric === 'BLOOD_PRESSURE' && (
            <line
              x1={padding}
              y1={getY(120)}
              x2={width - padding}
              y2={getY(120)}
              stroke="#2dd4bf"
              strokeWidth="1.5"
              strokeDasharray="4"
            />
          )}

          {/* Sparkline Path */}
          <polyline
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsStr}
          />

          {/* Data Points */}
          {dataPoints.map((d, i) => (
            <g key={d.id}>
              <circle
                cx={getX(i)}
                cy={getY(d.value)}
                r="5"
                fill="#0f172a"
                stroke="#2dd4bf"
                strokeWidth="2.5"
              />
              <text
                x={getX(i)}
                y={getY(d.value) - 10}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="#f8fafc"
              >
                {d.value}{d.valueSecondary ? `/${d.valueSecondary}` : ''}
              </text>
              <text
                x={getX(i)}
                y={height - padding + 18}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {new Date(d.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-2 border-t border-slate-800 pt-2">
          <span>Target baseline: {filtered[0]?.referenceRangeText || 'Clinical standard'}</span>
          <span className="font-medium text-teal-400">Unit: {filtered[0]?.unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <LineChart className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.nav.healthMetrics}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Longitudinal trend tracking, chronological vital signs, and clinician review notifications.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Reading</span>
        </button>
      </div>

      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 rounded-xl border border-slate-800">
        {[
          { id: 'BLOOD_PRESSURE', label: 'Blood Pressure (BP)', icon: Activity },
          { id: 'BLOOD_GLUCOSE', label: 'Blood Glucose (Fasting)', icon: Droplet },
          { id: 'HEART_RATE', label: 'Heart Rate (Pulse)', icon: Heart },
          { id: 'WEIGHT', label: 'Body Weight', icon: Weight },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedMetric === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedMetric(tab.id as typeof selectedMetric)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-slate-800 text-teal-300 shadow-2xs border border-slate-700/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart Display Container */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">
              {selectedMetric.replace('_', ' ')} Longitudinal History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical measurements logged over time with timestamps.
            </p>
          </div>

          <div className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-950/70 text-teal-300 border border-teal-800/80">
            {filtered.length} Recorded Entries
          </div>
        </div>

        {/* SVG Chart */}
        {renderSVGChart()}

        {/* Clinical Review Notice Banner */}
        <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <AlertCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Clinical Safety Statement:</strong> Health trend graphs provide observational longitudinal context. Deviations from reference ranges should be evaluated with your authorized healthcare clinician during scheduled consultations.
          </p>
        </div>
      </div>

      {/* Chronological Table of Entries */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Measurement Log History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Recorded Value</th>
                <th className="py-2.5 px-4">Normal Reference Target</th>
                <th className="py-2.5 px-4">Source Provenance</th>
                <th className="py-2.5 px-4">Clinical Annotations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/60">
                  <td className="py-3 px-4 font-medium text-slate-300">
                    {new Date(item.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-teal-300 text-sm">
                    {item.value}{item.valueSecondary ? ` / ${item.valueSecondary}` : ''} {item.unit}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-medium">
                    {item.referenceRangeText}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.source.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 italic">
                    {item.clinicalNote || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Measurement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md p-6 space-y-4 text-slate-100">
            <h3 className="text-base font-bold text-white">
              Record {selectedMetric.replace('_', ' ')}
            </h3>

            <form onSubmit={handleAddMeasurement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Measurement Value <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-teal-500 font-mono font-bold text-base focus:outline-none"
                />
              </div>

              {selectedMetric === 'BLOOD_PRESSURE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Diastolic Value (mmHg)
                  </label>
                  <input
                    type="number"
                    value={newValueSecondary}
                    onChange={(e) => setNewValueSecondary(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-teal-500 font-mono font-bold text-base focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observation Note (Optional)
                </label>
                <input
                  type="text"
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  placeholder="e.g. Taken 30 mins after morning walk"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none placeholder-slate-500"
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
                  className="flex-1 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm transition-colors"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

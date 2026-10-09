import React, { useState, useEffect } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Settings,
  Save,
  Phone,
  FileCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import {
  Hospital,
  HospitalInsuranceData,
  InsuranceProviderInfo,
  InsurancePlanDetail,
  InsuranceVerificationStatus,
} from '../types';

export const HospitalAdminPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { addNotification, playAlertSound } = useNotification();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);

  // Verification request state
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Insurance edit state
  const [insuranceForm, setInsuranceForm] = useState<HospitalInsuranceData | null>(null);
  const [isSavingInsurance, setIsSavingInsurance] = useState(false);
  const [insuranceSaveSuccess, setInsuranceSaveSuccess] = useState(false);

  // New provider modal / input state
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderStatus, setNewProviderStatus] = useState<InsuranceVerificationStatus>('VERIFIED');
  const [showAddProvider, setShowAddProvider] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    const list = await api.getHospitals();
    setHospitals(list);
    if (list.length > 0) {
      const initial = list[0];
      setSelectedHospitalId(initial.id);
      setSelectedHospital(initial);
      initInsuranceForm(initial);
    }
  };

  const handleSelectHospital = (id: string) => {
    setSelectedHospitalId(id);
    const hosp = hospitals.find((h) => h.id === id);
    if (hosp) {
      setSelectedHospital(hosp);
      initInsuranceForm(hosp);
      setRequestSubmitted(false);
      setInsuranceSaveSuccess(false);
    }
  };

  const initInsuranceForm = (hosp: Hospital) => {
    if (hosp.insuranceData) {
      setInsuranceForm(JSON.parse(JSON.stringify(hosp.insuranceData)));
    } else {
      setInsuranceForm({
        overallStatus: 'NOT_VERIFIED',
        cashlessDeskAvailable: true,
        tpaDeskContact: hosp.phone,
        tpaDeskHours: hosp.operatingHours,
        lastUpdatedDate: new Date().toISOString().split('T')[0],
        providers: [],
      });
    }
  };

  const handleSubmitVerification = async () => {
    if (!selectedHospital) return;
    try {
      const updated = await api.updateHospitalVerification(
        selectedHospital.id,
        'PENDING_REVIEW',
        { id: currentUser.id, name: currentUser.name, role: currentUser.role }
      );
      if (updated) {
        setSelectedHospital(updated);
        setRequestSubmitted(true);
        playAlertSound('chime');
        addNotification({
          userId: currentUser.id,
          title: 'Verification Request Submitted',
          message: `${selectedHospital.name} verification request submitted for regulatory credentialing review.`,
          category: 'SYSTEM',
          priority: 'NORMAL',
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add a provider to insuranceForm
  const handleAddProvider = () => {
    if (!insuranceForm || !newProviderName.trim()) return;
    const newProv: InsuranceProviderInfo = {
      providerId: `prov-${Date.now()}`,
      providerName: newProviderName.trim(),
      status: newProviderStatus,
      lastVerifiedDate: new Date().toISOString().split('T')[0],
      acceptedPlans: [],
    };
    setInsuranceForm({
      ...insuranceForm,
      providers: [...insuranceForm.providers, newProv],
    });
    setNewProviderName('');
    setShowAddProvider(false);
  };

  // Remove a provider
  const handleRemoveProvider = (providerId: string) => {
    if (!insuranceForm) return;
    setInsuranceForm({
      ...insuranceForm,
      providers: insuranceForm.providers.filter((p) => p.providerId !== providerId),
    });
  };

  // Add a plan under a provider
  const handleAddPlan = (providerId: string) => {
    if (!insuranceForm) return;
    const planName = prompt('Enter the specific insurance policy or plan name:');
    if (!planName || !planName.trim()) return;

    const newPlan: InsurancePlanDetail = {
      planId: `plan-${Date.now()}`,
      planName: planName.trim(),
      verificationStatus: 'VERIFIED',
      notes: 'Cashless pre-authorization accepted upon admission.',
      lastVerifiedDate: new Date().toISOString().split('T')[0],
    };

    setInsuranceForm({
      ...insuranceForm,
      providers: insuranceForm.providers.map((p) => {
        if (p.providerId === providerId) {
          return {
            ...p,
            acceptedPlans: [...p.acceptedPlans, newPlan],
          };
        }
        return p;
      }),
    });
  };

  // Update plan status
  const handleUpdatePlanStatus = (
    providerId: string,
    planId: string,
    newStatus: InsuranceVerificationStatus
  ) => {
    if (!insuranceForm) return;
    setInsuranceForm({
      ...insuranceForm,
      providers: insuranceForm.providers.map((p) => {
        if (p.providerId === providerId) {
          return {
            ...p,
            acceptedPlans: p.acceptedPlans.map((pl) => {
              if (pl.planId === planId) {
                return {
                  ...pl,
                  verificationStatus: newStatus,
                  lastVerifiedDate: new Date().toISOString().split('T')[0],
                };
              }
              return pl;
            }),
          };
        }
        return p;
      }),
    });
  };

  // Remove plan
  const handleRemovePlan = (providerId: string, planId: string) => {
    if (!insuranceForm) return;
    setInsuranceForm({
      ...insuranceForm,
      providers: insuranceForm.providers.map((p) => {
        if (p.providerId === providerId) {
          return {
            ...p,
            acceptedPlans: p.acceptedPlans.filter((pl) => pl.planId !== planId),
          };
        }
        return p;
      }),
    });
  };

  // Save insuranceForm to backend store
  const handleSaveInsurance = async () => {
    if (!selectedHospital || !insuranceForm) return;
    setIsSavingInsurance(true);
    setInsuranceSaveSuccess(false);

    try {
      const payload: HospitalInsuranceData = {
        ...insuranceForm,
        lastUpdatedDate: new Date().toISOString().split('T')[0],
      };

      const updated = await api.updateHospitalInsurance(selectedHospital.id, payload, {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      });

      if (updated) {
        setSelectedHospital(updated);
        setInsuranceForm(updated.insuranceData ? JSON.parse(JSON.stringify(updated.insuranceData)) : payload);
        setInsuranceSaveSuccess(true);
        playAlertSound('chime');
        addNotification({
          userId: currentUser.id,
          title: `Insurance Updated: ${selectedHospital.name}`,
          message: 'Insurance provider empanelment and accepted plans updated in facility registry.',
          category: 'SYSTEM',
          priority: 'NORMAL',
        });
      }
    } catch (err) {
      console.error('Failed to update insurance data:', err);
    } finally {
      setIsSavingInsurance(false);
    }
  };

  if (!selectedHospital || !insuranceForm) return null;

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
              Hospital Management & Facility Administration
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain facility profiles, operating workflows, department queues, and insurance empanelment data.
          </p>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Facility:</label>
          <select
            value={selectedHospitalId}
            onChange={(e) => handleSelectHospital(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:border-teal-500 focus:outline-none"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {requestSubmitted && (
        <div className="p-4 rounded-xl bg-teal-950/70 border border-teal-800/80 text-teal-300 flex items-center gap-2.5 text-xs font-semibold shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Verification documentation dispatched for facility credentialing review. Status: PENDING_REVIEW.</span>
        </div>
      )}

      {/* Hospital Profile Overview */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xs space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-mono text-xs font-bold text-slate-400">
              Facility ID: {selectedHospital.facilityIdentifier}
            </span>
            <h2 className="text-xl font-bold text-white mt-1">{selectedHospital.name}</h2>
            <p className="text-xs text-slate-400">{selectedHospital.tagline}</p>
          </div>

          <div className="flex items-center gap-2">
            {selectedHospital.verificationStatus === 'VERIFIED' ? (
              <span className="text-xs font-bold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Verified Facility</span>
              </span>
            ) : (
              <button
                onClick={handleSubmitVerification}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                Submit for Credentialing Verification
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div>
            <span className="font-bold text-slate-400">Contact Address</span>
            <p className="text-slate-200 mt-1">{selectedHospital.address}</p>
          </div>
          <div>
            <span className="font-bold text-slate-400">Emergency Telephone</span>
            <p className="text-rose-400 font-bold mt-1">{selectedHospital.emergencyPhone}</p>
          </div>
          <div>
            <span className="font-bold text-slate-400">Operating Hours</span>
            <p className="text-slate-200 mt-1">{selectedHospital.operatingHours}</p>
          </div>
        </div>
      </div>

      {/* Insurance & TPA Empanelment Management Workflow (Requirement 4) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Insurance Empanelment & TPA Desk Management
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Update accepted insurers, specific policy plans, verification statuses, and cashless pre-authorization desk hours.
            </p>
          </div>

          <button
            onClick={handleSaveInsurance}
            disabled={isSavingInsurance}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingInsurance ? 'Saving Updates...' : 'Save Insurance Changes'}</span>
          </button>
        </div>

        {insuranceSaveSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Insurance records successfully updated and audited in facility database!</span>
          </div>
        )}

        {/* Global Insurance Telemetry for this hospital */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Overall Insurance Status:
            </label>
            <select
              value={insuranceForm.overallStatus}
              onChange={(e) =>
                setInsuranceForm({
                  ...insuranceForm,
                  overallStatus: e.target.value as InsuranceVerificationStatus,
                })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg font-semibold focus:border-teal-500 focus:outline-none"
            >
              <option value="VERIFIED">VERIFIED (Active Empanelment)</option>
              <option value="NOT_ACCEPTED">NOT_ACCEPTED (No Direct Insurance)</option>
              <option value="NOT_VERIFIED">NOT_VERIFIED (Self-reported / Pending Audit)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">
              Direct TPA Desk Contact:
            </label>
            <input
              type="text"
              value={insuranceForm.tpaDeskContact || ''}
              onChange={(e) =>
                setInsuranceForm({ ...insuranceForm, tpaDeskContact: e.target.value })
              }
              placeholder="+91 40 2348 9150 / tpa@hospital.org"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">
              TPA Desk Working Hours:
            </label>
            <input
              type="text"
              value={insuranceForm.tpaDeskHours || ''}
              onChange={(e) =>
                setInsuranceForm({ ...insuranceForm, tpaDeskHours: e.target.value })
              }
              placeholder="24x7 Cashless Assistance Counter"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Providers and Plans List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Configured Insurance Providers ({insuranceForm.providers.length})
            </span>

            <button
              onClick={() => setShowAddProvider(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Insurer</span>
            </button>
          </div>

          {showAddProvider && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-800/80 space-y-3">
              <span className="text-xs font-bold text-teal-300">New Insurance Provider</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="e.g. Star Health, HDFC ERGO, PM-JAY..."
                  className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none"
                />

                <select
                  value={newProviderStatus}
                  onChange={(e) =>
                    setNewProviderStatus(e.target.value as InsuranceVerificationStatus)
                  }
                  className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none"
                >
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="NOT_ACCEPTED">NOT_ACCEPTED</option>
                  <option value="NOT_VERIFIED">NOT_VERIFIED</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddProvider(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddProvider}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white"
                >
                  Add Provider
                </button>
              </div>
            </div>
          )}

          {/* Providers List Grid */}
          <div className="space-y-4">
            {insuranceForm.providers.map((prov) => (
              <div
                key={prov.providerId}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-850 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{prov.providerName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        prov.status === 'VERIFIED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                          : prov.status === 'NOT_ACCEPTED'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                          : 'bg-slate-800 text-amber-300 border-amber-800/60'
                      }`}
                    >
                      {prov.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddPlan(prov.providerId)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-[11px] font-semibold rounded border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Policy Plan</span>
                    </button>

                    <button
                      onClick={() => handleRemoveProvider(prov.providerId)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove provider"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Plans List under this Provider */}
                <div className="space-y-2">
                  {prov.acceptedPlans.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">
                      No individual policy plans entered yet for this provider. Click "Add Policy Plan" to specify accepted or excluded plans.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {prov.acceptedPlans.map((pl) => (
                        <div
                          key={pl.planId}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200 text-xs">
                              {pl.planName}
                            </span>
                            <button
                              onClick={() => handleRemovePlan(prov.providerId, pl.planId)}
                              className="text-slate-500 hover:text-rose-400 p-0.5"
                              title="Remove plan"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={pl.verificationStatus}
                              onChange={(e) =>
                                handleUpdatePlanStatus(
                                  prov.providerId,
                                  pl.planId,
                                  e.target.value as InsuranceVerificationStatus
                                )
                              }
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold focus:outline-none"
                            >
                              <option value="VERIFIED">VERIFIED (Accepted)</option>
                              <option value="NOT_ACCEPTED">NOT_ACCEPTED (Excluded)</option>
                              <option value="NOT_VERIFIED">NOT_VERIFIED (Unknown)</option>
                            </select>

                            {pl.lastVerifiedDate && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                Date: {pl.lastVerifiedDate}
                              </span>
                            )}
                          </div>

                          {pl.notes && (
                            <p className="text-[10px] text-slate-400 leading-tight">
                              {pl.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configured Clinical Departments */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          Configured Clinical Departments ({selectedHospital.departments.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {selectedHospital.departments.map((dept) => (
            <div
              key={dept}
              className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
            >
              <span className="font-bold text-slate-200">{dept}</span>
              <span className="text-[10px] text-teal-300 bg-teal-950/70 border border-teal-800/80 px-1.5 py-0.5 rounded font-semibold">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

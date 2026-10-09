import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  MapPin,
  Star,
  CheckCircle2,
  Phone,
  Clock,
  ShieldCheck,
  Bed,
  ArrowRight,
  Filter,
  ExternalLink,
  AlertTriangle,
  Info,
  Stethoscope,
  HeartPulse,
  UserCheck,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Hospital,
  DiseaseConditionInfo,
  InsuranceVerificationStatus,
  SpecialistDoctor,
} from '../types';

interface HospitalDiscoveryPageProps {
  onNavigate: (path: string) => void;
  onSelectHospital: (hospitalId: string) => void;
}

export const HospitalDiscoveryPage: React.FC<HospitalDiscoveryPageProps> = ({
  onNavigate,
  onSelectHospital,
}) => {
  const { t } = useLanguage();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [conditions, setConditions] = useState<DiseaseConditionInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [selectedConditionId, setSelectedConditionId] = useState('ALL');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Insurance selection state
  const [selectedProvider, setSelectedProvider] = useState('ALL');
  const [selectedPlanId, setSelectedPlanId] = useState('ALL');
  const [insuranceAcceptedOnly, setInsuranceAcceptedOnly] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [hospList, condList] = await Promise.all([
        api.getHospitals(),
        api.getDiseaseConditions(),
      ]);
      setHospitals(hospList);
      setConditions(condList);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    }
  };

  // Distinct Specialties from hospitals & conditions
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => h.departments.forEach((d) => set.add(d)));
    conditions.forEach((c) => c.specialties.forEach((s) => set.add(s)));
    return ['ALL', ...Array.from(set).sort()];
  }, [hospitals, conditions]);

  // Distinct Insurance Providers from hospitals
  const availableInsuranceProviders = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => {
      h.insuranceData?.providers.forEach((p) => set.add(p.providerName));
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [hospitals]);

  // Available Plans for currently selected provider
  const availablePlansForSelectedProvider = useMemo(() => {
    if (selectedProvider === 'ALL') return [];
    const planMap = new Map<string, string>();
    hospitals.forEach((h) => {
      const prov = h.insuranceData?.providers.find(
        (p) => p.providerName.toLowerCase() === selectedProvider.toLowerCase()
      );
      if (prov) {
        prov.acceptedPlans.forEach((plan) => {
          planMap.set(plan.planId, plan.planName);
        });
      }
    });
    return Array.from(planMap.entries()).map(([planId, planName]) => ({ planId, planName }));
  }, [hospitals, selectedProvider]);

  // Reset plan when provider changes
  useEffect(() => {
    setSelectedPlanId('ALL');
  }, [selectedProvider]);

  // Active selected condition object
  const activeCondition = useMemo(() => {
    if (selectedConditionId === 'ALL') return null;
    return conditions.find((c) => c.id === selectedConditionId) || null;
  }, [conditions, selectedConditionId]);

  // When condition changes, automatically sync specialty if applicable
  const handleConditionSelect = (condId: string) => {
    setSelectedConditionId(condId);
    if (condId !== 'ALL') {
      const match = conditions.find((c) => c.id === condId);
      if (match && match.specialties.length > 0) {
        setSelectedSpecialty(match.specialties[0]);
      }
    } else {
      setSelectedSpecialty('ALL');
    }
  };

  // Compute recommendation scores and filter hospitals
  const processedHospitals = useMemo(() => {
    return hospitals
      .map((hosp) => {
        let matchScore = 100;
        let isSpecialtyMatch = false;
        let isConditionMatch = false;

        // Specialty filter / matching
        if (selectedSpecialty !== 'ALL') {
          const hasDept = hosp.departments.some(
            (d) =>
              d.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
              selectedSpecialty.toLowerCase().includes(d.toLowerCase())
          );
          const hasDoc = hosp.specialists?.some(
            (dr) => dr.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
          );
          if (hasDept || hasDoc) {
            isSpecialtyMatch = true;
            matchScore += 40;
          } else {
            return null; // Excluded by specialty filter
          }
        }

        // Condition matching
        if (activeCondition) {
          const reqSpecs = activeCondition.specialties;
          const matchesAnySpec = reqSpecs.some((reqS) =>
            hosp.departments.some(
              (d) =>
                d.toLowerCase().includes(reqS.toLowerCase()) ||
                reqS.toLowerCase().includes(d.toLowerCase())
            ) ||
            hosp.specialists?.some((dr) => dr.specialty.toLowerCase() === reqS.toLowerCase())
          );

          if (matchesAnySpec) {
            isConditionMatch = true;
            matchScore += 50;
          }

          // Services match bonus
          activeCondition.keyServicesNeeded.forEach((serv) => {
            if (
              hosp.services.some((s) => s.toLowerCase().includes(serv.slice(0, 8).toLowerCase()))
            ) {
              matchScore += 10;
            }
          });
        }

        // Location filter
        if (selectedCity !== 'ALL' && hosp.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return null;
        }

        // Emergency services filter
        if (emergencyOnly && !hosp.emergencyServicesAvailable) {
          return null;
        }

        // Verification status filter
        if (verifiedOnly && hosp.verificationStatus !== 'VERIFIED') {
          return null;
        }

        // Search Query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = hosp.name.toLowerCase().includes(q);
          const matchesDept = hosp.departments.some((d) => d.toLowerCase().includes(q));
          const matchesServ = hosp.services.some((s) => s.toLowerCase().includes(q));
          const matchesAddress = hosp.address.toLowerCase().includes(q);
          const matchesSpecialist = hosp.specialists?.some((dr) =>
            dr.name.toLowerCase().includes(q) || dr.specialty.toLowerCase().includes(q)
          );
          if (!matchesName && !matchesDept && !matchesServ && !matchesAddress && !matchesSpecialist) {
            return null;
          }
        }

        // Calculate specific insurance status for this hospital based on user selection
        let computedInsuranceStatus: InsuranceVerificationStatus = 'NOT_VERIFIED';
        let planSpecificMatch = false;

        if (hosp.insuranceData) {
          if (selectedProvider !== 'ALL') {
            const provider = hosp.insuranceData.providers.find(
              (p) => p.providerName.toLowerCase() === selectedProvider.toLowerCase()
            );

            if (provider) {
              if (selectedPlanId !== 'ALL') {
                const plan = provider.acceptedPlans.find((pl) => pl.planId === selectedPlanId);
                if (plan) {
                  computedInsuranceStatus = plan.verificationStatus;
                  if (plan.verificationStatus === 'VERIFIED') {
                    planSpecificMatch = true;
                    matchScore += 60; // Major priority boost for verified specific plan!
                  }
                } else {
                  computedInsuranceStatus = 'NOT_ACCEPTED';
                }
              } else {
                computedInsuranceStatus = provider.status;
                if (provider.status === 'VERIFIED') matchScore += 30;
              }
            } else {
              computedInsuranceStatus = 'NOT_ACCEPTED';
            }
          } else {
            computedInsuranceStatus = hosp.insuranceData.overallStatus;
            if (hosp.insuranceData.overallStatus === 'VERIFIED') matchScore += 20;
          }
        }

        // Filter if only insurance accepted is requested
        if (insuranceAcceptedOnly && computedInsuranceStatus !== 'VERIFIED') {
          return null;
        }

        return {
          hospital: hosp,
          matchScore,
          computedInsuranceStatus,
          planSpecificMatch,
          isSpecialtyMatch,
          isConditionMatch,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => {
        // Prioritize hospitals with plan-specific verified match, then matchScore, then rating
        if (a.planSpecificMatch && !b.planSpecificMatch) return -1;
        if (!a.planSpecificMatch && b.planSpecificMatch) return 1;
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return b.hospital.rating - a.hospital.rating;
      });
  }, [
    hospitals,
    selectedCity,
    selectedSpecialty,
    selectedConditionId,
    activeCondition,
    emergencyOnly,
    verifiedOnly,
    searchQuery,
    selectedProvider,
    selectedPlanId,
    insuranceAcceptedOnly,
  ]);

  const renderInsuranceBadge = (status: InsuranceVerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shadow-2xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Insurance Accepted</span>
          </span>
        );
      case 'NOT_ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Not Accepted</span>
          </span>
        );
      case 'NOT_VERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/80 text-amber-300 border border-amber-800/60 shadow-2xs">
            <Info className="w-3 h-3 text-amber-400" />
            <span>Acceptance Not Verified</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-950/70 border border-teal-800/60 text-teal-400 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Find Hospitals & Specialized Facilities
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/80">
                  Care & Access
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Search verified healthcare facilities by medical condition, clinical specialty, emergency readiness, and verified insurance plan acceptance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('/specialized-care')}
            className="px-3.5 py-2 rounded-lg bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 text-xs font-semibold border border-teal-800/80 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-teal-400" />
            <span>Specialized Disease Care Portal</span>
          </button>

          <button
            onClick={() => onNavigate('/hospital-admin')}
            className="px-3.5 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            Hospital Admin Portal
          </button>
        </div>
      </div>

      {/* Disease & Specialty Quick Recommender Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-800/60 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-teal-300 font-bold text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Condition & Specialty-Based Hospital Recommendations</span>
          </div>
          {selectedConditionId !== 'ALL' && (
            <button
              onClick={() => handleConditionSelect('ALL')}
              className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset Condition
            </button>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Select a medical condition below to instantly filter hospitals with relevant specialized departments, verified clinical teams, and tailored insurance coverage:
        </p>

        {/* Quick Condition Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => handleConditionSelect('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedConditionId === 'ALL'
                ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            All Conditions
          </button>

          {conditions.map((cond) => {
            const isSelected = selectedConditionId === cond.id;
            return (
              <button
                key={cond.id}
                onClick={() => handleConditionSelect(cond.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                }`}
              >
                <span>{cond.name.split('/')[0].trim()}</span>
                {cond.isLifeThreatening && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-rose-400'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Condition Warning banner if life-threatening */}
        {activeCondition?.isLifeThreatening && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Urgent Notice:</strong> {activeCondition.name} can be life-threatening. Prioritize hospitals with 24x7 Emergency and ICU beds. Call <strong>108</strong> for ambulance dispatch.
              </span>
            </div>
            <a
              href="tel:108"
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded shrink-0"
            >
              Call 108
            </a>
          </div>
        )}
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospital name, department, specialist..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none placeholder-slate-400"
            />
          </div>

          {/* Specialty Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Specialties</option>
              {availableSpecialties
                .filter((s) => s !== 'ALL')
                .map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Locations</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Secunderabad">Secunderabad</option>
              <option value="Vijayawada">Vijayawada</option>
            </select>
          </div>

          {/* Insurance Provider Selector */}
          <div className="lg:col-span-2">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">All Insurers</option>
              {availableInsuranceProviders
                .filter((p) => p !== 'ALL')
                .map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
            </select>
          </div>

          {/* Insurance Plan Selector (Prioritization) */}
          <div className="lg:col-span-2">
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              disabled={selectedProvider === 'ALL'}
              className={`w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold focus:border-teal-500 focus:outline-none ${
                selectedProvider === 'ALL' ? 'text-slate-500 opacity-60 cursor-not-allowed' : 'text-slate-200'
              }`}
            >
              <option value="ALL">All Plans from Insurer</option>
              {availablePlansForSelectedProvider.map(({ planId, planName }) => (
                <option key={planId} value={planId}>
                  {planName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Checkbox Toggles Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer font-medium hover:text-white">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded text-teal-500 bg-slate-800 border-slate-700"
              />
              <span>Verified Facilities Only</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer font-medium hover:text-white">
              <input
                type="checkbox"
                checked={emergencyOnly}
                onChange={(e) => setEmergencyOnly(e.target.checked)}
                className="rounded text-teal-500 bg-slate-800 border-slate-700"
              />
              <span>24x7 Emergency Services Required</span>
            </label>

            <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer font-medium hover:text-white">
              <input
                type="checkbox"
                checked={insuranceAcceptedOnly}
                onChange={(e) => setInsuranceAcceptedOnly(e.target.checked)}
                className="rounded text-teal-500 bg-slate-800 border-slate-700"
              />
              <span>Verified Insurance Acceptance Only</span>
            </label>
          </div>

          <div className="text-slate-400 font-medium">
            Showing <strong className="text-white">{processedHospitals.length}</strong> matching hospitals
          </div>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      {processedHospitals.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
          <Building2 className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Facilities Matched Your Criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your specialty, condition, location, or insurance plan selection. Do not hesitate to contact our emergency hotline for immediate assistance.
          </p>
          <button
            onClick={() => {
              setSelectedCity('ALL');
              setSelectedSpecialty('ALL');
              setSelectedConditionId('ALL');
              setSelectedProvider('ALL');
              setSelectedPlanId('ALL');
              setEmergencyOnly(false);
              setVerifiedOnly(false);
              setInsuranceAcceptedOnly(false);
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedHospitals.map(
            ({
              hospital: hosp,
              computedInsuranceStatus,
              planSpecificMatch,
              isConditionMatch,
            }) => (
              <div
                key={hosp.id}
                className={`p-6 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-700 ${
                  planSpecificMatch
                    ? 'border-emerald-600/80 ring-1 ring-emerald-500/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-white font-display">
                          {hosp.name}
                        </h2>

                        {hosp.verificationStatus === 'VERIFIED' ? (
                          <span className="text-[10px] font-bold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-teal-400" />
                            Verified Facility
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                            Demonstration / Sample Record
                          </span>
                        )}

                        {hosp.isSampleData && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            Sample Data
                          </span>
                        )}

                        {planSpecificMatch && (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                            ★ Verified for Selected Plan
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{hosp.tagline}</p>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400 shrink-0 font-bold text-xs bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{hosp.rating}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({hosp.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* Insurance Indicator & Status Notice */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Insurance Acceptance Status:
                      </span>
                      {renderInsuranceBadge(computedInsuranceStatus)}
                    </div>

                    {/* Show Accepted Providers & Plans summary */}
                    {hosp.insuranceData && (
                      <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-850">
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="font-semibold text-slate-300">Accepted Insurers:</span>
                          {hosp.insuranceData.providers.map((p, idx) => (
                            <span key={p.providerId}>
                              {idx > 0 && <span className="text-slate-600">·</span>}{' '}
                              <span
                                className={
                                  p.status === 'VERIFIED'
                                    ? 'text-slate-200'
                                    : p.status === 'NOT_ACCEPTED'
                                    ? 'text-rose-400 line-through'
                                    : 'text-amber-400'
                                }
                              >
                                {p.providerName}
                              </span>
                            </span>
                          ))}
                        </div>

                        {selectedProvider !== 'ALL' && (
                          <div className="pt-1 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800">
                            {(() => {
                              const matchP = hosp.insuranceData.providers.find(
                                (p) => p.providerName.toLowerCase() === selectedProvider.toLowerCase()
                              );
                              if (!matchP) {
                                return (
                                  <span className="text-rose-400">
                                    ✗ {selectedProvider} is currently NOT accepted at this facility.
                                  </span>
                                );
                              }
                              return (
                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-teal-300">
                                      {matchP.providerName} Plans:
                                    </span>
                                    {matchP.lastVerifiedDate && (
                                      <span className="text-[10px] text-slate-500">
                                        Verified: {matchP.lastVerifiedDate}
                                      </span>
                                    )}
                                  </div>
                                  {matchP.acceptedPlans.map((pl) => (
                                    <p
                                      key={pl.planId}
                                      className="flex items-center justify-between text-[10px] text-slate-400"
                                    >
                                      <span className="truncate">{pl.planName}</span>
                                      <span
                                        className={`font-bold ml-1 ${
                                          pl.verificationStatus === 'VERIFIED'
                                            ? 'text-emerald-400'
                                            : pl.verificationStatus === 'NOT_ACCEPTED'
                                            ? 'text-rose-400'
                                            : 'text-amber-400'
                                        }`}
                                      >
                                        {pl.verificationStatus === 'VERIFIED'
                                          ? 'Accepted'
                                          : pl.verificationStatus === 'NOT_ACCEPTED'
                                          ? 'Not Accepted'
                                          : 'Unverified'}
                                      </span>
                                    </p>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location & Contact Info with clickable Tel & Web links */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hosp.address}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Emergency: </span>
                        <a
                          href={`tel:${hosp.emergencyPhone.replace(/[^0-9+]/g, '')}`}
                          className="text-rose-400 font-bold hover:underline"
                        >
                          {hosp.emergencyPhone}
                        </a>
                      </p>

                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Desk: </span>
                        <a
                          href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                          className="text-teal-300 font-medium hover:underline"
                        >
                          {hosp.phone}
                        </a>
                      </p>
                    </div>

                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{hosp.operatingHours}</span>
                    </p>
                  </div>

                  {/* Available Beds telemetry */}
                  {hosp.availableBeds && (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          ICU Beds
                        </span>
                        <p className="font-mono font-extrabold text-teal-400 text-sm mt-0.5">
                          {hosp.availableBeds.icu} available
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Emergency Bay
                        </span>
                        <p className="font-mono font-extrabold text-amber-400 text-sm mt-0.5">
                          {hosp.availableBeds.emergency} available
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          General Wards
                        </span>
                        <p className="font-mono font-extrabold text-slate-300 text-sm mt-0.5">
                          {hosp.availableBeds.general} beds
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Departments metadata */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1">
                    <span className="font-semibold text-slate-200">Specialties:</span>
                    {hosp.departments.map((dept, idx) => (
                      <React.Fragment key={dept}>
                        {idx > 0 && <span aria-hidden="true" className="text-slate-600">·</span>}
                        <span
                          className={
                            selectedSpecialty !== 'ALL' &&
                            dept.toLowerCase().includes(selectedSpecialty.toLowerCase())
                              ? 'text-teal-400 font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {dept}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Available Services */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">Services:</span>
                    {hosp.services.slice(0, 4).map((serv, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {serv}
                      </span>
                    ))}
                    {hosp.services.length > 4 && (
                      <span className="text-[10px] text-slate-500">
                        +{hosp.services.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {hosp.website && (
                      <a
                        href={hosp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <span>Official Website</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    )}

                    <a
                      href={`tel:${hosp.phone.replace(/[^0-9+]/g, '')}`}
                      className="px-2.5 py-1.5 rounded-lg border border-teal-800/80 bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call Hospital</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectHospital(hosp.id);
                        onNavigate(`/hospital/${hosp.id}`);
                      }}
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Full Profile & Reviews</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectHospital(hosp.id);
                        onNavigate('/patient-intake');
                      }}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

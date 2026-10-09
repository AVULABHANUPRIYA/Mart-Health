import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Search,
  AlertTriangle,
  Phone,
  Building2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Info,
  HelpCircle,
  Clock,
  MapPin,
  Filter,
  Star,
  ChevronRight,
  UserCheck,
  HeartPulse,
  Bed,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { DiseaseConditionInfo, Hospital, SpecialistDoctor, InsuranceVerificationStatus } from '../types';

interface SpecializedDiseaseCarePageProps {
  onNavigate: (path: string) => void;
  onSelectHospital?: (hospitalId: string) => void;
}

export const SpecializedDiseaseCarePage: React.FC<SpecializedDiseaseCarePageProps> = ({
  onNavigate,
  onSelectHospital,
}) => {
  const { t } = useLanguage();
  const [conditions, setConditions] = useState<DiseaseConditionInfo[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedConditionId, setSelectedConditionId] = useState<string>('dis-cad');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedInsuranceProvider, setSelectedInsuranceProvider] = useState<string>('ALL');
  const [onlyVerifiedInsurance, setOnlyVerifiedInsurance] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [condList, hospList] = await Promise.all([
        api.getDiseaseConditions(),
        api.getHospitals(),
      ]);
      setConditions(condList);
      setHospitals(hospList);
      if (condList.length > 0) {
        setSelectedConditionId(condList[0].id);
      }
    } catch (err) {
      console.error('Failed to load disease care data:', err);
    } finally {
      setLoading(false);
    }
  };

  // List of distinct medical specialties
  const availableSpecialties = useMemo(() => {
    const set = new Set<string>();
    conditions.forEach((c) => c.specialties.forEach((s) => set.add(s)));
    return ['ALL', ...Array.from(set).sort()];
  }, [conditions]);

  // List of insurance providers across hospitals
  const availableInsuranceProviders = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => {
      h.insuranceData?.providers.forEach((p) => set.add(p.providerName));
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [hospitals]);

  // Filtered conditions list based on query and specialty
  const filteredConditions = useMemo(() => {
    return conditions.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSpecialty =
        selectedSpecialty === 'ALL' || c.specialties.includes(selectedSpecialty);

      return matchesSearch && matchesSpecialty;
    });
  }, [conditions, searchQuery, selectedSpecialty]);

  // Selected condition object
  const activeCondition = useMemo(() => {
    return (
      conditions.find((c) => c.id === selectedConditionId) ||
      (filteredConditions.length > 0 ? filteredConditions[0] : null)
    );
  }, [conditions, selectedConditionId, filteredConditions]);

  // Recommend hospitals for activeCondition
  const recommendedHospitals = useMemo(() => {
    if (!activeCondition) return [];

    return hospitals
      .map((hosp) => {
        let matchScore = 0;
        const matchingSpecialties: string[] = [];

        // 1. Specialty matching
        activeCondition.specialties.forEach((spec) => {
          const hasDept = hosp.departments.some(
            (d) => d.toLowerCase().includes(spec.toLowerCase()) || spec.toLowerCase().includes(d.toLowerCase())
          );
          const hasDoctor = hosp.specialists?.some(
            (dr) => dr.specialty.toLowerCase() === spec.toLowerCase()
          );
          if (hasDept || hasDoctor) {
            matchScore += 40;
            if (!matchingSpecialties.includes(spec)) matchingSpecialties.push(spec);
          }
        });

        // 2. Services matching
        let matchingServicesCount = 0;
        activeCondition.keyServicesNeeded.forEach((reqService) => {
          const lowerReq = reqService.toLowerCase();
          const matched = hosp.services.some((s) => {
            const lowerS = s.toLowerCase();
            return (
              lowerS.includes(lowerReq.slice(0, 8)) ||
              lowerReq.includes(lowerS.slice(0, 8))
            );
          });
          if (matched) {
            matchScore += 10;
            matchingServicesCount++;
          }
        });

        // 3. Location filter
        if (selectedCity !== 'ALL' && hosp.city.toLowerCase() !== selectedCity.toLowerCase()) {
          return null;
        }

        // 4. Insurance status calculation
        let insuranceStatus: InsuranceVerificationStatus = 'NOT_VERIFIED';
        let matchingProviderDetails = null;

        if (hosp.insuranceData) {
          if (selectedInsuranceProvider !== 'ALL') {
            const provider = hosp.insuranceData.providers.find(
              (p) => p.providerName.toLowerCase() === selectedInsuranceProvider.toLowerCase()
            );
            if (provider) {
              insuranceStatus = provider.status;
              matchingProviderDetails = provider;
            } else {
              insuranceStatus = 'NOT_ACCEPTED';
            }
          } else {
            insuranceStatus = hosp.insuranceData.overallStatus;
          }
        }

        // Filter out if user wants only verified insurance
        if (onlyVerifiedInsurance && insuranceStatus !== 'VERIFIED') {
          return null;
        }

        if (insuranceStatus === 'VERIFIED') matchScore += 25;
        else if (insuranceStatus === 'NOT_VERIFIED') matchScore += 5;

        // 5. Emergency & Bed availability bonus
        if (activeCondition.isLifeThreatening && hosp.emergencyServicesAvailable) {
          matchScore += 20;
        }
        if (hosp.availableBeds?.icu && hosp.availableBeds.icu > 0) {
          matchScore += 10;
        }

        // Relevant specialists
        const relevantDoctors: SpecialistDoctor[] = (hosp.specialists || []).filter((dr) =>
          activeCondition.specialties.some(
            (spec) => dr.specialty.toLowerCase() === spec.toLowerCase()
          )
        );

        return {
          hospital: hosp,
          matchScore,
          matchingSpecialties,
          matchingServicesCount,
          insuranceStatus,
          matchingProviderDetails,
          relevantDoctors,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [activeCondition, hospitals, selectedCity, selectedInsuranceProvider, onlyVerifiedInsurance]);

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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-950/70 border border-teal-800/60 text-teal-400 shadow-md">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
                  Specialized Disease Care & Recommendations
                </h1>
                <span className="text-[10px] font-bold tracking-wider uppercase text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/80">
                  Care & Access
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Disease-matched hospital recommendations, verified specialist rosters, insurance coverage clarity, and educational clinical guidance.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/hospitals')}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Building2 className="w-4 h-4 text-teal-400" />
          <span>View All Hospitals</span>
        </button>
      </div>

      {/* Mandatory AI Informational Notice */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 flex items-start gap-3 text-xs leading-relaxed shadow-sm">
        <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">
            Educational & Clinical Decision Support Notice
          </p>
          <p className="text-slate-400 text-[11px]">
            AI suggestions and disease overviews are strictly informational and educational. They do not constitute formal clinical diagnosis, medical triage, or individualized treatment plans. Always consult a qualified specialist physician. Real facility records are clearly distinguished from sample demonstration entries.
          </p>
        </div>
      </div>

      {/* Search & Specialty Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 bg-slate-900 rounded-xl border border-slate-800 shadow-2xs">
        {/* Search input */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search disease, condition, symptoms, or specialty..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none placeholder-slate-400"
          />
        </div>

        {/* Specialty filter */}
        <div className="md:col-span-3">
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">All Clinical Specialties</option>
            {availableSpecialties
              .filter((s) => s !== 'ALL')
              .map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
          </select>
        </div>

        {/* City Location filter */}
        <div className="md:col-span-2">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">All Cities</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Secunderabad">Secunderabad</option>
            <option value="Vijayawada">Vijayawada</option>
          </select>
        </div>

        {/* Insurance Provider filter */}
        <div className="md:col-span-2">
          <select
            value={selectedInsuranceProvider}
            onChange={(e) => setSelectedInsuranceProvider(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">All Insurance Providers</option>
            {availableInsuranceProviders
              .filter((p) => p !== 'ALL')
              .map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Main Two-Column Layout: Left (Conditions Selector) & Right (Condition Details + Recommendations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Condition Selector List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Conditions ({filteredConditions.length})
            </span>
            <span className="text-[11px] text-slate-500">Select to view guidance</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {filteredConditions.length === 0 ? (
              <div className="p-6 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No matching medical conditions found. Try clearing your search query or filters.
              </div>
            ) : (
              filteredConditions.map((cond) => {
                const isSelected = activeCondition?.id === cond.id;
                return (
                  <button
                    key={cond.id}
                    onClick={() => setSelectedConditionId(cond.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-teal-950/70 border-teal-500/80 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-bold leading-snug line-clamp-2">
                        {cond.name}
                      </span>
                      {cond.isLifeThreatening && (
                        <span className="shrink-0 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800">
                          Critical
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {cond.category}
                      </span>
                      {cond.specialties.map((s) => (
                        <span key={s} className="text-teal-400 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Condition Detail & Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          {activeCondition ? (
            <>
              {/* Critical Life-Threatening Urgent Warning Banner if applicable */}
              {activeCondition.isLifeThreatening && (
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/90 border-2 border-rose-700 text-rose-100 space-y-2 shadow-xl animate-pulse">
                  <div className="flex items-center gap-2 text-rose-200 font-extrabold text-sm sm:text-base">
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                    <span>URGENT MEDICAL EMERGENCY WARNING</span>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-100 font-semibold leading-relaxed">
                    {activeCondition.emergencyWarning ||
                      '🚨 For life-threatening symptoms, immediately contact local emergency services (108 / 112) or seek immediate medical care at the nearest Emergency Department rather than waiting for recommendations.'}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <a
                      href="tel:108"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-md"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Ambulance 108</span>
                    </a>
                    <a
                      href="tel:112"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white border border-rose-700 font-semibold text-xs hover:bg-slate-850"
                    >
                      <span>National Emergency 112</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Condition Educational Card */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-950/70 border border-teal-800/80 px-2.5 py-0.5 rounded">
                      {activeCondition.category}
                    </span>
                    {activeCondition.specialties.map((s) => (
                      <span
                        key={s}
                        className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700"
                      >
                        Specialty: {s}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
                    {activeCondition.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                    {activeCondition.description}
                  </p>
                </div>

                {/* Common Symptoms & Key Services Needed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-rose-400" />
                      <span>Common Symptoms</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
                      {activeCondition.commonSymptoms.map((symptom, idx) => (
                        <li key={idx} className="leading-snug">
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      <span>Essential Hospital Services Needed</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {activeCondition.keyServicesNeeded.map((serv, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-slate-800 text-teal-300 border border-slate-700 text-[11px] font-medium"
                        >
                          {serv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Suggested Questions to Ask Your Doctor */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Suggested Questions to Ask Your Specialist Doctor</span>
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {activeCondition.suggestedDoctorQuestions.map((q, idx) => (
                      <p key={idx} className="flex items-start gap-2">
                        <span className="text-teal-400 font-bold shrink-0">{idx + 1}.</span>
                        <span>{q}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommended Hospitals Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-teal-400" />
                      <span>Recommended Hospitals for {activeCondition.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Prioritized by clinical specialty alignment, available diagnostic infrastructure, bed availability, and insurance empanelment.
                    </p>
                  </div>

                  {/* Insurance verified toggle */}
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 cursor-pointer bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-850">
                    <input
                      type="checkbox"
                      checked={onlyVerifiedInsurance}
                      onChange={(e) => setOnlyVerifiedInsurance(e.target.checked)}
                      className="rounded text-teal-500 bg-slate-800 border-slate-700"
                    />
                    <span>Verified Insurance Acceptance Only</span>
                  </label>
                </div>

                {recommendedHospitals.length === 0 ? (
                  <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-300">
                      No hospitals matched your current filters.
                    </p>
                    <p className="text-xs text-slate-500">
                      Try resetting the city or insurance filter to view all qualified healthcare centers.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {recommendedHospitals.map(
                      ({
                        hospital,
                        matchScore,
                        insuranceStatus,
                        matchingProviderDetails,
                        relevantDoctors,
                      }) => (
                        <div
                          key={hospital.id}
                          className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm hover:border-slate-700 transition-all space-y-4"
                        >
                          {/* Top Row: Name, Badges & Rating */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base sm:text-lg font-bold text-white font-display">
                                  {hospital.name}
                                </h4>

                                {hospital.verificationStatus === 'VERIFIED' ? (
                                  <span className="text-[10px] font-bold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                                    Verified Facility
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                                    Demonstration / Sample Record
                                  </span>
                                )}

                                {hospital.isSampleData && (
                                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                    Sample Data
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{hospital.tagline}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {renderInsuranceBadge(insuranceStatus)}

                              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded-lg">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{hospital.rating}</span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({hospital.reviewCount})
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Address & Direct Contact Bar */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                            <p className="flex items-center gap-2 text-slate-300">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{hospital.address}</span>
                            </p>
                            <p className="flex items-center gap-2 text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>
                                Emergency:{' '}
                                <a
                                  href={`tel:${hospital.emergencyPhone.replace(/[^0-9+]/g, '')}`}
                                  className="text-rose-400 font-bold hover:underline"
                                >
                                  {hospital.emergencyPhone}
                                </a>
                              </span>
                            </p>
                            <p className="flex items-center gap-2 text-slate-300">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{hospital.operatingHours}</span>
                            </p>
                          </div>

                          {/* Insurance Accepted Plans Breakdown if available */}
                          {hospital.insuranceData && (
                            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                                  <span>Accepted Health Insurance Providers & Plans</span>
                                </span>
                                {hospital.insuranceData.tpaDeskContact && (
                                  <span className="text-[11px] text-slate-400">
                                    TPA Desk: {hospital.insuranceData.tpaDeskContact}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                {hospital.insuranceData.providers.map((prov) => (
                                  <div
                                    key={prov.providerId}
                                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-slate-200">
                                        {prov.providerName}
                                      </span>
                                      {renderInsuranceBadge(prov.status)}
                                    </div>
                                    <div className="space-y-0.5 pt-0.5">
                                      {prov.acceptedPlans.map((pl) => (
                                        <p
                                          key={pl.planId}
                                          className="text-[11px] text-slate-400 flex items-center justify-between"
                                        >
                                          <span className="truncate">{pl.planName}</span>
                                          <span
                                            className={`text-[10px] font-semibold shrink-0 ml-1 ${
                                              pl.verificationStatus === 'VERIFIED'
                                                ? 'text-emerald-400'
                                                : pl.verificationStatus === 'NOT_ACCEPTED'
                                                ? 'text-rose-400'
                                                : 'text-amber-400'
                                            }`}
                                          >
                                            {pl.verificationStatus === 'VERIFIED'
                                              ? 'Verified'
                                              : pl.verificationStatus === 'NOT_ACCEPTED'
                                              ? 'Excluded'
                                              : 'Unverified'}
                                          </span>
                                        </p>
                                      ))}
                                    </div>
                                    {prov.lastVerifiedDate && (
                                      <p className="text-[10px] text-slate-500 pt-0.5">
                                        Last verified: {prov.lastVerifiedDate}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Matching Specialist Doctors Roster */}
                          {relevantDoctors.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                                <span>
                                  Specialist Doctors ({relevantDoctors.length})
                                </span>
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {relevantDoctors.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1 text-xs"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="font-bold text-slate-200">
                                        {doc.name}
                                      </span>
                                      {doc.isVerified && (
                                        <span className="text-[10px] text-teal-300 font-semibold shrink-0">
                                          ✓ Verified
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-teal-400 font-medium">
                                      {doc.qualification} · {doc.experienceYears} yrs exp
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                      Schedule: {doc.availabilitySchedule}
                                    </p>
                                    {doc.opdRoom && (
                                      <p className="text-[11px] text-slate-500">
                                        Room: {doc.opdRoom}
                                      </p>
                                    )}
                                    {doc.contactPhone && (
                                      <a
                                        href={`tel:${doc.contactPhone.replace(/[^0-9+]/g, '')}`}
                                        className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:underline pt-0.5"
                                      >
                                        <Phone className="w-3 h-3" />
                                        <span>Direct Contact: {doc.contactPhone}</span>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Bed Telemetry & Actions */}
                          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {hospital.availableBeds && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Bed className="w-3.5 h-3.5 text-teal-400" />
                                  <span>
                                    ICU Beds:{' '}
                                    <strong className="text-white">
                                      {hospital.availableBeds.icu}
                                    </strong>
                                  </span>
                                </span>
                              )}
                              <span>Match Score: {matchScore}%</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {hospital.website && (
                                <a
                                  href={hospital.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                  <span>Official Website</span>
                                  <ExternalLink className="w-3 h-3 text-slate-400" />
                                </a>
                              )}

                              <a
                                href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`}
                                className="px-3 py-1.5 rounded-lg border border-teal-800/80 bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                              >
                                <Phone className="w-3 h-3" />
                                <span>Call Hospital</span>
                              </a>

                              <button
                                onClick={() => {
                                  if (onSelectHospital) onSelectHospital(hospital.id);
                                  onNavigate('/patient-intake');
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                              >
                                Register / Get Token
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              Select a medical condition on the left to review hospital recommendations and clinical guidance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

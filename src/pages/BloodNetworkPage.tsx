import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Droplet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Building2,
  User,
  Phone,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { BloodDonor, BloodRequest, BloodGroup } from '../types';

interface BloodNetworkPageProps {
  onNavigate: (path: string) => void;
}

export const BloodNetworkPage: React.FC<BloodNetworkPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { addNotification, playAlertSound } = useNotification();

  const [activeTab, setActiveTab] = useState<'DONORS' | 'REQUESTS' | 'MATRIX'>('DONORS');
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);

  // Search & Filters
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // New Request Modal / Form State
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [reqHospital, setReqHospital] = useState("NIMS Hospital, Hyderabad");
  const [reqBloodGroup, setReqBloodGroup] = useState<BloodGroup>('O-');
  const [reqUnits, setReqUnits] = useState(2);
  const [reqUrgency, setReqUrgency] = useState<'CRITICAL_IMMEDIATE' | 'URGENT_24H' | 'PLANNED_72H'>('CRITICAL_IMMEDIATE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedGroup, selectedCity]);

  const loadData = async () => {
    const bgParam = selectedGroup === 'ALL' ? undefined : (selectedGroup as BloodGroup);
    const cityParam = selectedCity === 'ALL' ? undefined : selectedCity;
    const [dList, rList] = await Promise.all([
      api.getDonors(bgParam, cityParam),
      api.getBloodRequests(),
    ]);
    setDonors(dList);
    setRequests(rList);
  };

  const handleToggleMyAvailability = async (donorId: string, currentStatus: boolean) => {
    const updated = await api.updateDonorAvailability(donorId, !currentStatus, 7);
    if (updated) {
      setDonors((prev) => prev.map((d) => (d.id === donorId ? updated : d)));
      playAlertSound('chime');
      addNotification({
        userId: currentUser.id,
        title: 'Donor Availability Updated',
        message: `Your availability is now set to ${!currentStatus ? 'AVAILABLE' : 'PAUSED'}. Valid for 7 days.`,
        category: 'DONOR',
        priority: 'NORMAL',
      });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName) return;

    setIsSubmitting(true);
    try {
      const newReq = await api.createBloodRequest({
        requesterName: currentUser.name,
        patientName,
        hospitalName: reqHospital,
        city: 'Hyderabad',
        bloodGroup: reqBloodGroup,
        unitsNeeded: Number(reqUnits),
        urgency: reqUrgency,
        neededBefore: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        coordinatorName: 'Mohammed Farooq',
      });

      setRequests((prev) => [newReq, ...prev]);
      setShowNewRequestForm(false);
      setPatientName('');
      playAlertSound('urgent');
      addNotification({
        userId: currentUser.id,
        title: `Blood Requisition Broadcast: ${newReq.bloodGroup}`,
        message: `Dispatched alert for ${newReq.unitsNeeded} units ${newReq.bloodGroup} at ${newReq.hospitalName}. ${newReq.matchedDonorCount} candidate donors matched.`,
        category: 'DONOR',
        priority: 'HIGH',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptRequestSimulated = async (requestId: string) => {
    const updated = await api.updateBloodRequestStatus(
      requestId,
      'DONOR_ACCEPTED',
      { id: currentUser.id, name: currentUser.name, role: currentUser.role },
      currentUser.role === 'DONOR' ? currentUser.name : 'Donor #K-402 (K.R.)',
      'Donor confirmed availability. Hospital screening appointment booked at 11:30 AM.'
    );
    if (updated) {
      setRequests((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
      playAlertSound('chime');
      addNotification({
        userId: currentUser.id,
        title: 'Donor Matched & Confirmed!',
        message: `A compatible registered donor has accepted Requisition ${updated.requestIdentifier}. Coordination underway.`,
        category: 'DONOR',
        priority: 'HIGH',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-950/70 border border-red-800/60 text-red-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t.nav.bloodNetwork}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Privacy-conscious registered donor network, compatibility matching, and urgent hospital requisitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewRequestForm(true)}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Droplet className="w-4 h-4 fill-white" />
            <span>Submit Blood Requisition</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-2">
        <div className="flex gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('DONORS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'DONORS' ? 'bg-slate-800 text-teal-300 shadow-2xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Registered Prospective Donors ({donors.length})
          </button>
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'REQUESTS' ? 'bg-slate-800 text-teal-300 shadow-2xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hospital Requisitions ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('MATRIX')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'MATRIX' ? 'bg-slate-800 text-teal-300 shadow-2xs border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Compatibility Matrix
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">All Blood Groups</option>
            <option value="O-">O- (Universal Red Cell)</option>
            <option value="O+">O+</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+ (Universal Recipient)</option>
            <option value="AB-">AB-</option>
          </select>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-700 rounded-lg bg-slate-800 font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            <option value="ALL">All Cities</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Secunderabad">Secunderabad</option>
            <option value="Vijayawada">Vijayawada</option>
          </select>
        </div>
      </div>

      {/* Tab Content: DONORS */}
      {activeTab === 'DONORS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map((donor) => (
            <div
              key={donor.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xl font-extrabold text-red-400 bg-red-950/70 border border-red-800/80 px-2.5 py-0.5 rounded-lg">
                      {donor.bloodGroup}
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-sm">{donor.displayName}</h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{donor.area}, {donor.city} (~{donor.distanceKmApprox} km)</span>
                      </p>
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    donor.isAvailable
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {donor.isAvailable ? 'Available Now' : 'Temporarily Paused'}
                </span>
              </div>

              {/* Donor stats */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400">Past Donations:</span>
                  <p className="font-bold text-slate-200">{donor.donationCount} times</p>
                </div>
                <div>
                  <span className="text-slate-400">Last Confirmed:</span>
                  <p className="font-medium text-slate-200">
                    {new Date(donor.lastConfirmedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Privacy Disclaimer */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Privacy Safe: Direct phone numbers managed via coordinator</span>
              </div>

              {/* Toggle Availability or Coordinate */}
              <div className="pt-1 flex gap-2">
                {currentUser.role === 'DONOR' && currentUser.id === donor.userId ? (
                  <button
                    onClick={() => handleToggleMyAvailability(donor.id, donor.isAvailable)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white font-semibold text-xs rounded-lg transition-colors border border-slate-700"
                  >
                    {donor.isAvailable ? 'Pause My Availability' : 'Set Available (7 Days)'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      addNotification({
                        userId: currentUser.id,
                        title: `Outreach Dispatched to ${donor.displayName}`,
                        message: `Coordinator notification queued for ${donor.bloodGroup} donor in ${donor.city}.`,
                        category: 'DONOR',
                        priority: 'NORMAL',
                      });
                    }}
                    className="w-full py-2 bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 font-bold text-xs rounded-lg border border-teal-800/60 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-teal-400" />
                    <span>Coordinate with Donor</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="font-extrabold text-sm">{req.bloodGroup}</span>
                  <span className="text-[10px] uppercase font-bold text-red-100">{req.unitsNeeded} U</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-400">{req.requestIdentifier}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        req.urgency === 'CRITICAL_IMMEDIATE'
                          ? 'bg-rose-950/70 text-rose-300 border-rose-800/80'
                          : 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                      }`}
                    >
                      {req.urgency.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Status: {req.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm mt-1">
                    Patient: {req.patientName}
                  </h3>
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{req.hospitalName} ({req.city})</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>Coordinator: {req.coordinatorName || 'Mohammed Farooq'}</span>
                  </p>

                  {req.fulfillmentNotes && (
                    <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                      {req.fulfillmentNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Status workflow action */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {req.status === 'MATCHING' && (
                  <button
                    onClick={() => handleAcceptRequestSimulated(req.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simulate Donor Acceptance</span>
                  </button>
                )}
                {req.status === 'DONOR_ACCEPTED' && (
                  <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Accepted by {req.acceptedDonorName}</span>
                  </span>
                )}
                {req.status === 'FULFILLED' && (
                  <span className="text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
                    Requisition Fulfilled
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: MATRIX */}
      {activeTab === 'MATRIX' && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Clinical Red Blood Cell Compatibility Reference
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              MART Health matching algorithm strictly enforces ABO and Rh(D) cross-match compatibility parameters.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-300 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-4">Recipient Blood Group</th>
                  <th className="py-2.5 px-4">Compatible Donor Groups</th>
                  <th className="py-2.5 px-4">Clinical Guidance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[
                  { r: 'O-', d: 'O- only', note: 'Universal Donor for RBCs. Can only receive O-.' },
                  { r: 'O+', d: 'O-, O+', note: 'Most common blood group in India (~37%).' },
                  { r: 'A-', d: 'O-, A-', note: 'High priority rare candidate.' },
                  { r: 'A+', d: 'O-, O+, A-, A+', note: 'Standard clinical compatibility.' },
                  { r: 'B-', d: 'O-, B-', note: 'Requires targeted donor registry outreach.' },
                  { r: 'B+', d: 'O-, O+, B-, B+', note: 'Very common in Andhra Pradesh & Telangana (~33%).' },
                  { r: 'AB-', d: 'O-, A-, B-, AB-', note: 'Rare Rh-negative subtype.' },
                  { r: 'AB+', d: 'All groups (Universal Recipient)', note: 'Can safely accept packed red cells from any ABO type.' },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-red-400">{row.r}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-200">{row.d}</td>
                    <td className="py-2.5 px-4 text-slate-400">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Requisition Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-lg p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-2 text-red-400">
              <Droplet className="w-5 h-5 fill-red-500" />
              <h3 className="text-base font-bold text-white">
                Submit Emergency Blood Requisition
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Requisitions are broadcasted to compatible registered donors within the municipal radius.
            </p>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Patient Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Baby Aaradhya / Rajesh Kumar"
                  className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-red-500 focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Required Blood Group
                  </label>
                  <select
                    value={reqBloodGroup}
                    onChange={(e) => setReqBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 text-slate-100 focus:border-red-500 focus:outline-none"
                  >
                    <option value="O-">O- (Universal)</option>
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Units Needed
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={reqUnits}
                    onChange={(e) => setReqUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-700 bg-slate-800 text-slate-100 rounded-lg focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hospital Requisitioning
                </label>
                <input
                  type="text"
                  value={reqHospital}
                  onChange={(e) => setReqHospital(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-700 bg-slate-800 text-slate-100 rounded-lg focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Urgency Timeframe
                </label>
                <select
                  value={reqUrgency}
                  onChange={(e) => setReqUrgency(e.target.value as 'CRITICAL_IMMEDIATE' | 'URGENT_24H' | 'PLANNED_72H')}
                  className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 text-slate-100 focus:border-red-500 focus:outline-none"
                >
                  <option value="CRITICAL_IMMEDIATE">Critical Immediate (&lt; 4 Hours - Emergency Surgery)</option>
                  <option value="URGENT_24H">Urgent (Within 24 Hours)</option>
                  <option value="PLANNED_72H">Planned Elective (Within 72 Hours)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewRequestForm(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Broadcasting...' : 'Broadcast Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

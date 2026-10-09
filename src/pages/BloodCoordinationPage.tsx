import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Droplet,
  CheckCircle2,
  Clock,
  Phone,
  Building2,
  User,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { BloodRequest, BloodDonor } from '../types';

export const BloodCoordinationPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { addNotification, playAlertSound } = useNotification();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rList, dList] = await Promise.all([
      api.getBloodRequests(),
      api.getDonors(),
    ]);
    setRequests(rList);
    setDonors(dList);
    if (rList.length > 0) setSelectedRequestId(rList[0].id);
  };

  const selectedRequest = requests.find((r) => r.id === selectedRequestId);

  const handleAdvanceStatus = async (status: BloodRequest['status'], acceptedDonorName?: string) => {
    if (!selectedRequestId) return;
    try {
      const updated = await api.updateBloodRequestStatus(
        selectedRequestId,
        status,
        { id: currentUser.id, name: currentUser.name, role: currentUser.role },
        acceptedDonorName || (status === 'DONOR_ACCEPTED' ? 'Donor #K-402' : undefined),
        `Status transitioned to ${status} by blood bank coordinator Mohammed Farooq.`
      );
      if (updated) {
        setRequests((prev) => prev.map((r) => (r.id === selectedRequestId ? updated : r)));
        playAlertSound('chime');
        addNotification({
          userId: currentUser.id,
          title: `Requisition Status: ${status}`,
          message: `Request ${updated.requestIdentifier} updated.`,
          category: 'DONOR',
          priority: 'NORMAL',
        });
      }
    } catch (err) {
      console.error(err);
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
              Blood Bank & Requisition Coordination
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Coordinate matching, donor outreach, clinical screening verification, and unit fulfillment.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 bg-red-950/70 text-red-300 border border-red-800/80 rounded-lg flex items-center gap-1.5">
          <Droplet className="w-4 h-4 fill-red-400 text-red-400" />
          <span>NABH Component Blood Bank Desk</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Requisitions ({requests.length})
          </h3>
          <div className="space-y-2">
            {requests.map((req) => (
              <button
                key={req.id}
                onClick={() => setSelectedRequestId(req.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedRequestId === req.id
                    ? 'border-red-500 bg-red-950/40 ring-2 ring-red-500/20'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs font-bold text-red-300 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded">
                    {req.bloodGroup} · {req.unitsNeeded} Units
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {req.status}
                  </span>
                </div>
                <p className="font-bold text-white text-xs mt-2">{req.patientName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{req.hospitalName}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Coordination Detail Card */}
        {selectedRequest && (
          <div className="lg:col-span-2 p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-xs font-bold text-slate-400">{selectedRequest.requestIdentifier}</span>
                <h2 className="text-lg font-bold text-white mt-1">
                  Requisition for {selectedRequest.patientName} ({selectedRequest.bloodGroup})
                </h2>
                <p className="text-xs text-slate-400">{selectedRequest.hospitalName} · Requested by {selectedRequest.requesterName}</p>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  selectedRequest.urgency === 'CRITICAL_IMMEDIATE'
                    ? 'bg-rose-950/70 text-rose-300 border-rose-800/80'
                    : 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                }`}
              >
                {selectedRequest.urgency.replace('_', ' ')}
              </span>
            </div>

            {/* Lifecycle advancement action bar */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Workflow Lifecycle Transition Actions
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleAdvanceStatus('DONOR_CONTACTED')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg transition-colors border border-slate-700 cursor-pointer"
                >
                  Mark Donor Contacted
                </button>
                <button
                  onClick={() => handleAdvanceStatus('DONOR_ACCEPTED', 'Donor #K-402')}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Confirm Donor Acceptance
                </button>
                <button
                  onClick={() => handleAdvanceStatus('COORDINATION_IN_PROGRESS')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Screening in Progress
                </button>
                <button
                  onClick={() => handleAdvanceStatus('FULFILLED')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Fulfill Requisition
                </button>
              </div>
            </div>

            {/* Matched Eligible Candidate Donors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Matched Eligible Registered Donors ({donors.filter((d) => d.isAvailable).length} Ready)
              </h3>
              <div className="space-y-2">
                {donors.filter((d) => d.isAvailable).map((donor) => (
                  <div key={donor.id} className="p-3 rounded-lg border border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-red-400 bg-red-950/70 border border-red-800/60 px-2 py-0.5 rounded">
                        {donor.bloodGroup}
                      </span>
                      <div>
                        <p className="font-bold text-slate-200">{donor.displayName}</p>
                        <p className="text-[11px] text-slate-400">{donor.area}, {donor.city} (~{donor.distanceKmApprox} km)</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAdvanceStatus('DONOR_ACCEPTED', donor.displayName)}
                      className="px-3 py-1 bg-red-950/70 hover:bg-red-900/80 text-red-300 font-bold text-xs rounded border border-red-800/80 transition-colors cursor-pointer"
                    >
                      Assign this Donor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

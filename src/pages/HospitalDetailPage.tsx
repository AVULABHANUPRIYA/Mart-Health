import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  User,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Hospital, HospitalReview } from '../types';

interface HospitalDetailPageProps {
  hospitalId: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}

export const HospitalDetailPage: React.FC<HospitalDetailPageProps> = ({
  hospitalId,
  onBack,
  onNavigate,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [reviews, setReviews] = useState<HospitalReview[]>([]);

  // New Review Form State
  const [cleanliness, setCleanliness] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [waitingExperience, setWaitingExperience] = useState(4);
  const [accessibility, setAccessibility] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmittedNotice, setReviewSubmittedNotice] = useState(false);

  useEffect(() => {
    loadHospitalData();
  }, [hospitalId]);

  const loadHospitalData = async () => {
    const hosp = await api.getHospitalById(hospitalId);
    if (hosp) {
      setHospital(hosp);
      const revs = await api.getHospitalReviews(hosp.id);
      setReviews(revs);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    const overall = parseFloat(
      ((cleanliness + communication + waitingExperience + accessibility) / 4).toFixed(1)
    );

    try {
      const newRev = await api.addHospitalReview(hospital.id, {
        patientName: currentUser.name,
        isVerifiedVisit: true,
        ratings: {
          cleanliness,
          communication,
          waitingExperience,
          accessibility,
        },
        overallRating: overall,
        comment: reviewComment,
      });

      setReviews((prev) => [newRev, ...prev]);
      setReviewComment('');
      setReviewSubmittedNotice(true);
      addNotification({
        userId: currentUser.id,
        title: 'Review Published',
        message: `Your verified review for ${hospital.name} has been published with rating ${overall}/5.`,
        category: 'SYSTEM',
        priority: 'NORMAL',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!hospital) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        Loading facility profile...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hospitals Directory</span>
      </button>

      {/* Main Profile Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                {hospital.name}
              </h1>
              {hospital.verificationStatus === 'VERIFIED' && (
                <span className="text-xs font-bold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Verified Healthcare Provider
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">{hospital.tagline}</p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-950/60 rounded-xl border border-amber-800/60">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <div>
              <p className="text-xl font-extrabold text-amber-300 leading-none">{hospital.rating}</p>
              <p className="text-[10px] text-amber-400 font-medium mt-0.5">{hospital.reviewCount} verified reviews</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs text-slate-300">
          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Address & Campus</span>
            <p className="flex items-center gap-1.5 text-slate-200 font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{hospital.address}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Emergency Line</span>
            <p className="flex items-center gap-1.5 text-rose-400 font-bold">
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{hospital.emergencyPhone}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Operating Schedule</span>
            <p className="flex items-center gap-1.5 text-slate-200 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{hospital.operatingHours}</span>
            </p>
          </div>
        </div>

        {/* Live Beds Availability */}
        {hospital.availableBeds && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-400">
              Live Verified Bed Occupancy Telemetry
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">ICU Beds</span>
                <p className="text-lg font-mono font-extrabold text-teal-400">{hospital.availableBeds.icu}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Trauma Bay</span>
                <p className="text-lg font-mono font-extrabold text-amber-400">{hospital.availableBeds.emergency}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">General Wards</span>
                <p className="text-lg font-mono font-extrabold text-slate-300">{hospital.availableBeds.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigate('/patient-intake')}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Register Patient & Queue at this Hospital
          </button>

          <a
            href={`tel:${hospital.phone.replace(/[^0-9+]/g, '')}`}
            className="px-4 py-2.5 rounded-lg border border-teal-800/80 bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call Desk ({hospital.phone})</span>
          </a>

          {hospital.website && (
            <a
              href={hospital.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Visit Official Website</span>
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            </a>
          )}
        </div>
      </div>

      {/* Insurance & TPA Empanelment Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span>Health Insurance & Cashless TPA Empanelment</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified empanelled insurance providers, plan-specific acceptance guidelines, and cashless pre-authorization desk.
            </p>
          </div>

          <div>
            {hospital.insuranceData?.overallStatus === 'VERIFIED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Insurance Accepted</span>
              </span>
            ) : hospital.insuranceData?.overallStatus === 'NOT_ACCEPTED' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80">
                <span>Not Accepted</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-amber-300 border border-amber-800/60">
                <span>Acceptance Not Verified</span>
              </span>
            )}
          </div>
        </div>

        {hospital.insuranceData ? (
          <div className="space-y-4">
            {/* TPA Desk Telemetry */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Cashless Helpdesk</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {hospital.insuranceData.cashlessDeskAvailable ? 'Active 24x7 Counter' : 'Unavailable'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Direct TPA Contact</span>
                <p className="font-semibold text-teal-300 mt-0.5">
                  {hospital.insuranceData.tpaDeskContact || 'Main Hospital Desk'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Last Audit / Verified</span>
                <p className="font-semibold text-slate-300 mt-0.5 font-mono">
                  {hospital.insuranceData.lastUpdatedDate}
                </p>
              </div>
            </div>

            {hospital.insuranceData.notes && (
              <p className="text-xs text-slate-300 bg-slate-850 p-3 rounded-lg border border-slate-800">
                <strong>Facility Insurance Policy:</strong> {hospital.insuranceData.notes}
              </p>
            )}

            {/* Providers and Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {hospital.insuranceData.providers.map((prov) => (
                <div
                  key={prov.providerId}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-100">{prov.providerName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        prov.status === 'VERIFIED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                          : prov.status === 'NOT_ACCEPTED'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                          : 'bg-slate-800 text-amber-300 border-amber-800/60'
                      }`}
                    >
                      {prov.status === 'VERIFIED'
                        ? 'Empanelled'
                        : prov.status === 'NOT_ACCEPTED'
                        ? 'Not Accepted'
                        : 'Verification Pending'}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Policy Plans & Coverage Status:
                    </span>
                    {prov.acceptedPlans.map((pl) => (
                      <div
                        key={pl.planId}
                        className="p-2 rounded bg-slate-900 border border-slate-800 space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{pl.planName}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              pl.verificationStatus === 'VERIFIED'
                                ? 'text-emerald-400'
                                : pl.verificationStatus === 'NOT_ACCEPTED'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {pl.verificationStatus === 'VERIFIED'
                              ? '✓ Verified'
                              : pl.verificationStatus === 'NOT_ACCEPTED'
                              ? '✗ Excluded'
                              : '? Not Verified'}
                          </span>
                        </div>
                        {pl.notes && (
                          <p className="text-[10px] text-slate-400 leading-tight">{pl.notes}</p>
                        )}
                        {pl.lastVerifiedDate && (
                          <p className="text-[9px] text-slate-500 font-mono">
                            Verified on: {pl.lastVerifiedDate}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-xs">
            Insurance empanelment details not yet formally verified for this facility. Please contact the hospital helpdesk directly.
          </div>
        )}
      </div>

      {/* Specialist Doctors Roster Section */}
      {hospital.specialists && hospital.specialists.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-teal-400" />
              <span>Specialist Clinical Faculty ({hospital.specialists.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified resident specialists, consultation hours, and OPD appointments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {hospital.specialists.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <span className="font-bold text-slate-100">{doc.name}</span>
                  {doc.isVerified && (
                    <span className="text-[10px] font-bold text-teal-400">✓ Verified</span>
                  )}
                </div>
                <p className="text-[11px] text-teal-300 font-medium">
                  {doc.specialty} · {doc.qualification}
                </p>
                <p className="text-[11px] text-slate-400">
                  Experience: <strong>{doc.experienceYears} years</strong>
                </p>
                <p className="text-[11px] text-slate-400">
                  OPD Schedule: {doc.availabilitySchedule}
                </p>
                {doc.opdRoom && (
                  <p className="text-[11px] text-slate-500">
                    Location: {doc.opdRoom}
                  </p>
                )}
                {doc.consultationFeeApprox && (
                  <p className="text-[11px] text-amber-300 font-medium">
                    Consultation Fee: {doc.consultationFeeApprox}
                  </p>
                )}
                {doc.contactPhone && (
                  <a
                    href={`tel:${doc.contactPhone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1 text-[11px] text-teal-400 hover:underline pt-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call Clinician: {doc.contactPhone}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">
            Patient Experience & Verified Reviews ({reviews.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent ratings across cleanliness, clinician communication, waiting times, and universal accessibility.
          </p>
        </div>

        {/* Add Review Form */}
        <form onSubmit={handleReviewSubmit} className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Submit Your Patient Feedback
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Cleanliness (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={cleanliness}
                onChange={(e) => setCleanliness(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-100 rounded font-bold focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Communication (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={communication}
                onChange={(e) => setCommunication(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-100 rounded font-bold focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Waiting Exp. (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={waitingExperience}
                onChange={(e) => setWaitingExperience(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-100 rounded font-bold focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Accessibility (1-5)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={accessibility}
                onChange={(e) => setAccessibility(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-slate-100 rounded font-bold focus:border-teal-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Written Review Comment
            </label>
            <textarea
              required
              rows={2}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Describe your care experience, waiting time, and staff responsiveness..."
              className="w-full px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:border-teal-500 focus:outline-none placeholder-slate-400"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors"
            >
              {isSubmittingReview ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </div>
        </form>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-white text-xs sm:text-sm">{rev.patientName}</p>
                    {rev.isVerifiedVisit && (
                      <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.2 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Verified Patient Visit
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{rev.overallRating} / 5</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>

              {/* Sub-ratings breakdown */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span>Cleanliness: <strong className="text-slate-200">{rev.ratings.cleanliness}/5</strong></span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Communication: <strong className="text-slate-200">{rev.ratings.communication}/5</strong></span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Waiting: <strong className="text-slate-200">{rev.ratings.waitingExperience}/5</strong></span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>Accessibility: <strong className="text-slate-200">{rev.ratings.accessibility}/5</strong></span>
              </div>

              {/* Hospital Official Response */}
              {rev.hospitalResponse && (
                <div className="p-3 rounded-lg bg-teal-950/40 border border-teal-800/60 text-xs space-y-1">
                  <p className="font-bold text-teal-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-teal-400" />
                    <span>Response from {rev.hospitalResponse.responderName}</span>
                  </p>
                  <p className="text-teal-100 leading-relaxed">{rev.hospitalResponse.message}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

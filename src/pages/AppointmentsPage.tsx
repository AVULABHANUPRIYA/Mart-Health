import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  CreditCard,
  FileText,
  Building2,
  Clock,
  User,
  Plus,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Send,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api } from '../services/api';
import { Appointment, DigitalPrescription, Invoice } from '../types';

export const AppointmentsPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { addNotification, playAlertSound } = useNotification();

  const [activeTab, setActiveTab] = useState<'APPOINTMENTS' | 'TELEHEALTH' | 'PRESCRIPTIONS' | 'BILLING'>('APPOINTMENTS');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<DigitalPrescription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Booking Form State
  const [showBookModal, setShowBookModal] = useState(false);
  const [doctorName, setDoctorName] = useState('Dr. Ananya Sharma, MD');
  const [departmentName, setDepartmentName] = useState('General Medicine OPD');
  const [dateTime, setDateTime] = useState('2026-10-18T10:30');
  const [appointmentType, setAppointmentType] = useState<'IN_PERSON' | 'TELEHEALTH_SIMULATED'>('TELEHEALTH_SIMULATED');
  const [reasonForVisit, setReasonForVisit] = useState('Quarterly diabetic and blood pressure follow-up');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Simulated Telehealth Video Call State
  const [isInCall, setIsInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([
    { sender: 'Dr. Ananya Sharma', text: 'Hello Rajesh garu! I am reviewing your blood pressure log from this morning.', time: '10:31 AM' },
    { sender: 'You', text: 'Thank you doctor, I took my Telmisartan at 8:00 AM.', time: '10:32 AM' },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [apts, rxs, invs] = await Promise.all([
      api.getAppointments('pat-1001'),
      api.getPrescriptions('pat-1001'),
      api.getInvoices('pat-1001'),
    ]);
    setAppointments(apts);
    setPrescriptions(rxs);
    setInvoices(invs);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    try {
      const booked = await api.bookAppointment({
        patientId: 'pat-1001',
        patientName: currentUser.name,
        hospitalId: 'hosp-1',
        hospitalName: "NIMS Hospital, Hyderabad",
        departmentId: 'dept-gen-med',
        departmentName,
        doctorName,
        dateTime: new Date(dateTime).toISOString(),
        type: appointmentType,
        reasonForVisit,
      });

      setAppointments((prev) => [booked, ...prev]);
      setShowBookModal(false);
      playAlertSound('chime');
      addNotification({
        userId: currentUser.id,
        title: 'Appointment Confirmed',
        message: `Booked with ${doctorName} at ${departmentName} on ${new Date(dateTime).toLocaleDateString()}.`,
        category: 'QUEUE',
        priority: 'NORMAL',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Double booking detected';
      setBookingError(msg);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      { sender: 'You', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setChatInput('');

    // Simulated doctor response after 1.5s
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'Dr. Ananya Sharma',
          text: 'Understood. Please keep monitoring daily and reduce sodium intake. I have updated your digital prescription.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1500);
  };

  const handlePayInvoice = async (invId: string) => {
    const paid = await api.payInvoice(invId, 'UPI_SIMULATED');
    if (paid) {
      setInvoices((prev) => prev.map((i) => (i.id === invId ? paid : i)));
      playAlertSound('chime');
      addNotification({
        userId: currentUser.id,
        title: 'Payment Successful (Simulated UPI)',
        message: `Settled ₹${paid.patientPayableAmount} for ${paid.invoiceNumber}. Ref: ${paid.transactionReference}`,
        category: 'SYSTEM',
        priority: 'NORMAL',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Appointments, Telehealth & Billing
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Smart scheduling, simulated remote consultation room, digital Rx, and simulated billing.
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('APPOINTMENTS')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'APPOINTMENTS' ? 'bg-slate-800 text-teal-300 shadow-2xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Scheduled Appointments ({appointments.length})
        </button>
        <button
          onClick={() => setActiveTab('TELEHEALTH')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'TELEHEALTH' ? 'bg-slate-800 text-teal-300 shadow-2xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5 text-teal-400" />
          <span>Telehealth Consultation Room</span>
        </button>
        <button
          onClick={() => setActiveTab('PRESCRIPTIONS')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'PRESCRIPTIONS' ? 'bg-slate-800 text-teal-300 shadow-2xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Digital Prescriptions ({prescriptions.length})
        </button>
        <button
          onClick={() => setActiveTab('BILLING')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'BILLING' ? 'bg-slate-800 text-teal-300 shadow-2xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          Billing & Invoices ({invoices.length})
        </button>
      </div>

      {/* Tab: APPOINTMENTS */}
      {activeTab === 'APPOINTMENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {appointments.map((apt) => (
            <div key={apt.id} className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{apt.doctorName}</h3>
                  <p className="text-xs text-slate-400">{apt.departmentName} · {apt.hospitalName}</p>
                </div>
                <span className="text-[10px] font-bold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded">
                  {apt.type === 'TELEHEALTH_SIMULATED' ? 'Telehealth Video' : 'In-Person OPD'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1">
                <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>{new Date(apt.dateTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</span>
                </p>
                <p className="text-slate-400 mt-1"><strong className="text-slate-300">Reason:</strong> {apt.reasonForVisit}</p>
              </div>

              {apt.type === 'TELEHEALTH_SIMULATED' && (
                <button
                  onClick={() => {
                    setActiveTab('TELEHEALTH');
                    setIsInCall(true);
                  }}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Join Telehealth Video Room</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: TELEHEALTH SIMULATED CONSULTATION ROOM */}
      {activeTab === 'TELEHEALTH' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <h3 className="font-bold text-sm text-white">Simulated Encrypted Telehealth Room</h3>
                <p className="text-[11px] text-slate-400">Dr. Ananya Sharma, MD & Rajesh Kumar (Token T-03)</p>
              </div>
            </div>

            <span className="text-xs font-semibold px-2 py-1 bg-slate-800/80 text-teal-400 rounded border border-slate-700">
              HIPAA & DPDP Simulation Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Feed Simulator */}
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 relative flex items-center justify-center overflow-hidden shadow-inner">
                {videoEnabled ? (
                  <div className="text-center space-y-2">
                    <div className="w-20 h-20 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-lg">
                      Dr. A
                    </div>
                    <p className="font-bold text-sm text-slate-200">Dr. Ananya Sharma, MD</p>
                    <p className="text-xs text-teal-400">Consultation Session Active</p>
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-xs">
                    <VideoOff className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <span>Camera Video Muted</span>
                  </div>
                )}

                {/* Self View overlay */}
                <div className="absolute bottom-3 right-3 w-32 aspect-video bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center text-xs text-slate-400">
                  <span>Patient (You)</span>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-3 rounded-full transition-colors cursor-pointer ${
                    audioEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                  }`}
                  title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
                >
                  {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`p-3 rounded-full transition-colors cursor-pointer ${
                    videoEnabled ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                  }`}
                  title={videoEnabled ? 'Stop Video' : 'Start Video'}
                >
                  {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={() => setIsInCall(false)}
                  className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Consultation</span>
                </button>
              </div>
            </div>

            {/* In-Call Doctor-Patient Chat */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 flex flex-col h-[340px]">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Consultation Secure Notes & Chat
              </p>

              <div className="flex-1 overflow-y-auto space-y-2 text-xs pr-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg ${
                      msg.sender === 'You' ? 'bg-teal-950/70 ml-4 border border-teal-800/60 text-slate-200' : 'bg-slate-900 mr-4 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-bold text-slate-300">{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="mt-1 text-slate-200 leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="pt-2 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type notes or message..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: DIGITAL PRESCRIPTIONS */}
      {activeTab === 'PRESCRIPTIONS' && (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-300 bg-teal-950/70 border border-teal-800/80 px-2 py-0.5 rounded">
                    {rx.rxNumber}
                  </span>
                  <h3 className="font-bold text-white text-base mt-1">{rx.doctorName}</h3>
                  <p className="text-xs text-slate-400">Reg No: {rx.doctorRegistrationNumber} · {rx.hospitalName}</p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Download / Print Rx
                </button>
              </div>

              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs">
                <p className="font-semibold text-slate-300">Diagnosis:</p>
                <p className="text-slate-200 mt-0.5">{rx.diagnosis}</p>
              </div>

              <div className="divide-y divide-slate-800 border-t border-slate-800 pt-2">
                {rx.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 text-xs flex justify-between">
                    <div>
                      <p className="font-bold text-white">{item.medicationName}</p>
                      <p className="text-slate-400">{item.instructions}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-slate-300">{item.frequency}</p>
                      <p className="text-slate-500">{item.duration}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                <span className="font-mono truncate">Digital Signature Hash: {rx.signatureHash}</span>
                <span>Valid Until: {rx.validUntil}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: BILLING & INVOICES */}
      {activeTab === 'BILLING' && (
        <div className="space-y-4">
          {invoices.map((inv) => (
            <div key={inv.id} className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                    {inv.invoiceNumber}
                  </span>
                  <h3 className="font-bold text-white text-base mt-1">{inv.hospitalName}</h3>
                  <p className="text-xs text-slate-400">Date: {inv.date}</p>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    inv.status === 'PAID'
                      ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80'
                      : 'bg-amber-950/70 text-amber-300 border-amber-800/80'
                  }`}
                >
                  {inv.status}
                </span>
              </div>

              <div className="divide-y divide-slate-800 text-xs">
                {inv.items.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between text-slate-300">
                    <span>{it.description} ({it.department})</span>
                    <span className="font-mono font-bold text-white">₹{it.cost}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="text-slate-400">Insurance Covered: <strong className="text-emerald-400 font-mono">₹{inv.insuranceCoveredAmount}</strong></p>
                  <p className="text-white text-sm font-bold">Patient Payable: <strong className="font-mono text-teal-300">₹{inv.patientPayableAmount}</strong></p>
                </div>

                {inv.status !== 'PAID' ? (
                  <button
                    onClick={() => handlePayInvoice(inv.id)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    Pay ₹{inv.patientPayableAmount} via Simulated UPI
                  </button>
                ) : (
                  <div className="text-right text-[11px] text-slate-400">
                    <p className="font-bold text-emerald-400">Settled via {inv.paymentMethod}</p>
                    <p className="font-mono text-slate-500">{inv.transactionReference}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              Book Specialist Appointment
            </h3>

            {bookingError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Clinician</label>
                <select
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 text-white"
                >
                  <option value="Dr. Ananya Sharma, MD">Dr. Ananya Sharma, MD (General Medicine)</option>
                  <option value="Dr. Sudheer Reddy, DM">Dr. Sudheer Reddy, DM (Endocrinology)</option>
                  <option value="Dr. V. Srinivas, MS">Dr. V. Srinivas, MS (Emergency Surgery)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Appointment Type</label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as 'IN_PERSON' | 'TELEHEALTH_SIMULATED')}
                  className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 text-white"
                >
                  <option value="TELEHEALTH_SIMULATED">Telehealth Video Call (Simulated)</option>
                  <option value="IN_PERSON">In-Person OPD Visit</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date & Time Slot</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  required
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="e.g., Routine review, cough, sugar check..."
                  className="w-full px-3 py-2 text-xs border border-slate-700 rounded-lg bg-slate-800 text-white placeholder-slate-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

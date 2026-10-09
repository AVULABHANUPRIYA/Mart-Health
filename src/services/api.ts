import { martStore } from './store';
import { firestoreService } from '../firebase/firestoreService';
import { testFirestoreConnection } from '../firebase/config';
import {
  Patient,
  QueueEntry,
  TriageAssessment,
  Hospital,
  HospitalReview,
  BloodDonor,
  BloodRequest,
  HealthMeasurement,
  Medication,
  Appointment,
  DigitalPrescription,
  Invoice,
  AuditLogEntry,
  TriageUrgency,
  QueueWorkflowStatus,
  BloodGroup,
  UserRole,
  DiseaseConditionInfo,
  HospitalInsuranceData,
} from '../types';

export const api = {
  // --- Health Actuator & Connection Verification ---
  async checkHealth() {
    const isFirestoreConnected = await testFirestoreConnection();
    try {
      const res = await fetch('/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          database: isFirestoreConnected ? 'CLOUD_FIRESTORE_CONNECTED' : 'LOCAL_REPLICATED',
        };
      }
    } catch {
      // Fallback
    }
    return {
      status: 'UP',
      database: isFirestoreConnected ? 'CLOUD_FIRESTORE_CONNECTED' : 'LOCAL_REPLICATED',
      timestamp: new Date().toISOString(),
    };
  },

  // --- Real-time Queue Subscription (Firestore onSnapshot) ---
  subscribeLiveQueue(callback: (entries: QueueEntry[]) => void, departmentId?: string): () => void {
    return firestoreService.subscribeLiveQueue(callback, departmentId);
  },

  // --- Patients ---
  async getPatients(search?: string): Promise<Patient[]> {
    try {
      const list = await firestoreService.getPatients(search);
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('API getPatients fallback:', e);
    }
    return martStore.getPatients();
  },

  async getPatientById(id: string): Promise<Patient | undefined> {
    try {
      const p = await firestoreService.getPatientById(id);
      if (p) return p;
    } catch (e) {
      console.warn('API getPatientById fallback:', e);
    }
    return martStore.getPatientById(id);
  },

  async registerPatient(
    patientData: Omit<Patient, 'id' | 'identifier' | 'registeredAt'>,
    options?: {
      hospitalId?: string;
      hospitalName?: string;
      departmentId?: string;
      departmentName?: string;
      chiefComplaint?: string;
    }
  ): Promise<{ patient: Patient; queueEntry?: QueueEntry }> {
    try {
      const res = await firestoreService.registerPatient(patientData, options);
      if (res) return res;
    } catch (e) {
      console.warn('API registerPatient fallback:', e);
    }
    return martStore.registerPatient(patientData, options);
  },

  // --- Triage ---
  async getTriageAssessments(): Promise<TriageAssessment[]> {
    try {
      const list = await firestoreService.getTriageAssessments();
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('API getTriageAssessments fallback:', e);
    }
    return martStore.getTriageAssessments();
  },

  async recordTriageAssessment(
    assessmentData: Omit<TriageAssessment, 'id' | 'assessedAt'>,
    clinicianUser: { id: string; name: string; role: UserRole }
  ): Promise<TriageAssessment> {
    try {
      const res = await firestoreService.createTriageAssessment(assessmentData, clinicianUser);
      if (res) return res;
    } catch (e) {
      console.warn('API recordTriageAssessment fallback:', e);
    }
    return martStore.createTriageAssessment(assessmentData, clinicianUser);
  },

  // --- Queue ---
  async getQueue(departmentId?: string): Promise<QueueEntry[]> {
    try {
      const list = await firestoreService.getQueue(departmentId);
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('API getQueue fallback:', e);
    }
    return martStore.getQueueEntries(departmentId);
  },

  async updateQueueStatus(
    queueId: string,
    status: QueueWorkflowStatus,
    clinician: { id: string; name: string; role: UserRole },
    notes?: string
  ): Promise<QueueEntry | undefined> {
    try {
      const updated = await firestoreService.updateQueueStatus(queueId, status, clinician, notes);
      if (updated) {
        martStore.updateQueueStatus(queueId, status, clinician, notes);
        return updated;
      }
    } catch (e) {
      console.warn('API updateQueueStatus fallback:', e);
    }
    return martStore.updateQueueStatus(queueId, status, clinician, notes);
  },

  async overrideQueuePriority(
    queueId: string,
    newUrgency: TriageUrgency,
    reason: string,
    clinician: { id: string; name: string; role: UserRole }
  ): Promise<QueueEntry | undefined> {
    try {
      const updated = await firestoreService.overrideQueuePriority(queueId, newUrgency, reason, clinician);
      if (updated) {
        martStore.overrideQueuePriority(queueId, newUrgency, reason, clinician);
        return updated;
      }
    } catch (e) {
      console.warn('API overrideQueuePriority fallback:', e);
    }
    return martStore.overrideQueuePriority(queueId, newUrgency, reason, clinician);
  },

  // --- Hospitals ---
  async getHospitals(city?: string, q?: string): Promise<Hospital[]> {
    try {
      const list = await firestoreService.getHospitals(city, q);
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('API getHospitals fallback:', e);
    }
    let list = martStore.getHospitals();
    if (city) list = list.filter((h) => h.city.toLowerCase() === city.toLowerCase());
    if (q) list = list.filter((h) => h.name.toLowerCase().includes(q.toLowerCase()));
    return list;
  },

  async getHospitalById(id: string): Promise<Hospital | undefined> {
    try {
      const hosp = await firestoreService.getHospitalById(id);
      if (hosp) return hosp;
    } catch (e) {
      console.warn('API getHospitalById fallback:', e);
    }
    return martStore.getHospitalById(id);
  },

  async getHospitalReviews(id: string): Promise<HospitalReview[]> {
    return martStore.getReviewsForHospital(id);
  },

  async addHospitalReview(
    hospitalId: string,
    data: Omit<HospitalReview, 'id' | 'hospitalId' | 'createdAt' | 'status'>
  ): Promise<HospitalReview> {
    return martStore.addReview({ ...data, hospitalId });
  },

  async updateHospitalVerification(
    hospitalId: string,
    status: Hospital['verificationStatus'],
    actor: { id: string; name: string; role: UserRole }
  ): Promise<Hospital | undefined> {
    try {
      const updated = await firestoreService.updateHospitalVerification(hospitalId, status, actor);
      if (updated) {
        martStore.updateHospitalVerification(hospitalId, status, actor);
        return updated;
      }
    } catch (e) {
      console.warn('API updateHospitalVerification fallback:', e);
    }
    return martStore.updateHospitalVerification(hospitalId, status, actor);
  },

  async updateHospitalInsurance(
    hospitalId: string,
    insuranceData: HospitalInsuranceData,
    actor: { id: string; name: string; role: UserRole }
  ): Promise<Hospital | undefined> {
    try {
      const updated = await firestoreService.updateHospitalInsurance(hospitalId, insuranceData, actor);
      if (updated) {
        martStore.updateHospitalInsurance(hospitalId, insuranceData, actor);
        return updated;
      }
    } catch (e) {
      console.warn('API updateHospitalInsurance fallback:', e);
    }
    return martStore.updateHospitalInsurance(hospitalId, insuranceData, actor);
  },

  // --- Specialized Disease Care ---
  async getDiseaseConditions(): Promise<DiseaseConditionInfo[]> {
    return martStore.getDiseaseConditions();
  },

  async getDiseaseConditionById(id: string): Promise<DiseaseConditionInfo | undefined> {
    return martStore.getDiseaseConditionById(id);
  },

  // --- Blood Network ---
  async getDonors(bloodGroup?: BloodGroup, city?: string): Promise<BloodDonor[]> {
    try {
      let list = await firestoreService.getBloodDonors();
      if (bloodGroup) list = list.filter((d) => d.bloodGroup === bloodGroup);
      if (city) list = list.filter((d) => d.city.toLowerCase() === city.toLowerCase());
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('API getDonors fallback:', e);
    }
    let list = martStore.getBloodDonors();
    if (bloodGroup) list = list.filter((d) => d.bloodGroup === bloodGroup);
    if (city) list = list.filter((d) => d.city.toLowerCase() === city.toLowerCase());
    return list;
  },

  async updateDonorAvailability(
    donorId: string,
    isAvailable: boolean,
    expiryDays: number = 7
  ): Promise<BloodDonor | undefined> {
    try {
      const updated = await firestoreService.updateDonorAvailability(donorId, isAvailable, expiryDays);
      if (updated) {
        martStore.updateDonorAvailability(donorId, isAvailable, expiryDays);
        return updated;
      }
    } catch (e) {
      console.warn('API updateDonorAvailability fallback:', e);
    }
    return martStore.updateDonorAvailability(donorId, isAvailable, expiryDays);
  },

  async getBloodRequests(): Promise<BloodRequest[]> {
    try {
      const list = await firestoreService.getBloodRequests();
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('API getBloodRequests fallback:', e);
    }
    return martStore.getBloodRequests();
  },

  async createBloodRequest(
    data: Omit<BloodRequest, 'id' | 'requestIdentifier' | 'createdAt' | 'status' | 'matchedDonorCount'>
  ): Promise<BloodRequest> {
    try {
      const req = await firestoreService.createBloodRequest(data);
      if (req) {
        martStore.createBloodRequest(data);
        return req;
      }
    } catch (e) {
      console.warn('API createBloodRequest fallback:', e);
    }
    return martStore.createBloodRequest(data);
  },

  async updateBloodRequestStatus(
    requestId: string,
    status: BloodRequest['status'],
    actor: { id: string; name: string; role: UserRole },
    acceptedDonorName?: string,
    fulfillmentNotes?: string
  ): Promise<BloodRequest | undefined> {
    return martStore.updateBloodRequestStatus(requestId, status, actor, acceptedDonorName, fulfillmentNotes);
  },

  // --- Health Measurements & Medications ---
  async getHealthMeasurements(patientId?: string): Promise<HealthMeasurement[]> {
    return martStore.getHealthMeasurements(patientId);
  },

  async addHealthMeasurement(data: Omit<HealthMeasurement, 'id' | 'timestamp'>): Promise<HealthMeasurement> {
    return martStore.addHealthMeasurement(data);
  },

  async getMedications(patientId?: string): Promise<Medication[]> {
    return martStore.getMedications(patientId);
  },

  async logMedicationAdherence(
    medicationId: string,
    patientId: string,
    timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT',
    status: 'TAKEN' | 'SKIPPED' | 'MISSED',
    reason?: string
  ) {
    return martStore.logAdherence(medicationId, patientId, timeSlot, status, reason);
  },

  // --- Appointments & Prescriptions ---
  async getAppointments(patientId?: string): Promise<Appointment[]> {
    try {
      const list = await firestoreService.getAppointments(patientId);
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('API getAppointments fallback:', e);
    }
    return martStore.getAppointments(patientId);
  },

  async bookAppointment(data: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
    try {
      const appt = await firestoreService.bookAppointment(data);
      if (appt) {
        martStore.bookAppointment(data);
        return appt;
      }
    } catch (e) {
      console.warn('API bookAppointment fallback:', e);
    }
    return martStore.bookAppointment(data);
  },

  async getPrescriptions(patientId?: string): Promise<DigitalPrescription[]> {
    return martStore.getPrescriptions(patientId);
  },

  async createPrescription(
    data: Omit<DigitalPrescription, 'id' | 'rxNumber' | 'issueDate' | 'signatureHash' | 'isPrintable'>,
    clinician: { id: string; name: string; role: UserRole }
  ): Promise<DigitalPrescription> {
    return martStore.createPrescription(data, clinician);
  },

  // --- Billing ---
  async getInvoices(patientId?: string): Promise<Invoice[]> {
    return martStore.getInvoices(patientId);
  },

  async payInvoice(invoiceId: string, paymentMethod: Invoice['paymentMethod']): Promise<Invoice | undefined> {
    return martStore.payInvoice(invoiceId, paymentMethod);
  },

  // --- Analytics & Audit ---
  async getAnalytics() {
    return martStore.getOperationalStats();
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return martStore.getAuditLogs();
  },

  // --- FHIR R4 Bundle ---
  async getFHIRBundle(patientId: string) {
    return martStore.exportFHIRPatientBundle(patientId);
  },
};

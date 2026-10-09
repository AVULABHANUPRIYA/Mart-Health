import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
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
  DiseaseConditionInfo,
  HospitalInsuranceData,
  User,
  UserRole,
  TriageUrgency,
  QueueWorkflowStatus,
} from '../types';
import {
  SEED_PATIENTS,
  SEED_HOSPITALS,
  SEED_REVIEWS,
  SEED_QUEUE_ENTRIES,
  SEED_TRIAGE_ASSESSMENTS,
  SEED_BLOOD_DONORS,
  SEED_BLOOD_REQUESTS,
  SEED_HEALTH_MEASUREMENTS,
  SEED_MEDICATIONS,
  SEED_APPOINTMENTS,
  SEED_PRESCRIPTIONS,
  SEED_INVOICES,
  SEED_AUDIT_LOGS,
  SEED_DISEASE_CONDITIONS,
  SEED_USERS,
} from '../data/seedData';

class FirestoreService {
  private isSeeded: boolean = false;
  private queueUnsubscribe: Unsubscribe | null = null;
  private queueMemoryCache: QueueEntry[] = [];
  private queueListeners: Set<(entries: QueueEntry[]) => void> = new Set();

  constructor() {
    this.initDataMigration();
  }

  // --- Initial Data Seeding / Migration to Cloud Firestore ---
  public async initDataMigration(): Promise<void> {
    if (this.isSeeded) return;
    try {
      // Check if hospitals already exist in Firestore
      const hospCol = collection(db, 'hospitals');
      const snap = await getDocs(hospCol);

      if (snap.empty) {
        console.log('MART Health: Migrating initial healthcare dataset to Cloud Firestore...');

        // 1. Seed Hospitals
        for (const h of SEED_HOSPITALS) {
          await setDoc(doc(db, 'hospitals', h.id), h);
        }

        // 2. Seed Patients
        for (const p of SEED_PATIENTS) {
          await setDoc(doc(db, 'patients', p.id), p);
        }

        // 3. Seed Initial Queue
        for (const q of SEED_QUEUE_ENTRIES) {
          await setDoc(doc(db, 'queue', q.id), q);
        }

        // 4. Seed Triage Assessments
        for (const t of SEED_TRIAGE_ASSESSMENTS) {
          await setDoc(doc(db, 'triage', t.id), t);
        }

        // 5. Seed Blood Donors & Requests
        for (const d of SEED_BLOOD_DONORS) {
          await setDoc(doc(db, 'bloodDonors', d.id), d);
        }
        for (const br of SEED_BLOOD_REQUESTS) {
          await setDoc(doc(db, 'bloodRequests', br.id), br);
        }

        // 6. Seed Disease Conditions
        for (const dc of SEED_DISEASE_CONDITIONS) {
          await setDoc(doc(db, 'diseaseConditions', dc.id), dc);
        }

        // 7. Seed Appointments
        for (const apt of SEED_APPOINTMENTS) {
          await setDoc(doc(db, 'appointments', apt.id), apt);
        }

        // 8. Seed Demo Users in users collection
        for (const u of SEED_USERS) {
          await setDoc(doc(db, 'users', u.id), u);
        }

        console.log('MART Health: Cloud Firestore seed migration completed successfully.');
      }
      this.isSeeded = true;
    } catch (err) {
      console.warn('MART Health: Initial migration notice (non-fatal, local fallback active):', err);
    }
  }

  // --- Real-time Synchronized Queue ---
  public subscribeLiveQueue(
    callback: (entries: QueueEntry[]) => void,
    departmentId?: string
  ): () => void {
    this.queueListeners.add(callback);

    // Provide instant memory cache if available
    if (this.queueMemoryCache.length > 0) {
      const filtered = this.filterAndSortQueue(this.queueMemoryCache, departmentId);
      callback(filtered);
    }

    // Set up Firestore onSnapshot listener if not already active
    if (!this.queueUnsubscribe) {
      const queueCol = collection(db, 'queue');
      this.queueUnsubscribe = onSnapshot(
        queueCol,
        (snapshot) => {
          const list: QueueEntry[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as QueueEntry);
          });

          this.queueMemoryCache = list;
          this.recalculateQueuePriorities(list);

          // Broadcast to all active page listeners
          this.queueListeners.forEach((listener) => {
            listener(this.filterAndSortQueue(this.queueMemoryCache, departmentId));
          });
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'queue');
        }
      );
    }

    return () => {
      this.queueListeners.delete(callback);
    };
  }

  private filterAndSortQueue(entries: QueueEntry[], departmentId?: string): QueueEntry[] {
    let list = [...entries];
    if (departmentId && departmentId !== 'ALL') {
      list = list.filter((q) => q.departmentId === departmentId);
    }

    return list.sort((a, b) => {
      // In consultation cases stay prominent
      if (a.status === 'IN_CONSULTATION' && b.status !== 'IN_CONSULTATION') return -1;
      if (b.status === 'IN_CONSULTATION' && a.status !== 'IN_CONSULTATION') return 1;

      // Completed / discharged cases go to bottom
      const aDone = ['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(a.status);
      const bDone = ['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(b.status);
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return a.arrivalOrder - b.arrivalOrder;
    });
  }

  private recalculateQueuePriorities(list: QueueEntry[]): void {
    let waitAccumulator = 0;
    list.forEach((q) => {
      let base = 200;
      if (q.urgency === 'IMMEDIATE') base = 950;
      else if (q.urgency === 'URGENT') base = 750;
      else if (q.urgency === 'STANDARD') base = 450;
      else if (q.urgency === 'NON_URGENT') base = 150;

      const arrivalBonus = Math.max(0, 50 - q.arrivalOrder * 2);
      q.priorityScore = base + arrivalBonus;

      if (['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(q.status)) {
        q.estimatedWaitMinutes = 0;
      } else if (q.status === 'IN_CONSULTATION') {
        q.estimatedWaitMinutes = 0;
      } else {
        if (q.urgency === 'IMMEDIATE') {
          q.estimatedWaitMinutes = 0;
        } else {
          waitAccumulator += q.urgency === 'URGENT' ? 8 : 12;
          q.estimatedWaitMinutes = waitAccumulator;
        }
      }
    });
  }

  public async getQueue(departmentId?: string): Promise<QueueEntry[]> {
    try {
      const snap = await getDocs(collection(db, 'queue'));
      if (!snap.empty) {
        const list: QueueEntry[] = [];
        snap.forEach((d) => list.push(d.data() as QueueEntry));
        this.queueMemoryCache = list;
        this.recalculateQueuePriorities(list);
        return this.filterAndSortQueue(list, departmentId);
      }
    } catch (err) {
      console.warn('Firestore getQueue fallback to memory:', err);
    }
    return this.filterAndSortQueue(SEED_QUEUE_ENTRIES, departmentId);
  }

  // --- Emergency / Urgency Override with Live Persistence ---
  public async overrideQueuePriority(
    queueId: string,
    newUrgency: TriageUrgency,
    reason: string,
    clinicianUser: { id: string; name: string; role: UserRole }
  ): Promise<QueueEntry | undefined> {
    const queueDocRef = doc(db, 'queue', queueId);
    try {
      let baseScore = 450;
      let estWait = 15;
      if (newUrgency === 'IMMEDIATE') {
        baseScore = 950;
        estWait = 0;
      } else if (newUrgency === 'URGENT') {
        baseScore = 750;
        estWait = 8;
      } else if (newUrgency === 'STANDARD') {
        baseScore = 450;
        estWait = 25;
      } else if (newUrgency === 'NON_URGENT') {
        baseScore = 150;
        estWait = 45;
      }

      const updates = {
        urgency: newUrgency,
        overrideReason: reason,
        priorityScore: baseScore,
        estimatedWaitMinutes: estWait,
        lastUpdatedAt: new Date().toISOString(),
      };

      await updateDoc(queueDocRef, updates);

      // Log in audit trail
      await this.logAudit({
        actorUserId: clinicianUser.id,
        actorRole: clinicianUser.role,
        actorName: clinicianUser.name,
        action: 'QUEUE_PRIORITY_MANUAL_OVERRIDE',
        targetEntity: 'QueueEntry',
        targetId: queueId,
        details: `Clinician override to ${newUrgency}. Mandatory Rationale: ${reason}`,
        ipAddress: '127.0.0.1',
      });

      const updatedSnap = await getDoc(queueDocRef);
      return updatedSnap.data() as QueueEntry;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `queue/${queueId}`);
    }
  }

  public async updateQueueStatus(
    queueId: string,
    newStatus: QueueWorkflowStatus,
    clinicianUser: { id: string; name: string; role: UserRole },
    notes?: string
  ): Promise<QueueEntry | undefined> {
    const queueDocRef = doc(db, 'queue', queueId);
    try {
      const snap = await getDoc(queueDocRef);
      if (!snap.exists()) return undefined;
      const current = snap.data() as QueueEntry;

      const updates: Partial<QueueEntry> = {
        status: newStatus,
        lastUpdatedAt: new Date().toISOString(),
      };

      if (newStatus === 'IN_CONSULTATION' && !current.consultationStartedAt) {
        updates.consultationStartedAt = new Date().toISOString();
        updates.assignedDoctorId = clinicianUser.id;
        updates.assignedDoctorName = clinicianUser.name;
        updates.estimatedWaitMinutes = 0;
      } else if (['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(newStatus)) {
        updates.consultationCompletedAt = new Date().toISOString();
        updates.estimatedWaitMinutes = 0;
        if (notes) updates.dispositionNotes = notes;
      }

      await updateDoc(queueDocRef, updates as Record<string, any>);

      await this.logAudit({
        actorUserId: clinicianUser.id,
        actorRole: clinicianUser.role,
        actorName: clinicianUser.name,
        action: 'QUEUE_STATUS_TRANSITION',
        targetEntity: 'QueueEntry',
        targetId: queueId,
        details: `Transitioned status from ${current.status} to ${newStatus} for Token ${current.tokenNumber}`,
        ipAddress: '127.0.0.1',
      });

      const updatedSnap = await getDoc(queueDocRef);
      return updatedSnap.data() as QueueEntry;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `queue/${queueId}`);
    }
  }

  // --- Patients Registration & Queries ---
  public async getPatients(search?: string): Promise<Patient[]> {
    try {
      const snap = await getDocs(collection(db, 'patients'));
      let list: Patient[] = [];
      snap.forEach((d) => list.push(d.data() as Patient));
      if (list.length === 0) list = [...SEED_PATIENTS];

      if (search) {
        const q = search.toLowerCase();
        return list.filter((p) => p.fullName.toLowerCase().includes(q) || p.identifier.toLowerCase().includes(q));
      }
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'patients');
    }
  }

  public async getPatientById(id: string): Promise<Patient | undefined> {
    try {
      const docRef = doc(db, 'patients', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as Patient;
      }
      // Check identifier fallback
      const q = query(collection(db, 'patients'), where('identifier', '==', id));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        return querySnap.docs[0].data() as Patient;
      }
      return SEED_PATIENTS.find((p) => p.id === id || p.identifier === id);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `patients/${id}`);
    }
  }

  public async registerPatient(
    patientData: Omit<Patient, 'id' | 'identifier' | 'registeredAt'>,
    options?: {
      hospitalId?: string;
      hospitalName?: string;
      departmentId?: string;
      departmentName?: string;
      chiefComplaint?: string;
    }
  ): Promise<{ patient: Patient; queueEntry?: QueueEntry }> {
    const id = `pat-${Date.now()}`;
    const identifier = `MART-P-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: Patient = {
      ...patientData,
      id,
      identifier,
      registeredAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'patients', id), newPatient);

      let queueEntry: QueueEntry | undefined;
      if (options?.hospitalId) {
        const queueSnap = await getDocs(collection(db, 'queue'));
        const nextCount = queueSnap.size + 1;
        const nextTokenNum = `T-${String(nextCount).padStart(2, '0')}`;

        queueEntry = {
          id: `q-${Date.now()}`,
          visitId: `vis-${Date.now()}`,
          patientId: id,
          patientName: newPatient.fullName,
          patientAge: newPatient.age,
          patientGender: newPatient.gender,
          tokenNumber: nextTokenNum,
          hospitalId: options.hospitalId,
          hospitalName: options.hospitalName || 'NIMS Hospital, Hyderabad',
          departmentId: options.departmentId || 'dept-gen-med',
          departmentName: options.departmentName || 'General Medicine OPD',
          registeredAt: new Date().toISOString(),
          urgency: 'STANDARD',
          status: 'AWAITING_TRIAGE',
          priorityScore: 500,
          estimatedWaitMinutes: 25,
          arrivalOrder: nextCount,
          chiefComplaint: options.chiefComplaint || 'General clinical review',
          reassessmentDue: false,
          staffAlertAcknowledged: false,
          lastUpdatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'queue', queueEntry.id), queueEntry);
      }

      await this.logAudit({
        actorUserId: auth.currentUser?.uid || 'system',
        actorRole: 'NURSE',
        actorName: 'Patient Intake Service',
        action: 'PATIENT_REGISTERED',
        targetEntity: 'Patient',
        targetId: id,
        details: `Registered patient ${newPatient.fullName} (${identifier})`,
        ipAddress: '127.0.0.1',
      });

      return { patient: newPatient, queueEntry };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `patients/${id}`);
    }
  }

  // --- Hospitals & Insurance Matrices ---
  public async getHospitals(city?: string, q?: string): Promise<Hospital[]> {
    try {
      const snap = await getDocs(collection(db, 'hospitals'));
      let list: Hospital[] = [];
      snap.forEach((d) => list.push(d.data() as Hospital));
      if (list.length === 0) list = [...SEED_HOSPITALS];

      if (city) {
        list = list.filter((h) => h.city.toLowerCase() === city.toLowerCase());
      }
      if (q) {
        const term = q.toLowerCase();
        list = list.filter((h) => h.name.toLowerCase().includes(term));
      }
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'hospitals');
    }
  }

  public async getHospitalById(id: string): Promise<Hospital | undefined> {
    try {
      const snap = await getDoc(doc(db, 'hospitals', id));
      if (snap.exists()) {
        return snap.data() as Hospital;
      }
      return SEED_HOSPITALS.find((h) => h.id === id);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `hospitals/${id}`);
    }
  }

  public async updateHospitalVerification(
    hospitalId: string,
    status: Hospital['verificationStatus'],
    actor: { id: string; name: string; role: UserRole }
  ): Promise<Hospital | undefined> {
    const hospRef = doc(db, 'hospitals', hospitalId);
    try {
      const updates: Partial<Hospital> = {
        verificationStatus: status,
      };
      if (status === 'VERIFIED') {
        updates.lastVerifiedDate = new Date().toISOString().split('T')[0];
      }
      await updateDoc(hospRef, updates);

      await this.logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'HOSPITAL_VERIFICATION_STATUS_UPDATED',
        targetEntity: 'Hospital',
        targetId: hospitalId,
        details: `Updated hospital verification status to ${status}`,
        ipAddress: '127.0.0.1',
      });

      const snap = await getDoc(hospRef);
      return snap.data() as Hospital;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `hospitals/${hospitalId}`);
    }
  }

  public async updateHospitalInsurance(
    hospitalId: string,
    insuranceData: HospitalInsuranceData,
    actor: { id: string; name: string; role: UserRole }
  ): Promise<Hospital | undefined> {
    const hospRef = doc(db, 'hospitals', hospitalId);
    try {
      const updates: Partial<Hospital> = {
        insuranceData,
      };
      if (insuranceData.overallStatus === 'VERIFIED') {
        updates.lastVerifiedDate = insuranceData.lastUpdatedDate || new Date().toISOString().split('T')[0];
      }
      await updateDoc(hospRef, updates);

      await this.logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'HOSPITAL_INSURANCE_DATA_UPDATED',
        targetEntity: 'Hospital',
        targetId: hospitalId,
        details: `Updated hospital insurance data to ${insuranceData.overallStatus} (${insuranceData.providers.length} empanelled providers)`,
        ipAddress: '127.0.0.1',
      });

      const snap = await getDoc(hospRef);
      return snap.data() as Hospital;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `hospitals/${hospitalId}`);
    }
  }

  // --- Triage Assessments ---
  public async getTriageAssessments(): Promise<TriageAssessment[]> {
    try {
      const snap = await getDocs(collection(db, 'triage'));
      const list: TriageAssessment[] = [];
      snap.forEach((d) => list.push(d.data() as TriageAssessment));
      return list.length > 0 ? list : [...SEED_TRIAGE_ASSESSMENTS];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'triage');
    }
  }

  public async createTriageAssessment(
    assessmentData: Omit<TriageAssessment, 'id' | 'assessedAt'>,
    clinicianUser: { id: string; name: string; role: UserRole }
  ): Promise<TriageAssessment> {
    const id = `tri-${Date.now()}`;
    const assessment: TriageAssessment = {
      ...assessmentData,
      id,
      assessedAt: new Date().toISOString(),
      assessedBy: clinicianUser.name,
      assessedByRole: clinicianUser.role,
    };

    try {
      await setDoc(doc(db, 'triage', id), assessment);

      // Also update corresponding queue entry in Firestore
      const queueQuery = query(
        collection(db, 'queue'),
        where('patientId', '==', assessment.patientId)
      );
      const queueSnap = await getDocs(queueQuery);
      if (!queueSnap.empty) {
        const qDoc = queueSnap.docs[0];
        let baseScore = 450;
        let estWait = 15;
        if (assessment.urgency === 'IMMEDIATE') {
          baseScore = 950;
          estWait = 0;
        } else if (assessment.urgency === 'URGENT') {
          baseScore = 750;
          estWait = 8;
        } else if (assessment.urgency === 'STANDARD') {
          baseScore = 450;
          estWait = 25;
        } else if (assessment.urgency === 'NON_URGENT') {
          baseScore = 150;
          estWait = 45;
        }

        await updateDoc(qDoc.ref, {
          urgency: assessment.urgency,
          triageAssessmentId: id,
          status: 'TRIAGE_COMPLETED',
          priorityScore: baseScore,
          estimatedWaitMinutes: estWait,
          lastUpdatedAt: new Date().toISOString(),
          overrideReason: assessment.overrideReason || null,
        });
      }

      await this.logAudit({
        actorUserId: clinicianUser.id,
        actorRole: clinicianUser.role,
        actorName: clinicianUser.name,
        action: assessment.overrideApplied ? 'TRIAGE_OVERRIDE_RECORDED' : 'TRIAGE_ASSESSMENT_RECORDED',
        targetEntity: 'TriageAssessment',
        targetId: id,
        details: `Assigned urgency ${assessment.urgency} for visit ${assessment.visitId}`,
        ipAddress: '127.0.0.1',
      });

      return assessment;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `triage/${id}`);
    }
  }

  // --- Blood Network ---
  public async getBloodDonors(): Promise<BloodDonor[]> {
    try {
      const snap = await getDocs(collection(db, 'bloodDonors'));
      const list: BloodDonor[] = [];
      snap.forEach((d) => list.push(d.data() as BloodDonor));
      return list.length > 0 ? list : [...SEED_BLOOD_DONORS];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'bloodDonors');
    }
  }

  public async updateDonorAvailability(
    donorId: string,
    isAvailable: boolean,
    expiryDays: number = 7
  ): Promise<BloodDonor | undefined> {
    const docRef = doc(db, 'bloodDonors', donorId);
    try {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiryDays);

      const updates = {
        isAvailable,
        lastConfirmedAt: new Date().toISOString(),
        availabilityExpiry: expDate.toISOString(),
      };
      await updateDoc(docRef, updates);
      const snap = await getDoc(docRef);
      return snap.data() as BloodDonor;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bloodDonors/${donorId}`);
    }
  }

  public async getBloodRequests(): Promise<BloodRequest[]> {
    try {
      const snap = await getDocs(collection(db, 'bloodRequests'));
      const list: BloodRequest[] = [];
      snap.forEach((d) => list.push(d.data() as BloodRequest));
      return list.length > 0 ? list : [...SEED_BLOOD_REQUESTS];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'bloodRequests');
    }
  }

  public async createBloodRequest(
    requestData: Omit<BloodRequest, 'id' | 'requestIdentifier' | 'createdAt' | 'status' | 'matchedDonorCount'>
  ): Promise<BloodRequest> {
    const id = `br-${Date.now()}`;
    const requestIdentifier = `MART-BR-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newReq: BloodRequest = {
      ...requestData,
      id,
      requestIdentifier,
      status: 'OPEN',
      matchedDonorCount: 2,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'bloodRequests', id), newReq);
      return newReq;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `bloodRequests/${id}`);
    }
  }

  // --- Appointments ---
  public async getAppointments(patientId?: string): Promise<Appointment[]> {
    try {
      const col = collection(db, 'appointments');
      const snap = await getDocs(col);
      let list: Appointment[] = [];
      snap.forEach((d) => list.push(d.data() as Appointment));
      if (list.length === 0) list = [...SEED_APPOINTMENTS];
      if (patientId) {
        return list.filter((a) => a.patientId === patientId);
      }
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    }
  }

  public async bookAppointment(data: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> {
    const id = `apt-${Date.now()}`;
    const appt: Appointment = {
      ...data,
      id,
      status: 'CONFIRMED',
    };
    try {
      await setDoc(doc(db, 'appointments', id), appt);
      return appt;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `appointments/${id}`);
    }
  }

  // --- Audit Logging ---
  public async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const log: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'auditLogs', id), log);
    } catch (err) {
      console.warn('Audit log write error:', err);
    }
  }

  // --- Users & Roles in Firestore ---
  public async syncUserToFirestore(user: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, {
        ...user,
        lastActiveAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('User sync to Firestore notice:', err);
    }
  }
}

export const firestoreService = new FirestoreService();

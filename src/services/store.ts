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
  MedicationAdherenceLog,
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
  SEED_ADHERENCE_LOGS,
  SEED_APPOINTMENTS,
  SEED_PRESCRIPTIONS,
  SEED_INVOICES,
  SEED_AUDIT_LOGS,
  SEED_DISEASE_CONDITIONS,
} from '../data/seedData';

type QueueListener = (entries: QueueEntry[]) => void;

class MartHealthStore {
  private patients: Patient[] = [...SEED_PATIENTS];
  private hospitals: Hospital[] = [...SEED_HOSPITALS];
  private reviews: HospitalReview[] = [...SEED_REVIEWS];
  private queueEntries: QueueEntry[] = [...SEED_QUEUE_ENTRIES];
  private triageAssessments: TriageAssessment[] = [...SEED_TRIAGE_ASSESSMENTS];
  private bloodDonors: BloodDonor[] = [...SEED_BLOOD_DONORS];
  private bloodRequests: BloodRequest[] = [...SEED_BLOOD_REQUESTS];
  private healthMeasurements: HealthMeasurement[] = [...SEED_HEALTH_MEASUREMENTS];
  private medications: Medication[] = [...SEED_MEDICATIONS];
  private adherenceLogs: MedicationAdherenceLog[] = [...SEED_ADHERENCE_LOGS];
  private appointments: Appointment[] = [...SEED_APPOINTMENTS];
  private prescriptions: DigitalPrescription[] = [...SEED_PRESCRIPTIONS];
  private invoices: Invoice[] = [...SEED_INVOICES];
  private auditLogs: AuditLogEntry[] = [...SEED_AUDIT_LOGS];
  private diseaseConditions: DiseaseConditionInfo[] = [...SEED_DISEASE_CONDITIONS];

  private queueListeners: Set<QueueListener> = new Set();

  constructor() {
    this.recalculateQueuePriorities();
  }

  // --- Queue Listeners (SSE & Reactive State) ---
  public subscribeQueue(listener: QueueListener): () => void {
    this.queueListeners.add(listener);
    listener(this.getQueueEntries());
    return () => {
      this.queueListeners.delete(listener);
    };
  }

  private notifyQueueUpdate(): void {
    const sorted = this.getQueueEntries();
    this.queueListeners.forEach((fn) => {
      try {
        fn(sorted);
      } catch (err) {
        console.error('Queue subscriber notification error:', err);
      }
    });
  }

  // --- Audit Logging ---
  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const log: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  public getAuditLogs(): AuditLogEntry[] {
    return [...this.auditLogs];
  }

  // --- Patients ---
  public getPatients(): Patient[] {
    return [...this.patients];
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.find((p) => p.id === id || p.identifier === id);
  }

  public registerPatient(
    patientData: Omit<Patient, 'id' | 'identifier' | 'registeredAt'>,
    options?: {
      hospitalId?: string;
      hospitalName?: string;
      departmentId?: string;
      departmentName?: string;
      chiefComplaint?: string;
    }
  ): { patient: Patient; queueEntry?: QueueEntry } {
    const id = `pat-${Date.now()}`;
    const identifier = `MART-P-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient: Patient = {
      ...patientData,
      id,
      identifier,
      registeredAt: new Date().toISOString(),
    };
    this.patients.unshift(newPatient);

    this.logAudit({
      actorUserId: 'system',
      actorRole: 'NURSE',
      actorName: 'Patient Intake Service',
      action: 'PATIENT_REGISTERED',
      targetEntity: 'Patient',
      targetId: id,
      details: `Registered patient ${newPatient.fullName} (${identifier})`,
      ipAddress: '127.0.0.1',
    });

    // Optionally generate queue entry
    let queueEntry: QueueEntry | undefined;
    if (options?.hospitalId) {
      const nextTokenNum = `T-${String(this.queueEntries.length + 1).padStart(2, '0')}`;
      queueEntry = {
        id: `q-${Date.now()}`,
        visitId: `vis-${Date.now()}`,
        patientId: id,
        patientName: newPatient.fullName,
        patientAge: newPatient.age,
        patientGender: newPatient.gender,
        tokenNumber: nextTokenNum,
        hospitalId: options.hospitalId,
        hospitalName: options.hospitalName || "NIMS Hospital, Hyderabad",
        departmentId: options.departmentId || 'dept-gen-med',
        departmentName: options.departmentName || 'General Medicine OPD',
        registeredAt: new Date().toISOString(),
        urgency: 'STANDARD',
        status: 'AWAITING_TRIAGE',
        priorityScore: 500,
        estimatedWaitMinutes: 25,
        arrivalOrder: this.queueEntries.length + 1,
        chiefComplaint: options.chiefComplaint || 'General clinical review',
        reassessmentDue: false,
        staffAlertAcknowledged: false,
        lastUpdatedAt: new Date().toISOString(),
      };
      this.queueEntries.push(queueEntry);
      this.recalculateQueuePriorities();
      this.notifyQueueUpdate();
    }

    return { patient: newPatient, queueEntry };
  }

  // --- Triage & Urgency Support ---
  public getTriageAssessments(): TriageAssessment[] {
    return [...this.triageAssessments];
  }

  public getTriageAssessmentByVisitId(visitId: string): TriageAssessment | undefined {
    return this.triageAssessments.find((t) => t.visitId === visitId);
  }

  public createTriageAssessment(
    assessmentData: Omit<TriageAssessment, 'id' | 'assessedAt'>,
    clinicianUser: { id: string; name: string; role: UserRole }
  ): TriageAssessment {
    const id = `tri-${Date.now()}`;
    const assessment: TriageAssessment = {
      ...assessmentData,
      id,
      assessedAt: new Date().toISOString(),
      assessedBy: clinicianUser.name,
      assessedByRole: clinicianUser.role,
    };
    this.triageAssessments.unshift(assessment);

    // Update corresponding queue entry
    const qIndex = this.queueEntries.findIndex((q) => q.visitId === assessment.visitId || q.patientId === assessment.patientId);
    if (qIndex !== -1) {
      const q = this.queueEntries[qIndex];
      q.urgency = assessment.urgency;
      q.triageAssessmentId = id;
      q.status = 'TRIAGE_COMPLETED';
      q.lastUpdatedAt = new Date().toISOString();
      if (assessment.overrideApplied && assessment.overrideReason) {
        q.overrideReason = assessment.overrideReason;
      }
      this.recalculateQueuePriorities();
      this.notifyQueueUpdate();
    }

    this.logAudit({
      actorUserId: clinicianUser.id,
      actorRole: clinicianUser.role,
      actorName: clinicianUser.name,
      action: assessment.overrideApplied ? 'TRIAGE_OVERRIDE_RECORDED' : 'TRIAGE_ASSESSMENT_RECORDED',
      targetEntity: 'TriageAssessment',
      targetId: id,
      details: `Assigned urgency ${assessment.urgency} for visit ${assessment.visitId}. Reason/Notes: ${assessment.clinicalNotes}`,
      ipAddress: '127.0.0.1',
    });

    return assessment;
  }

  // --- Dynamic Queue & Flow Management ---
  public getQueueEntries(departmentId?: string): QueueEntry[] {
    let list = [...this.queueEntries];
    if (departmentId && departmentId !== 'ALL') {
      list = list.filter((q) => q.departmentId === departmentId);
    }
    // Sort primarily by priorityScore descending, then arrivalOrder ascending
    return list.sort((a, b) => {
      // In consultation active cases stay prominent
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

  public updateQueueStatus(
    queueId: string,
    newStatus: QueueWorkflowStatus,
    clinicianUser: { id: string; name: string; role: UserRole },
    notes?: string
  ): QueueEntry | undefined {
    const entry = this.queueEntries.find((q) => q.id === queueId);
    if (!entry) return undefined;

    const oldStatus = entry.status;
    entry.status = newStatus;
    entry.lastUpdatedAt = new Date().toISOString();

    if (newStatus === 'IN_CONSULTATION' && !entry.consultationStartedAt) {
      entry.consultationStartedAt = new Date().toISOString();
      entry.assignedDoctorId = clinicianUser.id;
      entry.assignedDoctorName = clinicianUser.name;
    } else if (['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(newStatus)) {
      entry.consultationCompletedAt = new Date().toISOString();
      if (notes) entry.dispositionNotes = notes;
    }

    this.recalculateQueuePriorities();
    this.notifyQueueUpdate();

    this.logAudit({
      actorUserId: clinicianUser.id,
      actorRole: clinicianUser.role,
      actorName: clinicianUser.name,
      action: 'QUEUE_STATUS_TRANSITION',
      targetEntity: 'QueueEntry',
      targetId: queueId,
      details: `Transitioned status from ${oldStatus} to ${newStatus} for Token ${entry.tokenNumber}`,
      ipAddress: '127.0.0.1',
    });

    return entry;
  }

  public overrideQueuePriority(
    queueId: string,
    newUrgency: TriageUrgency,
    reason: string,
    clinicianUser: { id: string; name: string; role: UserRole }
  ): QueueEntry | undefined {
    const entry = this.queueEntries.find((q) => q.id === queueId);
    if (!entry) return undefined;

    const oldUrgency = entry.urgency;
    entry.urgency = newUrgency;
    entry.overrideReason = reason;
    entry.lastUpdatedAt = new Date().toISOString();

    this.recalculateQueuePriorities();
    this.notifyQueueUpdate();

    this.logAudit({
      actorUserId: clinicianUser.id,
      actorRole: clinicianUser.role,
      actorName: clinicianUser.name,
      action: 'QUEUE_PRIORITY_MANUAL_OVERRIDE',
      targetEntity: 'QueueEntry',
      targetId: queueId,
      details: `Clinician override from ${oldUrgency} to ${newUrgency} for Token ${entry.tokenNumber}. Mandatory Rationale: ${reason}`,
      ipAddress: '127.0.0.1',
    });

    return entry;
  }

  public acknowledgeStaffAlert(queueId: string): void {
    const entry = this.queueEntries.find((q) => q.id === queueId);
    if (entry) {
      entry.staffAlertAcknowledged = true;
      entry.reassessmentDue = false;
      this.notifyQueueUpdate();
    }
  }

  private recalculateQueuePriorities(): void {
    let waitAccumulator = 0;
    this.queueEntries.forEach((q) => {
      // Base score on triage urgency
      let base = 200;
      if (q.urgency === 'IMMEDIATE') base = 950;
      else if (q.urgency === 'URGENT') base = 750;
      else if (q.urgency === 'STANDARD') base = 450;
      else if (q.urgency === 'NON_URGENT') base = 150;

      // Small adjustment for waiting seniority within same tier
      const arrivalBonus = Math.max(0, 50 - q.arrivalOrder * 2);
      q.priorityScore = base + arrivalBonus;

      // Calculate approximate estimated waiting time
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

  // --- Hospitals & Reviews ---
  public getHospitals(): Hospital[] {
    return [...this.hospitals];
  }

  public getHospitalById(id: string): Hospital | undefined {
    return this.hospitals.find((h) => h.id === id);
  }

  public getReviewsForHospital(hospitalId: string): HospitalReview[] {
    return this.reviews.filter((r) => r.hospitalId === hospitalId && r.status === 'PUBLISHED');
  }

  public addReview(
    reviewData: Omit<HospitalReview, 'id' | 'createdAt' | 'status'>
  ): HospitalReview {
    const review: HospitalReview = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'PUBLISHED',
    };
    this.reviews.unshift(review);

    // Recalculate hospital rating
    const hospReviews = this.reviews.filter((r) => r.hospitalId === review.hospitalId);
    const avg = hospReviews.reduce((acc, r) => acc + r.overallRating, 0) / hospReviews.length;
    const hosp = this.hospitals.find((h) => h.id === review.hospitalId);
    if (hosp) {
      hosp.rating = parseFloat(avg.toFixed(1));
      hosp.reviewCount = hospReviews.length;
    }

    return review;
  }

  public updateHospitalVerification(
    hospitalId: string,
    status: Hospital['verificationStatus'],
    actor: { id: string; name: string; role: UserRole }
  ): Hospital | undefined {
    const hosp = this.hospitals.find((h) => h.id === hospitalId);
    if (hosp) {
      hosp.verificationStatus = status;
      if (status === 'VERIFIED') {
        hosp.lastVerifiedDate = new Date().toISOString().split('T')[0];
      }
      this.logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'HOSPITAL_VERIFICATION_STATUS_UPDATED',
        targetEntity: 'Hospital',
        targetId: hospitalId,
        details: `Updated hospital ${hosp.name} verification status to ${status}`,
        ipAddress: '127.0.0.1',
      });
    }
    return hosp;
  }

  public updateHospitalInsurance(
    hospitalId: string,
    insuranceData: HospitalInsuranceData,
    actor: { id: string; name: string; role: UserRole }
  ): Hospital | undefined {
    const hosp = this.hospitals.find((h) => h.id === hospitalId);
    if (hosp) {
      hosp.insuranceData = insuranceData;
      if (insuranceData.overallStatus === 'VERIFIED') {
        hosp.lastVerifiedDate = insuranceData.lastUpdatedDate || new Date().toISOString().split('T')[0];
      }
      this.logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'HOSPITAL_INSURANCE_DATA_UPDATED',
        targetEntity: 'Hospital',
        targetId: hospitalId,
        details: `Updated hospital ${hosp.name} insurance empanelment status to ${insuranceData.overallStatus} with ${insuranceData.providers.length} provider policies`,
        ipAddress: '127.0.0.1',
      });
    }
    return hosp;
  }

  // --- Specialized Disease Care ---
  public getDiseaseConditions(): DiseaseConditionInfo[] {
    return [...this.diseaseConditions];
  }

  public getDiseaseConditionById(id: string): DiseaseConditionInfo | undefined {
    return this.diseaseConditions.find((d) => d.id === id);
  }

  // --- Blood Network ---
  public getBloodDonors(): BloodDonor[] {
    return [...this.bloodDonors];
  }

  public getBloodRequests(): BloodRequest[] {
    return [...this.bloodRequests];
  }

  public updateDonorAvailability(
    donorId: string,
    isAvailable: boolean,
    expiryDays: number = 7
  ): BloodDonor | undefined {
    const donor = this.bloodDonors.find((d) => d.id === donorId);
    if (donor) {
      donor.isAvailable = isAvailable;
      donor.lastConfirmedAt = new Date().toISOString();
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expiryDays);
      donor.availabilityExpiry = expDate.toISOString();

      this.logAudit({
        actorUserId: donor.userId || donorId,
        actorRole: 'DONOR',
        actorName: donor.displayName,
        action: 'DONOR_AVAILABILITY_TOGGLED',
        targetEntity: 'BloodDonor',
        targetId: donorId,
        details: `Donor set availability to ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}, valid until ${donor.availabilityExpiry}`,
        ipAddress: '127.0.0.1',
      });
    }
    return donor;
  }

  public createBloodRequest(
    requestData: Omit<BloodRequest, 'id' | 'requestIdentifier' | 'createdAt' | 'status' | 'matchedDonorCount'>
  ): BloodRequest {
    const id = `br-${Date.now()}`;
    const requestIdentifier = `MART-BR-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Calculate matched compatible donors
    const matchedCount = this.findCompatibleDonors(requestData.bloodGroup, requestData.city).length;

    const request: BloodRequest = {
      ...requestData,
      id,
      requestIdentifier,
      status: 'OPEN',
      matchedDonorCount: matchedCount,
      createdAt: new Date().toISOString(),
    };
    this.bloodRequests.unshift(request);

    this.logAudit({
      actorUserId: 'system',
      actorRole: 'BLOOD_COORDINATOR',
      actorName: 'Blood Request Dispatch',
      action: 'BLOOD_REQUEST_CREATED',
      targetEntity: 'BloodRequest',
      targetId: id,
      details: `Created blood request ${requestIdentifier} for ${request.unitsNeeded} units of ${request.bloodGroup} at ${request.hospitalName}`,
      ipAddress: '127.0.0.1',
    });

    return request;
  }

  public updateBloodRequestStatus(
    requestId: string,
    status: BloodRequest['status'],
    actor: { id: string; name: string; role: UserRole },
    acceptedDonorName?: string,
    fulfillmentNotes?: string
  ): BloodRequest | undefined {
    const req = this.bloodRequests.find((r) => r.id === requestId);
    if (req) {
      req.status = status;
      if (acceptedDonorName) {
        req.acceptedDonorName = acceptedDonorName;
        req.acceptedAt = new Date().toISOString();
      }
      if (fulfillmentNotes) req.fulfillmentNotes = fulfillmentNotes;

      this.logAudit({
        actorUserId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'BLOOD_REQUEST_STATUS_UPDATED',
        targetEntity: 'BloodRequest',
        targetId: requestId,
        details: `Updated request ${req.requestIdentifier} to status ${status}. Notes: ${fulfillmentNotes || 'N/A'}`,
        ipAddress: '127.0.0.1',
      });
    }
    return req;
  }

  public findCompatibleDonors(recipientGroup: BloodGroup, city?: string): BloodDonor[] {
    // Standard red blood cell compatibility guidelines:
    // O- can donate to all
    // O+ can donate to O+, A+, B+, AB+
    // A- can donate to A-, A+, AB-, AB+
    // A+ can donate to A+, AB+
    // B- can donate to B-, B+, AB-, AB+
    // B+ can donate to B+, AB+
    // AB- can donate to AB-, AB+
    // AB+ can donate to AB+ only
    const compatibilityMap: Record<BloodGroup, BloodGroup[]> = {
      'O-': ['O-'],
      'O+': ['O-', 'O+'],
      'A-': ['O-', 'A-'],
      'A+': ['O-', 'O+', 'A-', 'A+'],
      'B-': ['O-', 'B-'],
      'B+': ['O-', 'O+', 'B-', 'B+'],
      'AB-': ['O-', 'A-', 'B-', 'AB-'],
      'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    };

    const compatibleDonorGroups = compatibilityMap[recipientGroup] || [];

    return this.bloodDonors.filter((donor) => {
      const isComp = compatibleDonorGroups.includes(donor.bloodGroup);
      const isCity = !city || donor.city.toLowerCase() === city.toLowerCase();
      return isComp && donor.isAvailable && isCity;
    });
  }

  // --- Health Measurements ---
  public getHealthMeasurements(patientId?: string): HealthMeasurement[] {
    if (patientId) {
      return this.healthMeasurements.filter((m) => m.patientId === patientId);
    }
    return [...this.healthMeasurements];
  }

  public addHealthMeasurement(
    data: Omit<HealthMeasurement, 'id' | 'timestamp'>
  ): HealthMeasurement {
    const measurement: HealthMeasurement = {
      ...data,
      id: `hm-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    this.healthMeasurements.unshift(measurement);
    return measurement;
  }

  // --- Medications & Adherence ---
  public getMedications(patientId?: string): Medication[] {
    if (patientId) {
      return this.medications.filter((m) => m.patientId === patientId);
    }
    return [...this.medications];
  }

  public addMedication(data: Omit<Medication, 'id' | 'adherencePercentage'>): Medication {
    const med: Medication = {
      ...data,
      id: `med-${Date.now()}`,
      adherencePercentage: 100,
    };
    this.medications.unshift(med);
    return med;
  }

  public logAdherence(
    medicationId: string,
    patientId: string,
    timeSlot: MedicationAdherenceLog['timeSlot'],
    status: MedicationAdherenceLog['status'],
    reason?: string
  ): MedicationAdherenceLog {
    const log: MedicationAdherenceLog = {
      id: `adh-${Date.now()}`,
      medicationId,
      patientId,
      date: new Date().toISOString().split('T')[0],
      timeSlot,
      status,
      recordedAt: new Date().toISOString(),
      reason,
    };
    this.adherenceLogs.unshift(log);

    // Recalculate adherence for that medication
    const logs = this.adherenceLogs.filter((l) => l.medicationId === medicationId);
    const taken = logs.filter((l) => l.status === 'TAKEN').length;
    const med = this.medications.find((m) => m.id === medicationId);
    if (med && logs.length > 0) {
      med.adherencePercentage = Math.round((taken / logs.length) * 100);
    }

    return log;
  }

  public getAdherenceLogs(patientId?: string): MedicationAdherenceLog[] {
    if (patientId) {
      return this.adherenceLogs.filter((l) => l.patientId === patientId);
    }
    return [...this.adherenceLogs];
  }

  // --- Appointments ---
  public getAppointments(patientId?: string): Appointment[] {
    if (patientId) {
      return this.appointments.filter((a) => a.patientId === patientId);
    }
    return [...this.appointments];
  }

  public bookAppointment(data: Omit<Appointment, 'id' | 'status'>): Appointment {
    // Check double-booking
    const exists = this.appointments.some(
      (a) =>
        a.hospitalId === data.hospitalId &&
        a.doctorName === data.doctorName &&
        a.dateTime === data.dateTime &&
        a.status !== 'CANCELLED'
    );
    if (exists) {
      throw new Error('This time slot is already booked for Dr. ' + data.doctorName + '. Please select another slot.');
    }

    const appt: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      status: 'CONFIRMED',
    };
    this.appointments.unshift(appt);
    return appt;
  }

  // --- Prescriptions ---
  public getPrescriptions(patientId?: string): DigitalPrescription[] {
    if (patientId) {
      return this.prescriptions.filter((p) => p.patientId === patientId);
    }
    return [...this.prescriptions];
  }

  public createPrescription(
    data: Omit<DigitalPrescription, 'id' | 'rxNumber' | 'issueDate' | 'signatureHash' | 'isPrintable'>,
    clinicianUser: { id: string; name: string; role: UserRole }
  ): DigitalPrescription {
    const id = `rx-${Date.now()}`;
    const rxNumber = `MART-RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rx: DigitalPrescription = {
      ...data,
      id,
      rxNumber,
      issueDate: new Date().toISOString().split('T')[0],
      signatureHash: `sha256-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      isPrintable: true,
    };
    this.prescriptions.unshift(rx);

    this.logAudit({
      actorUserId: clinicianUser.id,
      actorRole: clinicianUser.role,
      actorName: clinicianUser.name,
      action: 'DIGITAL_PRESCRIPTION_ISSUED',
      targetEntity: 'DigitalPrescription',
      targetId: id,
      details: `Issued Rx ${rxNumber} for patient ${rx.patientName} (${rx.items.length} medications)`,
      ipAddress: '127.0.0.1',
    });

    return rx;
  }

  // --- Invoices & Billing ---
  public getInvoices(patientId?: string): Invoice[] {
    if (patientId) {
      return this.invoices.filter((i) => i.patientId === patientId);
    }
    return [...this.invoices];
  }

  public payInvoice(invoiceId: string, paymentMethod: Invoice['paymentMethod']): Invoice | undefined {
    const inv = this.invoices.find((i) => i.id === invoiceId);
    if (inv) {
      inv.status = 'PAID';
      inv.paymentMethod = paymentMethod;
      inv.transactionReference = `MART/PAY/${Date.now()}/${Math.floor(1000 + Math.random() * 9000)}`;

      this.logAudit({
        actorUserId: inv.patientId,
        actorRole: 'PATIENT',
        actorName: inv.patientName,
        action: 'INVOICE_SETTLED_SIMULATED',
        targetEntity: 'Invoice',
        targetId: invoiceId,
        details: `Settled payment of ₹${inv.patientPayableAmount} via ${paymentMethod}. Ref: ${inv.transactionReference}`,
        ipAddress: '127.0.0.1',
      });
    }
    return inv;
  }

  // --- Operational Analytics ---
  public getOperationalStats() {
    const totalPatients = this.patients.length;
    const queueWaiting = this.queueEntries.filter(
      (q) => !['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(q.status)
    ).length;
    const immediateCases = this.queueEntries.filter(
      (q) => q.urgency === 'IMMEDIATE' && !['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(q.status)
    ).length;
    const urgentCases = this.queueEntries.filter(
      (q) => q.urgency === 'URGENT' && !['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(q.status)
    ).length;
    const inConsultation = this.queueEntries.filter((q) => q.status === 'IN_CONSULTATION').length;
    const availableDonors = this.bloodDonors.filter((d) => d.isAvailable).length;
    const openBloodRequests = this.bloodRequests.filter(
      (b) => !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(b.status)
    ).length;

    // Average wait time
    const waitTimes = this.queueEntries
      .filter((q) => !['COMPLETED', 'DISCHARGED', 'REFERRED'].includes(q.status))
      .map((q) => q.estimatedWaitMinutes);
    const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;

    return {
      totalPatients,
      queueWaiting,
      immediateCases,
      urgentCases,
      inConsultation,
      availableDonors,
      openBloodRequests,
      avgWaitMinutes: avgWait,
      hospitalsCount: this.hospitals.length,
      verifiedHospitals: this.hospitals.filter((h) => h.verificationStatus === 'VERIFIED').length,
    };
  }

  // --- HL7 FHIR R4 Export Format ---
  public exportFHIRPatientBundle(patientId: string) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;

    const vitals = this.getHealthMeasurements(patient.id);
    const meds = this.getMedications(patient.id);

    return {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: patient.id,
            identifier: [
              {
                system: 'https://marthealth.org/patients',
                value: patient.identifier,
              },
            ],
            name: [{ text: patient.fullName }],
            telecom: [{ system: 'phone', value: patient.phone }],
            gender: patient.gender.toLowerCase(),
            birthDate: patient.dateOfBirth,
            address: [{ city: patient.city, text: patient.address }],
          },
        },
        ...vitals.map((v) => ({
          resource: {
            resourceType: 'Observation',
            id: v.id,
            status: 'final',
            category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs' }] }],
            code: { text: v.type },
            subject: { reference: `Patient/${patient.id}` },
            effectiveDateTime: v.timestamp,
            valueQuantity: {
              value: v.value,
              unit: v.unit,
            },
          },
        })),
        ...meds.map((m) => ({
          resource: {
            resourceType: 'MedicationRequest',
            id: m.id,
            status: m.status.toLowerCase(),
            intent: 'order',
            medicationCodeableConcept: { text: m.name },
            subject: { reference: `Patient/${patient.id}` },
            authoredOn: m.startDate,
            dosageInstruction: [{ text: `${m.dosage} - ${m.frequency}` }],
          },
        })),
      ],
    };
  }
}

export const martStore = new MartHealthStore();

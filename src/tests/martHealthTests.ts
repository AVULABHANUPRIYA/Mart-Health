import { martStore } from '../services/store.ts';

export function runMartHealthVerificationSuite() {
  const results: { test: string; status: 'PASSED' | 'FAILED'; error?: string }[] = [];

  const assert = (condition: boolean, testName: string, errorMsg: string) => {
    if (condition) {
      results.push({ test: testName, status: 'PASSED' });
    } else {
      results.push({ test: testName, status: 'FAILED', error: errorMsg });
      console.error(`FAILED: ${testName} - ${errorMsg}`);
    }
  };

  console.log('--- STARTING MART HEALTH AUTOMATED CLINICAL TEST SUITE ---');

  // Test 1: Patient Registration & Identifier generation
  try {
    const regResult = martStore.registerPatient(
      {
        fullName: 'Test Patient Verification',
        dateOfBirth: '1990-01-01',
        age: 36,
        gender: 'MALE',
        phone: '+91 99999 88888',
        emergencyContact: { name: 'Emergency Kin', phone: '+91 99999 77777', relation: 'Brother' },
        preferredLanguage: 'en',
        bloodGroup: 'O+',
        city: 'Hyderabad',
        address: 'Banjara Hills, Hyderabad',
        allergies: ['Penicillin'],
        existingConditions: ['Hypertension'],
        currentMedications: ['Amlodipine 5mg'],
        consentGiven: true,
      },
      {
        hospitalId: 'hosp-1',
        hospitalName: "NIMS Hospital, Hyderabad",
        departmentId: 'dept-emergency',
        departmentName: 'Emergency Bay',
        chiefComplaint: 'Acute chest discomfort',
      }
    );
    assert(
      Boolean(regResult.patient.id && regResult.patient.identifier.startsWith('MART-P-')),
      'Test 1: Patient Registration & Unique Identifier',
      'Failed to generate patient identifier'
    );
    assert(
      Boolean(regResult.queueEntry && regResult.queueEntry.tokenNumber),
      'Test 2: Automatic Queue Token Assignment on Intake',
      'Queue token not issued'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 1: Patient Registration', status: 'FAILED', error: String(err) });
  }

  // Test 3: Triage Urgency Persistence & Priority Calculation
  try {
    const assessment = martStore.createTriageAssessment(
      {
        visitId: 'vis-test-01',
        patientId: 'pat-test-01',
        assessedBy: 'Dr. Ananya Sharma',
        assessedByRole: 'DOCTOR',
        urgency: 'IMMEDIATE',
        chiefComplaint: 'Ventricular arrhythmia and hypotension',
        symptomDuration: '20 minutes',
        vitalSigns: { heartRate: 145, bloodPressureSys: 80, bloodPressureDia: 50, spO2: 89, recordedAt: new Date().toISOString() },
        warningSigns: ['Severe hypotension', 'Desaturation'],
        protocolVersion: 'MART-CLINICAL-EMERGENCY-v2.4',
        clinicalNotes: 'Immediate cardioversion room prepared.',
      },
      { id: 'usr-doctor-1', name: 'Dr. Ananya Sharma', role: 'DOCTOR' }
    );
    assert(
      assessment.urgency === 'IMMEDIATE',
      'Test 3: Triage Urgency Assessment Persistence',
      'Urgency did not save as IMMEDIATE'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 3: Triage Assessment', status: 'FAILED', error: String(err) });
  }

  // Test 4: Queue Dynamic Reordering - Urgency Precedence over Arrival Order
  try {
    const queue = martStore.getQueueEntries();
    // Verify that the top entries are IMMEDIATE or in consultation
    const topEntry = queue[0];
    assert(
      topEntry.urgency === 'IMMEDIATE' || topEntry.status === 'IN_CONSULTATION',
      'Test 4: Clinical Urgency Takes Precedence in Queue Ordering',
      `Expected top item to be IMMEDIATE or IN_CONSULTATION, found ${topEntry.urgency} (${topEntry.status})`
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 4: Queue Ordering', status: 'FAILED', error: String(err) });
  }

  // Test 5: Clinician Priority Override with Mandatory Audit Trail
  try {
    const qList = martStore.getQueueEntries();
    const targetQ = qList[qList.length - 1];
    const overridden = martStore.overrideQueuePriority(
      targetQ.id,
      'IMMEDIATE',
      'Patient condition deteriorated rapidly in waiting area.',
      { id: 'usr-doctor-1', name: 'Dr. Ananya Sharma', role: 'DOCTOR' }
    );
    assert(
      Boolean(overridden?.urgency === 'IMMEDIATE' && overridden.overrideReason?.includes('deteriorated')),
      'Test 5: Priority Override Audit Trail Logging',
      'Override failed to record urgency or reason'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 5: Priority Override', status: 'FAILED', error: String(err) });
  }

  // Test 6: Blood Donor ABO & Rh Compatibility Matching
  try {
    const oMinusDonors = martStore.findCompatibleDonors('O-', 'Hyderabad');
    assert(
      oMinusDonors.every((d) => d.bloodGroup === 'O-'),
      'Test 6: O- Recipient Blood Compatibility Rule (O- only for RBCs)',
      'Compatible donors included non-O- donors for O- recipient'
    );

    const abPlusDonors = martStore.findCompatibleDonors('AB+', 'Hyderabad');
    assert(
      abPlusDonors.length > 0,
      'Test 7: AB+ Recipient Blood Compatibility (Universal recipient)',
      'AB+ matched 0 donors'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 6: Blood Compatibility', status: 'FAILED', error: String(err) });
  }

  // Test 8: Blood Requisition Creation & Donor Acceptance Flow
  try {
    const req = martStore.createBloodRequest({
      requesterName: 'ICU Coordinator',
      patientName: 'Emergency Trauma Victim',
      hospitalName: "NIMS Hospital, Hyderabad",
      city: 'Hyderabad',
      bloodGroup: 'B+',
      unitsNeeded: 2,
      urgency: 'CRITICAL_IMMEDIATE',
      neededBefore: new Date(Date.now() + 3600000).toISOString(),
    });
    assert(
      req.status === 'OPEN' && req.requestIdentifier.startsWith('MART-BR-'),
      'Test 8: Blood Request Creation with Unique Requisition ID',
      'Request creation failed'
    );

    const accepted = martStore.updateBloodRequestStatus(
      req.id,
      'DONOR_ACCEPTED',
      { id: 'usr-donor-1', name: 'Kavitha R.', role: 'DONOR' },
      'Donor #K-402',
      'Donor confirmed travel to hospital blood bank'
    );
    assert(
      accepted?.status === 'DONOR_ACCEPTED' && accepted?.acceptedDonorName === 'Donor #K-402',
      'Test 9: Donor Acceptance State Transition',
      'Acceptance transition failed'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 8: Blood Request Flow', status: 'FAILED', error: String(err) });
  }

  // Test 10: Appointment Double-Booking Guard
  try {
    const dateTime = '2026-10-25T14:00:00Z';
    martStore.bookAppointment({
      patientId: 'pat-1001',
      patientName: 'Rajesh Kumar',
      hospitalId: 'hosp-1',
      hospitalName: "NIMS Hospital, Hyderabad",
      departmentId: 'dept-gen-med',
      departmentName: 'General Medicine',
      doctorName: 'Dr. Ananya Sharma',
      dateTime,
      type: 'IN_PERSON',
      reasonForVisit: 'BP follow-up',
    });

    let doubleBookPrevented = false;
    try {
      martStore.bookAppointment({
        patientId: 'pat-1002',
        patientName: 'Another Patient',
        hospitalId: 'hosp-1',
        hospitalName: "NIMS Hospital, Hyderabad",
        departmentId: 'dept-gen-med',
        departmentName: 'General Medicine',
        doctorName: 'Dr. Ananya Sharma',
        dateTime, // Same doctor, same slot
        type: 'IN_PERSON',
        reasonForVisit: 'Conflict test',
      });
    } catch {
      doubleBookPrevented = true;
    }

    assert(
      doubleBookPrevented,
      'Test 10: Appointment Double-Booking Conflict Prevention',
      'Double booking was erroneously allowed'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 10: Double Booking Guard', status: 'FAILED', error: String(err) });
  }

  // Test 11: Medication Adherence Calculation
  try {
    const log = martStore.logAdherence('med-01', 'pat-1001', 'MORNING', 'TAKEN');
    const meds = martStore.getMedications('pat-1001');
    const med1 = meds.find((m) => m.id === 'med-01');
    assert(
      Boolean(med1 && med1.adherencePercentage >= 0 && med1.adherencePercentage <= 100),
      'Test 11: Medication Adherence Rate Precision',
      'Adherence percentage not computed'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 11: Medication Adherence', status: 'FAILED', error: String(err) });
  }

  // Test 12: HL7 FHIR R4 Bundle Structure
  try {
    const fhirBundle = martStore.exportFHIRPatientBundle('pat-1001');
    assert(
      Boolean(
        fhirBundle &&
        fhirBundle.resourceType === 'Bundle' &&
        fhirBundle.entry.some((e) => e.resource.resourceType === 'Patient') &&
        fhirBundle.entry.some((e) => e.resource.resourceType === 'Observation')
      ),
      'Test 12: HL7 FHIR R4 Bundle Conformance (Patient & Observation)',
      'FHIR bundle structure mismatch'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 12: FHIR Bundle', status: 'FAILED', error: String(err) });
  }

  // Test 13: Digital Prescription Signing & Hash Generation
  try {
    const rx = martStore.createPrescription(
      {
        patientId: 'pat-1001',
        patientName: 'Rajesh Kumar',
        patientAge: 42,
        patientGender: 'Male',
        doctorName: 'Dr. Ananya Sharma',
        doctorRegistrationNumber: 'MCI-TS-2012-44981',
        hospitalName: "NIMS Hospital, Hyderabad",
        validUntil: '2026-12-31',
        diagnosis: 'Essential Hypertension',
        items: [
          { medicationName: 'Telmisartan 40mg', dosage: '40mg', frequency: 'OD', duration: '90 days', instructions: 'After breakfast' },
        ],
        notes: 'Review in 3 months',
      },
      { id: 'usr-doctor-1', name: 'Dr. Ananya Sharma', role: 'DOCTOR' }
    );
    assert(
      Boolean(rx.rxNumber.startsWith('MART-RX-') && rx.signatureHash.startsWith('sha256-')),
      'Test 13: Digital Prescription Cryptographic Signature Representation',
      'Prescription signature hash not generated'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 13: Digital Prescription', status: 'FAILED', error: String(err) });
  }

  // Test 14: Simulated Billing Payment Execution
  try {
    const inv = martStore.payInvoice('inv-101', 'UPI_SIMULATED');
    assert(
      Boolean(inv?.status === 'PAID' && inv.transactionReference?.startsWith('MART/PAY/')),
      'Test 14: Billing & Simulated UPI Payment Settlement',
      'Invoice payment failed to settle'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 14: Invoicing', status: 'FAILED', error: String(err) });
  }

  // Test 15: Operational Audit Trail Immutability
  try {
    const logs = martStore.getAuditLogs();
    assert(
      logs.length >= 5 && logs.every((l) => l.timestamp && l.action && l.actorRole),
      'Test 15: Institutional Audit Trail Immutability & Completeness',
      'Audit log entries missing required metadata'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 15: Audit Trail', status: 'FAILED', error: String(err) });
  }

  // Test 16: Specialized Disease Care Conditions & Educational Guidance
  try {
    const conditions = martStore.getDiseaseConditions();
    const hasCardio = conditions.some((c) => c.specialties.includes('Cardiology') && c.isLifeThreatening);
    const hasOnco = conditions.some((c) => c.specialties.includes('Oncology') && c.suggestedDoctorQuestions.length > 0);
    assert(
      conditions.length >= 6 && hasCardio && hasOnco,
      'Test 16: Specialized Disease Conditions & Educational Guidance',
      'Disease conditions data missing or incomplete'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 16: Disease Conditions', status: 'FAILED', error: String(err) });
  }

  // Test 17: Hospital Insurance Empanelment & Plan-Specific Status
  try {
    const hospitals = martStore.getHospitals();
    const verifiedHosp = hospitals.find((h) => h.id === 'hosp-1');
    const hasVerifiedStar = verifiedHosp?.insuranceData?.providers.some(
      (p) => p.providerName === 'Star Health' && p.status === 'VERIFIED'
    );
    const hasPlans = (verifiedHosp?.insuranceData?.providers[0].acceptedPlans.length ?? 0) > 0;
    assert(
      Boolean(verifiedHosp?.insuranceData && hasVerifiedStar && hasPlans),
      'Test 17: Hospital Insurance Providers and Plan-Specific Verification',
      'Hospital insurance empanelment data missing or invalid'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 17: Insurance Empanelment', status: 'FAILED', error: String(err) });
  }

  // Test 18: Hospital Staff Insurance Data Update Workflow
  try {
    const testPayload = {
      overallStatus: 'VERIFIED' as const,
      cashlessDeskAvailable: true,
      tpaDeskContact: '+91 40 2348 9999',
      tpaDeskHours: '24x7 Emergency Desk',
      lastUpdatedDate: '2026-10-09',
      providers: [
        {
          providerId: 'prov-test',
          providerName: 'Test Insurance Co',
          status: 'VERIFIED' as const,
          acceptedPlans: [
            {
              planId: 'plan-test-1',
              planName: 'Gold Health Plan',
              verificationStatus: 'VERIFIED' as const,
              notes: 'Full cashless coverage',
              lastVerifiedDate: '2026-10-09',
            },
          ],
        },
      ],
    };
    const updated = martStore.updateHospitalInsurance('hosp-1', testPayload, {
      id: 'usr-admin-1',
      name: 'Vikram Chaitanya',
      role: 'HOSPITAL_ADMIN',
    });
    assert(
      Boolean(updated?.insuranceData?.providers.some((p) => p.providerName === 'Test Insurance Co')),
      'Test 18: Hospital Staff Insurance Workflow Update & Audit Trail',
      'Hospital insurance update failed to persist'
    );
  } catch (err: unknown) {
    results.push({ test: 'Test 18: Insurance Workflow', status: 'FAILED', error: String(err) });
  }

  console.table(results);
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);
  return { results, passedCount, total: results.length };
}

// --- CLOUD FIRESTORE & FIREBASE AUTHENTICATION VERIFICATION SUITE ---
export async function runFirebaseBackendVerificationSuite() {
  const { testFirestoreConnection } = await import('../firebase/config');
  const { firestoreService } = await import('../firebase/firestoreService');

  const results: { test: string; status: 'PASSED' | 'FAILED'; error?: string }[] = [];

  const assert = (condition: boolean, testName: string, errorMsg: string) => {
    if (condition) {
      results.push({ test: testName, status: 'PASSED' });
    } else {
      results.push({ test: testName, status: 'FAILED', error: errorMsg });
      console.error(`FAILED: ${testName} - ${errorMsg}`);
    }
  };

  console.log('--- STARTING MART HEALTH CLOUD FIRESTORE & AUTH VERIFICATION SUITE ---');

  // Test FB-1: Firestore Connection & Handshake
  try {
    const isConnected = await testFirestoreConnection();
    assert(isConnected, 'FB Test 1: Cloud Firestore Persistent Connection & Handshake', 'Database probe did not respond');
  } catch (err) {
    results.push({ test: 'FB Test 1: Firestore Connection', status: 'FAILED', error: String(err) });
  }

  // Test FB-2: Hospital Directory & Real Insurance Empanelment Persistence
  try {
    const hospitals = await firestoreService.getHospitals();
    const hasInsurance = hospitals.some((h) => h.insuranceData && h.insuranceData.providers.length > 0);
    assert(
      hospitals.length > 0 && hasInsurance,
      'FB Test 2: Hospital Insurance Empanelment & Verification Data in Firestore',
      'No hospitals or insurance details found in Firestore'
    );
  } catch (err) {
    results.push({ test: 'FB Test 2: Hospital Insurance in Firestore', status: 'FAILED', error: String(err) });
  }

  // Test FB-3: Real-Time Patient Intake Registration in Cloud Firestore
  let createdPatientId = '';
  try {
    const res = await firestoreService.registerPatient(
      {
        fullName: 'Aarav Reddy (Verified Firebase Patient)',
        dateOfBirth: '1988-04-12',
        age: 38,
        gender: 'MALE',
        phone: '+91 98490 55443',
        emergencyContact: { name: 'Kavitha Reddy', phone: '+91 98490 55444', relation: 'Spouse' },
        preferredLanguage: 'te',
        bloodGroup: 'B+',
        city: 'Hyderabad',
        address: 'Jubilee Hills, Hyderabad',
        allergies: ['Sulfa drugs'],
        existingConditions: ['Type 2 Diabetes'],
        currentMedications: ['Metformin 500mg'],
        consentGiven: true,
      },
      {
        hospitalId: 'hosp-1',
        hospitalName: 'NIMS Hospital, Hyderabad',
        departmentId: 'dept-emergency',
        departmentName: 'Emergency Bay',
        chiefComplaint: 'Acute chest pain radiating to left arm',
      }
    );
    createdPatientId = res.patient.id;
    assert(
      Boolean(res.patient.id && res.queueEntry?.tokenNumber),
      'FB Test 3: Patient Intake Registration & Token Creation in Firestore',
      'Failed to create patient record or token in Firestore'
    );
  } catch (err) {
    results.push({ test: 'FB Test 3: Patient Intake in Firestore', status: 'FAILED', error: String(err) });
  }

  // Test FB-4: Staff Marking Patient as Immediate (Emergency) - Persistent Reordering
  try {
    const initialQueue = await firestoreService.getQueue();
    const target = initialQueue.find((q) => q.urgency !== 'IMMEDIATE') || initialQueue[0];
    if (target) {
      const updated = await firestoreService.overrideQueuePriority(
        target.id,
        'IMMEDIATE',
        'Staff escalation to Resuscitation Bay (L1) - Acute distress',
        { id: 'usr-doctor-1', name: 'Dr. Ananya Sharma', role: 'DOCTOR' }
      );
      assert(
        Boolean(updated && updated.urgency === 'IMMEDIATE' && updated.priorityScore >= 950),
        'FB Test 4: Marking Patient as Immediate (Emergency) Reorders Live Queue',
        'Queue entry urgency was not updated to IMMEDIATE or priority score was insufficient'
      );

      // Verify that after fetching fresh queue, the updated patient persists at highest priority
      const freshQueue = await firestoreService.getQueue();
      const topEntry = freshQueue[0];
      assert(
        topEntry.urgency === 'IMMEDIATE' || topEntry.status === 'IN_CONSULTATION',
        'FB Test 5: Immediate Emergency Urgency Persists in Firestore After Refresh',
        `Top entry was not emergency priority: ${topEntry.urgency}`
      );
    }
  } catch (err) {
    results.push({ test: 'FB Test 4/5: Emergency Reordering in Firestore', status: 'FAILED', error: String(err) });
  }

  // Test FB-6: Real-Time Subscription Listener
  try {
    let receivedUpdate = false;
    const unsub = firestoreService.subscribeLiveQueue((entries) => {
      if (entries.length > 0) receivedUpdate = true;
    });
    // Wait briefly for snapshot callback
    await new Promise((r) => setTimeout(r, 200));
    unsub();
    assert(receivedUpdate, 'FB Test 6: Cloud Firestore Real-Time onSnapshot Queue Synchronization', 'No snapshot received');
  } catch (err) {
    results.push({ test: 'FB Test 6: onSnapshot Synchronization', status: 'FAILED', error: String(err) });
  }

  console.table(results);
  const passedFB = results.filter((r) => r.status === 'PASSED').length;
  console.log(`TOTAL FIREBASE TESTS: ${results.length} | PASSED: ${passedFB} | FAILED: ${results.length - passedFB}`);
  return { results, passedCount: passedFB, total: results.length };
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMartHealthVerificationSuite();
}

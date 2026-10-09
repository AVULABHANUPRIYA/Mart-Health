# Security Specification & Threat Model — MART Health Care OS

## 1. Data Invariants & Zero-Trust Policies
1. **Patient Privacy & PII Isolation**: Private medical records, prescriptions, health measurements, and invoices belonging to patient `P` can ONLY be accessed by patient `P` (where `patientId == request.auth.uid` or matching user identifier) or verified medical staff (`DOCTOR`, `NURSE`, `HOSPITAL_ADMIN`). Patients are strictly forbidden from accessing other patients' private medical data.
2. **Emergency Triage Integrity**: Only verified clinical staff (`DOCTOR` or `NURSE` or `HOSPITAL_ADMIN`) may alter triage urgency (`IMMEDIATE`, `URGENT`, `STANDARD`, `NON_URGENT`), modify priority scores, or register clinical override rationales on queue tokens. Patients cannot self-escalate their priority in the queue.
3. **Queue Reordering Authority**: Status transitions (e.g., to `IN_CONSULTATION`, `DISCHARGED`, `COMPLETED`) and urgent reordering to `IMMEDIATE` are reserved strictly for authorized hospital staff.
4. **Hospital Verification & Insurance Empanelment**: Only `HOSPITAL_ADMIN` or platform administrators can update hospital verification badges and insurance empanelment policy matrices.
5. **Identity & Role Immutability**: Users cannot arbitrarily grant themselves `HOSPITAL_ADMIN`, `DOCTOR`, or elevated platform permissions without validated administrative role assignment.
6. **Immutable Timestamps & Keys**: `createdAt`, `registeredAt`, and document IDs cannot be tampered with or reassigned during update transactions.

---

## 2. The "Dirty Dozen" Threat Payloads

1. **Payload 1 (Patient PII Scraping)**: Unauthenticated or unrelated patient attempts `GET /patients/pat-other-1049` to scrape clinical history and phone numbers.
2. **Payload 2 (Self-Escalation to Immediate Emergency)**: Normal patient submits `UPDATE /queue/q-101` setting `urgency: "IMMEDIATE"`, `priorityScore: 9999` to bypass waiting line.
3. **Payload 3 (Forged Clinician Override)**: Non-staff user submits `UPDATE /queue/q-102` setting `overrideReason: "Self-declared acute trauma"` without clinician credentials.
4. **Payload 4 (Ghost Field / Denial of Wallet Attack)**: Malicious actor injects 2MB buffer into `chiefComplaint` or shadow property `isAdmin: true` into `/users/usr-1`.
5. **Payload 5 (Fake Hospital Insurance Endorsement)**: Unauthorized user writes `UPDATE /hospitals/hosp-1` setting `verificationStatus: "VERIFIED"` and fabricated insurance providers.
6. **Payload 6 (Other Patient Prescription Reading)**: Patient A queries `GET /prescriptions/rx-992` issued to Patient B.
7. **Payload 7 (Falsified Doctor Consultation Completion)**: Unauthorized user sets `status: "COMPLETED"` and clears waiting patients from the consultation queue.
8. **Payload 8 (Unauthorized Blood Request Cancellation)**: Unauthenticated user modifies `/bloodRequests/br-101` setting `status: "CANCELLED"`.
9. **Payload 9 (ID Traversal / Special Character Injection)**: Malicious user targets path `/queue/../../../admins/bypass`.
10. **Payload 10 (Spoofed Doctor Prescription Issuance)**: Patient crafts a new `POST /prescriptions` asserting themselves as `Dr. Sharma, MD`.
11. **Payload 11 (Audit Log Tampering)**: Actor attempts `DELETE /auditLogs/aud-991` or edits historical audit records.
12. **Payload 12 (Self-Assigned Platform Admin Role)**: Regular authenticated user updates their own `/users/{uid}` setting `role: "PLATFORM_ADMIN"`.

---

## 3. Test Runner Specification (`firestore.rules.test.ts`)

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('MART Health Firestore Security Rules Matrix', () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'ferrous-polygon-78p5g',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('Payload 1: Patient cannot read another patient medical profile', async () => {
    const unauthDb = testEnv.authenticatedContext('patient-attacker-uid').firestore();
    const docRef = unauthDb.collection('patients').doc('patient-victim-uid');
    await assertFails(docRef.get());
  });

  test('Payload 2: Patient cannot self-escalate urgency to IMMEDIATE', async () => {
    const patientDb = testEnv.authenticatedContext('patient-uid', { email: 'pat@example.com' }).firestore();
    const queueRef = patientDb.collection('queue').doc('q-normal');
    await assertFails(queueRef.update({ urgency: 'IMMEDIATE', priorityScore: 999 }));
  });

  test('Payload 5: Patient cannot tamper with hospital insurance status', async () => {
    const patientDb = testEnv.authenticatedContext('patient-uid').firestore();
    const hospRef = patientDb.collection('hospitals').doc('hosp-1');
    await assertFails(hospRef.update({ verificationStatus: 'VERIFIED' }));
  });

  test('Payload 11: Audit logs are append-only; cannot be updated or deleted', async () => {
    const staffDb = testEnv.authenticatedContext('staff-uid').firestore();
    const auditRef = staffDb.collection('auditLogs').doc('aud-1');
    await assertFails(auditRef.delete());
    await assertFails(auditRef.update({ details: 'Wiped' }));
  });
});
```

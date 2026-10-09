export type UserRole =
  | 'PATIENT'
  | 'DOCTOR'
  | 'NURSE'
  | 'HOSPITAL_ADMIN'
  | 'DONOR'
  | 'BLOOD_COORDINATOR'
  | 'PLATFORM_ADMIN';

export type LanguageCode = 'en' | 'te' | 'hi';

export type TriageUrgency =
  | 'IMMEDIATE'      // Resuscitation / Immediate professional attention
  | 'URGENT'         // Very urgent / high priority
  | 'STANDARD'       // Standard priority
  | 'NON_URGENT';    // Routine care

export type QueueWorkflowStatus =
  | 'REGISTERED'
  | 'AWAITING_TRIAGE'
  | 'TRIAGE_COMPLETED'
  | 'WAITING_FOR_CONSULTATION'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'REFERRED'
  | 'DISCHARGED';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type BloodRequestStatus =
  | 'OPEN'
  | 'MATCHING'
  | 'DONOR_CONTACTED'
  | 'DONOR_ACCEPTED'
  | 'COORDINATION_IN_PROGRESS'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  language: LanguageCode;
  avatarUrl?: string;
  hospitalId?: string; // If clinician or hospital admin
  departmentId?: string;
}

export interface Patient {
  id: string;
  identifier: string; // E.g., MART-P-1049
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  preferredLanguage: LanguageCode;
  bloodGroup: BloodGroup;
  city: string;
  address: string;
  allergies: string[];
  existingConditions: string[];
  currentMedications: string[];
  consentGiven: boolean;
  registeredAt: string;
}

export interface VitalSigns {
  heartRate?: number; // bpm
  bloodPressureSys?: number; // mmHg
  bloodPressureDia?: number; // mmHg
  respiratoryRate?: number; // breaths/min
  temperature?: number; // Fahrenheit
  spO2?: number; // %
  painScore?: number; // 0-10
  recordedAt: string;
  recordedBy?: string;
}

export interface TriageAssessment {
  id: string;
  visitId: string;
  patientId: string;
  assessedBy: string; // Clinician/Nurse name
  assessedByRole: UserRole;
  assessedAt: string;
  urgency: TriageUrgency;
  chiefComplaint: string;
  symptomDuration: string;
  vitalSigns: VitalSigns;
  warningSigns: string[];
  protocolVersion: string;
  clinicalNotes: string;
  overrideApplied?: boolean;
  overrideReason?: string;
  reassessmentRecommendedMin?: number;
  lastReassessedAt?: string;
}

export interface QueueEntry {
  id: string;
  visitId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  tokenNumber: string; // e.g. T-042
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  registeredAt: string;
  urgency: TriageUrgency;
  status: QueueWorkflowStatus;
  priorityScore: number; // Higher means earlier
  estimatedWaitMinutes: number;
  arrivalOrder: number;
  triageAssessmentId?: string;
  chiefComplaint: string;
  reassessmentDue: boolean;
  reassessmentDueAt?: string;
  staffAlertAcknowledged: boolean;
  consultationStartedAt?: string;
  consultationCompletedAt?: string;
  dispositionNotes?: string;
  overrideReason?: string;
  lastUpdatedAt: string;
}

export type InsuranceVerificationStatus = 'VERIFIED' | 'NOT_ACCEPTED' | 'NOT_VERIFIED';

export interface InsurancePlanDetail {
  planId: string;
  planName: string;
  verificationStatus: InsuranceVerificationStatus;
  notes?: string;
  lastVerifiedDate?: string;
}

export interface InsuranceProviderInfo {
  providerId: string;
  providerName: string;
  status: InsuranceVerificationStatus;
  acceptedPlans: InsurancePlanDetail[];
  tpaDeskContact?: string;
  lastVerifiedDate?: string;
}

export interface HospitalInsuranceData {
  overallStatus: InsuranceVerificationStatus;
  providers: InsuranceProviderInfo[];
  cashlessDeskAvailable: boolean;
  tpaDeskContact?: string;
  tpaDeskHours?: string;
  lastUpdatedDate: string;
  notes?: string;
}

export interface SpecialistDoctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  experienceYears: number;
  availabilitySchedule: string;
  consultationFeeApprox?: string;
  isVerified: boolean;
  contactPhone?: string;
  opdRoom?: string;
}

export interface DiseaseConditionInfo {
  id: string;
  name: string;
  category: string;
  specialties: string[];
  description: string;
  commonSymptoms: string[];
  isLifeThreatening: boolean;
  emergencyWarning?: string;
  suggestedDoctorQuestions: string[];
  keyServicesNeeded: string[];
  disclaimer: string;
}

export interface Hospital {
  id: string;
  facilityIdentifier: string;
  name: string;
  tagline: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  website?: string;
  operatingHours: string;
  departments: string[];
  services: string[];
  appointmentTypes: string[];
  accessibilityFeatures: string[];
  supportedLanguages: string[];
  emergencyServicesAvailable: boolean;
  verificationStatus: 'VERIFIED' | 'SELF_REPORTED' | 'PENDING_REVIEW' | 'REJECTED';
  lastVerifiedDate?: string;
  rating: number; // e.g. 4.6
  reviewCount: number;
  latitude: number;
  longitude: number;
  availableBeds?: {
    icu: number;
    emergency: number;
    general: number;
  };
  insuranceData?: HospitalInsuranceData;
  specialists?: SpecialistDoctor[];
  isSampleData?: boolean;
}

export interface HospitalReview {
  id: string;
  hospitalId: string;
  patientName: string;
  isVerifiedVisit: boolean;
  ratings: {
    cleanliness: number;
    communication: number;
    waitingExperience: number;
    accessibility: number;
  };
  overallRating: number;
  comment: string;
  createdAt: string;
  hospitalResponse?: {
    responderName: string;
    responseDate: string;
    message: string;
  };
  status: 'PUBLISHED' | 'FLAGGED' | 'REMOVED';
}

export interface BloodDonor {
  id: string;
  userId?: string;
  displayName: string; // E.g. Donor #402 or initials for privacy
  bloodGroup: BloodGroup;
  city: string;
  area: string;
  distanceKmApprox: number;
  isAvailable: boolean;
  availabilityExpiry: string;
  lastConfirmedAt: string;
  preferredContact: 'IN_APP' | 'SMS_SIMULATED' | 'CALL_COORDINATOR';
  donationCount: number;
  lastDonationDate?: string;
  eligibilityStatus: 'ELIGIBLE_SELF_REPORTED' | 'SCREENING_REQUIRED' | 'DEFERRED';
  matchingConsented: boolean;
}

export interface BloodRequest {
  id: string;
  requestIdentifier: string; // e.g. BR-2026-891
  requesterName: string;
  patientName: string;
  hospitalName: string;
  city: string;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: 'CRITICAL_IMMEDIATE' | 'URGENT_24H' | 'PLANNED_72H';
  status: BloodRequestStatus;
  createdAt: string;
  neededBefore: string;
  coordinatorName?: string;
  matchedDonorCount: number;
  acceptedDonorName?: string;
  acceptedAt?: string;
  fulfillmentNotes?: string;
}

export interface HealthMeasurement {
  id: string;
  patientId: string;
  type: 'BLOOD_PRESSURE' | 'BLOOD_GLUCOSE' | 'WEIGHT' | 'HEART_RATE' | 'TEMPERATURE' | 'SPO2';
  value: number;
  valueSecondary?: number; // e.g. diastolic for BP
  unit: string;
  timestamp: string;
  isAbnormal?: boolean;
  referenceRangeText: string;
  clinicalNote?: string;
  source: 'PATIENT_REPORTED' | 'CLINICIAN_ENTERED' | 'SIMULATED_MONITOR';
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string; // e.g. "Twice daily after meals"
  timing: ('MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT')[];
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  notes: string;
  refillReminder: boolean;
  adherencePercentage: number;
}

export interface MedicationAdherenceLog {
  id: string;
  medicationId: string;
  patientId: string;
  date: string;
  timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  status: 'TAKEN' | 'SKIPPED' | 'MISSED';
  recordedAt: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  doctorName: string;
  dateTime: string;
  type: 'IN_PERSON' | 'TELEHEALTH_SIMULATED';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reasonForVisit: string;
  tokenNumber?: string;
}

export interface DigitalPrescription {
  id: string;
  rxNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorName: string;
  doctorRegistrationNumber: string;
  hospitalName: string;
  issueDate: string;
  validUntil: string;
  diagnosis: string;
  items: {
    medicationName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  notes: string;
  signatureHash: string; // Digital signing representation
  isPrintable: boolean;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  hospitalName: string;
  date: string;
  items: {
    description: string;
    department: string;
    cost: number;
  }[];
  totalAmount: number;
  insuranceCoveredAmount: number;
  patientPayableAmount: number;
  status: 'PAID' | 'PENDING' | 'INSURANCE_CLAIM_PROCESSING';
  paymentMethod?: 'UPI_SIMULATED' | 'CARD_SIMULATED' | 'CASH';
  transactionReference?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: UserRole;
  actorName: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'QUEUE' | 'TRIAGE_ALERT' | 'MEDICATION' | 'DONOR' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  priority: 'HIGH' | 'NORMAL';
  actionUrl?: string;
}

export interface ClinicalRedFlag {
  id: string;
  condition: string;
  criteria: string;
  severity: 'CRITICAL' | 'WARNING';
  actionPrompt: string;
}

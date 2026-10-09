import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { martStore } from './src/services/store.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- OpenAPI 3.0 Specification ---
app.get('/api/v1/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'MART Health API',
      version: '1.0.0',
      description: 'Unified Healthcare, Emergency Triage, Dynamic Patient Queue, Donor Network & Hospital Management Platform API',
    },
    paths: {
      '/api/v1/health': {
        get: { summary: 'Operational health check', responses: { '200': { description: 'Service UP' } } },
      },
      '/api/v1/patients': {
        get: { summary: 'Search and retrieve patients' },
        post: { summary: 'Register a new patient and create queue token' },
      },
      '/api/v1/triage': {
        get: { summary: 'Retrieve triage assessments' },
        post: { summary: 'Record protocol-based triage assessment and urgency' },
      },
      '/api/v1/queue': {
        get: { summary: 'Retrieve dynamic prioritized patient queue' },
      },
      '/api/v1/queue/stream': {
        get: { summary: 'Server-Sent Events (SSE) stream for live queue updates' },
      },
      '/api/v1/hospitals': {
        get: { summary: 'Search hospitals by location, department, or services' },
      },
      '/api/v1/donors': {
        get: { summary: 'Search eligible registered blood donors' },
      },
      '/api/v1/blood-requests': {
        get: { summary: 'Retrieve blood donation requests' },
        post: { summary: 'Submit a new blood donation request' },
      },
      '/api/v1/analytics': {
        get: { summary: 'Operational hospital and platform analytics' },
      },
      '/api/v1/fhir/patients/{id}': {
        get: { summary: 'Export HL7 FHIR R4 Bundle for patient' },
      },
    },
  });
});

// --- Actuator / Health Endpoint ---
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'UP',
    platform: 'MART Health Enterprise',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: 'CONNECTED_DEVELOPMENT_PROFILE',
    services: {
      triageEngine: 'UP',
      queueEngine: 'UP',
      bloodNetwork: 'UP',
      auditLogger: 'UP',
    },
  });
});

// --- Patients REST API ---
app.get('/api/v1/patients', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase();
  let list = martStore.getPatients();
  if (query) {
    list = list.filter(
      (p) =>
        p.fullName.toLowerCase().includes(query) ||
        p.identifier.toLowerCase().includes(query) ||
        p.phone.includes(query)
    );
  }
  res.json(list);
});

app.get('/api/v1/patients/:id', (req: Request, res: Response) => {
  const patient = martStore.getPatientById(req.params.id);
  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }
  res.json(patient);
});

app.post('/api/v1/patients', (req: Request, res: Response) => {
  try {
    const result = martStore.registerPatient(req.body.patient, req.body.options);
    res.status(201).json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    res.status(400).json({ error: msg });
  }
});

// --- Triage Assessments ---
app.get('/api/v1/triage', (_req: Request, res: Response) => {
  res.json(martStore.getTriageAssessments());
});

app.post('/api/v1/triage', (req: Request, res: Response) => {
  try {
    const assessment = martStore.createTriageAssessment(req.body.assessment, req.body.clinician);
    res.status(201).json(assessment);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Triage assessment failed';
    res.status(400).json({ error: msg });
  }
});

// --- Dynamic Queue & SSE Live Stream ---
app.get('/api/v1/queue', (req: Request, res: Response) => {
  const departmentId = req.query.departmentId as string;
  res.json(martStore.getQueueEntries(departmentId));
});

// SSE Live Queue updates
app.get('/api/v1/queue/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const unsubscribe = martStore.subscribeQueue((entries) => {
    res.write(`data: ${JSON.stringify(entries)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

app.put('/api/v1/queue/:id/status', (req: Request, res: Response) => {
  const updated = martStore.updateQueueStatus(
    req.params.id,
    req.body.status,
    req.body.clinician,
    req.body.notes
  );
  if (!updated) {
    res.status(404).json({ error: 'Queue entry not found' });
    return;
  }
  res.json(updated);
});

app.post('/api/v1/queue/:id/override', (req: Request, res: Response) => {
  if (!req.body.reason || !req.body.newUrgency) {
    res.status(400).json({ error: 'Clinician override requires newUrgency and mandatory documented reason' });
    return;
  }
  const updated = martStore.overrideQueuePriority(
    req.params.id,
    req.body.newUrgency,
    req.body.reason,
    req.body.clinician
  );
  if (!updated) {
    res.status(404).json({ error: 'Queue entry not found' });
    return;
  }
  res.json(updated);
});

// --- Hospitals & Reviews ---
app.get('/api/v1/hospitals', (req: Request, res: Response) => {
  const city = (req.query.city as string || '').toLowerCase();
  const q = (req.query.q as string || '').toLowerCase();
  let list = martStore.getHospitals();
  if (city) {
    list = list.filter((h) => h.city.toLowerCase() === city);
  }
  if (q) {
    list = list.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.departments.some((d) => d.toLowerCase().includes(q)) ||
        h.services.some((s) => s.toLowerCase().includes(q))
    );
  }
  res.json(list);
});

app.get('/api/v1/hospitals/:id', (req: Request, res: Response) => {
  const hosp = martStore.getHospitalById(req.params.id);
  if (!hosp) {
    res.status(404).json({ error: 'Hospital not found' });
    return;
  }
  res.json(hosp);
});

app.get('/api/v1/hospitals/:id/reviews', (req: Request, res: Response) => {
  res.json(martStore.getReviewsForHospital(req.params.id));
});

app.post('/api/v1/hospitals/:id/reviews', (req: Request, res: Response) => {
  const review = martStore.addReview({
    hospitalId: req.params.id,
    patientName: req.body.patientName || 'Anonymous Patient',
    isVerifiedVisit: Boolean(req.body.isVerifiedVisit),
    ratings: req.body.ratings,
    overallRating: req.body.overallRating,
    comment: req.body.comment,
  });
  res.status(201).json(review);
});

app.put('/api/v1/hospitals/:id/verification', (req: Request, res: Response) => {
  const updated = martStore.updateHospitalVerification(
    req.params.id,
    req.body.status,
    req.body.actor
  );
  if (!updated) {
    res.status(404).json({ error: 'Hospital not found' });
    return;
  }
  res.json(updated);
});

app.put('/api/v1/hospitals/:id/insurance', (req: Request, res: Response) => {
  const updated = martStore.updateHospitalInsurance(
    req.params.id,
    req.body.insuranceData,
    req.body.actor
  );
  if (!updated) {
    res.status(404).json({ error: 'Hospital not found' });
    return;
  }
  res.json(updated);
});

// --- Specialized Disease Care API ---
app.get('/api/v1/diseases', (_req: Request, res: Response) => {
  res.json(martStore.getDiseaseConditions());
});

app.get('/api/v1/diseases/:id', (req: Request, res: Response) => {
  const condition = martStore.getDiseaseConditionById(req.params.id);
  if (!condition) {
    res.status(404).json({ error: 'Medical condition not found' });
    return;
  }
  res.json(condition);
});

// --- Blood Donors & Requests ---
app.get('/api/v1/donors', (req: Request, res: Response) => {
  const group = req.query.bloodGroup as string;
  const city = req.query.city as string;
  let list = martStore.getBloodDonors();
  if (group) {
    list = list.filter((d) => d.bloodGroup === group);
  }
  if (city) {
    list = list.filter((d) => d.city.toLowerCase() === city.toLowerCase());
  }
  res.json(list);
});

app.put('/api/v1/donors/:id/availability', (req: Request, res: Response) => {
  const updated = martStore.updateDonorAvailability(
    req.params.id,
    req.body.isAvailable,
    req.body.expiryDays
  );
  if (!updated) {
    res.status(404).json({ error: 'Donor not found' });
    return;
  }
  res.json(updated);
});

app.get('/api/v1/blood-requests', (_req: Request, res: Response) => {
  res.json(martStore.getBloodRequests());
});

app.post('/api/v1/blood-requests', (req: Request, res: Response) => {
  const request = martStore.createBloodRequest(req.body);
  res.status(201).json(request);
});

app.put('/api/v1/blood-requests/:id/status', (req: Request, res: Response) => {
  const updated = martStore.updateBloodRequestStatus(
    req.params.id,
    req.body.status,
    req.body.actor,
    req.body.acceptedDonorName,
    req.body.fulfillmentNotes
  );
  if (!updated) {
    res.status(404).json({ error: 'Blood request not found' });
    return;
  }
  res.json(updated);
});

// --- Health Measurements & Medications ---
app.get('/api/v1/health-measurements', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  res.json(martStore.getHealthMeasurements(patientId));
});

app.post('/api/v1/health-measurements', (req: Request, res: Response) => {
  const m = martStore.addHealthMeasurement(req.body);
  res.status(201).json(m);
});

app.get('/api/v1/medications', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  res.json(martStore.getMedications(patientId));
});

app.post('/api/v1/medications/:id/adherence', (req: Request, res: Response) => {
  const log = martStore.logAdherence(
    req.params.id,
    req.body.patientId,
    req.body.timeSlot,
    req.body.status,
    req.body.reason
  );
  res.status(201).json(log);
});

// --- Appointments & Prescriptions ---
app.get('/api/v1/appointments', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  res.json(martStore.getAppointments(patientId));
});

app.post('/api/v1/appointments', (req: Request, res: Response) => {
  try {
    const appt = martStore.bookAppointment(req.body);
    res.status(201).json(appt);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Booking failed';
    res.status(409).json({ error: msg });
  }
});

app.get('/api/v1/prescriptions', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  res.json(martStore.getPrescriptions(patientId));
});

app.post('/api/v1/prescriptions', (req: Request, res: Response) => {
  const rx = martStore.createPrescription(req.body.prescription, req.body.clinician);
  res.status(201).json(rx);
});

// --- Invoices & Billing ---
app.get('/api/v1/invoices', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  res.json(martStore.getInvoices(patientId));
});

app.post('/api/v1/invoices/:id/pay', (req: Request, res: Response) => {
  const paid = martStore.payInvoice(req.params.id, req.body.paymentMethod);
  if (!paid) {
    res.status(404).json({ error: 'Invoice not found' });
    return;
  }
  res.json(paid);
});

// --- Operational Analytics & Audit ---
app.get('/api/v1/analytics', (_req: Request, res: Response) => {
  res.json(martStore.getOperationalStats());
});

app.get('/api/v1/audit', (_req: Request, res: Response) => {
  res.json(martStore.getAuditLogs());
});

// --- HL7 FHIR Interoperability Export ---
app.get('/api/v1/fhir/patients/:id', (req: Request, res: Response) => {
  const bundle = martStore.exportFHIRPatientBundle(req.params.id);
  if (!bundle) {
    res.status(404).json({ error: 'Patient not found for FHIR export' });
    return;
  }
  res.json(bundle);
});

// --- Vite Middleware Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`MART Health Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MART Health server:', err);
});

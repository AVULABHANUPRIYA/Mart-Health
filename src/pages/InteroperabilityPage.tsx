import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  Layers,
  Network,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const InteroperabilityPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'FHIR' | 'OPENAPI' | 'ABDM'>('FHIR');
  const [fhirBundle, setFhirBundle] = useState<Record<string, unknown> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadFHIR();
  }, []);

  const loadFHIR = async () => {
    const bundle = await api.getFHIRBundle('pat-1001');
    setFhirBundle(bundle);
  };

  const handleCopyJSON = () => {
    if (!fhirBundle) return;
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-teal-950/70 border border-teal-800/60 text-teal-400">
              <FileCode className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              EHR / EMR Interoperability & FHIR Gateway
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Standardized HL7 FHIR R4 export, ABDM milestone readiness, and OpenAPI 3.0 interfaces.
          </p>
        </div>

        <button
          onClick={handleCopyJSON}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700 shadow-2xs cursor-pointer"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied FHIR JSON' : 'Copy FHIR Bundle'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('FHIR')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'FHIR' ? 'bg-slate-800 text-teal-300 shadow-2xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          HL7 FHIR R4 Bundle Exporter
        </button>
        <button
          onClick={() => setActiveTab('OPENAPI')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'OPENAPI' ? 'bg-slate-800 text-teal-300 shadow-2xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          REST API / OpenAPI 3.0 Specs
        </button>
        <button
          onClick={() => setActiveTab('ABDM')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            activeTab === 'ABDM' ? 'bg-slate-800 text-teal-300 shadow-2xs' : 'text-slate-400 hover:text-white'
          }`}
        >
          ABDM Ecosystem Architecture
        </button>
      </div>

      {/* Tab: FHIR */}
      {activeTab === 'FHIR' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-teal-950/70 border border-teal-800/80 text-teal-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p>
              This bundle maps patient demographics to <code>Patient</code>, longitudinal vitals to <code>Observation</code> (category: vital-signs), and medications to <code>MedicationRequest</code> under official HL7 FHIR Release 4 specification.
            </p>
          </div>

          <div className="bg-slate-950 rounded-xl p-5 shadow-inner border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2 mb-3">
              <span>Resource Type: Bundle (Type: collection)</span>
              <span className="font-mono text-teal-400">pat-1001 / MART-P-1001</span>
            </div>
            <pre className="text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px]">
              {JSON.stringify(fhirBundle, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: OPENAPI */}
      {activeTab === 'OPENAPI' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Interactive Endpoints Definition (/api/v1/openapi.json)
            </h3>
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Raw JSON</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2 text-xs divide-y divide-slate-800">
            {[
              { method: 'GET', path: '/api/v1/health', desc: 'Actuator operational telemetry and database readiness' },
              { method: 'GET', path: '/api/v1/patients', desc: 'Search and retrieve registered patients' },
              { method: 'POST', path: '/api/v1/patients', desc: 'Register walk-in patient and issue queue token' },
              { method: 'POST', path: '/api/v1/triage', desc: 'Commit protocol-based triage assessment and urgency' },
              { method: 'GET', path: '/api/v1/queue', desc: 'Retrieve dynamic priority ordered patient queue' },
              { method: 'GET', path: '/api/v1/queue/stream', desc: 'Server-Sent Events (SSE) live queue update stream' },
              { method: 'PUT', path: '/api/v1/queue/:id/status', desc: 'Advance patient workflow status with clinician audit' },
              { method: 'POST', path: '/api/v1/queue/:id/override', desc: 'Clinician priority override with mandatory justification' },
              { method: 'GET', path: '/api/v1/donors', desc: 'Search eligible prospective blood donors by group and city' },
              { method: 'POST', path: '/api/v1/blood-requests', desc: 'Dispatch emergency blood requisition to matched candidates' },
              { method: 'GET', path: '/api/v1/fhir/patients/:id', desc: 'Export standardized HL7 FHIR R4 Bundle' },
            ].map((ep, idx) => (
              <div key={idx} className="pt-2 flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                      ep.method === 'GET'
                        ? 'bg-blue-950/70 text-blue-300 border border-blue-800/80'
                        : ep.method === 'POST'
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/80'
                        : 'bg-amber-950/70 text-amber-300 border border-amber-800/80'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-slate-200 font-semibold">{ep.path}</span>
                </div>
                <span className="text-slate-400">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: ABDM */}
      {activeTab === 'ABDM' && (
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-white">
            Ayushman Bharat Digital Mission (ABDM) Integration Architecture
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            MART Health separates internal database identifiers from external national identifiers. Architecture provisions for:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-white">Milestone 1: ABHA Number Creation</h4>
              <p className="text-slate-400 leading-relaxed">
                Patient linkage via 14-digit Ayushman Bharat Health Account (ABHA) and consent artifact verification.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-white">Milestone 2: HIP / HIU Gateways</h4>
              <p className="text-slate-400 leading-relaxed">
                Health Information Provider (HIP) pushes diagnostic records and Health Information User (HIU) views historical longitudinal records upon OTP consent.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-white">Milestone 3: Health Facility Registry (HFR)</h4>
              <p className="text-slate-400 leading-relaxed">
                Hospital facility identifiers (e.g. AP-HYD-GOV-001) map to national verified registries for transparent public discoverability.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

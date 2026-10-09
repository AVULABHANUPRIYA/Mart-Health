import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { OfflineProvider } from './context/OfflineContext';
import { EmergencyBanner } from './components/layout/EmergencyBanner';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { VoiceAssistantModal } from './components/layout/VoiceAssistantModal';
import { NotificationDrawer } from './components/layout/NotificationDrawer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { PatientRegistrationPage } from './pages/PatientRegistrationPage';
import { HospitalDiscoveryPage } from './pages/HospitalDiscoveryPage';
import { HospitalDetailPage } from './pages/HospitalDetailPage';
import { BloodNetworkPage } from './pages/BloodNetworkPage';
import { TriageAssessmentPage } from './pages/TriageAssessmentPage';
import { DynamicQueuePage } from './pages/DynamicQueuePage';
import { StaffDashboard } from './pages/StaffDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { HealthDashboard } from './pages/HealthDashboard';
import { MedicationTrackerPage } from './pages/MedicationTrackerPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { MyQueueTokenPage } from './pages/MyQueueTokenPage';
import { BloodCoordinationPage } from './pages/BloodCoordinationPage';
import { HospitalAdminPage } from './pages/HospitalAdminPage';
import { InteroperabilityPage } from './pages/InteroperabilityPage';
import { FeatureCoverageMatrixPage } from './pages/FeatureCoverageMatrixPage';
import { AboutHelpPage } from './pages/AboutHelpPage';
import { SpecializedDiseaseCarePage } from './pages/SpecializedDiseaseCarePage';
import { Lock } from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('hosp-1');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);

  const navigate = (path: string) => {
    setCurrentPath(path);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    if (currentPath === '/') {
      return <LandingPage onNavigate={navigate} onOpenVoice={() => setIsVoiceOpen(true)} />;
    }
    if (currentPath === '/patient-intake') {
      return <PatientRegistrationPage onNavigate={navigate} />;
    }
    if (currentPath === '/hospitals') {
      return (
        <HospitalDiscoveryPage
          onNavigate={navigate}
          onSelectHospital={(id) => {
            setSelectedHospitalId(id);
            navigate(`/hospital/${id}`);
          }}
        />
      );
    }
    if (currentPath.startsWith('/hospital/')) {
      const id = currentPath.replace('/hospital/', '') || selectedHospitalId;
      return (
        <HospitalDetailPage
          hospitalId={id}
          onBack={() => navigate('/hospitals')}
          onNavigate={navigate}
        />
      );
    }
    if (currentPath === '/specialized-care') {
      return (
        <SpecializedDiseaseCarePage
          onNavigate={navigate}
          onSelectHospital={(id) => {
            setSelectedHospitalId(id);
            navigate(`/hospital/${id}`);
          }}
        />
      );
    }
    if (currentPath === '/blood-network') {
      return <BloodNetworkPage onNavigate={navigate} />;
    }
    if (currentPath === '/triage-assessment') {
      return <TriageAssessmentPage onNavigate={navigate} />;
    }
    if (currentPath === '/queue-board') {
      return <DynamicQueuePage onNavigate={navigate} />;
    }
    if (currentPath === '/staff-dashboard') {
      return <StaffDashboard onNavigate={navigate} />;
    }
    if (currentPath === '/patient-dashboard') {
      return <PatientDashboard onNavigate={navigate} />;
    }
    if (currentPath === '/my-token') {
      return <MyQueueTokenPage onNavigate={navigate} />;
    }
    if (currentPath === '/health-dashboard') {
      return <HealthDashboard />;
    }
    if (currentPath === '/medications') {
      return <MedicationTrackerPage />;
    }
    if (currentPath === '/appointments') {
      return <AppointmentsPage />;
    }
    if (currentPath === '/blood-coordination') {
      return <BloodCoordinationPage />;
    }
    if (currentPath === '/hospital-admin') {
      return <HospitalAdminPage />;
    }
    if (currentPath === '/platform-admin') {
      return (
        <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-rose-900/60 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-950 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">403 Access Restricted — Platform Admin</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Platform Admin Access has been disabled and removed from all public, Governance, and Tech portal entry points. Platform infrastructure governance requires direct cloud infrastructure credentials and is not accessible through portal client navigation.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/hospitals')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Return to Hospitals Directory
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }
    if (currentPath === '/interoperability') {
      return <InteroperabilityPage />;
    }
    if (currentPath === '/feature-matrix') {
      return <FeatureCoverageMatrixPage />;
    }
    if (currentPath === '/about') {
      return <AboutHelpPage />;
    }

    return <LandingPage onNavigate={navigate} onOpenVoice={() => setIsVoiceOpen(true)} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Persistent Emergency Notice Bar */}
      <EmergencyBanner />

      {/* Main Top Header */}
      <Header
        onOpenVoice={() => setIsVoiceOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onNavigate={navigate}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* App Body with Sidebar & Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentPath={currentPath}
          onNavigate={navigate}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Modals & Overlays */}
      <VoiceAssistantModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onNavigate={navigate}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={navigate}
      />
    </div>
  );
};

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <OfflineProvider>
            <AppContent />
          </OfflineProvider>
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

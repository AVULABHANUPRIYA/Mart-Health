import React, { useState } from 'react';
import {
  Globe,
  Bell,
  Mic,
  Wifi,
  WifiOff,
  UserCheck,
  ChevronDown,
  Menu,
  X,
  Activity,
  HeartPulse,
  LogIn,
  LogOut,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useOffline } from '../../context/OfflineContext';
import { UserRole, LanguageCode } from '../../types';

interface HeaderProps {
  onOpenVoice: () => void;
  onOpenNotifications: () => void;
  onNavigate: (path: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVoice,
  onOpenNotifications,
  onNavigate,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const {
    currentUser,
    firebaseUser,
    signInWithGoogle,
    logout,
    switchRole,
    availableUsers,
    authError,
    clearAuthError,
    isStaff,
  } = useAuth();
  const { unreadCount } = useNotification();
  const { isOnline, isSimulatedOffline, toggleSimulatedOffline, pendingSyncQueue } = useOffline();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const rolesList: { role: UserRole; label: string; desc: string; isStaffRole: boolean }[] = [
    { role: 'PATIENT', label: t.roles.patient, desc: 'View records, appointments & queue token', isStaffRole: false },
    { role: 'DOCTOR', label: t.roles.doctor, desc: 'Conduct triage, overrides & consultations', isStaffRole: true },
    { role: 'NURSE', label: t.roles.nurse, desc: 'Record vitals & patient intake triage', isStaffRole: true },
    { role: 'HOSPITAL_ADMIN', label: t.roles.hospitalAdmin, desc: 'Manage departments & verification', isStaffRole: true },
    { role: 'DONOR', label: t.roles.donor, desc: 'Update blood donation availability', isStaffRole: false },
    { role: 'BLOOD_COORDINATOR', label: t.roles.bloodCoordinator, desc: 'Coordinate requests & match candidates', isStaffRole: true },
  ];

  const handleRoleSelect = (role: UserRole) => {
    switchRole(role);
    setRoleMenuOpen(false);
    // Route appropriately
    if (role === 'PATIENT') onNavigate('/patient-dashboard');
    else if (role === 'DOCTOR' || role === 'NURSE') onNavigate('/queue-board');
    else if (role === 'HOSPITAL_ADMIN') onNavigate('/hospital-admin');
    else if (role === 'DONOR') onNavigate('/blood-network');
    else if (role === 'BLOOD_COORDINATOR') onNavigate('/blood-coordination');
  };

  const handleLangSelect = (code: LanguageCode) => {
    setLanguage(code);
    setLangMenuOpen(false);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:bg-teal-500 transition-colors">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-display">
                  MART <span className="text-teal-400">Health</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wider uppercase text-teal-300 bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800/80">
                  Care OS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block truncate max-w-[210px]">
                {t.app.tagline}
              </p>
            </div>
          </button>
        </div>

        {/* Center: Live Engine & Connectivity Pills */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Live Queue Pulse */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Triage & Queue Active</span>
          </div>

          {/* Offline simulator toggle button for demo testing */}
          <button
            onClick={toggleSimulatedOffline}
            title={isSimulatedOffline ? 'Switch to Online Mode' : 'Simulate Low-Connectivity / Offline Mode'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
              isOnline
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/80'
                : 'bg-amber-950/70 text-amber-300 border-amber-800/80 hover:bg-amber-900/80'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            {pendingSyncQueue.length > 0 && (
              <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {pendingSyncQueue.length} pending
              </span>
            )}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice Assistant Launcher */}
          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-950/70 hover:bg-teal-900/80 text-teal-300 text-xs font-semibold border border-teal-800/60 transition-colors shadow-2xs"
            title="Launch Multilingual Voice Navigation"
          >
            <Mic className="w-4 h-4 text-teal-400" />
            <span className="hidden sm:inline">Voice Assistant</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setLangMenuOpen(!langMenuOpen);
                setRoleMenuOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/90 text-xs font-medium text-slate-200 hover:bg-slate-750 transition-colors"
              aria-label="Select language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="uppercase font-semibold">{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                <button
                  onClick={() => handleLangSelect('en')}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-800 ${
                    language === 'en' ? 'text-teal-400 font-bold bg-teal-950/50' : 'text-slate-300'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <span className="text-teal-400">✓</span>}
                </button>
                <button
                  onClick={() => handleLangSelect('te')}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-800 ${
                    language === 'te' ? 'text-teal-400 font-bold bg-teal-950/50' : 'text-slate-300'
                  }`}
                >
                  <span>తెలుగు (Telugu)</span>
                  {language === 'te' && <span className="text-teal-400">✓</span>}
                </button>
                <button
                  onClick={() => handleLangSelect('hi')}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-slate-800 ${
                    language === 'hi' ? 'text-teal-400 font-bold bg-teal-950/50' : 'text-slate-300'
                  }`}
                >
                  <span>हिंदी (Hindi)</span>
                  {language === 'hi' && <span className="text-teal-400">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-pulse" />
            )}
          </button>

          {/* Google Sign In / Firebase Session Button */}
          {firebaseUser ? (
            <div className="hidden sm:flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-xs">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'User'}
                  className="w-5 h-5 rounded-full ring-1 ring-emerald-500"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                  {firebaseUser.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
              <div className="text-left hidden lg:block leading-tight">
                <span className="text-[10px] text-emerald-400 font-semibold block truncate max-w-[120px]">
                  {firebaseUser.email}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign out of Firebase"
                className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 ml-0.5 cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Sign in with Google using Firebase Authentication"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSigningIn ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          )}

          {/* Role Switcher Menu (Essential for Testing Staff vs Patient Security Rules) */}
          <div className="relative">
            <button
              onClick={() => {
                setRoleMenuOpen(!roleMenuOpen);
                setLangMenuOpen(false);
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-750 transition-colors cursor-pointer"
              title="Switch user role to test permissions and access control"
            >
              <div className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center text-[11px] font-bold">
                {currentUser.role[0]}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold leading-none flex items-center gap-1">
                  <span>{currentUser.role.replace('_', ' ')}</span>
                  {isStaff && <ShieldCheck className="w-2.5 h-2.5 text-teal-300" />}
                </p>
                <p className="text-xs font-bold text-white leading-tight truncate max-w-[110px]">
                  {currentUser.name.split(' ')[0]}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
                {/* Firebase Authentication Banner */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 mb-2 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">Firebase Authentication</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        firebaseUser
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                          : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                      }`}
                    >
                      {firebaseUser ? '✓ Signed In' : 'Demo Profile Active'}
                    </span>
                  </div>
                  {firebaseUser ? (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-850">
                      <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {firebaseUser.email}
                      </p>
                      <button
                        onClick={logout}
                        className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="w-full mt-1 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
                    </button>
                  )}
                </div>

                {authError && (
                  <div className="mb-2 p-2 rounded bg-rose-950/80 border border-rose-800/80 text-[11px] text-rose-200 flex items-center justify-between">
                    <span className="truncate max-w-[200px]">{authError}</span>
                    <button onClick={clearAuthError} className="font-bold text-rose-400 hover:text-white">✕</button>
                  </div>
                )}

                <div className="px-2 py-1.5 border-b border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-100">Role-Based Access Control (RBAC)</p>
                  <p className="text-[11px] text-slate-400">
                    Switch roles to test clinician-only overrides vs patient view:
                  </p>
                </div>

                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {rolesList.map((item) => {
                    const isActive = currentUser.role === item.role;
                    return (
                      <button
                        key={item.role}
                        onClick={() => handleRoleSelect(item.role)}
                        className={`w-full text-left p-2 rounded-lg transition-colors flex items-start gap-2.5 cursor-pointer ${
                          isActive
                            ? 'bg-teal-950/80 text-teal-200 border border-teal-800/80 font-semibold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <UserCheck className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-teal-400' : 'text-slate-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs flex items-center justify-between gap-1">
                            <span className="font-semibold text-white">{item.label}</span>
                            <div className="flex items-center gap-1">
                              {item.isStaffRole && (
                                <span className="text-[9px] bg-slate-800 text-teal-300 px-1 py-0.2 rounded font-mono">
                                  Staff Rights
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[9px] bg-teal-800/80 text-teal-200 px-1.5 py-0.2 rounded font-bold">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

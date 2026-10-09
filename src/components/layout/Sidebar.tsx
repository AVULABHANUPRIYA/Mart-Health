import React from 'react';
import {
  Home,
  Building2,
  HeartHandshake,
  UserPlus,
  LayoutDashboard,
  Clock,
  LineChart,
  Pill,
  CalendarCheck,
  Stethoscope,
  Activity,
  Layers,
  ShieldCheck,
  FileCode,
  CheckCircle2,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  roles?: string[]; // Allowed roles or empty for all
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();

  const navSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Care & Access',
      items: [
        { path: '/', label: t.nav.home, icon: Home },
        { path: '/hospitals', label: t.nav.hospitals, icon: Building2 },
        { path: '/specialized-care', label: 'Specialized Disease Care', icon: Stethoscope, badge: 'New', badgeColor: 'bg-teal-950 text-teal-300 border-teal-800' },
        { path: '/blood-network', label: t.nav.bloodNetwork, icon: HeartHandshake, badge: 'Network', badgeColor: 'bg-red-50 text-red-700 border-red-200' },
        { path: '/patient-intake', label: t.nav.patientIntake, icon: UserPlus },
      ],
    },
    {
      title: 'Patient Portal',
      items: [
        { path: '/patient-dashboard', label: t.nav.patientDashboard, icon: LayoutDashboard },
        { path: '/my-token', label: t.nav.myToken, icon: Clock, badge: 'Live', badgeColor: 'bg-teal-50 text-teal-800 border-teal-200' },
        { path: '/health-dashboard', label: t.nav.healthMetrics, icon: LineChart },
        { path: '/medications', label: t.nav.medications, icon: Pill },
        { path: '/appointments', label: 'Appointments & Telehealth', icon: CalendarCheck },
      ],
    },
    {
      title: 'Clinical & Triage',
      items: [
        { path: '/queue-board', label: t.nav.queueBoard, icon: Layers, badge: 'Real-time', badgeColor: 'bg-amber-50 text-amber-800 border-amber-200' },
        { path: '/triage-assessment', label: t.nav.triageAssessment, icon: Stethoscope },
        { path: '/staff-dashboard', label: t.nav.staffDashboard, icon: Activity },
        { path: '/blood-coordination', label: 'Blood Coordination', icon: HeartHandshake },
      ],
    },
    {
      title: 'Governance Portal',
      items: [
        { path: '/hospital-admin', label: t.nav.hospitalAdmin, icon: Building2 },
      ],
    },
    {
      title: 'Tech Portal',
      items: [
        { path: '/interoperability', label: t.nav.fhirInteroperability, icon: FileCode },
        { path: '/feature-matrix', label: t.nav.featureMatrix, icon: CheckCircle2, badge: '34/34', badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
        { path: '/about', label: t.nav.about, icon: HelpCircle },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-16 z-40 w-64 h-[calc(100vh-4rem)] bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-3 space-y-6 flex-1">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        onNavigate(item.path);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors group ${
                        isActive
                          ? 'bg-teal-950/80 text-teal-300 border border-teal-800/80 shadow-2xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Role Card at bottom */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-850/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                {currentUser.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-teal-400 font-medium">
                  {currentUser.role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

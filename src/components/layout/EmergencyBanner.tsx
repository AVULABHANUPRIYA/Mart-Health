import React from 'react';
import { PhoneCall, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const EmergencyBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-rose-950 text-rose-100 border-b border-rose-800/80 px-4 py-2.5 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <p className="font-medium text-rose-200">
            {t.app.emergencyBanner}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:108"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded text-xs transition-colors shadow-sm"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Call 108 (Ambulance)</span>
          </a>
          <a
            href="tel:112"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white font-medium rounded text-xs transition-colors border border-rose-700"
          >
            <span>Dial 112 (National Emergency)</span>
          </a>
        </div>
      </div>
    </div>
  );
};

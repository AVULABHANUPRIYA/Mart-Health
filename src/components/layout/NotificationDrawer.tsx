import React from 'react';
import { X, CheckCheck, Trash2, Bell, AlertCircle, Clock, HeartHandshake, Pill } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotification();

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'TRIAGE_ALERT':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'QUEUE':
        return <Clock className="w-4 h-4 text-teal-600" />;
      case 'DONOR':
        return <HeartHandshake className="w-4 h-4 text-red-600" />;
      case 'MEDICATION':
        return <Pill className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-100">
      <div className="w-full max-w-sm bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-800 text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-850/80">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="text-xs bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-semibold">
                {notifications.filter((n) => !n.read).length} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 hover:text-teal-400 transition-colors font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear list</span>
          </button>
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
          {notifications.length === 0 ? (
            <div className="py-12 px-6 text-center text-slate-500 text-xs flex flex-col items-center">
              <Bell className="w-8 h-8 mb-2 stroke-1 text-slate-600" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  markAsRead(item.id);
                  if (item.actionUrl) {
                    onNavigate(item.actionUrl);
                    onClose();
                  }
                }}
                className={`p-4 transition-colors cursor-pointer text-left hover:bg-slate-800/70 ${
                  !item.read ? 'bg-teal-950/25' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-slate-800 shrink-0 mt-0.5 border border-slate-700/60">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-semibold truncate ${!item.read ? 'text-white' : 'text-slate-300'}`}>
                        {item.title}
                      </p>
                      {!item.read && <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

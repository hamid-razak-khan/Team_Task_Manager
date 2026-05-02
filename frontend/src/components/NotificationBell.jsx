import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, ClipboardList, FolderPlus, AlertTriangle, CheckCircle2, MessageSquare } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const typeIcon = (type) => {
  if (type === 'task_assigned')  return <ClipboardList className="w-4 h-4 text-primary-400" />;
  if (type === 'project_added')  return <FolderPlus className="w-4 h-4 text-accent-teal" />;
  if (type === 'deadline_alert') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  if (type === 'task_completed') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (type === 'group_message')  return <MessageSquare className="w-4 h-4 text-blue-400" />;
  return <Bell className="w-4 h-4 text-slate-400" />;
};

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const NotificationBell = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const count = notifications.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(139,92,246,0.8)] animate-pulse-slow">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-dark-900 border border-white/10 shadow-2xl shadow-black/50 z-50 animate-slide-up overflow-hidden rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-white">Notifications</span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full font-medium">{count}</span>
              )}
            </div>
            {count > 0 && (
              <button
                onClick={() => { markAllAsRead(); setOpen(false); }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-300 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-slate-500">
                <Bell className="w-8 h-8 opacity-30" />
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-b-0 group transition-colors">
                  <div className="mt-0.5 p-1.5 bg-dark-900 rounded-lg border border-white/5 shrink-0">
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => markAsRead(n._id)}
                    className="text-slate-600 hover:text-white p-1 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

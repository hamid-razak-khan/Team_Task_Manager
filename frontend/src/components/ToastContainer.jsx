import React, { useEffect } from 'react';
import { X, ClipboardList, FolderPlus, AlertTriangle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const typeStyles = {
  task_assigned: {
    icon: <ClipboardList className="w-5 h-5" />,
    color: 'from-primary-600 to-primary-500',
    border: 'border-primary-500/30',
    bg: 'bg-primary-500/10',
  },
  project_added: {
    icon: <FolderPlus className="w-5 h-5" />,
    color: 'from-accent-teal to-teal-500',
    border: 'border-accent-teal/30',
    bg: 'bg-accent-teal/10',
  },
  deadline_alert: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'from-amber-600 to-amber-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
};

const ToastItem = ({ toast }) => {
  const { dismissToast } = useNotifications();
  const style = typeStyles[toast.type] || typeStyles.task_assigned;

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast._id), 6000);
    return () => clearTimeout(timer);
  }, [toast._id]);

  return (
    <div className={`flex items-start gap-3 w-full sm:w-80 p-4 rounded-2xl border ${style.border} ${style.bg} backdrop-blur-xl shadow-2xl shadow-black/50 animate-slide-up`}>
      <div className={`p-2 rounded-xl bg-gradient-to-br ${style.color} text-white shrink-0 shadow-lg`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-sm text-slate-200 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => dismissToast(toast._id)}
        className="text-slate-500 hover:text-white transition-colors shrink-0 mt-0.5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts } = useNotifications();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:bottom-6 sm:left-auto sm:right-6 z-[100] flex flex-col gap-2 sm:gap-3 items-stretch sm:items-end">
      {toasts.slice(0, 4).map(toast => (
        <ToastItem key={toast._id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;

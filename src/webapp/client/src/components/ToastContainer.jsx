import React from 'react';
import { CheckCircleIcon, XCircleIcon, InfoIcon, AlertTriangleIcon, XIcon } from 'lucide-react';
import useToastStore from '../hooks/useToast.js';

const ICONS = {
  success: <CheckCircleIcon size={14} />,
  error:   <XCircleIcon     size={14} />,
  info:    <InfoIcon        size={14} />,
  warn:    <AlertTriangleIcon size={14} />,
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id}
          className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : 'toast-enter'}`}
          onClick={() => remove(t.id)}
          role="alert"
        >
          <span className="toast-icon">{ICONS[t.type] || ICONS.info}</span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-close" onClick={(e) => { e.stopPropagation(); remove(t.id); }}>
            <XIcon size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

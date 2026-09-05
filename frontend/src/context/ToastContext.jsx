import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    remove: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => {
          let Icon = CheckCircle2;
          let iconColor = '#34d399';
          let borderClass = 'toast-success';

          if (t.type === 'error') {
            Icon = AlertCircle;
            iconColor = '#f87171';
            borderClass = 'toast-error';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            iconColor = '#fbbf24';
            borderClass = 'toast-warning';
          } else if (t.type === 'info') {
            Icon = Info;
            iconColor = '#38bdf8';
            borderClass = 'toast-info';
          }

          return (
            <div key={t.id} className={`toast-item ${borderClass}`}>
              <Icon size={18} color={iconColor} style={{ flexShrink: 0 }} />
              <div className="toast-message">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="toast-close"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('[Toast Success]:', msg),
      error: (msg) => console.error('[Toast Error]:', msg),
      warning: (msg) => console.warn('[Toast Warning]:', msg),
      info: (msg) => console.info('[Toast Info]:', msg),
      remove: () => {}
    };
  }
  return context;
};

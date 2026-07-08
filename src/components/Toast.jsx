import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onDismiss }) {
  // Auto-dismiss after 3.5 seconds (handled by parent, but as safety)
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="assertive"
    >
      <span>{message}</span>
      <button
        className="toast__dismiss"
        onClick={onDismiss}
        aria-label="Chiudi notifica"
      >
        ×
      </button>
    </div>
  );
}

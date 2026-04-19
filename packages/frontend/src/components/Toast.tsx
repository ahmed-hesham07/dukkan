import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const config = {
  success: { bg: '#D1FAE5', border: '#A7F3D0', color: '#059669', icon: '✓' },
  error:   { bg: '#FEE2E2', border: '#FECACA', color: '#DC2626', icon: '✕' },
  info:    { bg: '#EDE9FE', border: '#DDD6FE', color: '#7C3AED', icon: 'i' },
};

export function Toast() {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3500);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  const c = config[toast.type];

  return (
    <div className="fixed top-4 inset-x-4 z-50 animate-slide-down" role="alert" onClick={clearToast}>
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          boxShadow: '0 4px 20px rgba(19,15,42,0.1)',
        }}
      >
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 text-white"
          style={{ background: c.color }}
        >
          {c.icon}
        </span>
        <span className="text-sm font-semibold flex-1" style={{ color: '#130F2A' }}>{toast.message}</span>
        <button style={{ color: '#9C94B8' }}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

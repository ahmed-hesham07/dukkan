import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

const config = {
  success: {
    border: 'rgba(16,185,129,0.4)',
    bg:     'rgba(16,185,129,0.12)',
    glow:   '0 0 30px rgba(16,185,129,0.25)',
    icon:   (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2"/>
        <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#10b981',
  },
  error: {
    border: 'rgba(247,37,133,0.4)',
    bg:     'rgba(247,37,133,0.12)',
    glow:   '0 0 30px rgba(247,37,133,0.25)',
    icon:   (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#f72585" strokeWidth="2"/>
        <path d="M12 8v4M12 16h.01" stroke="#f72585" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#f72585',
  },
  info: {
    border: 'rgba(124,58,237,0.4)',
    bg:     'rgba(124,58,237,0.12)',
    glow:   '0 0 30px rgba(124,58,237,0.25)',
    icon:   (
      <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#a855f7" strokeWidth="2"/>
        <path d="M12 16v-4M12 8h.01" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    color: '#a855f7',
  },
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
    <div
      className="fixed top-4 inset-x-4 z-50 animate-slide-down"
      role="alert"
      onClick={clearToast}
    >
      <div
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
        style={{
          background: `linear-gradient(135deg, ${c.bg} 0%, rgba(14,14,30,0.95) 100%)`,
          border: `1px solid ${c.border}`,
          boxShadow: `${c.glow}, 0 8px 32px rgba(0,0,0,0.5)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {c.icon}
        <span className="text-sm font-semibold text-white/90 flex-1">{toast.message}</span>
        <button className="text-white/30 hover:text-white/60 transition-colors">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

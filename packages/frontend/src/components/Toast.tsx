import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export function Toast() {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3000);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  const colors = {
    success: 'bg-success',
    error: 'bg-danger',
    info: 'bg-primary',
  };

  return (
    <div
      className={`fixed top-4 right-4 left-4 z-50 ${colors[toast.type]} text-white text-center
        py-3 px-4 rounded-xl shadow-lg font-semibold text-base animate-bounce-in`}
      role="alert"
    >
      {toast.message}
    </div>
  );
}

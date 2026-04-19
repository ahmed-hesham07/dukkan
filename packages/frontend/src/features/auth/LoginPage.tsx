import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { apiPost } from '../../api/client';
import type { AuthResponse, LoginInput } from '@dukkan/shared';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { lang, setLang } = useLanguageStore();
  const isAr = lang === 'ar';
  const [form, setForm] = useState<LoginInput>({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiPost<AuthResponse>('/auth/login', form);
      login(result.token, result.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? 'خطأ في تسجيل الدخول' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: 'linear-gradient(160deg, #F5F4FF 0%, #EDE9FE 50%, #FAF5FF 100%)' }}>

      <div className="w-full max-w-sm animate-fade-in">

        {/* Lang toggle */}
        <div className="flex justify-end mb-8">
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="flex items-center gap-2 text-sm font-bold px-3.5 py-2 rounded-full transition-all active:scale-95"
            style={{ background: '#FFFFFF', border: '1px solid #E2DFF0', color: '#7C3AED', boxShadow: '0 1px 6px rgba(124,58,237,0.1)' }}
          >
            <span>{isAr ? '🇬🇧' : '🇪🇬'}</span>
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 text-4xl"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)', boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}
          >
            🏪
          </div>
          <h1 className="text-4xl font-black mb-1" style={{ color: '#7C3AED' }}>
            {isAr ? 'دكان' : 'Dukkan'}
          </h1>
          <p className="text-sm font-medium" style={{ color: '#9C94B8' }}>
            {isAr ? 'نظام إدارة المحل' : 'Business Operations System'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 space-y-5"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 8px 40px rgba(124,58,237,0.12)' }}>
          <h2 className="text-xl font-black text-center" style={{ color: '#130F2A' }}>
            {isAr ? 'تسجيل الدخول' : 'Welcome back 👋'}
          </h2>

          {error && (
            <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold animate-scale-in"
              style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
                {isAr ? 'اسم المستخدم' : 'Username'}
              </label>
              <input
                className="input-field"
                type="text"
                autoComplete="username"
                placeholder={isAr ? 'ادخل اسم المستخدم' : 'Enter your username'}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input
                  className="input-field"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={isAr ? 'ادخل كلمة المرور' : 'Enter your password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading}
                  style={{ paddingInlineEnd: '3rem' }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 end-3.5 flex items-center transition-colors"
                  style={{ color: '#9C94B8' }}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass
                    ? <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    : <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary mt-2"
              disabled={loading || !form.username.trim() || !form.password}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {isAr ? 'جارٍ الدخول...' : 'Signing in...'}
                  </span>
                : (isAr ? 'دخول ←' : 'Sign In →')
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6 font-medium" style={{ color: '#9C94B8' }}>
          {isAr ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
          <Link to="/register" className="font-black" style={{ color: '#7C3AED' }}>
            {isAr ? 'إنشاء حساب' : 'Create one'}
          </Link>
        </p>
      </div>
    </div>
  );
}

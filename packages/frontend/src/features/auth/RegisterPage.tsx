import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { apiPost } from '../../api/client';
import type { AuthResponse, RegisterInput } from '@dukkan/shared';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { lang, setLang } = useLanguageStore();
  const isAr = lang === 'ar';
  const [form, setForm] = useState<RegisterInput>({ businessName: '', username: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const isValid =
    form.businessName.trim().length >= 2 &&
    form.username.trim().length >= 3 &&
    form.password.length >= 6 &&
    form.password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiPost<AuthResponse>('/auth/register', form);
      login(result.token, result.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : (isAr ? 'خطأ في إنشاء الحساب' : 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ show }: { show: boolean }) => show
    ? <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    : <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none"><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>;

  const FieldLabel = ({ text }: { text: string }) => (
    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">{text}</label>
  );

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
      style={{ background: '#080810' }}
    >
      <div
        className="absolute -top-32 -end-32 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(247,37,133,0.2) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="flex items-center gap-2 text-sm font-semibold text-white/70 px-3.5 py-2 rounded-full transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <span>{isAr ? '🇬🇧' : '🇪🇬'}</span>
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>

        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 text-4xl"
            style={{
              background: 'linear-gradient(135deg, #f72585 0%, #7c3aed 100%)',
              boxShadow: '0 0 40px rgba(247,37,133,0.4)',
            }}
          >
            ✨
          </div>
          <h1
            className="text-4xl font-black mb-1"
            style={{
              background: 'linear-gradient(135deg, #f72585 0%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {isAr ? 'دكان' : 'Dukkan'}
          </h1>
          <p className="text-white/40 text-sm font-medium">
            {isAr ? 'إنشاء حساب جديد لمحلك' : 'Create your business account'}
          </p>
        </div>

        <div
          className="rounded-3xl p-6 space-y-4"
          style={{
            background: 'rgba(20,20,42,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <h2 className="text-xl font-bold text-white text-center">
            {isAr ? 'إنشاء حساب' : 'Create Account'}
          </h2>

          {error && (
            <div
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold animate-scale-in"
              style={{
                background: 'rgba(247,37,133,0.12)',
                border: '1px solid rgba(247,37,133,0.3)',
                color: '#f72585',
              }}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel text={isAr ? 'اسم المحل / الشركة' : 'Business Name'} />
              <input className="input-field" type="text"
                placeholder={isAr ? 'مثال: محل أحمد للبقالة' : "e.g. Ahmed's Grocery"}
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                disabled={loading} autoFocus />
            </div>

            <div>
              <FieldLabel text={isAr ? 'اسم المستخدم' : 'Username'} />
              <input className="input-field" type="text" autoComplete="username"
                placeholder={isAr ? '3 أحرف على الأقل' : 'At least 3 characters'}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                disabled={loading} />
            </div>

            <div>
              <FieldLabel text={isAr ? 'كلمة المرور' : 'Password'} />
              <div className="relative">
                <input className="input-field" type={showPass ? 'text' : 'password'} autoComplete="new-password"
                  placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading} style={{ paddingInlineEnd: '3rem' }} />
                <button type="button"
                  className="absolute inset-y-0 end-3.5 flex items-center text-white/30 hover:text-white/60 transition-colors"
                  onClick={() => setShowPass(!showPass)}>
                  <EyeIcon show={showPass} />
                </button>
              </div>
            </div>

            <div>
              <FieldLabel text={isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'} />
              <input
                className="input-field"
                type={showPass ? 'text' : 'password'} autoComplete="new-password"
                placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter your password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                style={
                  confirmPassword && form.password !== confirmPassword
                    ? { borderColor: 'rgba(247,37,133,0.6)', boxShadow: '0 0 0 3px rgba(247,37,133,0.12)' }
                    : {}
                }
              />
              {confirmPassword && form.password !== confirmPassword && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: '#f72585' }}>
                  {isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary mt-2" disabled={!isValid || loading}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    {isAr ? 'جارٍ الإنشاء...' : 'Creating...'}
                  </span>
                : (isAr ? '✨ إنشاء الحساب' : '✨ Create Account')
              }
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/40 mt-6">
          {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <Link to="/login" className="font-bold" style={{ color: '#a855f7' }}>
            {isAr ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

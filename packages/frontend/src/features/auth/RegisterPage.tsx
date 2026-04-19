import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { apiPost } from '../../api/client';
import type { AuthResponse, RegisterInput } from '@dukkan/shared';
import { DukkanMark } from '../../components/DukkanLogo';

const EyeIcon = ({ show }: { show: boolean }) =>
  show
    ? <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    : <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /></svg>;

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

  return (
    <div className="min-h-screen flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Brand hero ── */}
      <div
        className="flex flex-col items-center justify-center pt-14 pb-10 px-6 relative"
        style={{ background: '#7C3AED', minHeight: '34vh' }}
      >
        {/* Language toggle */}
        <button
          onClick={() => setLang(isAr ? 'en' : 'ar')}
          className="absolute top-5 end-5 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          {isAr ? 'EN' : 'ع'}
        </button>

        <DukkanMark size={56} inverted />

        <p
          className="mt-3 font-black tracking-tight"
          style={{
            fontSize: 30,
            color: 'white',
            letterSpacing: isAr ? '0.01em' : '-0.03em',
            fontFamily: isAr ? 'Cairo, sans-serif' : 'Plus Jakarta Sans, sans-serif',
          }}
        >
          {isAr ? 'دكان' : 'Dukkan'}
        </p>
        <p className="text-xs mt-1 font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {isAr ? 'إنشاء حساب لمحلك' : 'Create your business account'}
        </p>
      </div>

      {/* ── Form panel ── */}
      <div
        className="flex-1 px-6 py-8"
        style={{
          background: '#FFFFFF',
          borderRadius: '28px 28px 0 0',
          marginTop: -24,
          boxShadow: '0 -4px 32px rgba(19,15,42,0.08)',
        }}
      >
        <h2 className="text-xl font-black mb-1" style={{ color: '#130F2A' }}>
          {isAr ? 'إنشاء حساب' : 'Create Account'}
        </h2>
        <p className="text-sm mb-6 font-medium" style={{ color: '#9C94B8' }}>
          {isAr ? 'سيستغرق هذا دقيقة واحدة فقط' : 'Takes less than a minute'}
        </p>

        {error && (
          <div
            className="flex items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold mb-4"
            style={{ background: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
              {isAr ? 'اسم المحل / الشركة' : 'Business Name'}
            </label>
            <input
              className="input-field"
              type="text"
              autoComplete="organization"
              placeholder={isAr ? 'مثال: محل أحمد للبقالة' : "e.g. Ahmed's Grocery"}
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
              {isAr ? 'اسم المستخدم' : 'Username'}
            </label>
            <input
              className="input-field"
              type="text"
              autoComplete="username"
              placeholder={isAr ? '3 أحرف على الأقل' : 'At least 3 characters'}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <input
                className="input-field"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
                style={{ paddingInlineEnd: '3rem' }}
              />
              <button
                type="button"
                className="absolute inset-y-0 end-3.5 flex items-center"
                style={{ color: '#9C94B8' }}
                onClick={() => setShowPass(!showPass)}
              >
                <EyeIcon show={showPass} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
              {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
            </label>
            <input
              className="input-field"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter your password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              style={
                confirmPassword && form.password !== confirmPassword
                  ? { borderColor: '#FECACA', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' }
                  : {}
              }
            />
            {confirmPassword && form.password !== confirmPassword && (
              <p className="text-xs mt-1.5 font-semibold" style={{ color: '#DC2626' }}>
                {isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary mt-2"
            disabled={!isValid || loading}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isAr ? 'جارٍ الإنشاء…' : 'Creating…'}
                </span>
              : isAr ? 'إنشاء الحساب' : 'Create Account'
            }
          </button>
        </form>

        <p className="text-center text-sm mt-6 font-medium" style={{ color: '#9C94B8' }}>
          {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
          <Link to="/login" className="font-black" style={{ color: '#7C3AED' }}>
            {isAr ? 'تسجيل الدخول' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

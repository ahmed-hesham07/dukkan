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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10"
      style={{ background: 'linear-gradient(160deg, #F5F4FF 0%, #EDE9FE 50%, #FAF5FF 100%)' }}>

      <div className="w-full max-w-sm animate-fade-in">

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="flex items-center gap-2 text-sm font-bold px-3.5 py-2 rounded-full transition-all active:scale-95"
            style={{ background: '#FFFFFF', border: '1px solid #E2DFF0', color: '#7C3AED', boxShadow: '0 1px 6px rgba(124,58,237,0.1)' }}
          >
            <span>{isAr ? '🇬🇧' : '🇪🇬'}</span>
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>

        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 text-4xl"
            style={{ background: 'linear-gradient(135deg, #EC4899 0%, #7C3AED 100%)', boxShadow: '0 8px 24px rgba(236,72,153,0.3)' }}>
            ✨
          </div>
          <h1 className="text-3xl font-black mb-1" style={{ color: '#7C3AED' }}>
            {isAr ? 'دكان' : 'Dukkan'}
          </h1>
          <p className="text-sm font-medium" style={{ color: '#9C94B8' }}>
            {isAr ? 'إنشاء حساب جديد لمحلك' : 'Create your business account'}
          </p>
        </div>

        <div className="rounded-3xl p-6 space-y-4"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6F5', boxShadow: '0 8px 40px rgba(124,58,237,0.12)' }}>
          <h2 className="text-xl font-black text-center" style={{ color: '#130F2A' }}>
            {isAr ? 'إنشاء حساب' : 'Create Account 🚀'}
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

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {[
              {
                label: isAr ? 'اسم المحل / الشركة' : 'Business Name',
                type: 'text', autoComplete: 'organization',
                placeholder: isAr ? 'مثال: محل أحمد للبقالة' : "e.g. Ahmed's Grocery",
                value: form.businessName,
                onChange: (v: string) => setForm({ ...form, businessName: v }),
                autoFocus: true,
              },
              {
                label: isAr ? 'اسم المستخدم' : 'Username',
                type: 'text', autoComplete: 'username',
                placeholder: isAr ? '3 أحرف على الأقل' : 'At least 3 characters',
                value: form.username,
                onChange: (v: string) => setForm({ ...form, username: v.toLowerCase() }),
              },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#9C94B8' }}>{f.label}</label>
                <input className="input-field" type={f.type} autoComplete={f.autoComplete}
                  placeholder={f.placeholder} value={f.value}
                  onChange={(e) => f.onChange(e.target.value)}
                  disabled={loading} autoFocus={f.autoFocus} />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <input className="input-field" type={showPass ? 'text' : 'password'} autoComplete="new-password"
                  placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={loading} style={{ paddingInlineEnd: '3rem' }} />
                <button type="button"
                  className="absolute inset-y-0 end-3.5 flex items-center transition-colors"
                  style={{ color: '#9C94B8' }}
                  onClick={() => setShowPass(!showPass)}>
                  <EyeIcon show={showPass} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: '#9C94B8' }}>
                {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <input
                className="input-field"
                type={showPass ? 'text' : 'password'} autoComplete="new-password"
                placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter your password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                style={confirmPassword && form.password !== confirmPassword
                  ? { borderColor: '#FECACA', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' } : {}}
              />
              {confirmPassword && form.password !== confirmPassword && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: '#DC2626' }}>
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
                : (isAr ? 'إنشاء الحساب ←' : 'Create Account →')
              }
            </button>
          </form>
        </div>

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

import { useLanguageStore } from '../store/useLanguageStore';

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguageStore();
  const isArabic = lang === 'ar';

  return (
    <button
      onClick={() => setLang(isArabic ? 'en' : 'ar')}
      className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all duration-200 active:scale-95 flex-shrink-0"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.7)',
      }}
      aria-label="Switch language"
    >
      <span>{isArabic ? '🇬🇧' : '🇪🇬'}</span>
      <span>{isArabic ? 'EN' : 'ع'}</span>
    </button>
  );
}

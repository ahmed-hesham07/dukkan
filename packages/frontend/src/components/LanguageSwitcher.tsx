import { useLanguageStore } from '../store/useLanguageStore';

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguageStore();
  const isArabic = lang === 'ar';

  return (
    <button
      onClick={() => setLang(isArabic ? 'en' : 'ar')}
      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-200 active:scale-95 flex-shrink-0"
      style={{
        background: '#EDE9FE',
        border: '1px solid #DDD6FE',
        color: '#7C3AED',
      }}
      aria-label="Switch language"
    >
      <span>{isArabic ? '🇬🇧' : '🇪🇬'}</span>
      <span>{isArabic ? 'EN' : 'ع'}</span>
    </button>
  );
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n/config';

export type Lang = 'ar' | 'en';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

/** Apply language to DOM and i18n — single source of truth */
function applyLang(lang: Lang): void {
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  i18n.changeLanguage(lang);
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      lang: 'ar',
      setLang: (lang) => {
        applyLang(lang);
        set({ lang });
      },
    }),
    { name: 'dukkan-lang', partialize: (s) => ({ lang: s.lang }) }
  )
);

/** Call once before React renders to restore persisted language with no flash */
export function initLanguage(): void {
  try {
    const raw = localStorage.getItem('dukkan-lang');
    const lang: Lang = raw ? (JSON.parse(raw)?.lang ?? 'ar') : 'ar';
    applyLang(lang);
  } catch {
    applyLang('ar');
  }
}

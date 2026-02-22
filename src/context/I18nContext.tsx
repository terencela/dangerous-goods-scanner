import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import translations, { type Language, type TranslationKey } from '../utils/translations';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LANG_KEY = 'zrh-lang';

function getInitialLang(): Language {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'de' || stored === 'en') return stored;
    const nav = navigator.language?.toLowerCase() || '';
    return nav.startsWith('de') ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLang);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

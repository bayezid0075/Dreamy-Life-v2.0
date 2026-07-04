import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import en from './en';
import bn from './bn';

export type Locale = 'en' | 'bn';
export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<string, string>> = { en, bn } as any;

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  t: (key) => key,
  setLocale: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dreamy-lang') as Locale | null;
      if (saved && (saved === 'en' || saved === 'bn')) {
        setLocaleState(saved);
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dreamy-lang', newLocale);
    }
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale]?.[key] || translations.en[key] || key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { en, bn };

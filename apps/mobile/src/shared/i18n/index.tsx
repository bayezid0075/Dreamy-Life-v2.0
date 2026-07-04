import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STORAGE_KEY = 'dreamy-lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'en' || saved === 'bn') {
        setLocaleState(saved);
      }
      setLoaded(true);
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale]?.[key] || translations.en[key] || key;
  }, [locale]);

  if (!loaded) return null;

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

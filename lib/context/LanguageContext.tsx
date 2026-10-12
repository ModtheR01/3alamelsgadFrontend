'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

export interface LocalizableEntity {
  name?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
  description?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
}

export function getLocalizedName(
  item: LocalizableEntity | null | undefined,
  language: Language = 'ar'
): string {
  if (!item) return '';
  if (language === 'ar') {
    return (item.name_ar || item.name || item.name_en || '').trim();
  }
  return (item.name_en || item.name || item.name_ar || '').trim();
}

export function getLocalizedDescription(
  item: LocalizableEntity | null | undefined,
  language: Language = 'ar'
): string {
  if (!item) return '';
  if (language === 'ar') {
    return (item.description_ar || item.description || item.description_en || '').trim();
  }
  return (item.description_en || item.description || item.description_ar || '').trim();
}

interface LanguageContextType {
  language: Language;
  direction: Direction;
  isRtl: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (arText: string, enText: string) => string;
  getName: (item: LocalizableEntity | null | undefined) => string;
  getDescription: (item: LocalizableEntity | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Arabic is the primary first-class default language for Alamelsgad
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('alamelsgad_lang') as Language;
        if (saved === 'ar' || saved === 'en') {
          return saved;
        }
      } catch {
        // Fallback to default
      }
    }
    return 'ar';
  });

  useEffect(() => {
    const dir: Direction = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    try {
      localStorage.setItem('alamelsgad_lang', language);
    } catch {
      // Ignore in private browsing
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (arText: string, enText: string): string => {
    return language === 'ar' ? arText : enText;
  };

  const getName = (item: LocalizableEntity | null | undefined): string => {
    return getLocalizedName(item, language);
  };

  const getDescription = (item: LocalizableEntity | null | undefined): string => {
    return getLocalizedDescription(item, language);
  };

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';
  const isRtl = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        isRtl,
        setLanguage,
        toggleLanguage,
        t,
        getName,
        getDescription,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

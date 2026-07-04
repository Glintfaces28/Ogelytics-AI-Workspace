import { createContext, useContext, useState } from 'react';
import en from '../i18n/en';
import de from '../i18n/de';

const translations = { en, de };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('lang') || 'en'
  );

  function switchLang(newLang) {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }

  // t() returns a translation string (or calls a function key with args)
  function t(key, ...args) {
    const dict = translations[lang] || translations.en;
    const val = dict[key] ?? translations.en[key] ?? key;
    return typeof val === 'function' ? val(...args) : val;
  }

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

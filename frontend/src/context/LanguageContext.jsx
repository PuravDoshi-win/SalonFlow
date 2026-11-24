import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../i18n/en.json';
import gu from '../i18n/gu.json';

const LanguageContext = createContext(null);

const translations = { en, gu };

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('salonflow_lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'gu' : 'en';
    setLang(nextLang);
    localStorage.setItem('salonflow_lang', nextLang);
  };

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('salonflow_lang', newLang);
  };

  // Helper function to resolve nested keys like "home.welcome"
  const t = (path) => {
    const keys = path.split('.');
    let current = translations[lang];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations['en'];
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import ptTranslation from './locales/pt/translation.json';
import enTranslation from './locales/en/translation.json';
import esTranslation from './locales/es/translation.json';
import frTranslation from './locales/fr/translation.json';
import deTranslation from './locales/de/translation.json';
import itTranslation from './locales/it/translation.json';

const resources = {
  pt: {
    translation: ptTranslation
  },
  en: {
    translation: enTranslation
  },
  es: {
    translation: esTranslation
  },
  fr: {
    translation: frTranslation
  },
  de: {
    translation: deTranslation
  },
  it: {
    translation: itTranslation
  }
};

// Get device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'pt', // Portuguese as fallback
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false // React already does escaping
    },

    react: {
      useSuspense: false // Disable suspense for better compatibility
    }
  });

export default i18n;


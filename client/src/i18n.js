import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      welcome: 'Welcome to HAKGROS UZHAVAN',
      weather: 'Weather',
      market: 'Market',
      ask_ai: 'Ask AI Advisor',
      placeholder: 'Ask for crop advice, weather, or market guidance...',
      submit: 'Get Advice'
    }
  },
  ta: {
    translation: {
      welcome: 'HAKGROS UZHAVANக்கு வரவேற்கிறோம்',
      weather: 'வானிலை',
      market: 'சந்தை',
      ask_ai: 'AI ஆலோசகரிடம் கேளுங்கள்',
      placeholder: 'பயிர் ஆலோசனை, வானிலை அல்லது சந்தை வழிகாட்டுதல் கேளுங்கள்...',
      submit: 'ஆலோசனை பெறுங்கள்'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

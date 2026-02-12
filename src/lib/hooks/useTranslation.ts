import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { translations, Language } from '../i18n';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => any;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      language: 'en' as Language,
      setLanguage: (language: Language) => set({ language }),
      t: (key: string) => {
        const { language } = get();
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
          value = value?.[k];
        }

        return value || key;
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
    }
  )
);

export const useTranslation = () => {
  const { language, setLanguage, t } = useLanguageStore();
  return { language, setLanguage, t };
};

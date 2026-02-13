import { useLanguage } from '@/contexts/LanguageContext';

export function useLocale() {
  const { locale, t } = useLanguage();
  
  return { t, locale };
}

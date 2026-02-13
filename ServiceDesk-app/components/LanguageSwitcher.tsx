'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { locales, localeNames, localeFlags, Locale } from '@/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button data-testid="language-switcher" variant="ghost" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="hidden md:inline">{localeFlags[locale]} {localeNames[locale]}</span>
          <span className="md:hidden">{localeFlags[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((lang) => (
          <DropdownMenuItem
            key={lang}
            data-testid={`lang-${lang}`}
            onClick={() => setLocale(lang as Locale)}
            className={`cursor-pointer ${locale === lang ? 'bg-gray-100' : ''}`}
          >
            <span className="mr-2">{localeFlags[lang]}</span>
            {localeNames[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

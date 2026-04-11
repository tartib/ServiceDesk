'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, defaultLocale, locales, isRTL } from '@/i18n/config';

import enRoot from '@/locales/en.json';
import arRoot from '@/locales/ar.json';
import enCommon from '@/locales/en/common.json';
import arCommon from '@/locales/ar/common.json';
import enDashboard from '@/locales/en/dashboard.json';
import arDashboard from '@/locales/ar/dashboard.json';
import enReports from '@/locales/en/reports.json';
import arReports from '@/locales/ar/reports.json';
import enUsers from '@/locales/en/users.json';
import arUsers from '@/locales/ar/users.json';
import enItsm from '@/locales/en/itsm.json';
import arItsm from '@/locales/ar/itsm.json';
import enInventory from '@/locales/en/inventory.json';
import arInventory from '@/locales/ar/inventory.json';
import enCategories from '@/locales/en/categories.json';
import arCategories from '@/locales/ar/categories.json';
import enRoadmap from '@/locales/en/roadmap.json';
import arRoadmap from '@/locales/ar/roadmap.json';
import enProjects from '@/locales/en/projects.json';
import arProjects from '@/locales/ar/projects.json';
import enSettings from '@/locales/en/settings.json';
import arSettings from '@/locales/ar/settings.json';
import enProfile from '@/locales/en/profile.json';
import arProfile from '@/locales/ar/profile.json';
import enDrive from '@/locales/en/drive.json';
import arDrive from '@/locales/ar/drive.json';
import enWorkflows from '@/locales/en/workflows.json';
import arWorkflows from '@/locales/ar/workflows.json';
import enVacations from '@/locales/en/vacations.json';
import arVacations from '@/locales/ar/vacations.json';
import enIntake from '@/locales/en/intake.json';
import arIntake from '@/locales/ar/intake.json';
import enPortfolio from '@/locales/en/portfolio.json';
import arPortfolio from '@/locales/ar/portfolio.json';
import frRoot from '@/locales/fr.json';
import frCommon from '@/locales/fr/common.json';
import frDashboard from '@/locales/fr/dashboard.json';
import frReports from '@/locales/fr/reports.json';
import frUsers from '@/locales/fr/users.json';
import frItsm from '@/locales/fr/itsm.json';
import frInventory from '@/locales/fr/inventory.json';
import frCategories from '@/locales/fr/categories.json';
import frRoadmap from '@/locales/fr/roadmap.json';
import frProjects from '@/locales/fr/projects.json';
import frSettings from '@/locales/fr/settings.json';
import frProfile from '@/locales/fr/profile.json';
import frDrive from '@/locales/fr/drive.json';
import frWorkflows from '@/locales/fr/workflows.json';
import frVacations from '@/locales/fr/vacations.json';
import frIntake from '@/locales/fr/intake.json';
import frPortfolio from '@/locales/fr/portfolio.json';
import enAgentConsole from '@/locales/en/agent-console.json';
import arAgentConsole from '@/locales/ar/agent-console.json';
import frAgentConsole from '@/locales/fr/agent-console.json';
import enNotifications from '@/locales/en/notifications.json';
import arNotifications from '@/locales/ar/notifications.json';
import frNotifications from '@/locales/fr/notifications.json';

type Messages = typeof enRoot & typeof enCommon & typeof enDashboard & typeof enReports & typeof enUsers & typeof enItsm & typeof enInventory & typeof enCategories & typeof enRoadmap & typeof enProjects & typeof enSettings & typeof enProfile & typeof enDrive & typeof enWorkflows & typeof enVacations & typeof enIntake & typeof enPortfolio & typeof enAgentConsole & typeof enNotifications;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(...objects: Record<string, any>[]): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (
        result[key] &&
        typeof result[key] === 'object' &&
        !Array.isArray(result[key]) &&
        typeof obj[key] === 'object' &&
        !Array.isArray(obj[key])
      ) {
        result[key] = deepMerge(result[key], obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

const messages: Record<Locale, Messages> = {
  en: deepMerge(enRoot, enCommon, enDashboard, enReports, enUsers, enItsm, enInventory, enCategories, enRoadmap, enProjects, enSettings, enProfile, enDrive, enWorkflows, enVacations, enIntake, enPortfolio, enAgentConsole, enNotifications) as Messages,
  ar: deepMerge(arRoot, arCommon, arDashboard, arReports, arUsers, arItsm, arInventory, arCategories, arRoadmap, arProjects, arSettings, arProfile, arDrive, arWorkflows, arVacations, arIntake, arPortfolio, arAgentConsole, arNotifications) as Messages,
  fr: deepMerge(frRoot, frCommon, frDashboard, frReports, frUsers, frItsm, frInventory, frCategories, frRoadmap, frProjects, frSettings, frProfile, frDrive, frWorkflows, frVacations, frIntake, frPortfolio, frAgentConsole, frNotifications) as Messages,
};

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  messages: Messages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && (locales as readonly string[]).includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Update document direction and lang attribute
      document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
      document.documentElement.lang = locale;
      // Save to localStorage
      localStorage.setItem('locale', locale);
    }
  }, [locale, mounted]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = messages[locale];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider 
      value={{ 
        locale, 
        setLocale, 
        t,
        messages: messages[locale]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

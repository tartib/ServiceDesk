'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocale } from '@/hooks/useLocale';
import { locales, localeNames, localeFlags, Locale } from '@/i18n/config';
import { Settings, Globe, Bell, Palette, Monitor, Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

export default function SettingsPage() {
  const { locale, setLocale } = useLanguage();
  const { t } = useLocale();
  const [theme, setTheme] = useState<Theme>('light');
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    incidents: true,
    tasks: true,
    mentions: true,
  });

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const themeOptions: { value: Theme; labelKey: string; icon: React.ReactNode }[] = [
    { value: 'light', labelKey: 'settings.themeLight', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', labelKey: 'settings.themeDark', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', labelKey: 'settings.themeSystem', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-7 w-7" />
            {t('settings.title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('settings.language')}
            </CardTitle>
            <CardDescription>
              {t('settings.languageDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {locales.map((lang) => (
                <Button
                  key={lang}
                  variant={locale === lang ? 'default' : 'outline'}
                  onClick={() => setLocale(lang as Locale)}
                  className="gap-2"
                >
                  <span>{localeFlags[lang]}</span>
                  {localeNames[lang]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.appearance')}
            </CardTitle>
            <CardDescription>
              {t('settings.appearanceDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {themeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={theme === option.value ? 'default' : 'outline'}
                  onClick={() => setTheme(option.value)}
                  className="gap-2"
                >
                  {option.icon}
                  {t(option.labelKey)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('settings.notifications')}
            </CardTitle>
            <CardDescription>
              {t('settings.notificationsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{t('settings.emailNotifications')}</div>
                <div className="text-sm text-gray-500">{t('settings.emailNotificationsDesc')}</div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={() => handleNotificationChange('email')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{t('settings.browserNotifications')}</div>
                <div className="text-sm text-gray-500">{t('settings.browserNotificationsDesc')}</div>
              </div>
              <Switch
                checked={notifications.browser}
                onCheckedChange={() => handleNotificationChange('browser')}
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium text-gray-700 mb-3">{t('settings.notificationTypes')}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{t('settings.incidents')}</div>
                <div className="text-sm text-gray-500">{t('settings.incidentsDesc')}</div>
              </div>
              <Switch
                checked={notifications.incidents}
                onCheckedChange={() => handleNotificationChange('incidents')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{t('settings.tasks')}</div>
                <div className="text-sm text-gray-500">{t('settings.tasksDesc')}</div>
              </div>
              <Switch
                checked={notifications.tasks}
                onCheckedChange={() => handleNotificationChange('tasks')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium">{t('settings.mentions')}</div>
                <div className="text-sm text-gray-500">{t('settings.mentionsDesc')}</div>
              </div>
              <Switch
                checked={notifications.mentions}
                onCheckedChange={() => handleNotificationChange('mentions')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

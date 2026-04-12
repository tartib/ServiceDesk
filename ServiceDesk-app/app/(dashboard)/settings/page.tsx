'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocale } from '@/hooks/useLocale';
import { locales, localeNames, localeFlags, Locale } from '@/i18n/config';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useBrandSettings, useSaveBrandSettings, useResetBrandSettings } from '@/hooks/useBrandSettings';
import { DEFAULT_BRAND_KIT } from '@/lib/domains/settings/api';
import {
  Settings,
  Globe,
  Bell,
  Palette,
  Monitor,
  Moon,
  Sun,
  Check,
  Image as ImageIcon,
  Save,
  RotateCcw,
} from 'lucide-react';

export default function SettingsPage() {
 const { locale, setLocale } = useLanguage();
 const { t } = useLocale();
 const { theme, setTheme } = useTheme();
 const [mounted, setMounted] = useState(false);
 const [notifications, setNotifications] = useState({
 email: true,
 browser: true,
 incidents: true,
 tasks: true,
 mentions: true,
 });

  const { data: savedSettings } = useBrandSettings();
  const saveMutation = useSaveBrandSettings();
  const resetMutation = useResetBrandSettings();

  const [brandKit, setBrandKit] = useState(DEFAULT_BRAND_KIT);
  const [themeOverrides, setThemeOverrides] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const probeRef = useRef<HTMLDivElement | null>(null);

  const cssVarToHex = useCallback((token: string): string => {
    if (themeOverrides[token]) return themeOverrides[token];
    if (typeof window === 'undefined') return '#888888';
    const probe = probeRef.current ?? document.createElement('div');
    if (!probeRef.current) {
      probe.style.display = 'none';
      document.body.appendChild(probe);
      probeRef.current = probe;
    }
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (!raw) return '#888888';
    probe.style.color = raw;
    const rgb = getComputedStyle(probe).color;
    const m = rgb.match(/\d+/g);
    if (!m) return '#888888';
    return '#' + m.slice(0, 3).map((v) => Number(v).toString(16).padStart(2, '0')).join('');
  }, [themeOverrides]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (savedSettings) {
      setBrandKit(savedSettings.brandKit);
      setThemeOverrides(savedSettings.themeOverrides);
      return;
    }
    // Offline fallback: load from localStorage
    try {
      const saved = localStorage.getItem('brandKit');
      if (saved) setBrandKit(JSON.parse(saved));
      const savedOverrides = localStorage.getItem('themeOverrides');
      if (savedOverrides) setThemeOverrides(JSON.parse(savedOverrides));
    } catch {}
  }, [savedSettings]);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(themeOverrides).forEach(([token, value]) => {
      root.style.setProperty(token, value);
    });
  }, [themeOverrides]);

  const handleBrandKitChange = useCallback(
    (key: keyof typeof DEFAULT_BRAND_KIT, value: string) => {
      setBrandKit((prev) => ({ ...prev, [key]: value }));
      setIsDirty(true);
    },
    [],
  );

  const handleThemeOverride = useCallback((token: string, value: string) => {
    setThemeOverrides((prev) => ({ ...prev, [token]: value }));
    setIsDirty(true);
  }, []);

  const handleSaveBrandKit = useCallback(() => {
    saveMutation.mutate(
      { brandKit, themeOverrides },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast.success(t('settings.brandSaved'));
        },
        onError: () => {
          // Fallback: persist to localStorage
          localStorage.setItem('brandKit', JSON.stringify(brandKit));
          localStorage.setItem('themeOverrides', JSON.stringify(themeOverrides));
          setIsDirty(false);
          toast.success(t('settings.brandSaved'));
        },
      },
    );
  }, [brandKit, themeOverrides, t, saveMutation]);

  const handleResetBrandKit = useCallback(() => {
    const root = document.documentElement;
    Object.keys(themeOverrides).forEach((token) => {
      root.style.removeProperty(token);
    });
    setBrandKit(DEFAULT_BRAND_KIT);
    setThemeOverrides({});
    setIsDirty(false);
    resetMutation.mutate(undefined, {
      onSuccess: () => toast.info(t('settings.brandReset')),
      onError: () => {
        localStorage.removeItem('brandKit');
        localStorage.removeItem('themeOverrides');
        toast.info(t('settings.brandReset'));
      },
    });
  }, [themeOverrides, t, resetMutation]);

 const handleNotificationChange = (key: keyof typeof notifications) => {
 setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
 };

 return (
 <DashboardLayout>
 <div className="max-w-4xl mx-auto space-y-6">
 <div>
 <h1 className="text-3xl font-bold flex items-center gap-2">
 <Settings className="h-7 w-7" />
 {t('settings.title')}
 </h1>
 <p className="text-muted-foreground mt-1">
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
 <div className="grid grid-cols-3 gap-4">
 {/* Light Theme Card */}
 <button
 onClick={() => setTheme('light')}
 className={`group relative rounded-xl border-2 p-1 transition-all hover:border-brand-border ${
 mounted && theme === 'light' ? 'border-brand ring-2 ring-brand-border' : 'border-border'
 }`}
 >
 <div className="overflow-hidden rounded-lg">
 {/* Mini app preview - Light */}
 <div className="flex h-24 bg-[#f8f9fa]">
 <div className="w-8 bg-white border-r border-[#e5e7eb] flex flex-col items-center pt-2 gap-1.5">
 <div className="w-4 h-1 rounded-full bg-[#3b82f6]" />
 <div className="w-4 h-1 rounded-full bg-[#d1d5db]" />
 <div className="w-4 h-1 rounded-full bg-[#d1d5db]" />
 <div className="w-4 h-1 rounded-full bg-[#d1d5db]" />
 </div>
 <div className="flex-1 flex flex-col">
 <div className="h-4 bg-white border-b border-[#e5e7eb] flex items-center px-1.5">
 <div className="w-6 h-1 rounded-full bg-[#d1d5db]" />
 </div>
 <div className="flex-1 p-2 space-y-1.5">
 <div className="h-1.5 w-3/4 rounded-full bg-[#d1d5db]" />
 <div className="h-1.5 w-1/2 rounded-full bg-[#e5e7eb]" />
 <div className="flex gap-1 mt-2">
 <div className="h-5 w-8 rounded bg-white border border-[#e5e7eb]" />
 <div className="h-5 w-8 rounded bg-white border border-[#e5e7eb]" />
 </div>
 </div>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-center gap-1.5 py-2">
 <Sun className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="text-sm font-medium">{t('settings.themeLight')}</span>
 {mounted && theme === 'light' && <Check className="h-3.5 w-3.5 text-brand" />}
 </div>
 </button>

 {/* Dark Theme Card */}
 <button
 onClick={() => setTheme('dark')}
 className={`group relative rounded-xl border-2 p-1 transition-all hover:border-brand-border ${
 mounted && theme === 'dark' ? 'border-brand ring-2 ring-brand-border' : 'border-border'
 }`}
 >
 <div className="overflow-hidden rounded-lg">
 {/* Mini app preview - Dark */}
 <div className="flex h-24 bg-[#1a1a2e]">
 <div className="w-8 bg-[#16213e] border-r border-[#2a2a4a] flex flex-col items-center pt-2 gap-1.5">
 <div className="w-4 h-1 rounded-full bg-[#6366f1]" />
 <div className="w-4 h-1 rounded-full bg-[#3a3a5c]" />
 <div className="w-4 h-1 rounded-full bg-[#3a3a5c]" />
 <div className="w-4 h-1 rounded-full bg-[#3a3a5c]" />
 </div>
 <div className="flex-1 flex flex-col">
 <div className="h-4 bg-[#16213e] border-b border-[#2a2a4a] flex items-center px-1.5">
 <div className="w-6 h-1 rounded-full bg-[#3a3a5c]" />
 </div>
 <div className="flex-1 p-2 space-y-1.5">
 <div className="h-1.5 w-3/4 rounded-full bg-[#3a3a5c]" />
 <div className="h-1.5 w-1/2 rounded-full bg-[#2a2a4a]" />
 <div className="flex gap-1 mt-2">
 <div className="h-5 w-8 rounded bg-[#16213e] border border-[#2a2a4a]" />
 <div className="h-5 w-8 rounded bg-[#16213e] border border-[#2a2a4a]" />
 </div>
 </div>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-center gap-1.5 py-2">
 <Moon className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="text-sm font-medium">{t('settings.themeDark')}</span>
 {mounted && theme === 'dark' && <Check className="h-3.5 w-3.5 text-brand" />}
 </div>
 </button>

 {/* System Theme Card */}
 <button
 onClick={() => setTheme('system')}
 className={`group relative rounded-xl border-2 p-1 transition-all hover:border-brand-border ${
 mounted && theme === 'system' ? 'border-brand ring-2 ring-brand-border' : 'border-border'
 }`}
 >
 <div className="overflow-hidden rounded-lg">
 {/* Mini app preview - Split */}
 <div className="flex h-24">
 {/* Left half - Light */}
 <div className="w-1/2 flex bg-[#f8f9fa]">
 <div className="w-4 bg-white border-r border-[#e5e7eb] flex flex-col items-center pt-2 gap-1">
 <div className="w-2.5 h-0.5 rounded-full bg-[#3b82f6]" />
 <div className="w-2.5 h-0.5 rounded-full bg-[#d1d5db]" />
 <div className="w-2.5 h-0.5 rounded-full bg-[#d1d5db]" />
 </div>
 <div className="flex-1 flex flex-col">
 <div className="h-3 bg-white border-b border-[#e5e7eb]" />
 <div className="flex-1 p-1.5 space-y-1">
 <div className="h-1 w-3/4 rounded-full bg-[#d1d5db]" />
 <div className="h-1 w-1/2 rounded-full bg-[#e5e7eb]" />
 </div>
 </div>
 </div>
 {/* Right half - Dark */}
 <div className="w-1/2 flex bg-[#1a1a2e]">
 <div className="flex-1 flex flex-col">
 <div className="h-3 bg-[#16213e] border-b border-[#2a2a4a]" />
 <div className="flex-1 p-1.5 space-y-1">
 <div className="h-1 w-3/4 rounded-full bg-[#3a3a5c]" />
 <div className="h-1 w-1/2 rounded-full bg-[#2a2a4a]" />
 </div>
 </div>
 <div className="w-4 bg-[#16213e] border-l border-[#2a2a4a] flex flex-col items-center pt-2 gap-1">
 <div className="w-2.5 h-0.5 rounded-full bg-[#6366f1]" />
 <div className="w-2.5 h-0.5 rounded-full bg-[#3a3a5c]" />
 <div className="w-2.5 h-0.5 rounded-full bg-[#3a3a5c]" />
 </div>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-center gap-1.5 py-2">
 <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="text-sm font-medium">{t('settings.themeSystem')}</span>
 {mounted && theme === 'system' && <Check className="h-3.5 w-3.5 text-brand" />}
 </div>
 </button>
 </div>
 </CardContent>
 </Card>

 {/* Brand & Assets Kit */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <ImageIcon className="h-5 w-5" />
 {t('settings.brandAssets')}
 </CardTitle>
 <CardDescription>
 {t('settings.brandAssetsDescription')}
 </CardDescription>
 </CardHeader>

 <CardContent className="space-y-6">
 <Tabs defaultValue="customize">
 <TabsList>
 <TabsTrigger value="customize">{t('settings.tabCustomize')}</TabsTrigger>
 <TabsTrigger value="palette">{t('settings.tabPalette')}</TabsTrigger>
 </TabsList>

 {/* ── Tab: Customize ── */}
 <TabsContent value="customize" className="space-y-6 pt-2">
 <div className="grid gap-4 md:grid-cols-2">
 <div className="space-y-2">
 <Label htmlFor="brandName">{t('settings.brandName')}</Label>
 <Input
 id="brandName"
 value={brandKit.brandName}
 onChange={(e) => handleBrandKitChange('brandName', e.target.value)}
 placeholder="Acme"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="logoUrl">{t('settings.logoUrl')}</Label>
 <Input
 id="logoUrl"
 value={brandKit.logoUrl}
 onChange={(e) => handleBrandKitChange('logoUrl', e.target.value)}
 placeholder="https://example.com/logo.svg"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="faviconUrl">{t('settings.faviconUrl')}</Label>
 <Input
 id="faviconUrl"
 value={brandKit.faviconUrl}
 onChange={(e) => handleBrandKitChange('faviconUrl', e.target.value)}
 placeholder="https://example.com/favicon.ico"
 />
 </div>

 <div className="space-y-2">
 <Label htmlFor="primaryColor">{t('settings.primaryColor')}</Label>
 <div className="flex gap-2">
 <Input
 id="primaryColor"
 type="color"
 value={brandKit.primaryColor}
 onChange={(e) => handleBrandKitChange('primaryColor', e.target.value)}
 className="h-10 w-16 p-1"
 />
 <Input
 value={brandKit.primaryColor}
 onChange={(e) => handleBrandKitChange('primaryColor', e.target.value)}
 />
 </div>
 </div>

 <div className="space-y-2 md:col-span-2">
 <Label htmlFor="accentColor">{t('settings.accentColor')}</Label>
 <div className="flex gap-2">
 <Input
 id="accentColor"
 type="color"
 value={brandKit.accentColor}
 onChange={(e) => handleBrandKitChange('accentColor', e.target.value)}
 className="h-10 w-16 p-1"
 />
 <Input
 value={brandKit.accentColor}
 onChange={(e) => handleBrandKitChange('accentColor', e.target.value)}
 />
 </div>
 </div>
 </div>

 <div className="rounded-xl border p-4 space-y-3">
 <div className="text-sm font-medium">
 {brandKit.brandName || 'Brand Preview'}
 </div>
 <div className="flex items-center gap-3">
 <div
 className="h-10 w-10 rounded-lg border"
 style={{ backgroundColor: brandKit.primaryColor }}
 />
 <div className="flex-1">
 <div className="h-2 rounded-full" style={{ backgroundColor: brandKit.primaryColor }} />
 <div className="mt-2 h-2 w-2/3 rounded-full" style={{ backgroundColor: brandKit.accentColor }} />
 </div>
 </div>
 </div>
 </TabsContent>

 {/* ── Tab: Palette ── */}
 <TabsContent value="palette" className="space-y-6 pt-2">
 <p className="text-xs text-muted-foreground">{t('settings.paletteEditable')}</p>

 <div className="space-y-3">
 <p className="text-sm font-medium">{t('settings.brandColours')}</p>
 <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
 {[
 { token: '--brand', label: 'brand' },
 { token: '--brand-strong', label: 'brand-strong' },
 { token: '--brand-foreground', label: 'brand-fg' },
 { token: '--brand-surface', label: 'brand-surface' },
 { token: '--brand-soft', label: 'brand-soft' },
 { token: '--brand-border', label: 'brand-border' },
 ].map(({ token, label }) => (
 <label key={token} className="flex flex-col items-center gap-1.5 cursor-pointer group">
 <div className="relative h-10 w-10">
 <div
 className="absolute inset-0 rounded-lg border shadow-sm transition-shadow group-hover:ring-2 group-hover:ring-brand-border"
 style={{ backgroundColor: themeOverrides[token] || `var(${token})` }}
 />
 <input
 type="color"
 className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
 value={cssVarToHex(token)}
 onChange={(e) => handleThemeOverride(token, e.target.value)}
 />
 </div>
 <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
 </label>
 ))}
 </div>
 </div>

 <div className="space-y-3">
 <p className="text-sm font-medium">{t('settings.statusColours')}</p>
 <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
 {[
 { token: '--destructive', label: 'destructive' },
 { token: '--destructive-soft', label: 'destr-soft' },
 { token: '--success', label: 'success' },
 { token: '--success-soft', label: 'success-soft' },
 { token: '--warning', label: 'warning' },
 { token: '--warning-soft', label: 'warn-soft' },
 { token: '--info', label: 'info' },
 { token: '--info-soft', label: 'info-soft' },
 ].map(({ token, label }) => (
 <label key={token} className="flex flex-col items-center gap-1.5 cursor-pointer group">
 <div className="relative h-10 w-10">
 <div
 className="absolute inset-0 rounded-lg border shadow-sm transition-shadow group-hover:ring-2 group-hover:ring-brand-border"
 style={{ backgroundColor: themeOverrides[token] || `var(${token})` }}
 />
 <input
 type="color"
 className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
 value={cssVarToHex(token)}
 onChange={(e) => handleThemeOverride(token, e.target.value)}
 />
 </div>
 <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
 </label>
 ))}
 </div>
 </div>

 <div className="space-y-3">
 <p className="text-sm font-medium">{t('settings.neutralColours')}</p>
 <div className="grid grid-cols-4 gap-3">
 {[
 { token: '--primary', label: 'primary' },
 { token: '--muted', label: 'muted' },
 { token: '--muted-foreground', label: 'muted-fg' },
 { token: '--border', label: 'border' },
 ].map(({ token, label }) => (
 <label key={token} className="flex flex-col items-center gap-1.5 cursor-pointer group">
 <div className="relative h-10 w-10">
 <div
 className="absolute inset-0 rounded-lg border shadow-sm transition-shadow group-hover:ring-2 group-hover:ring-brand-border"
 style={{ backgroundColor: themeOverrides[token] || `var(${token})` }}
 />
 <input
 type="color"
 className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
 value={cssVarToHex(token)}
 onChange={(e) => handleThemeOverride(token, e.target.value)}
 />
 </div>
 <span className="text-[10px] text-muted-foreground leading-tight text-center">{label}</span>
 </label>
 ))}
 </div>
 </div>
 </TabsContent>
 </Tabs>

 <div className="flex items-center gap-3 border-t pt-4">
 <Button onClick={handleSaveBrandKit} disabled={!isDirty} className="gap-2">
 <Save className="h-4 w-4" />
 {t('settings.save')}
 </Button>
 <Button variant="outline" onClick={handleResetBrandKit} className="gap-2">
 <RotateCcw className="h-4 w-4" />
 {t('settings.reset')}
 </Button>
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
 <div className="text-sm text-muted-foreground">{t('settings.emailNotificationsDesc')}</div>
 </div>
 <Switch
 checked={notifications.email}
 onCheckedChange={() => handleNotificationChange('email')}
 />
 </div>

 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="font-medium">{t('settings.browserNotifications')}</div>
 <div className="text-sm text-muted-foreground">{t('settings.browserNotificationsDesc')}</div>
 </div>
 <Switch
 checked={notifications.browser}
 onCheckedChange={() => handleNotificationChange('browser')}
 />
 </div>

 <div className="border-t pt-4 mt-4">
 <p className="text-sm font-medium text-foreground mb-3">{t('settings.notificationTypes')}</p>
 </div>

 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="font-medium">{t('settings.incidents')}</div>
 <div className="text-sm text-muted-foreground">{t('settings.incidentsDesc')}</div>
 </div>
 <Switch
 checked={notifications.incidents}
 onCheckedChange={() => handleNotificationChange('incidents')}
 />
 </div>

 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="font-medium">{t('settings.tasks')}</div>
 <div className="text-sm text-muted-foreground">{t('settings.tasksDesc')}</div>
 </div>
 <Switch
 checked={notifications.tasks}
 onCheckedChange={() => handleNotificationChange('tasks')}
 />
 </div>

 <div className="flex items-center justify-between">
 <div className="flex-1">
 <div className="font-medium">{t('settings.mentions')}</div>
 <div className="text-sm text-muted-foreground">{t('settings.mentionsDesc')}</div>
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

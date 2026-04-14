'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useLogin } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Eye, EyeOff, ChevronDown } from 'lucide-react';

type LoginFormData = { email: string; password: string; rememberMe?: boolean };

const DEV_ACCOUNTS = [
  { label: 'Admin', email: 'admin@servicedesk.com', password: 'Admin@123' },
  { label: 'Supervisor', email: 'supervisor@servicedesk.com', password: 'Super@123' },
  { label: 'Member', email: 'ahmed.alfarsi@servicedesk.com', password: 'Member@123' },
];

const isDev = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
 const [error, setError] = useState<string>('');
 const [showPassword, setShowPassword] = useState(false);
 const [showDevCreds, setShowDevCreds] = useState(false);
 const [brandName, setBrandName] = useState<string>('');

 useEffect(() => {
   try {
     const stored = localStorage.getItem('brandKit');
     if (stored) {
       const parsed = JSON.parse(stored);
       if (parsed?.brandName) setBrandName(parsed.brandName);
     }
   } catch {}
 }, []);
 const { mutate: login, isPending } = useLogin();
 const { t } = useLanguage();

 const loginSchema = useMemo(() => z.object({
 email: z.string().email(t('validation.invalidEmail')),
 password: z.string().min(6, t('validation.passwordMinLength')),
 rememberMe: z.boolean().optional(),
 }), [t]);

 const {
 register,
 handleSubmit,
 setValue,
 formState: { errors },
 } = useForm<LoginFormData>({
 resolver: zodResolver(loginSchema),
 });

 const onSubmit = (data: LoginFormData) => {
 setError('');
 // Trim whitespace from inputs to prevent authentication issues
 const trimmedData = {
 email: data.email.trim(),
 password: data.password.trim(),
 rememberMe: data.rememberMe,
 };
 login(trimmedData, {
 onError: (err: Error & { response?: { data?: { error?: string; message?: string } } }) => {
 setError(err.response?.data?.error || err.response?.data?.message || t('auth.loginFailed'));
 },
 });
 };

 return (
 <div className="h-screen flex items-center justify-center bg-muted px-4">
 <Card className="w-full max-w-md">
 <CardHeader className="space-y-1">
 <CardTitle className="text-2xl font-bold text-center">{t('auth.welcomeBack')}</CardTitle>
 <CardDescription className="text-center">
 {t('auth.signIn')} {brandName || t('app.name')}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <form data-testid="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 {error && (
 <div data-testid="login-error" className="flex items-center gap-2 text-sm text-destructive bg-destructive-soft p-3 rounded-md">
 <AlertCircle className="h-4 w-4" />
 <span>{error}</span>
 </div>
 )}

 <div className="space-y-2">
 <Label htmlFor="email">{t('auth.email')}</Label>
 <Input
 id="email"
 data-testid="email-input"
 type="email"
 placeholder="you@example.com"
 {...register('email')}
 disabled={isPending}
 />
 {errors.email && (
 <p data-testid="email-error" className="text-sm text-destructive">{errors.email.message}</p>
 )}
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label htmlFor="password">{t('auth.password')}</Label>
 <Link data-testid="forgot-password-link" href="/forgot-password" className="text-sm text-brand hover:underline">
 {t('auth.forgotPassword')}
 </Link>
 </div>
 <div className="relative">
 <Input
 id="password"
 data-testid="password-input"
 type={showPassword ? 'text' : 'password'}
 placeholder="••••••••"
 {...register('password')}
 disabled={isPending}
 />
 <button
 type="button"
 data-testid="toggle-password-btn"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
 >
 {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
 </button>
 </div>
 {errors.password && (
 <p data-testid="password-error" className="text-sm text-destructive">{errors.password.message}</p>
 )}
 </div>

 <div className="flex items-center space-x-2">
 <input
 type="checkbox"
 id="rememberMe"
 {...register('rememberMe')}
 className="h-4 w-4 rounded border-border"
 disabled={isPending}
 />
 <Label htmlFor="rememberMe" className="text-sm font-normal">
 {t('auth.rememberMe')}
 </Label>
 </div>

 <Button data-testid="login-submit-btn" type="submit" className="w-full" disabled={isPending}>
 {isPending ? (
 <>
 <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
 {t('common.loading')}
 </>
 ) : (
 t('auth.signIn')
 )}
 </Button>

 <div className="text-center text-sm text-muted-foreground">
 {t('auth.dontHaveAccount')}{' '}
 <Link data-testid="register-link" href="/register" className="text-brand hover:underline font-medium">
 {t('auth.signUp')}
 </Link>
 </div>
 </form>

 </CardContent>
 </Card>

 {isDev && (
 <div className="w-full max-w-md mt-3">
 <button
 type="button"
 onClick={() => setShowDevCreds(v => !v)}
 className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-warning bg-warning-soft border border-warning/30 rounded-lg hover:bg-warning/10 transition-colors"
>
<span>🔧 Dev credentials</span>
<ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDevCreds ? 'rotate-180' : ''}`} />
</button>
{showDevCreds && (
<div className="mt-1 border border-warning/30 rounded-lg overflow-hidden bg-warning-soft">
{DEV_ACCOUNTS.map(acc => (
<button
key={acc.email}
type="button"
onClick={() => { setValue('email', acc.email); setValue('password', acc.password); setShowDevCreds(false); }}
className="w-full flex items-center justify-between px-3 py-2 hover:bg-warning/10 transition-colors border-b border-warning/20 last:border-0 text-left"
>
<div>
<span className="text-xs font-semibold text-warning">{acc.label}</span>
<p className="text-[11px] text-warning/80">{acc.email}</p>
</div>
<span className="text-[11px] font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded">{acc.password}</span>
</button>
))}
 </div>
 )}
 </div>
 )}
 </div>
 );
}

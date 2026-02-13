'use client';

import { useState } from 'react';
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
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: login, isPending } = useLogin();
  const { t } = useLanguage();

  const {
    register,
    handleSubmit,
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
      onError: (err: Error & { response?: { data?: { message?: string } } }) => {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      },
    });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{t('auth.welcomeBack')}</CardTitle>
          <CardDescription className="text-center">
            {t('auth.signIn')} {t('app.name')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form data-testid="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div data-testid="login-error" className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
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
                <p data-testid="email-error" className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link data-testid="forgot-password-link" href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  {t('auth.forgotPassword') || 'Forgot password?'}
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
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p data-testid="password-error" className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                {...register('rememberMe')}
                className="h-4 w-4 rounded border-gray-300"
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

            <div className="text-center text-sm text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <Link data-testid="register-link" href="/register" className="text-blue-600 hover:underline font-medium">
                {t('auth.signUp')}
              </Link>
            </div>
          </form>

          {/* Development Credentials */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-800 mb-3">🔧 Development Test Accounts</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-amber-700">
                  <thead>
                    <tr className="border-b border-amber-200">
                      <th className="text-left py-1 font-semibold">Role</th>
                      <th className="text-left py-1 font-semibold">Email</th>
                      <th className="text-left py-1 font-semibold">Password</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-amber-100">
                      <td className="py-1.5">Manager</td>
                      <td className="py-1.5">admin@servicedesk.com</td>
                      <td className="py-1.5">Admin@123</td>
                    </tr>
                    <tr className="border-b border-amber-100">
                      <td className="py-1.5">Supervisor</td>
                      <td className="py-1.5">supervisor@servicedesk.com</td>
                      <td className="py-1.5">Super@123</td>
                    </tr>
                    <tr className="border-b border-amber-100">
                      <td className="py-1.5">Prep</td>
                      <td className="py-1.5">prep@servicedesk.com</td>
                      <td className="py-1.5">Prep@123</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Prep</td>
                      <td className="py-1.5">test@servicedesk.com</td>
                      <td className="py-1.5">Test@123</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

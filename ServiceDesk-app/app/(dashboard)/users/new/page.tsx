'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, UserPlus, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateUser } from '@/hooks/useUsers';
import { useToast } from '@/components/ui/Toast';
import { ALL_ROLES, ROLE_LABELS, UserRole } from '@/types';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.string().refine((val) => ALL_ROLES.includes(val as UserRole), 'Invalid role'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type UserFormData = z.infer<typeof userSchema>;

export default function AddUserPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const toast = useToast();
  const [error, setError] = useState('');
  const createUserMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'prep',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    setError('');

    try {
      await createUserMutation.mutateAsync({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        phone: data.phone,
      });
      
      toast.success('User created successfully');
      router.push('/users');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };


  return (
    <DashboardLayout allowedRoles={['manager', 'product_owner', 'project_manager']}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('users.addUser')}</h1>
            <p className="text-gray-500 mt-1">{t('users.createAccount')}</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('users.userDetails')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.fullName')} *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., John Doe"
                  {...register('name')}
                  disabled={createUserMutation.isPending}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  {...register('email')}
                  disabled={createUserMutation.isPending}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')} *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={createUserMutation.isPending}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <p className="text-xs text-gray-500">{t('users.minimumChars')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('users.confirmPassword')} *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    disabled={createUserMutation.isPending}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...register('phone')}
                  disabled={createUserMutation.isPending}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">{t('auth.role')} *</Label>
                <select
                  id="role"
                  {...register('role')}
                  disabled={createUserMutation.isPending}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ALL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex-1"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                      {t('users.creatingUser')}...
                    </>
                  ) : (
                    <>
                      <UserPlus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                      {t('users.createUser')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createUserMutation.isPending}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Info Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-amber-600">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">
                  {t('users.securityAccess')}
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• {t('users.securityTip1')}</li>
                  <li>• {t('users.securityTip2')}</li>
                  <li>• {t('users.securityTip3')}</li>
                  <li>• {t('users.securityTip4')}</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

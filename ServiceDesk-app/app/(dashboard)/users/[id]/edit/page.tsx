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
import { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, Loader2, UserPlus, Shield, UserCircle } from 'lucide-react';
import { use } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ALL_ROLES, ROLE_LABELS, UserRole } from '@/types';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.string().refine((val) => ALL_ROLES.includes(val as UserRole), 'Invalid role'),
  phone: z.string().optional(),
  isActive: z.boolean(),
});

type UserFormData = z.infer<typeof userSchema>;

const API = 'http://localhost:5000/api/v1';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = use(params);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<(UserFormData & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'prep',
      isActive: true,
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) { router.push('/login'); return; }
      setIsLoading(true);
      try {
        const res = await fetch(`${API}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data?.user) {
          const u = data.data.user;
          const userData = {
            id: u._id,
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'prep',
            phone: u.profile?.phone || '',
            isActive: u.isActive !== false,
          };
          setUser(userData);
          reset(userData);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id, reset, router]);

  const onSubmit = async (data: UserFormData) => {
    setError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

    try {
      const res = await fetch(`${API}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone,
          isActive: data.isActive,
        }),
      });
      const result = await res.json();
      if (result.success) {
        router.push('/users');
      } else {
        setError(result.message || 'Failed to update user.');
      }
    } catch {
      setError('Failed to update user. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">{t('users.userNotFound')}</p>
          <Button onClick={() => router.push('/users')} className="mt-4">
            {t('users.backToUsers')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

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
            <h1 className="text-3xl font-bold">{t('users.editUser')}</h1>
            <p className="text-gray-500 mt-1">{t('users.updateUserDetails')}</p>
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...register('phone')}
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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

              {/* Is Active */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register('isActive')}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive" className="text-sm font-normal">
                  {t('users.activeStatus')}
                </Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                      {t('users.updatingUser')}...
                    </>
                  ) : (
                    <>
                      <UserPlus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                      {t('users.updateUser')}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="text-amber-600">
                <Shield className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-900">
                  {t('users.editNote')}
                </p>
                <p className="text-sm text-amber-700">
                  {t('users.editNoteTip')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

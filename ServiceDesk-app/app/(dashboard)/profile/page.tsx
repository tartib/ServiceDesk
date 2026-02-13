'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { getRoleLabel } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { Loader2, User, Shield, Key } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { t } = useLocale();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    setSuccessMessage('');
    updateProfile(data, {
      onSuccess: () => {
        setSuccessMessage(t('profile.profileUpdated'));
        setTimeout(() => setSuccessMessage(''), 3000);
      },
    });
  };

  const onPasswordSubmit = (data: PasswordFormData) => {
    setPasswordSuccess('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...passwordData } = data;
    changePassword(passwordData, {
      onSuccess: () => {
        setPasswordSuccess(t('profile.passwordChanged'));
        resetPasswordForm();
        setTimeout(() => setPasswordSuccess(''), 3000);
      },
    });
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
          <p className="text-gray-500 mt-1">{t('profile.subtitle')}</p>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('profile.profileInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4">
              {successMessage && (
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-md text-sm">
                  {successMessage}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{t('profile.fullName')}</Label>
                <Input
                  id="name"
                  {...registerProfile('name')}
                  disabled={isUpdatingProfile}
                />
                {profileErrors.name && (
                  <p className="text-sm text-red-600">{profileErrors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('profile.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...registerProfile('email')}
                  disabled={isUpdatingProfile}
                />
                {profileErrors.email && (
                  <p className="text-sm text-red-600">{profileErrors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('profile.role')}</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <Badge variant="secondary">{getRoleLabel(user.role)}</Badge>
                </div>
              </div>

              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('profile.updating')}
                  </>
                ) : (
                  t('profile.updateProfile')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('profile.changePassword')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              {passwordSuccess && (
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-md text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('profile.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword('currentPassword')}
                  disabled={isChangingPassword}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('profile.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword')}
                  disabled={isChangingPassword}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('profile.confirmNewPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword')}
                  disabled={isChangingPassword}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('profile.changing')}
                  </>
                ) : (
                  t('profile.changePassword')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

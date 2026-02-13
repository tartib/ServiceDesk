'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { User, Plus, Search, Edit, Trash2, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUsers } from '@/hooks/useUsers';

export default function UsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users from API
  const { data: users = [], isLoading } = useUsers();

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800';
      case 'prep':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'manager':
        return '👨‍💼';
      case 'supervisor':
        return '👨‍🏫';
      case 'prep':
        return '👨‍🍳';
      default:
        return '👤';
    }
  };

  return (
    <DashboardLayout allowedRoles={['manager']}>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold leading-tight">{t('users.title')}</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1 leading-relaxed">{t('users.subtitle')}</p>
          </div>
          <Button 
            className="gap-2 h-10 md:h-11 whitespace-nowrap"
            onClick={() => router.push('/users/new')}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('users.addUser')}</span>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 shrink-0" />
              <Input
                type="text"
                placeholder={t('users.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 md:h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('users.teamMembers')} ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">{t('common.loading')}</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 font-semibold text-xs md:text-sm text-gray-700">{t('users.user')}</th>
                      <th className="hidden sm:table-cell text-left py-3 md:py-4 px-3 md:px-4 font-semibold text-xs md:text-sm text-gray-700">{t('auth.email')}</th>
                      <th className="text-left py-3 md:py-4 px-3 md:px-4 font-semibold text-xs md:text-sm text-gray-700">{t('auth.role')}</th>
                      <th className="hidden md:table-cell text-left py-3 md:py-4 px-3 md:px-4 font-semibold text-xs md:text-sm text-gray-700">{t('common.status')}</th>
                      <th className="hidden lg:table-cell text-left py-3 md:py-4 px-3 md:px-4 font-semibold text-xs md:text-sm text-gray-700">{t('users.joined')}</th>
                      <th className="text-right py-3 md:py-4 px-3 md:px-4 font-semibold text-xs md:text-sm text-gray-700">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                              {getRoleIcon(u.role)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs md:text-sm text-gray-900 truncate">{u.name}</p>
                              <p className="text-xs text-gray-500 truncate">ID: {u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell py-3 md:py-4 px-3 md:px-4">
                          <p className="text-xs md:text-sm text-gray-700 truncate">{u.email}</p>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <Badge className={`text-xs md:text-sm ${getRoleBadgeColor(u.role)}`}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </Badge>
                        </td>
                        <td className="hidden md:table-cell py-3 md:py-4 px-3 md:px-4">
                          <Badge className={`text-xs md:text-sm ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {u.isActive ? t('common.active') : t('common.inactive')}
                          </Badge>
                        </td>
                        <td className="hidden lg:table-cell py-3 md:py-4 px-3 md:px-4">
                          <p className="text-xs md:text-sm text-gray-700">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }) : '-'}
                          </p>
                        </td>
                        <td className="py-3 md:py-4 px-3 md:px-4">
                          <div className="flex items-center justify-end gap-1 md:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 md:gap-2 h-9 md:h-10 text-xs md:text-sm"
                              disabled={u.id === user?.id}
                              onClick={() => router.push(`/users/${u.id}/edit`)}
                            >
                              <Edit className="h-3 w-3" />
                              <span className="hidden sm:inline">{t('common.edit')}</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 md:gap-2 text-red-600 hover:bg-red-50 h-9 md:h-10 text-xs md:text-sm"
                              disabled={u.id === user?.id}
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="hidden sm:inline">{t('common.delete')}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-lg">
                  {t('users.noUsers')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">{t('roles.manager')}</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">
                    {users.filter((u) => u.role === 'manager').length}
                  </p>
                </div>
                <div className="h-12 w-12 shrink-0 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                  👨‍💼
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">{t('users.supervisors')}</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {users.filter((u) => u.role === 'supervisor').length}
                  </p>
                </div>
                <div className="h-12 w-12 shrink-0 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                  👨‍🏫
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-500">{t('roles.prep')}</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">
                    {users.filter((u) => u.role === 'prep').length}
                  </p>
                </div>
                <div className="h-12 w-12 shrink-0 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                  👨‍🍳
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

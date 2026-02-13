'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Users,
  UserPlus,
  Trash2,
  Edit,
  Crown,
  Search,
  X,
  Check,
  Mail,
  Shield,
  Settings,
} from 'lucide-react';
import {
  useTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
  Team,
  CreateTeamDTO,
  TeamMember,
} from '@/hooks/useTeams';
import { useUsers } from '@/hooks/useUsers';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

const teamTypeConfig: Record<string, { icon: typeof Users; color: string; bg: string }> = {
  support: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
  technical: { icon: Settings, color: 'text-violet-600', bg: 'bg-violet-50' },
  operations: { icon: Settings, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  management: { icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
  other: { icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
};

export default function TeamsPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CreateTeamDTO>({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    type: 'support',
  });

  const { data: teams = [], isLoading, refetch } = useTeams({ search: searchQuery });
  const { data: users = [] } = useUsers();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const teamTypes = [
    { value: 'support', label: 'Support', label_ar: 'دعم' },
    { value: 'technical', label: 'Technical', label_ar: 'تقني' },
    { value: 'operations', label: 'Operations', label_ar: 'عمليات' },
    { value: 'management', label: 'Management', label_ar: 'إدارة' },
    { value: 'other', label: 'Other', label_ar: 'أخرى' },
  ];

  const handleCreateTeam = async () => {
    try {
      await createTeam.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({ name: '', name_ar: '', description: '', description_ar: '', type: 'support' });
      refetch();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam) return;
    try {
      await updateTeam.mutateAsync({
        id: selectedTeam._id,
        data: formData,
      });
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
      refetch();
    } catch (error) {
      console.error('Error updating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الفريق؟' : 'Are you sure you want to delete this team?')) {
      return;
    }
    try {
      await deleteTeam.mutateAsync(teamId);
      refetch();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const handleAddMember = async (userId: string, role: 'leader' | 'member' = 'member') => {
    if (!selectedTeam) return;
    try {
      await addMember.mutateAsync({
        teamId: selectedTeam._id,
        data: { user_id: userId, role },
      });
      setAddedUserIds((prev) => new Set(prev).add(userId));
      refetch();
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من إزالة هذا العضو؟' : 'Are you sure you want to remove this member?')) {
      return;
    }
    try {
      await removeMember.mutateAsync({ teamId, userId });
      refetch();
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      name_ar: team.name_ar,
      description: team.description || '',
      description_ar: team.description_ar || '',
      type: team.type,
    });
    setIsEditDialogOpen(true);
  };

  const openAddMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setMemberSearch('');
    setAddedUserIds(new Set());
    setIsAddMemberDialogOpen(true);
  };

  // Get users not in the selected team, filtered by search
  const availableUsers = useMemo(() => {
    const base = selectedTeam
      ? users.filter((user: { _id: string }) =>
          !selectedTeam.members.some((m) => m.user_id._id === user._id)
        )
      : users;

    if (!memberSearch.trim()) return base;
    const q = memberSearch.toLowerCase();
    return base.filter(
      (user: { name: string; email: string }) =>
        user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q)
    );
  }, [selectedTeam, users, memberSearch]);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isAr ? 'إدارة الفرق' : 'Team Management'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {isAr
                ? 'إنشاء وإدارة فرق الدعم والأعضاء'
                : 'Create and manage support teams and members'}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isAr ? 'فريق جديد' : 'New Team'}
          </Button>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={isAr ? 'البحث عن فريق...' : 'Search teams...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {teams.length} {isAr ? 'فريق' : 'teams'}
            </span>
          </div>
        </div>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : teams.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team: Team) => {
              const memberCount = team.member_count || team.members?.length || 0;
              const typeConf = teamTypeConfig[team.type] || teamTypeConfig.other;
              const TypeIcon = typeConf.icon;
              return (
                <Card key={team._id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 overflow-hidden">
                  {/* Color strip */}
                  <div className={`h-1 ${typeConf.bg.replace('bg-', 'bg-').replace('-50', '-400')}`} />

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${typeConf.bg} flex items-center justify-center`}>
                          <TypeIcon className={`h-5 w-5 ${typeConf.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base">
                            {isAr ? team.name_ar : team.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs font-normal">
                              {teamTypes.find((t) => t.value === team.type)?.[isAr ? 'label_ar' : 'label'] || team.type}
                            </Badge>
                            <Badge variant={team.is_active ? 'default' : 'secondary'} className="text-xs">
                              {team.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditDialog(team)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {(isAr ? team.description_ar : team.description) && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {isAr ? team.description_ar : team.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Members Section */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {isAr ? 'الأعضاء' : 'Members'} ({memberCount})
                        </span>
                      </div>

                      {team.members && team.members.length > 0 ? (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {team.members.map((member: TeamMember) => (
                            <div
                              key={member.user_id._id}
                              className="flex items-center justify-between group/member py-1.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-full ${getAvatarColor(member.user_id._id)} flex items-center justify-center text-white text-xs font-medium shrink-0`}
                                >
                                  {getInitials(member.user_id.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                                    {member.user_id.name}
                                    {member.role === 'leader' && (
                                      <Crown className="h-3 w-3 text-amber-500 shrink-0" />
                                    )}
                                  </p>
                                  {member.user_id.email && (
                                    <p className="text-xs text-gray-400 truncate">{member.user_id.email}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveMember(team._id, member.user_id._id)}
                                className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover/member:opacity-100 transition-all"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-3">
                          {isAr ? 'لا يوجد أعضاء بعد' : 'No members yet'}
                        </p>
                      )}
                    </div>

                    {/* Add Member Button */}
                    <button
                      onClick={() => openAddMemberDialog(team)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                    >
                      <UserPlus className="h-4 w-4" />
                      {isAr ? 'إضافة عضو' : 'Add Member'}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {isAr ? 'لا توجد فرق' : 'No teams yet'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              {isAr ? 'ابدأ بإنشاء فريق جديد' : 'Get started by creating a new team'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {isAr ? 'إنشاء فريق' : 'Create Team'}
            </Button>
          </div>
        )}

        {/* Create Team Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? 'إنشاء فريق جديد' : 'Create New Team'}</DialogTitle>
              <DialogDescription>
                {isAr ? 'أدخل معلومات الفريق الجديد' : 'Enter the new team information'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="IT Support Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="فريق الدعم التقني"
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'النوع' : 'Type'}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CreateTeamDTO['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teamTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {isAr ? type.label_ar : type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={isAr ? 'وصف الفريق...' : 'Team description...'}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleCreateTeam} disabled={!formData.name || createTeam.isPending}>
                {createTeam.isPending
                  ? (isAr ? 'جاري الإنشاء...' : 'Creating...')
                  : (isAr ? 'إنشاء' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isAr ? 'تعديل الفريق' : 'Edit Team'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'النوع' : 'Type'}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CreateTeamDTO['type'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teamTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {isAr ? type.label_ar : type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الوصف' : 'Description'}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleUpdateTeam} disabled={updateTeam.isPending}>
                {updateTeam.isPending
                  ? (isAr ? 'جاري الحفظ...' : 'Saving...')
                  : (isAr ? 'حفظ' : 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog - Redesigned */}
        <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                {isAr ? 'إضافة عضو للفريق' : 'Add Team Member'}
              </DialogTitle>
              <DialogDescription>
                {isAr
                  ? `إضافة أعضاء إلى ${selectedTeam?.name_ar || selectedTeam?.name}`
                  : `Add members to ${selectedTeam?.name}`}
              </DialogDescription>
            </DialogHeader>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* User List */}
            <div className="max-h-80 overflow-y-auto -mx-1 px-1">
              {availableUsers.length > 0 ? (
                <div className="space-y-1">
                  {availableUsers.map((user: { _id: string; name: string; email: string; role: string }) => {
                    const justAdded = addedUserIds.has(user._id);
                    return (
                      <div
                        key={user._id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          justAdded
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full ${getAvatarColor(user._id)} flex items-center justify-center text-white text-sm font-medium shrink-0`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>

                        {justAdded ? (
                          <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium px-2">
                            <Check className="h-4 w-4" />
                            {isAr ? 'تمت الإضافة' : 'Added'}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => handleAddMember(user._id, 'member')}
                              disabled={addMember.isPending}
                            >
                              <UserPlus className="h-3.5 w-3.5 mr-1" />
                              {isAr ? 'عضو' : 'Member'}
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs bg-amber-500 hover:bg-amber-600"
                              onClick={() => handleAddMember(user._id, 'leader')}
                              disabled={addMember.isPending}
                            >
                              <Crown className="h-3.5 w-3.5 mr-1" />
                              {isAr ? 'قائد' : 'Leader'}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Users className="h-10 w-10 mb-3" />
                  <p className="text-sm font-medium">
                    {memberSearch
                      ? (isAr ? 'لا توجد نتائج' : 'No results found')
                      : (isAr ? 'لا يوجد مستخدمين متاحين' : 'No available users')}
                  </p>
                  {memberSearch && (
                    <p className="text-xs mt-1">
                      {isAr ? 'جرب كلمات بحث مختلفة' : 'Try different search terms'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {addedUserIds.size > 0 && (
              <div className="text-xs text-green-600 font-medium text-center py-1">
                {isAr
                  ? `تم إضافة ${addedUserIds.size} عضو`
                  : `${addedUserIds.size} member${addedUserIds.size > 1 ? 's' : ''} added`}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                {isAr ? 'إغلاق' : 'Done'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

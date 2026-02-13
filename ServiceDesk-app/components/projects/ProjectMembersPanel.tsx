'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  MoreHorizontal, 
  Shield, 
  Trash2, 
  ChevronDown,
  X,
  Loader2,
  Mail,
  Crown
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface MemberProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface MemberUser {
  _id: string;
  email: string;
  profile: MemberProfile;
}

interface Member {
  userId: MemberUser;
  role: 'lead' | 'manager' | 'contributor' | 'viewer';
  joinedAt: string;
}

interface Permissions {
  canManageMembers: boolean;
  assignableRoles: string[];
  currentUserRole: string;
}

interface OrganizationUser {
  _id: string;
  email: string;
  profile: MemberProfile;
}

interface ProjectMembersPanelProps {
  projectId: string;
}

const roleLabels = {
  en: {
    lead: 'Project Lead',
    manager: 'Manager',
    contributor: 'Contributor',
    member: 'Member',
    viewer: 'Viewer'
  },
  ar: {
    lead: 'مدير المشروع',
    manager: 'مدير',
    contributor: 'مساهم',
    member: 'عضو',
    viewer: 'مشاهد'
  }
};

const roleColors: Record<string, string> = {
  lead: 'bg-purple-100 text-purple-800',
  manager: 'bg-blue-100 text-blue-800',
  contributor: 'bg-green-100 text-green-800',
  member: 'bg-gray-100 text-gray-800',
  viewer: 'bg-gray-100 text-gray-600'
};

export default function ProjectMembersPanel({ projectId }: ProjectMembersPanelProps) {
  const { t, locale } = useLanguage();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('contributor');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [updatingMember, setUpdatingMember] = useState<string | null>(null);
  
  // Add people state
  const [showAddPeopleModal, setShowAddPeopleModal] = useState(false);
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [addRole, setAddRole] = useState<string>('contributor');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAddingPeople, setIsAddingPeople] = useState(false);
  const [addError, setAddError] = useState('');

  const getRoleLabel = (role: string) => {
    const labels = locale === 'ar' ? roleLabels.ar : roleLabels.en;
    return labels[role as keyof typeof labels] || role;
  };

  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setMembers(data.data.members || []);
        setPermissions(data.data.permissions || null);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Debounce timer ref for user search
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchUsers = useCallback(async (query: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    // Only search if query is at least 2 characters
    if (query.trim().length < 2) {
      setOrganizationUsers([]);
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/users/search?q=${encodeURIComponent(query.trim())}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success || data.statusCode === 200) {
        // Filter out users who are already members
        const memberIds = members.map(m => m.userId._id);
        const availableUsers = (data.data?.users || []).filter(
          (user: OrganizationUser) => !memberIds.includes(user._id)
        );
        setOrganizationUsers(availableUsers);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [members]);

  // Debounced search effect
  useEffect(() => {
    if (!showAddPeopleModal) return;

    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Debounce the search by 300ms
    searchDebounceRef.current = setTimeout(() => {
      searchUsers(userSearchQuery);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [userSearchQuery, showAddPeopleModal, searchUsers]);

  // Clear users when modal closes
  useEffect(() => {
    if (!showAddPeopleModal) {
      setOrganizationUsers([]);
      setUserSearchQuery('');
    }
  }, [showAddPeopleModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError('');

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/members/invite`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setShowInviteModal(false);
        setInviteEmail('');
        setInviteRole('contributor');
        fetchMembers();
      } else {
        setInviteError(data.message || t('projects.members.inviteError') || 'Failed to invite member');
      }
    } catch {
      setInviteError(t('projects.members.inviteError') || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    setUpdatingMember(memberId);
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/members/${memberId}/role`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdatingMember(null);
      setActiveDropdown(null);
    }
  };

  const handleAddPeople = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsAddingPeople(true);
    setAddError('');
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      // Add each selected user
      const promises = selectedUsers.map(userId => 
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/members/invite`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              role: addRole,
            }),
          }
        ).then(res => res.json())
      );

      const results = await Promise.all(promises);
      const hasError = results.some(r => !r.success);
      
      if (hasError) {
        setAddError(t('projects.members.addError') || 'Some users could not be added');
      } else {
        setShowAddPeopleModal(false);
        setSelectedUsers([]);
        setUserSearchQuery('');
        setAddRole('contributor');
        fetchMembers();
      }
    } catch {
      setAddError(t('projects.members.addError') || 'Failed to add people');
    } finally {
      setIsAddingPeople(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Users are already filtered server-side, no need for client-side filtering
  const filteredOrganizationUsers = organizationUsers;

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t('projects.members.confirmRemove') || 'Are you sure you want to remove this member?')) {
      return;
    }

    setUpdatingMember(memberId);
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setUpdatingMember(null);
      setActiveDropdown(null);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500',
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${member.userId?.profile?.firstName || ''} ${member.userId?.profile?.lastName || ''}`.toLowerCase();
    return fullName.includes(query) || member.userId?.email?.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('projects.members.title') || 'Team Members'}
          </h3>
          <p className="text-sm text-gray-500">
            {t('projects.members.description') || 'Manage who has access to this project.'}
          </p>
        </div>
        {permissions?.canManageMembers && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddPeopleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <UserPlus className="h-4 w-4" />
              {t('projects.members.addPeople') || 'Add People'}
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Mail className="h-4 w-4" />
              {t('projects.members.inviteByEmail') || 'Invite by Email'}
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('projects.members.searchPlaceholder') || 'Search members...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 ltr:pl-10 rtl:pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Members List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchQuery
                ? t('projects.members.noResults') || 'No members found'
                : t('projects.members.noMembers') || 'No team members yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredMembers.map((member) => (
              <div
                key={member.userId._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  {member.userId?.profile?.avatar ? (
                    <Image
                      src={member.userId.profile.avatar}
                      alt={`${member.userId.profile?.firstName || ''} ${member.userId.profile?.lastName || ''}`}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full ${getAvatarColor(
                        member.userId?.profile?.firstName || member.userId?.email || 'U'
                      )} flex items-center justify-center text-white text-sm font-medium`}
                    >
                      {getInitials(member.userId?.profile?.firstName, member.userId?.profile?.lastName) || member.userId?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {member.userId?.profile?.firstName || member.userId?.email || 'Unknown'} {member.userId?.profile?.lastName || ''}
                      </p>
                      {member.role === 'lead' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.userId?.email || 'No email'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Role Badge */}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[member.role]}`}>
                    {getRoleLabel(member.role)}
                  </span>

                  {/* Actions */}
                  {permissions?.canManageMembers && member.role !== 'lead' && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === member.userId._id ? null : member.userId._id);
                        }}
                        disabled={updatingMember === member.userId._id}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updatingMember === member.userId._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </button>

                      {/* Dropdown Menu */}
                      {activeDropdown === member.userId._id && (
                        <div className="absolute ltr:right-0 rtl:left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          {/* Change Role */}
                          <div className="p-2 border-b border-gray-100">
                            <p className="text-xs font-medium text-gray-500 px-2 mb-1">
                              {t('projects.members.changeRole') || 'Change Role'}
                            </p>
                            {permissions.assignableRoles.map((role) => (
                              <button
                                key={role}
                                onClick={() => handleUpdateRole(member.userId._id, role)}
                                disabled={member.role === role}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
                                  member.role === role
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <Shield className="h-3.5 w-3.5" />
                                {getRoleLabel(role)}
                              </button>
                            ))}
                          </div>

                          {/* Remove */}
                          <div className="p-2">
                            <button
                              onClick={() => handleRemoveMember(member.userId._id)}
                              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {t('projects.members.remove') || 'Remove from project'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Count */}
      <p className="text-sm text-gray-500">
        {t('projects.members.totalMembers') || 'Total members'}: {members.length}
      </p>

      {/* Add People Modal */}
      {showAddPeopleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('projects.members.addPeople') || 'Add People'}
              </h3>
              <button
                onClick={() => {
                  setShowAddPeopleModal(false);
                  setSelectedUsers([]);
                  setUserSearchQuery('');
                  setAddError('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('projects.members.searchUsers') || 'Search users...'}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 ltr:pl-10 rtl:pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto min-h-0 max-h-72">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : filteredOrganizationUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    {userSearchQuery
                      ? t('projects.members.noUsersFound') || 'No users found'
                      : t('projects.members.allUsersAdded') || 'All users are already members'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredOrganizationUsers.map((user) => (
                    <label
                      key={user._id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => toggleUserSelection(user._id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      {user.profile?.avatar ? (
                        <Image
                          src={user.profile.avatar}
                          alt={`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-9 h-9 rounded-full ${getAvatarColor(
                            user.profile?.firstName || user.email || 'U'
                          )} flex items-center justify-center text-white text-sm font-medium`}
                        >
                          {getInitials(user.profile?.firstName, user.profile?.lastName) || user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {user.profile?.firstName || user.email || 'Unknown'} {user.profile?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Role Selection */}
            {selectedUsers.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {t('projects.members.selectedCount') || `${selectedUsers.length} selected`}
                  </span>
                  <div className="flex-1" />
                  <label className="text-sm text-gray-600">{t('projects.members.role') || 'Role'}:</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {permissions?.assignableRoles.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Error Message */}
            {addError && (
              <div className="px-4 pb-2">
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {addError}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowAddPeopleModal(false);
                  setSelectedUsers([]);
                  setUserSearchQuery('');
                  setAddError('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                {t('projects.common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleAddPeople}
                disabled={isAddingPeople || selectedUsers.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingPeople && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('projects.members.addSelected') || `Add ${selectedUsers.length} People`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('projects.members.inviteMember') || 'Invite Member'}
              </h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteError('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleInvite} className="p-4 space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.members.email') || 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder={t('projects.members.emailPlaceholder') || 'user@example.com'}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 ltr:pl-10 rtl:pr-10 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.members.role') || 'Role'}
                </label>
                <div className="relative">
                  <Shield className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 ltr:pl-10 rtl:pr-10 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none bg-white"
                  >
                    {permissions?.assignableRoles.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Error Message */}
              {inviteError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {inviteError}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteError('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  {t('projects.common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isInviting || !inviteEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInviting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('projects.members.sendInvite') || 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

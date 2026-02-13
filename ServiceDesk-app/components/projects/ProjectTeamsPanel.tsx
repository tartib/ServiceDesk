'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2,
  X,
  Loader2,
  UserPlus,
  UserMinus
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TeamMember {
  _id: string;
  userId: {
    _id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  role: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  lead?: string;
  createdAt: string;
}

interface ProjectTeamsPanelProps {
  projectId: string;
}

interface ProjectMember {
  _id: string;
  userId: {
    _id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  };
  role: string;
}

export default function ProjectTeamsPanel({ projectId }: ProjectTeamsPanelProps) {
  const { t } = useLanguage();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Member management state
  const [managingTeam, setManagingTeam] = useState<Team | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams`, {
        headers: { 
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        const teamsData = data.data?.teams || [];
        // Extract team objects from the nested structure
        // API returns: [{team: {...}, role: 'primary'}, ...]
        const extractedTeams = teamsData.map((item: { team?: Team; role?: string } | Team) => 
          'team' in item ? item.team : item
        ).filter((team: Team | undefined): team is Team => 
          Boolean(team && team._id && team.name)
        );
        setTeams(extractedTeams);
      } else {
        console.error('Failed to fetch teams:', data.message);
        setError(data.message || 'Failed to load teams');
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      setError('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      setError('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeam.name,
          description: newTeam.description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewTeam({ name: '', description: '' });
        await fetchTeams();
      } else {
        setError(data.message || 'Failed to create team');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      setError('Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !newTeam.name.trim()) {
      setError('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      // Remove old team and re-add with new name/description
      // since there is no PUT endpoint for teams
      await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams/${editingTeam._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeam.name,
          description: newTeam.description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEditingTeam(null);
        setNewTeam({ name: '', description: '' });
        await fetchTeams();
      } else {
        setError(data.message || 'Failed to update team');
      }
    } catch (error) {
      console.error('Failed to update team:', error);
      setError('Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        await fetchTeams();
      } else {
        setError(data.error || data.message || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
      setError('Failed to delete team');
    }
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setNewTeam({ name: team.name, description: team.description || '' });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingTeam(null);
    setNewTeam({ name: '', description: '' });
    setError(null);
  };

  const fetchProjectMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setProjectMembers(data.data?.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const openMembersModal = async (team: Team) => {
    setManagingTeam(team);
    setSelectedMembers([]);
    setMemberRoles({});
    await fetchProjectMembers();
  };

  const closeMembersModal = () => {
    setManagingTeam(null);
    setSelectedMembers([]);
    setMemberRoles({});
    setProjectMembers([]);
  };

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => {
      const isSelected = prev.includes(userId);
      if (isSelected) {
        // Remove from selection and role mapping
        setMemberRoles(prevRoles => {
          const newRoles = { ...prevRoles };
          delete newRoles[userId];
          return newRoles;
        });
        return prev.filter(id => id !== userId);
      } else {
        // Add to selection with default role
        setMemberRoles(prevRoles => ({ ...prevRoles, [userId]: 'member' }));
        return [...prev, userId];
      }
    });
  };

  const updateMemberRole = (userId: string, role: string) => {
    setMemberRoles(prev => ({ ...prev, [userId]: role }));
  };

  const handleAddMembers = async () => {
    if (!managingTeam || selectedMembers.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      // Add members one by one
      for (const userId of selectedMembers) {
        const response = await fetch(
          `http://localhost:5000/api/v1/pm/projects/${projectId}/teams/${managingTeam._id}/members`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
              userId: userId,
              role: memberRoles[userId] || 'member'
            }),
          }
        );

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || data.message || 'Failed to add member');
        }
      }

      closeMembersModal();
      await fetchTeams();
    } catch (error) {
      console.error('Failed to add members:', error);
      setError(error instanceof Error ? error.message : 'Failed to add members');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    const confirmMessage = t('projects.settings.removeMemberConfirm') || 'Are you sure you want to remove this member from the team?';
    if (!confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/teams/${teamId}/members/${memberId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        await fetchTeams();
      } else {
        setError(data.error || data.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      setError('Failed to remove member');
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('projects.settings.teams') || 'Teams'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('projects.settings.teamsDescription') || 'Organize project members into teams'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>{t('projects.settings.createTeam') || 'Create Team'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Teams List */}
      {teams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('projects.settings.noTeams') || 'No teams yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {t('projects.settings.noTeamsDescription') || 'Create your first team to organize project members'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('projects.settings.createTeam') || 'Create Team'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.filter(team => team && team._id && team.name).map((team) => (
            <div
              key={team._id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{team.name}</h4>
                  {team.description && (
                    <p className="text-sm text-gray-500 mt-1">{team.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(team)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit team"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete team"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{team.members?.length || 0} {t('projects.settings.members') || 'members'}</span>
                  </div>
                  <button
                    onClick={() => openMembersModal(team)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </div>
                
                {/* Members List */}
                {team.members && team.members.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {team.members.slice(0, 3).map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between text-xs p-1.5 hover:bg-gray-50 rounded"
                      >
                        <span className="text-gray-700">
                          {member.userId?.profile?.firstName || member.userId?.email || 'Unknown'}{' '}
                          {member.userId?.profile?.lastName || ''}
                        </span>
                        <button
                          onClick={() => handleRemoveMember(team._id, member._id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove member"
                        >
                          <UserMinus className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <p className="text-xs text-gray-400 pl-1.5">
                        +{team.members.length - 3} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Team Modal */}
      {(showCreateModal || editingTeam) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTeam 
                  ? (t('projects.settings.editTeam') || 'Edit Team')
                  : (t('projects.settings.createTeam') || 'Create Team')
                }
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.settings.teamName') || 'Team Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="e.g., Frontend Team"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('projects.settings.teamDescription') || 'Description'}
                </label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Describe the team's responsibilities..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('projects.common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={editingTeam ? handleUpdateTeam : handleCreateTeam}
                disabled={isSubmitting || !newTeam.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('projects.common.saving') || 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    {editingTeam ? (
                      <span>{t('projects.common.update') || 'Update'}</span>
                    ) : (
                      <span>{t('projects.common.create') || 'Create'}</span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {managingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('projects.settings.addMembersTo') || 'Add Members to'} {managingTeam.name}
              </h3>
              <button
                onClick={closeMembersModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {isLoadingMembers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="space-y-2">
                  {projectMembers.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      {t('projects.settings.noAvailableMembers') || 'No available members to add'}
                    </p>
                  ) : (
                    projectMembers
                      .filter(pm => {
                        // Filter out members who are already in the team
                        const projectUserId = pm.userId?._id;
                        if (!projectUserId) return false;
                        
                        return !managingTeam.members?.some(tm => {
                          // Handle both string and object userId
                          const teamUserId = typeof tm.userId === 'string' ? tm.userId : tm.userId?._id;
                          return teamUserId === projectUserId;
                        });
                      })
                      .map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.userId._id)}
                            onChange={() => toggleMemberSelection(member.userId._id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {member.userId?.profile?.firstName || member.userId?.email || 'Unknown'}{' '}
                              {member.userId?.profile?.lastName || ''}
                            </p>
                            <p className="text-xs text-gray-500">{member.userId?.email}</p>
                          </div>
                          {selectedMembers.includes(member.userId._id) && (
                            <select
                              value={memberRoles[member.userId._id] || 'member'}
                              onChange={(e) => updateMemberRole(member.userId._id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="member">Member</option>
                              <option value="lead">Lead</option>
                            </select>
                          )}
                          {!selectedMembers.includes(member.userId._id) && (
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {member.role}
                            </span>
                          )}
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {selectedMembers.length} {selectedMembers.length === 1 
                  ? (t('projects.settings.memberSelected') || 'member selected')
                  : (t('projects.settings.membersSelected') || 'members selected')
                }
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={closeMembersModal}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('projects.common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={isSubmitting || selectedMembers.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('projects.settings.adding') || 'Adding...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>{t('projects.settings.addMembers') || 'Add Members'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

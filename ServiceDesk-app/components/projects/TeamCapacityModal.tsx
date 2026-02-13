'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Calendar, Clock, Users, Check, Loader2 } from 'lucide-react';
import { useSprintPlanning, TeamMember, CapacitySettings } from '@/hooks/useSprintPlanning';

interface ProjectMember {
  _id: string;
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  name?: string;
  email?: string;
}

interface TeamCapacityModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
  projectId: string;
  sprintDays: number;
  onCapacityUpdated: (capacity: number) => void;
}

export default function TeamCapacityModal({
  isOpen,
  onClose,
  sprintId,
  projectId,
  sprintDays,
  onCapacityUpdated,
}: TeamCapacityModalProps) {
  const { loading, updateCapacity, calculateTeamCapacity, calculateAvailabilityPercentage } = useSprintPlanning('');

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [settings, setSettings] = useState<CapacitySettings>({
    sprintDays: sprintDays || 10,
    defaultHoursPerDay: 6,
    meetings: 10,
    teamMembers: [],
  });

  const [totalCapacity, setTotalCapacity] = useState(0);
  const [availabilityPercentage, setAvailabilityPercentage] = useState(100);

  const getDisplayName = (member: ProjectMember): string => {
    if (member.profile?.firstName || member.profile?.lastName) {
      return `${member.profile.firstName || ''} ${member.profile.lastName || ''}`.trim();
    }
    return member.name || member.email || 'Unknown';
  };

  const getInitials = (member: ProjectMember): string => {
    if (member.profile?.firstName || member.profile?.lastName) {
      return `${member.profile.firstName?.[0] || ''}${member.profile.lastName?.[0] || ''}`.toUpperCase();
    }
    return member.name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || '?';
  };

  const fetchProjectMembers = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !projectId) return;

    setLoadingMembers(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/v1/pm/projects/${projectId}/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      if (data.success && data.data?.members) {
        const members: ProjectMember[] = data.data.members.map(
          (m: { userId: ProjectMember }) => ({
            _id: m.userId._id,
            profile: m.userId.profile,
            name: m.userId.name,
            email: m.userId.email,
          })
        );
        setProjectMembers(members);
      }
    } catch (error) {
      console.error('Failed to fetch project members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      fetchProjectMembers();
    }
  }, [isOpen, fetchProjectMembers]);

  useEffect(() => {
    const capacity = calculateTeamCapacity(settings);
    const availability = calculateAvailabilityPercentage(settings);
    setTotalCapacity(capacity);
    setAvailabilityPercentage(availability);
  }, [settings, calculateTeamCapacity, calculateAvailabilityPercentage]);

  const isSelected = (memberId: string) => {
    return settings.teamMembers.some(m => m.userId === memberId);
  };

  const toggleMember = (member: ProjectMember) => {
    if (isSelected(member._id)) {
      setSettings(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter(m => m.userId !== member._id),
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        teamMembers: [
          ...prev.teamMembers,
          {
            userId: member._id,
            name: getDisplayName(member),
            email: member.email || '',
            availability: prev.defaultHoursPerDay,
            daysOff: [],
          },
        ],
      }));
    }
  };

  const selectAll = () => {
    const allMembers: TeamMember[] = projectMembers.map(m => ({
      userId: m._id,
      name: getDisplayName(m),
      email: m.email || '',
      availability: settings.defaultHoursPerDay,
      daysOff: [],
    }));
    setSettings(prev => ({ ...prev, teamMembers: allMembers }));
  };

  const deselectAll = () => {
    setSettings(prev => ({ ...prev, teamMembers: [] }));
  };

  const handleMemberSettingChange = (userId: string, field: 'availability' | 'daysOff', value: number) => {
    setSettings(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map(m => {
        if (m.userId !== userId) return m;
        if (field === 'daysOff') {
          return { ...m, daysOff: Array(value).fill('').map((_, i) => `day-${i}`) };
        }
        return { ...m, [field]: value };
      }),
    }));
  };

  const handleSave = async () => {
    try {
      await updateCapacity(sprintId, settings);
      onCapacityUpdated(totalCapacity);
      onClose();
    } catch (error) {
      console.error('Failed to update capacity:', error);
    }
  };

  if (!isOpen) return null;

  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-cyan-600">
          <div>
            <h2 className="text-xl font-semibold text-white">Team Capacity Planning</h2>
            <p className="text-sm text-blue-100 mt-1">Select team members and configure sprint capacity</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Sprint Settings */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sprint Settings
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sprint Days
                </label>
                <input
                  type="number"
                  value={settings.sprintDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, sprintDays: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Hours/Day
                </label>
                <input
                  type="number"
                  value={settings.defaultHoursPerDay}
                  onChange={(e) => setSettings(prev => ({ ...prev, defaultHoursPerDay: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="12"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Hours (Total)
                </label>
                <input
                  type="number"
                  value={settings.meetings}
                  onChange={(e) => setSettings(prev => ({ ...prev, meetings: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Team Members Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members ({settings.teamMembers.length} / {projectMembers.length} selected)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-blue-600 bg-blue-50 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-gray-600 bg-gray-100 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {loadingMembers ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Loader2 className="h-8 w-8 mx-auto mb-3 text-blue-500 animate-spin" />
                <p className="text-gray-600 font-medium">Loading project members...</p>
              </div>
            ) : projectMembers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 font-medium">No project members found</p>
                <p className="text-sm text-gray-500 mt-1">Add members to the project first</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projectMembers.map((member) => {
                  const selected = isSelected(member._id);
                  const teamMember = settings.teamMembers.find(m => m.userId === member._id);
                  const colorIndex = (member.profile?.firstName?.charCodeAt(0) ?? 0) % colors.length;
                  const memberCapacity = teamMember
                    ? (settings.sprintDays - teamMember.daysOff.length) * teamMember.availability
                    : 0;

                  return (
                    <div
                      key={member._id}
                      className={`rounded-lg border transition-all ${
                        selected
                          ? 'border-blue-300 bg-blue-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {/* Member row - clickable to toggle */}
                      <div
                        className="flex items-center gap-3 p-3 cursor-pointer"
                        onClick={() => toggleMember(member)}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                          selected ? 'bg-blue-600' : 'border-2 border-gray-300'
                        }`}>
                          {selected && <Check className="h-3.5 w-3.5 text-white" />}
                        </div>

                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                          {member.profile?.avatar ? (
                            <img src={member.profile.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            getInitials(member)
                          )}
                        </div>

                        {/* Name & Email */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{getDisplayName(member)}</p>
                          {member.email && (
                            <p className="text-xs text-gray-500 truncate">{member.email}</p>
                          )}
                        </div>

                        {/* Capacity badge */}
                        {selected && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            <Clock className="h-3 w-3" />
                            {memberCapacity.toFixed(0)}h
                          </div>
                        )}
                      </div>

                      {/* Expanded settings when selected */}
                      {selected && teamMember && (
                        <div className="px-3 pb-3 pt-0 ml-8 flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 whitespace-nowrap">Hours/Day</label>
                            <input
                              type="number"
                              value={teamMember.availability}
                              onChange={(e) => handleMemberSettingChange(member._id, 'availability', parseFloat(e.target.value) || 0)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="0"
                              max="12"
                              step="0.5"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600 whitespace-nowrap">Days Off</label>
                            <input
                              type="number"
                              value={teamMember.daysOff.length}
                              onChange={(e) => handleMemberSettingChange(member._id, 'daysOff', parseInt(e.target.value) || 0)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              min="0"
                              max={settings.sprintDays}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Capacity Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Total Team Hours</div>
                <div className="text-2xl font-bold text-blue-600">
                  {settings.teamMembers.reduce((sum, m) => 
                    sum + ((settings.sprintDays - m.daysOff.length) * m.availability), 0
                  ).toFixed(1)}h
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Meeting Overhead</div>
                <div className="text-2xl font-bold text-orange-600">-{settings.meetings}h</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Available Hours</div>
                <div className="text-2xl font-bold text-green-600">{totalCapacity.toFixed(1)}h</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Availability</div>
                <div className="text-2xl font-bold text-purple-600">{availabilityPercentage}%</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
              <p className="text-sm text-blue-800">
                💡 <strong>Note:</strong> Hours are used only for availability tracking. 
                Sprint capacity in story points should be based on <strong>Historical Velocity × {availabilityPercentage}%</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || settings.teamMembers.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : `Save Capacity (${settings.teamMembers.length} members)`}
          </button>
        </div>
      </div>
    </div>
  );
}

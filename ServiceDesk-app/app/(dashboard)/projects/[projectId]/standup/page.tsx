'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Edit3,
  Save,
  FileText,
  Send,
  ChevronLeft,
  Crown,
  RefreshCw,
  BarChart3,
  X,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface StandupEntry {
  _id: string;
  projectId: string;
  organizationId: string;
  userId: {
    _id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      avatar?: string;
    };
  } | string;
  isTeamStandup: boolean;
  yesterday: string;
  today: string;
  blockers: string[];
  status: 'draft' | 'published';
  writtenBy?: {
    _id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  } | string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
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

interface Project {
  _id: string;
  name: string;
  key: string;
}

type DateFilter = 'today' | 'yesterday';

export default function StandupPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [standups, setStandups] = useState<StandupEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingStandup, setEditingStandup] = useState<StandupEntry | null>(null);
  const [formData, setFormData] = useState({ yesterday: '', today: '', blockers: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [myStandupData, setMyStandupData] = useState<StandupEntry | null>(null);
  
  // Summary view
  const [showSummary, setShowSummary] = useState(false);

  const isLeader = currentUserRole === 'lead' || currentUserRole === 'manager';

  const getDateForFilter = (filter: DateFilter) => {
    const date = new Date();
    if (filter === 'yesterday') {
      date.setDate(date.getDate() - 1);
    }
    return date.toISOString().split('T')[0];
  };

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  }, [projectId]);

  const fetchMembers = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.members) {
        const membersList: TeamMember[] = data.data.members.map((member: ProjectMember) => {
          const firstName = member.userId?.profile?.firstName || '';
          const lastName = member.userId?.profile?.lastName || '';
          const name = firstName || lastName 
            ? `${firstName} ${lastName}`.trim() 
            : member.userId?.email || 'Unknown';
          return {
            id: member.userId?._id || member._id,
            name,
            email: member.userId?.email || '',
            avatar: member.userId?.profile?.avatar,
            role: member.role,
          };
        });
        setMembers(membersList);
        
        // Find current user's role
        const currentMember = data.data.members.find((m: ProjectMember) => m.userId?._id === currentUserId);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
    }
  }, [projectId, currentUserId]);

  const fetchStandups = useCallback(async (token: string) => {
    try {
      const date = getDateForFilter(dateFilter);
      // Use /today endpoint for today's standups, otherwise filter by date
      const endpoint = dateFilter === 'today'
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/standups/today`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/standups?date=${date}`;
      
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.standups) {
        setStandups(data.data.standups);
      } else {
        setStandups([]);
      }
    } catch (error) {
      console.error('Failed to fetch standups:', error);
      setStandups([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, dateFilter]);

  // Fetch current user's standup using /me endpoint
  const fetchMyStandup = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/standups/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.standup) {
        setMyStandupData(data.data.standup);
      } else {
        setMyStandupData(null);
      }
    } catch (error) {
      console.error('Failed to fetch my standup:', error);
      setMyStandupData(null);
    }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Get current user ID from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setCurrentUserId(payload.userId || payload.id || payload.sub);
    } catch {
      console.error('Failed to parse token');
    }
    
    fetchProject(token);
  }, [projectId, router, fetchProject]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token && currentUserId) {
      fetchMembers(token);
      fetchMyStandup(token);
    }
  }, [currentUserId, fetchMembers, fetchMyStandup]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      fetchStandups(token);
    }
  }, [dateFilter, fetchStandups]);

  const handleRefresh = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token) {
      setIsLoading(true);
      fetchStandups(token);
      fetchMyStandup(token);
    }
  };

  // Helper to get user ID from standup (userId can be object or string)
  const getStandupUserId = (standup: StandupEntry): string => {
    if (typeof standup.userId === 'string') return standup.userId;
    return standup.userId._id;
  };

  // Helper to get writtenBy name
  const getWrittenByName = (standup: StandupEntry): string | null => {
    if (!standup.writtenBy) return null;
    if (typeof standup.writtenBy === 'string') return null;
    const { profile, email } = standup.writtenBy;
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return email || null;
  };

  // Helper to get writtenBy ID
  const getWrittenById = (standup: StandupEntry): string | null => {
    if (!standup.writtenBy) return null;
    if (typeof standup.writtenBy === 'string') return standup.writtenBy;
    return standup.writtenBy._id;
  };

  const getUserStandup = (userId: string) => {
    return standups.find(s => getStandupUserId(s) === userId);
  };

  // Use myStandupData from /me endpoint for current user's standup (more reliable)
  const myStandup = myStandupData || (currentUserId ? getUserStandup(currentUserId) : null);
  const canWriteStandup = dateFilter === 'today' && !myStandup;
  const canEditStandup = dateFilter === 'today' && myStandup;

  const handleOpenForm = (memberId?: string) => {
    if (memberId && memberId !== currentUserId) {
      // Leader writing for someone else
      setSelectedMemberId(memberId);
      const existingStandup = getUserStandup(memberId);
      if (existingStandup) {
        setEditingStandup(existingStandup);
        setFormData({
          yesterday: existingStandup.yesterday,
          today: existingStandup.today,
          blockers: existingStandup.blockers.join('\n'),
        });
      } else {
        setEditingStandup(null);
        setFormData({ yesterday: '', today: '', blockers: '' });
      }
    } else {
      // Writing own standup
      setSelectedMemberId(null);
      if (myStandup) {
        setEditingStandup(myStandup);
        setFormData({
          yesterday: myStandup.yesterday,
          today: myStandup.today,
          blockers: myStandup.blockers.join('\n'),
        });
      } else {
        setEditingStandup(null);
        setFormData({ yesterday: '', today: '', blockers: '' });
      }
    }
    setShowForm(true);
  };

  const handleSaveStandup = async (status: 'draft' | 'published') => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !formData.today.trim()) return;

    setIsSaving(true);
    try {
      const targetUserId = selectedMemberId || currentUserId;
      const blockers = formData.blockers.split('\n').filter(b => b.trim());
      
      const url = editingStandup
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/standups/${editingStandup._id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/standups`;
      
      const res = await fetch(url, {
        method: editingStandup ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: targetUserId,
          yesterday: formData.yesterday,
          today: formData.today,
          blockers,
          status,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        setFormData({ yesterday: '', today: '', blockers: '' });
        setEditingStandup(null);
        setSelectedMemberId(null);
        fetchStandups(token);
      }
    } catch (error) {
      console.error('Failed to save standup:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStats = () => {
    const submitted = standups.filter(s => s.status === 'published').length;
    const drafts = standups.filter(s => s.status === 'draft').length;
    const pending = members.length - standups.length;
    const allBlockers = standups.flatMap(s => s.blockers);
    
    return { submitted, drafts, pending, blockers: allBlockers };
  };

  const stats = getStats();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ProjectHeader 
        projectKey={project?.key} 
        projectName={project?.name}
        projectId={projectId}
      />

      <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Daily Standup</h2>
            </div>
            
            {/* Date Filter */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDateFilter('today')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateFilter === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className="h-4 w-4" />
                Today
              </button>
              <button
                onClick={() => setDateFilter('yesterday')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dateFilter === 'yesterday' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Yesterday
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            
            {isLeader && (
              <button
                onClick={() => setShowSummary(!showSummary)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showSummary ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Summary
              </button>
            )}
            
            {dateFilter === 'today' && (canWriteStandup || canEditStandup) && (
              <button
                onClick={() => handleOpenForm()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                {canEditStandup ? <Edit3 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                {canEditStandup ? 'Edit My Standup' : 'Write Standup'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{members.length} Team Members</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">{stats.submitted} Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">{stats.drafts} Drafts</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">{stats.pending} Pending</span>
          </div>
          {stats.blockers.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">{stats.blockers.length} Blockers</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Summary Panel (Leader only) */}
          {showSummary && isLeader && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Summary
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
                  <div className="text-xs text-gray-500">Submitted</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.blockers.length}</div>
                  <div className="text-xs text-gray-500">Blockers</div>
                </div>
              </div>
              {stats.blockers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-purple-800 mb-2">All Blockers:</h4>
                  <ul className="space-y-1">
                    {stats.blockers.map((blocker, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {blocker}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Standups List */}
          <div className="space-y-4">
            {members.map((member) => {
              const standup = getUserStandup(member.id);
              const isCurrentUser = member.id === currentUserId;
              
              return (
                <div
                  key={member.id}
                  className={`bg-white border rounded-xl p-5 transition-all ${
                    standup?.status === 'published'
                      ? 'border-green-200'
                      : standup?.status === 'draft'
                      ? 'border-yellow-200'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium ${
                        standup?.status === 'published' ? 'bg-green-100 text-green-700' :
                        standup?.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      {standup?.status === 'published' && (
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </span>
                      )}
                      {member.role === 'lead' && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Crown className="h-3 w-3 text-yellow-800" />
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {member.name}
                            {isCurrentUser && <span className="text-blue-600 text-sm ml-2">(You)</span>}
                          </h3>
                          {standup?.status === 'published' && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Published
                            </span>
                          )}
                          {standup?.status === 'draft' && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              Draft
                            </span>
                          )}
                          {!standup && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                              Pending
                            </span>
                          )}
                          {standup && getWrittenByName(standup) && getWrittenById(standup) !== getStandupUserId(standup) && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Written by {getWrittenByName(standup)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {standup && (
                            <span className="text-xs text-gray-500">
                              {formatTime(standup.updatedAt)}
                            </span>
                          )}
                          {/* Edit button for own standup */}
                          {isCurrentUser && standup && dateFilter === 'today' && (
                            <button
                              onClick={() => handleOpenForm()}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          {/* Leader can write for others */}
                          {isLeader && !isCurrentUser && dateFilter === 'today' && (
                            <button
                              onClick={() => handleOpenForm(member.id)}
                              className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Write standup for this member"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Standup Content */}
                      {standup ? (
                        <div className="space-y-2 text-sm">
                          {standup.yesterday && (
                            <div className="flex items-start gap-2">
                              <span className="text-gray-500 w-20 shrink-0">Yesterday:</span>
                              <span className="text-gray-700">{standup.yesterday}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-gray-500 w-20 shrink-0">Today:</span>
                            <span className="text-gray-700">{standup.today}</span>
                          </div>
                          {standup.blockers.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-red-500 w-20 shrink-0">Blockers:</span>
                              <div className="space-y-1">
                                {standup.blockers.map((blocker, i) => (
                                  <div key={i} className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    <span>{blocker}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No standup submitted yet</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Standup Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStandup ? 'Edit Standup' : 'Write Standup'}
                {selectedMemberId && (
                  <span className="text-purple-600 text-sm ml-2">
                    (for {members.find(m => m.id === selectedMemberId)?.name})
                  </span>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData({ yesterday: '', today: '', blockers: '' });
                  setEditingStandup(null);
                  setSelectedMemberId(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What did you do yesterday? <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={formData.yesterday}
                  onChange={(e) => setFormData(prev => ({ ...prev, yesterday: e.target.value }))}
                  placeholder="Completed authentication API, Fixed bugs..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What will you do today? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.today}
                  onChange={(e) => setFormData(prev => ({ ...prev, today: e.target.value }))}
                  placeholder="Working on task board UI, Code review..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Any blockers? <span className="text-gray-400">(one per line)</span>
                </label>
                <textarea
                  value={formData.blockers}
                  onChange={(e) => setFormData(prev => ({ ...prev, blockers: e.target.value }))}
                  placeholder="Waiting for backend API&#10;Need access to production logs"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => handleSaveStandup('draft')}
                disabled={isSaving || !formData.today.trim()}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                onClick={() => handleSaveStandup('published')}
                disabled={isSaving || !formData.today.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

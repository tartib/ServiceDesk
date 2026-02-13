'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Heart,
  Vote,
  CheckCircle2,
  Target,
  X,
  Lightbulb,
  Clock,
  Timer,
  StopCircle,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface User {
  _id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
}

interface RetrospectiveNote {
  _id: string;
  category: 'went_well' | 'to_improve';
  content: string;
  createdBy: User;
  votes: string[];
  voteCount: number;
  createdAt: string;
}

interface ActionItem {
  _id: string;
  title: string;
  description?: string;
  owner?: User;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  linkedNoteId?: string;
  linkedToNextSprint?: string;
  createdAt: string;
}

interface Retrospective {
  _id: string;
  projectId: string;
  organizationId: string;
  sprintId: {
    _id: string;
    name: string;
    number: number;
    status: string;
    startDate: string;
    endDate: string;
  };
  status: 'draft' | 'voting' | 'published' | 'archived';
  maxVotesPerUser: number;
  notes: RetrospectiveNote[];
  actionItems: ActionItem[];
  publishedBy?: User;
  publishedAt?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

interface Sprint {
  _id: string;
  name: string;
  number: number;
  status: string;
  startDate: string;
  endDate: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  members: Array<{
    userId: { _id: string };
    role: string;
  }>;
}

interface VotingStatus {
  maxVotes: number;
  usedVotes: number;
  remainingVotes: number;
  votedNoteIds: string[];
}

const columnConfig = {
  went_well: { 
    title: 'What went well', 
    icon: ThumbsUp, 
    color: 'bg-green-500', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200' 
  },
  to_improve: { 
    title: 'What to improve', 
    icon: ThumbsDown, 
    color: 'bg-orange-500', 
    bgColor: 'bg-orange-50', 
    borderColor: 'border-orange-200' 
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function RetrospectivePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [retrospectives, setRetrospectives] = useState<Retrospective[]>([]);
  const [retrospective, setRetrospective] = useState<Retrospective | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  
  // Create retrospective form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [maxVotes, setMaxVotes] = useState(3);
  
  // Voting timer
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [votingDuration, setVotingDuration] = useState(15); // minutes
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  
  // Form states
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteCategory, setNoteCategory] = useState<'went_well' | 'to_improve'>('went_well');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Action item form
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const isLeader = currentUserRole === 'lead' || currentUserRole === 'manager';
  const canAddNotes = retrospective?.status === 'draft' || retrospective?.status === 'voting';
  const canVote = retrospective?.status === 'draft' || retrospective?.status === 'voting';

  const getUserName = (user?: User) => {
    if (!user) return 'Unknown';
    if (user.profile?.firstName || user.profile?.lastName) {
      return `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim();
    }
    return user.email || 'Unknown';
  };
  
  const getUserInitial = (user?: User) => {
    const name = getUserName(user);
    return name && name.length > 0 ? name[0].toUpperCase() : '?';
  };

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data.project);
        
        // Find current user's role
        const currentMember = data.data.project.members.find(
          (m: { userId: { _id: string }; role: string }) => m.userId._id === currentUserId
        );
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
    }
  }, [projectId, currentUserId]);

  const fetchSprints = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/pm/projects/${projectId}/sprints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSprints(data.data.sprints || []);
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
    }
  }, [projectId]);

  const fetchRetrospective = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/pm/projects/${projectId}/retrospectives`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.retrospectives.length > 0) {
        setRetrospectives(data.data.retrospectives);
        // Get the most recent retrospective
        setRetrospective(data.data.retrospectives[0]);
      }
    } catch (error) {
      console.error('Failed to fetch retrospective:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchVotingStatus = useCallback(async (token: string, retroId: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/pm/retrospectives/${retroId}/voting-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setVotingStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch voting status:', error);
    }
  }, []);

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
    fetchSprints(token);
    fetchRetrospective(token);
  }, [projectId, router, fetchProject, fetchSprints, fetchRetrospective]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token && retrospective) {
      fetchVotingStatus(token, retrospective._id);
    }
  }, [retrospective, fetchVotingStatus]);
  
  const handleCloseVoting = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !retrospective) return;
    
    setTimerActive(false);
    setTimeRemaining(null);
    await handlePublish();
  }, [retrospective]);
  
  // Timer countdown effect
  useEffect(() => {
    if (!timerActive || timeRemaining === null || timeRemaining <= 0) {
      if (timeRemaining === 0) {
        // Auto-close voting when timer expires
        handleCloseVoting();
      }
      return;
    }
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining, handleCloseVoting]);
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateRetrospective = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !selectedSprintId) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/v1/pm/sprints/${selectedSprintId}/retrospective`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maxVotesPerUser: maxVotes,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowCreateForm(false);
        setSelectedSprintId('');
        setMaxVotes(3);
        fetchRetrospective(token);
      }
    } catch (error) {
      console.error('Failed to create retrospective:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !retrospective || !noteContent.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/v1/pm/retrospectives/${retrospective._id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: noteCategory,
          content: noteContent,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowNoteForm(false);
        setNoteContent('');
        fetchRetrospective(token);
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVote = async (noteId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !retrospective) return;

    const note = retrospective.notes.find(n => n._id === noteId);
    if (!note) return;

    const hasVoted = note.votes.includes(currentUserId || '');
    const endpoint = hasVoted ? 'DELETE' : 'POST';

    try {
      const res = await fetch(`${API_URL}/v1/pm/retrospectives/${retrospective._id}/notes/${noteId}/vote`, {
        method: endpoint,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      if (data.success) {
        fetchRetrospective(token);
        fetchVotingStatus(token, retrospective._id);
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handlePublish = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !retrospective) return;

    try {
      const res = await fetch(`${API_URL}/v1/pm/retrospectives/${retrospective._id}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      if (data.success) {
        fetchRetrospective(token);
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    }
  };

  const handleStartVotingWithTimer = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !retrospective) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/v1/pm/retrospectives/${retrospective._id}/start-voting`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const data = await res.json();
      if (data.success) {
        setShowVotingModal(false);
        fetchRetrospective(token);
        // Start timer
        setTimeRemaining(votingDuration * 60); // Convert minutes to seconds
        setTimerActive(true);
      }
    } catch (error) {
      console.error('Failed to start voting:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddActionItem = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token || !retrospective || !actionTitle.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/v1/pm/retrospectives/${retrospective._id}/action-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: actionTitle,
          description: actionDescription || undefined,
          linkedNoteId: selectedNoteId || undefined,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setShowActionForm(false);
        setActionTitle('');
        setActionDescription('');
        setSelectedNoteId(null);
        fetchRetrospective(token);
      }
    } catch (error) {
      console.error('Failed to add action item:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getNotesByCategory = (category: 'went_well' | 'to_improve') => {
    if (!retrospective) return [];
    return retrospective.notes
      .filter(note => note.category === category)
      .sort((a, b) => b.voteCount - a.voteCount);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (!retrospective) {
    console.log('No retrospective found. isLeader:', isLeader, 'currentUserRole:', currentUserRole);
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <ProjectHeader 
          projectKey={project?.key} 
          projectName={project?.name}
          projectId={projectId}
        />
        <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Retrospective Found</h3>
            <p className="text-gray-500 mb-4">Create a retrospective for your sprint to get started.</p>
            <p className="text-xs text-gray-400 mb-2">Debug: isLeader={String(isLeader)}, role={currentUserRole}</p>
            {isLeader && (
              <button 
                onClick={() => {
                  console.log('Create button clicked, isLeader:', isLeader);
                  console.log('Current showCreateForm:', showCreateForm);
                  setShowCreateForm(true);
                  console.log('After setState, showCreateForm should be true');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create Retrospective
              </button>
            )}
            {!isLeader && (
              <p className="text-sm text-gray-500">Only managers and leads can create retrospectives</p>
            )}
          </div>
        </div>
        
        {/* Create Retrospective Modal - Debug */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Create Retrospective</h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedSprintId('');
                    setMaxVotes(3);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Sprint <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSprintId}
                    onChange={(e) => setSelectedSprintId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Choose a sprint...</option>
                    {sprints
                      .filter(sprint => !retrospectives.some(retro => 
                        typeof retro.sprintId === 'object' ? retro.sprintId._id === sprint._id : retro.sprintId === sprint._id
                      ))
                      .map((sprint) => (
                        <option key={sprint._id} value={sprint._id}>
                          {sprint.name} - {sprint.status}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {sprints.filter(sprint => !retrospectives.some(retro => 
                      typeof retro.sprintId === 'object' ? retro.sprintId._id === sprint._id : retro.sprintId === sprint._id
                    )).length} available sprints (excluding those with existing retrospectives)
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Votes Per User
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxVotes}
                    onChange={(e) => setMaxVotes(parseInt(e.target.value) || 3)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Each team member can vote up to {maxVotes} times</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedSprintId('');
                    setMaxVotes(3);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRetrospective}
                  disabled={isSaving || !selectedSprintId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Retrospective'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    voting: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    archived: 'bg-purple-100 text-purple-700',
  };

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
              <MessageCircle className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Retrospective</h2>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
              {typeof retrospective.sprintId === 'object' ? retrospective.sprintId.name : 'Sprint'}
            </span>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[retrospective.status]}`}>
              {retrospective.status.charAt(0).toUpperCase() + retrospective.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {retrospectives.length > 1 && (
              <select
                value={retrospective._id}
                onChange={(e) => {
                  const selected = retrospectives.find(r => r._id === e.target.value);
                  if (selected) setRetrospective(selected);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {retrospectives.map((retro) => (
                  <option key={retro._id} value={retro._id}>
                    {typeof retro.sprintId === 'object' ? retro.sprintId.name : 'Sprint'} - {retro.status}
                  </option>
                ))}
              </select>
            )}
            {timerActive && timeRemaining !== null && (
              <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg ${
                timeRemaining < 60 ? 'bg-red-100 text-red-700' : 
                timeRemaining < 300 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                <Timer className="h-4 w-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
            )}
            {votingStatus && (
              <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                <Vote className="h-4 w-4" />
                <span>{votingStatus.remainingVotes}/{votingStatus.maxVotes} votes left</span>
              </div>
            )}
            {isLeader && (
              <button 
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                New Retrospective
              </button>
            )}
            {isLeader && retrospective.status === 'draft' && (
              <button 
                onClick={() => setShowVotingModal(true)}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <Clock className="h-4 w-4 inline mr-1" />
                Start Voting
              </button>
            )}
            {isLeader && retrospective.status === 'voting' && timerActive && (
              <button 
                onClick={handleCloseVoting}
                className="px-4 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                <StopCircle className="h-4 w-4 inline mr-1" />
                Close Voting
              </button>
            )}
            {isLeader && (retrospective.status === 'draft' || retrospective.status === 'voting') && (
              <button 
                onClick={handlePublish}
                className="px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
              >
                <CheckCircle2 className="h-4 w-4 inline mr-1" />
                Publish
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-3 gap-4 h-full">
          {/* Notes Columns */}
          {(['went_well', 'to_improve'] as const).map((category) => {
            const config = columnConfig[category];
            const Icon = config.icon;
            const notes = getNotesByCategory(category);

            return (
              <div key={category} className={`flex flex-col rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden`}>
                <div className={`px-4 py-3 ${config.color} text-white`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-semibold">{config.title}</h3>
                    <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm">
                      {notes.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note._id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm text-gray-800 mb-3">{note.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700">
                            {getUserInitial(note.createdBy)}
                          </div>
                          <span className="text-xs text-gray-500">{getUserName(note.createdBy)}</span>
                        </div>
                        {canVote && (
                          <button
                            onClick={() => handleVote(note._id)}
                            disabled={!votingStatus || (votingStatus.remainingVotes === 0 && !note.votes.includes(currentUserId || ''))}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                              note.votes.includes(currentUserId || '')
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                            }`}
                          >
                            <Heart className={`h-3.5 w-3.5 ${note.votes.includes(currentUserId || '') ? 'fill-current' : ''}`} />
                            <span>{note.voteCount}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {canAddNotes && (
                  <div className="p-3 border-t border-gray-200 bg-white/50">
                    <button
                      onClick={() => {
                        setNoteCategory(category);
                        setShowNoteForm(true);
                      }}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2 ${config.color} text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium`}
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Action Items Column */}
          <div className="flex flex-col rounded-xl border border-blue-200 bg-blue-50 overflow-hidden">
            <div className="px-4 py-3 bg-blue-500 text-white">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                <h3 className="font-semibold">Action Items</h3>
                <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-sm">
                  {retrospective.actionItems.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {retrospective.actionItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    {item.owner && (
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                          {getUserInitial(item.owner)}
                        </div>
                        <span className="text-xs text-gray-500">{getUserName(item.owner)}</span>
                      </div>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'completed' ? 'bg-green-100 text-green-700' :
                      item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {isLeader && (
              <div className="p-3 border-t border-gray-200 bg-white/50">
                <button
                  onClick={() => setShowActionForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Action Item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Voting Modal */}
      {showVotingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Start Voting Session</h3>
              <button
                onClick={() => setShowVotingModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Timer className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Voting Timer</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Set a time limit for the voting session. When the timer expires, voting will automatically close and the retrospective will be published.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voting Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={votingDuration}
                  onChange={(e) => setVotingDuration(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 10-15 minutes for small teams, 15-30 minutes for larger teams
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> Team members will see a countdown timer. You can manually close voting at any time using the &quot;Close Voting&quot; button.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowVotingModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleStartVotingWithTimer}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Starting...' : `Start ${votingDuration} Min Timer`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Note</h3>
              <button
                onClick={() => {
                  setShowNoteForm(false);
                  setNoteContent('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNoteCategory('went_well')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      noteCategory === 'went_well'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4 inline mr-1" />
                    Went Well
                  </button>
                  <button
                    onClick={() => setNoteCategory('to_improve')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      noteCategory === 'to_improve'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4 inline mr-1" />
                    To Improve
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowNoteForm(false);
                  setNoteContent('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={isSaving || !noteContent.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Retrospective Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Create Retrospective</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedSprintId('');
                  setMaxVotes(3);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Sprint <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a sprint...</option>
                  {sprints.map((sprint) => (
                    <option key={sprint._id} value={sprint._id}>
                      {sprint.name} - {sprint.status}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Votes Per User
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxVotes}
                  onChange={(e) => setMaxVotes(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">Each team member can vote up to {maxVotes} times</p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setSelectedSprintId('');
                  setMaxVotes(3);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRetrospective}
                disabled={isSaving || !selectedSprintId}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Creating...' : 'Create Retrospective'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Action Item Modal */}
      {showActionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Action Item</h3>
              <button
                onClick={() => {
                  setShowActionForm(false);
                  setActionTitle('');
                  setActionDescription('');
                  setSelectedNoteId(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="Action item title..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowActionForm(false);
                  setActionTitle('');
                  setActionDescription('');
                  setSelectedNoteId(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddActionItem}
                disabled={isSaving || !actionTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? 'Adding...' : 'Add Action Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

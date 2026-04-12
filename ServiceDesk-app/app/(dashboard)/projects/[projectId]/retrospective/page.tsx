'use client';

import { API_URL } from '@/lib/api/config';
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
 History,
 FileDown,
 ChevronRight,
 Printer,
 TrendingUp,
 AlertTriangle,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { toast } from 'sonner';

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
 votingStartedAt?: string;
 votingDurationMinutes?: number;
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
 color: 'bg-success', 
 bgColor: 'bg-success-soft', 
 borderColor: 'border-success/30' 
 },
 to_improve: { 
 title: 'What to improve', 
 icon: ThumbsDown, 
 color: 'bg-warning', 
 bgColor: 'bg-warning-soft', 
 borderColor: 'border-warning/20' 
 },
};

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

 // History & Report views
 const [viewMode, setViewMode] = useState<'board' | 'history' | 'report'>('board');

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
 const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) {
 setProject(data.data.project);
 
 // Find current user's role
 const currentMember = data.data.project.members.find(
 (m: { userId: { _id: string } | string; role: string }) => {
 const uid = typeof m.userId === 'string' ? m.userId : m.userId?._id;
 return uid === currentUserId;
 }
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
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/sprints`, {
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
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/retrospectives`, {
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
 const res = await fetch(`${API_URL}/pm/retrospectives/${retroId}/voting-status`, {
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

 // Restore voting timer from backend data on page load / retrospective change
 useEffect(() => {
 if (
 retrospective?.status === 'voting' &&
 retrospective.votingStartedAt &&
 retrospective.votingDurationMinutes &&
 !timerActive
 ) {
 const startedAt = new Date(retrospective.votingStartedAt).getTime();
 const durationMs = retrospective.votingDurationMinutes * 60 * 1000;
 const endTime = startedAt + durationMs;
 const remaining = Math.floor((endTime - Date.now()) / 1000);

 if (remaining > 0) {
 setTimeRemaining(remaining);
 setTimerActive(true);
 }
 }
 }, [retrospective, timerActive]);
 
 const handleCloseVoting = useCallback(async () => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token || !retrospective) return;
 
 setTimerActive(false);
 setTimeRemaining(null);
 
 try {
 const res = await fetch(`${API_URL}/pm/retrospectives/${retrospective._id}/publish`, {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` },
 });
 const data = await res.json();
 if (data.success) {
 fetchRetrospective(token);
 }
 } catch (error) {
 console.error('Failed to close voting:', error);
 }
 }, [retrospective, fetchRetrospective]);
 
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
 const res = await fetch(`${API_URL}/pm/sprints/${selectedSprintId}/retrospective`, {
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
 toast.success('Retrospective created!');
 } else {
 toast.error(data.error || 'Failed to create retrospective');
 }
 } catch (error) {
 console.error('Failed to create retrospective:', error);
 toast.error('Failed to create retrospective');
 } finally {
 setIsSaving(false);
 }
 };

 const handleAddNote = async () => {
 const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
 if (!token || !retrospective || !noteContent.trim()) return;

 setIsSaving(true);
 try {
 const res = await fetch(`${API_URL}/pm/retrospectives/${retrospective._id}/notes`, {
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
 const res = await fetch(`${API_URL}/pm/retrospectives/${retrospective._id}/notes/${noteId}/vote`, {
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
 const res = await fetch(`${API_URL}/pm/retrospectives/${retrospective._id}/publish`, {
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
 const res = await fetch(`${API_URL}/pm/retrospectives/${retrospective._id}/start-voting`, {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}`,
 },
 body: JSON.stringify({ votingDurationMinutes: votingDuration }),
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
 const res = await fetch(`${API_URL}/pm/retrospectives/${retrospective._id}/action-items`, {
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
 return (
 <div className="flex flex-col h-full bg-muted/50">
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />
 
 <div className="flex-1 flex items-center justify-center">
 <div className="text-center">
 <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-semibold text-foreground mb-2">No Retrospective Found</h3>
 <p className="text-muted-foreground mb-4">Create a retrospective for your sprint to get started.</p>
 {isLeader && (
 <button 
 onClick={() => setShowCreateForm(true)}
 className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info"
 >
 Create Retrospective
 </button>
 )}
 {!isLeader && (
 <p className="text-sm text-muted-foreground">Only managers and leads can create retrospectives</p>
 )}
 </div>
 </div>
 
 {/* Create Retrospective Modal - Debug */}
 {showCreateForm && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl shadow-xl w-full max-w-lg">
 <div className="flex items-center justify-between p-4 border-b border-border">
 <h3 className="text-lg font-semibold text-foreground">Create Retrospective</h3>
 <button
 onClick={() => {
 setShowCreateForm(false);
 setSelectedSprintId('');
 setMaxVotes(3);
 }}
 className="p-1 text-muted-foreground hover:text-muted-foreground rounded"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 
 <div className="p-4 space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Select Sprint <span className="text-destructive">*</span>
 </label>
 <select
 value={selectedSprintId}
 onChange={(e) => setSelectedSprintId(e.target.value)}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-info"
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
 <p className="text-xs text-muted-foreground mt-1">
 {sprints.filter(sprint => !retrospectives.some(retro => 
 typeof retro.sprintId === 'object' ? retro.sprintId._id === sprint._id : retro.sprintId === sprint._id
 )).length} available sprints (excluding those with existing retrospectives)
 </p>
 </div>
 
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Max Votes Per User
 </label>
 <input
 type="number"
 min="1"
 max="10"
 value={maxVotes}
 onChange={(e) => setMaxVotes(parseInt(e.target.value) || 3)}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-info"
 />
 <p className="text-xs text-muted-foreground mt-1">Each team member can vote up to {maxVotes} times</p>
 </div>
 </div>
 
 <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/50 rounded-b-xl">
 <button
 onClick={() => {
 setShowCreateForm(false);
 setSelectedSprintId('');
 setMaxVotes(3);
 }}
 className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleCreateRetrospective}
 disabled={isSaving || !selectedSprintId}
 className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info transition-colors text-sm font-medium disabled:opacity-50"
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
 draft: 'bg-muted text-foreground',
 voting: 'bg-brand-soft text-brand',
 published: 'bg-success-soft text-success',
 archived: 'bg-info-soft text-info',
 };

 return (
 <div className="flex flex-col h-full bg-muted/50">
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Toolbar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <MessageCircle className="h-5 w-5 text-info" />
 <h2 className="text-lg font-semibold text-foreground">Retrospective</h2>
 </div>
 <span className="px-3 py-1 bg-info-soft text-info text-sm font-medium rounded-full">
 {typeof retrospective.sprintId === 'object' ? retrospective.sprintId.name : 'Sprint'}
 </span>
 <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[retrospective.status]}`}>
 {retrospective.status.charAt(0).toUpperCase() + retrospective.status.slice(1)}
 </span>
 </div>
 <div className="flex items-center gap-2">
 {/* View Mode Tabs */}
 <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
 <button
 onClick={() => setViewMode('board')}
 className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
 viewMode === 'board' ? 'bg-background text-info shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 <MessageCircle className="h-3.5 w-3.5" />
 Board
 </button>
 <button
 onClick={() => setViewMode('history')}
 className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
 viewMode === 'history' ? 'bg-background text-info shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 <History className="h-3.5 w-3.5" />
 History
 </button>
 <button
 onClick={() => setViewMode('report')}
 className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
 viewMode === 'report' ? 'bg-background text-info shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 <FileDown className="h-3.5 w-3.5" />
 Report
 </button>
 </div>
 {retrospectives.length > 1 && viewMode === 'board' && (
 <select
 value={retrospective._id}
 onChange={(e) => {
 const selected = retrospectives.find(r => r._id === e.target.value);
 if (selected) setRetrospective(selected);
 }}
 className="px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-info"
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
 timeRemaining < 60 ? 'bg-destructive-soft text-destructive' : 
 timeRemaining < 300 ? 'bg-warning-soft text-warning' : 
 'bg-brand-soft text-brand'
 }`}>
 <Timer className="h-4 w-4" />
 <span>{formatTime(timeRemaining)}</span>
 </div>
 )}
 {votingStatus && (
 <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
 <Vote className="h-4 w-4" />
 <span>{votingStatus.remainingVotes}/{votingStatus.maxVotes} votes left</span>
 </div>
 )}
 {isLeader && (
 <button 
 onClick={() => setShowCreateForm(true)}
 className="px-4 py-1.5 bg-success text-success-foreground text-sm font-medium rounded-lg hover:bg-success/80"
 >
 <Plus className="h-4 w-4 inline mr-1" />
 New Retrospective
 </button>
 )}
 {isLeader && retrospective.status === 'draft' && (
 <button 
 onClick={() => setShowVotingModal(true)}
 className="px-4 py-1.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong"
 >
 <Clock className="h-4 w-4 inline mr-1" />
 Start Voting
 </button>
 )}
 {isLeader && retrospective.status === 'voting' && timerActive && (
 <button 
 onClick={handleCloseVoting}
 className="px-4 py-1.5 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90"
 >
 <StopCircle className="h-4 w-4 inline mr-1" />
 Close Voting
 </button>
 )}
 {isLeader && (retrospective.status === 'draft' || retrospective.status === 'voting') && (
 <button 
 onClick={handlePublish}
 className="px-4 py-1.5 bg-info text-white text-sm font-medium rounded-lg hover:bg-info"
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
 {/* ===== HISTORY VIEW ===== */}
 {viewMode === 'history' && (
 <div className="h-full overflow-y-auto">
 <div className="max-w-4xl mx-auto space-y-4">
 <div className="flex items-center gap-3 mb-2">
 <History className="h-5 w-5 text-info" />
 <h3 className="text-lg font-semibold text-foreground">Retrospective History</h3>
 <span className="text-sm text-muted-foreground">({retrospectives.length} total)</span>
 </div>

 {retrospectives.length === 0 ? (
 <div className="text-center py-16 text-muted-foreground">
 <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
 <p>No retrospectives yet</p>
 </div>
 ) : (
 retrospectives.map((retro, idx) => {
 const sprintName = typeof retro.sprintId === 'object' ? retro.sprintId.name : 'Sprint';
 const sprintDates = typeof retro.sprintId === 'object'
 ? `${new Date(retro.sprintId.startDate).toLocaleDateString()} - ${new Date(retro.sprintId.endDate).toLocaleDateString()}`
 : '';
 const wentWell = retro.notes.filter(n => n.category === 'went_well');
 const toImprove = retro.notes.filter(n => n.category === 'to_improve');
 const totalVotes = retro.notes.reduce((sum, n) => sum + n.voteCount, 0);
 const completedActions = retro.actionItems.filter(a => a.status === 'completed').length;
 const isActive = retro._id === retrospective?._id;

 return (
 <div
 key={retro._id}
 className={`bg-background border rounded-xl overflow-hidden transition-all hover:shadow-md ${
 isActive ? 'border-info/30 ring-1 ring-info/30' : 'border-border'
 }`}
 >
 <div className="p-4">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
 retro.status === 'published' ? 'bg-success-soft text-success' :
 retro.status === 'voting' ? 'bg-brand-soft text-brand' :
 retro.status === 'archived' ? 'bg-info-soft text-info' :
 'bg-muted text-foreground'
 }`}>
 {idx + 1}
 </div>
 <div>
 <h4 className="font-semibold text-foreground">{sprintName}</h4>
 {sprintDates && <p className="text-xs text-muted-foreground">{sprintDates}</p>}
 </div>
 <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[retro.status]}`}>
 {retro.status.charAt(0).toUpperCase() + retro.status.slice(1)}
 </span>
 {isActive && (
 <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-info-soft text-info">Current</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground">{new Date(retro.createdAt).toLocaleDateString()}</span>
 <button
 onClick={() => { setRetrospective(retro); setViewMode('board'); }}
 className="flex items-center gap-1 px-3 py-1.5 text-sm text-info hover:bg-info-soft rounded-lg transition-colors font-medium"
 >
 View <ChevronRight className="h-3.5 w-3.5" />
 </button>
 </div>
 </div>

 {/* Stats row */}
 <div className="flex items-center gap-4 text-sm">
 <div className="flex items-center gap-1.5 text-success">
 <ThumbsUp className="h-3.5 w-3.5" />
 <span>{wentWell.length} went well</span>
 </div>
 <div className="flex items-center gap-1.5 text-warning">
 <ThumbsDown className="h-3.5 w-3.5" />
 <span>{toImprove.length} to improve</span>
 </div>
 <div className="flex items-center gap-1.5 text-destructive">
 <Heart className="h-3.5 w-3.5" />
 <span>{totalVotes} votes</span>
 </div>
 <div className="flex items-center gap-1.5 text-brand">
 <Target className="h-3.5 w-3.5" />
 <span>{completedActions}/{retro.actionItems.length} actions done</span>
 </div>
 </div>

 {/* Top voted notes preview */}
 {retro.notes.length > 0 && (
 <div className="mt-3 pt-3 border-t border-border">
 <p className="text-xs font-medium text-muted-foreground mb-2">Top voted items:</p>
 <div className="space-y-1.5">
 {[...retro.notes].sort((a, b) => b.voteCount - a.voteCount).slice(0, 3).map(note => (
 <div key={note._id} className="flex items-center gap-2 text-sm">
 <span className={`w-1.5 h-1.5 rounded-full ${note.category === 'went_well' ? 'bg-success' : 'bg-warning'}`} />
 <span className="text-foreground truncate flex-1">{note.content}</span>
 <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
 <Heart className="h-3 w-3" /> {note.voteCount}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 );
 })
 )}
 </div>
 </div>
 )}

 {/* ===== REPORT VIEW ===== */}
 {viewMode === 'report' && (
 <div className="h-full overflow-y-auto">
 <div className="max-w-3xl mx-auto">
 {/* Report Header */}
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <FileDown className="h-5 w-5 text-info" />
 <h3 className="text-lg font-semibold text-foreground">Retrospective Report</h3>
 </div>
 <div className="flex items-center gap-2">
 <select
 value={retrospective._id}
 onChange={(e) => {
 const selected = retrospectives.find(r => r._id === e.target.value);
 if (selected) setRetrospective(selected);
 }}
 className="px-3 py-1.5 text-sm border border-border rounded-lg"
 >
 {retrospectives.map((retro) => (
 <option key={retro._id} value={retro._id}>
 {typeof retro.sprintId === 'object' ? retro.sprintId.name : 'Sprint'} - {retro.status}
 </option>
 ))}
 </select>
 <button
 onClick={() => window.print()}
 className="flex items-center gap-2 px-4 py-1.5 bg-info text-white text-sm font-medium rounded-lg hover:bg-info"
 >
 <Printer className="h-4 w-4" />
 Print Report
 </button>
 </div>
 </div>

 {/* Printable Report Content */}
 <div className="bg-background border border-border rounded-xl shadow-sm print:shadow-none print:border-0" id="retro-report">
 {/* Report Title */}
 <div className="p-6 border-b border-border bg-info-soft">
 <h1 className="text-xl font-bold text-foreground">
 Sprint Retrospective: {typeof retrospective.sprintId === 'object' ? retrospective.sprintId.name : 'Sprint'}
 </h1>
 <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
 {typeof retrospective.sprintId === 'object' && (
 <span>
 {new Date(retrospective.sprintId.startDate).toLocaleDateString()} — {new Date(retrospective.sprintId.endDate).toLocaleDateString()}
 </span>
 )}
 <span>Status: {retrospective.status.charAt(0).toUpperCase() + retrospective.status.slice(1)}</span>
 <span>Generated: {new Date().toLocaleDateString()}</span>
 </div>
 </div>

 {/* Summary Stats */}
 <div className="p-6 border-b border-border">
 <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
 <TrendingUp className="h-4 w-4" /> Summary
 </h2>
 <div className="grid grid-cols-4 gap-4">
 <div className="text-center p-3 bg-success-soft rounded-lg">
 <div className="text-2xl font-bold text-success">
 {retrospective.notes.filter(n => n.category === 'went_well').length}
 </div>
 <div className="text-xs text-success mt-1">Went Well</div>
 </div>
 <div className="text-center p-3 bg-warning-soft rounded-lg">
 <div className="text-2xl font-bold text-warning">
 {retrospective.notes.filter(n => n.category === 'to_improve').length}
 </div>
 <div className="text-xs text-warning mt-1">To Improve</div>
 </div>
 <div className="text-center p-3 bg-destructive-soft rounded-lg">
 <div className="text-2xl font-bold text-destructive">
 {retrospective.notes.reduce((s, n) => s + n.voteCount, 0)}
 </div>
 <div className="text-xs text-destructive mt-1">Total Votes</div>
 </div>
 <div className="text-center p-3 bg-brand-surface rounded-lg">
 <div className="text-2xl font-bold text-brand">
 {retrospective.actionItems.length}
 </div>
 <div className="text-xs text-brand mt-1">Action Items</div>
 </div>
 </div>
 </div>

 {/* What Went Well */}
 <div className="p-6 border-b border-border">
 <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
 <ThumbsUp className="h-4 w-4 text-success" /> What Went Well
 </h2>
 {retrospective.notes.filter(n => n.category === 'went_well').length === 0 ? (
 <p className="text-sm text-muted-foreground italic">No items</p>
 ) : (
 <div className="space-y-2">
 {[...retrospective.notes]
 .filter(n => n.category === 'went_well')
 .sort((a, b) => b.voteCount - a.voteCount)
 .map((note, i) => (
 <div key={note._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
 <span className="text-sm font-medium text-muted-foreground w-5 text-right">{i + 1}.</span>
 <div className="flex-1">
 <p className="text-sm text-foreground">{note.content}</p>
 <span className="text-xs text-muted-foreground">by {getUserName(note.createdBy)}</span>
 </div>
 <div className="flex items-center gap-1 text-xs text-destructive">
 <Heart className="h-3 w-3" /> {note.voteCount}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* What To Improve */}
 <div className="p-6 border-b border-border">
 <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-warning" /> What To Improve
 </h2>
 {retrospective.notes.filter(n => n.category === 'to_improve').length === 0 ? (
 <p className="text-sm text-muted-foreground italic">No items</p>
 ) : (
 <div className="space-y-2">
 {[...retrospective.notes]
 .filter(n => n.category === 'to_improve')
 .sort((a, b) => b.voteCount - a.voteCount)
 .map((note, i) => (
 <div key={note._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
 <span className="text-sm font-medium text-muted-foreground w-5 text-right">{i + 1}.</span>
 <div className="flex-1">
 <p className="text-sm text-foreground">{note.content}</p>
 <span className="text-xs text-muted-foreground">by {getUserName(note.createdBy)}</span>
 </div>
 <div className="flex items-center gap-1 text-xs text-destructive">
 <Heart className="h-3 w-3" /> {note.voteCount}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Action Items */}
 <div className="p-6">
 <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
 <Target className="h-4 w-4 text-brand" /> Action Items
 </h2>
 {retrospective.actionItems.length === 0 ? (
 <p className="text-sm text-muted-foreground italic">No action items</p>
 ) : (
 <div className="space-y-2">
 {retrospective.actionItems.map((item, i) => (
 <div key={item._id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
 <span className="text-sm font-medium text-muted-foreground w-5 text-right">{i + 1}.</span>
 <div className="flex-1">
 <p className="text-sm font-medium text-foreground">{item.title}</p>
 {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
 {item.owner && <span className="text-xs text-muted-foreground">Owner: {getUserName(item.owner)}</span>}
 </div>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 item.status === 'completed' ? 'bg-success-soft text-success' :
 item.status === 'in_progress' ? 'bg-warning-soft text-warning' :
 'bg-muted text-muted-foreground'
 }`}>
 {item.status.replace('_', ' ')}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ===== BOARD VIEW (original) ===== */}
 {viewMode === 'board' && <div className="grid grid-cols-3 gap-4 h-full">
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
 <span className="ml-auto bg-background/20 px-2 py-0.5 rounded-full text-sm">
 {notes.length}
 </span>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-3 space-y-3">
 {notes.map((note) => (
 <div
 key={note._id}
 className="bg-background rounded-lg p-3 shadow-sm border border-border hover:shadow-md transition-shadow"
 >
 <p className="text-sm text-foreground mb-3">{note.content}</p>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-info-soft flex items-center justify-center text-xs font-medium text-info">
 {getUserInitial(note.createdBy)}
 </div>
 <span className="text-xs text-muted-foreground">{getUserName(note.createdBy)}</span>
 </div>
 {canVote && (
 <button
 onClick={() => handleVote(note._id)}
 disabled={!votingStatus || (votingStatus.remainingVotes === 0 && !note.votes.includes(currentUserId || ''))}
 className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
 note.votes.includes(currentUserId || '')
 ? 'bg-destructive-soft text-destructive'
 : 'bg-muted text-muted-foreground hover:bg-muted disabled:opacity-50'
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
 <div className="p-3 border-t border-border bg-background/50">
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
 <div className="flex flex-col rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
 <div className="px-4 py-3 bg-brand text-brand-foreground">
 <div className="flex items-center gap-2">
 <Lightbulb className="h-5 w-5" />
 <h3 className="font-semibold">Action Items</h3>
 <span className="ml-auto bg-background/20 px-2 py-0.5 rounded-full text-sm">
 {retrospective.actionItems.length}
 </span>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-3 space-y-3">
 {retrospective.actionItems.map((item) => (
 <div
 key={item._id}
 className="bg-background rounded-lg p-3 shadow-sm border border-border"
 >
 <div className="flex items-start gap-2 mb-2">
 <Target className="h-4 w-4 text-brand mt-0.5" />
 <div className="flex-1">
 <p className="text-sm font-medium text-foreground">{item.title}</p>
 {item.description && (
 <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
 )}
 </div>
 </div>
 <div className="flex items-center justify-between mt-2">
 {item.owner && (
 <div className="flex items-center gap-1">
 <div className="w-5 h-5 rounded-full bg-brand-soft flex items-center justify-center text-xs font-medium text-brand">
 {getUserInitial(item.owner)}
 </div>
 <span className="text-xs text-muted-foreground">{getUserName(item.owner)}</span>
 </div>
 )}
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
 item.status === 'completed' ? 'bg-success-soft text-success' :
 item.status === 'in_progress' ? 'bg-warning-soft text-warning' :
 'bg-muted text-muted-foreground'
 }`}>
 {item.status.replace('_', ' ')}
 </span>
 </div>
 </div>
 ))}
 </div>

 {isLeader && (
 <div className="p-3 border-t border-border bg-background/50">
 <button
 onClick={() => setShowActionForm(true)}
 className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-brand text-brand-foreground rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
 >
 <Plus className="h-4 w-4" />
 Add Action Item
 </button>
 </div>
 )}
 </div>
 </div>}
 </div>

 {/* Start Voting Modal */}
 {showVotingModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-background rounded-xl shadow-xl w-full max-w-md">
 <div className="flex items-center justify-between p-4 border-b border-border">
 <h3 className="text-lg font-semibold text-foreground">Start Voting Session</h3>
 <button
 onClick={() => setShowVotingModal(false)}
 className="p-1 text-muted-foreground hover:text-muted-foreground rounded"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 
 <div className="p-4 space-y-4">
 <div className="bg-brand-surface border border-brand-border rounded-lg p-3">
 <div className="flex items-start gap-2">
 <Timer className="h-5 w-5 text-brand mt-0.5" />
 <div>
 <p className="text-sm font-medium text-brand">Voting Timer</p>
 <p className="text-xs text-brand mt-1">
 Set a time limit for the voting session. When the timer expires, voting will automatically close and the retrospective will be published.
 </p>
 </div>
 </div>
 </div>
 
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Voting Duration (minutes)
 </label>
 <input
 type="number"
 min="1"
 max="60"
 value={votingDuration}
 onChange={(e) => setVotingDuration(parseInt(e.target.value) || 15)}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 />
 <p className="text-xs text-muted-foreground mt-1">
 Recommended: 10-15 minutes for small teams, 15-30 minutes for larger teams
 </p>
 </div>
 
 <div className="bg-warning-soft border border-warning/30 rounded-lg p-3">
 <div className="flex items-start gap-2">
 <Clock className="h-5 w-5 text-warning mt-0.5" />
 <div>
 <p className="text-xs text-warning">
 <strong>Note:</strong> Team members will see a countdown timer. You can manually close voting at any time using the &quot;Close Voting&quot; button.
 </p>
 </div>
 </div>
 </div>
 </div>
 
 <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/50 rounded-b-xl">
 <button
 onClick={() => setShowVotingModal(false)}
 className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleStartVotingWithTimer}
 disabled={isSaving}
 className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors text-sm font-medium disabled:opacity-50"
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
 <div className="bg-background rounded-xl shadow-xl w-full max-w-lg">
 <div className="flex items-center justify-between p-4 border-b border-border">
 <h3 className="text-lg font-semibold text-foreground">Add Note</h3>
 <button
 onClick={() => {
 setShowNoteForm(false);
 setNoteContent('');
 }}
 className="p-1 text-muted-foreground hover:text-muted-foreground rounded"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 
 <div className="p-4 space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">Category</label>
 <div className="flex gap-2">
 <button
 onClick={() => setNoteCategory('went_well')}
 className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 noteCategory === 'went_well'
 ? 'bg-success text-success-foreground'
 : 'bg-muted text-muted-foreground hover:bg-muted'
 }`}
 >
 <ThumbsUp className="h-4 w-4 inline mr-1" />
 Went Well
 </button>
 <button
 onClick={() => setNoteCategory('to_improve')}
 className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
 noteCategory === 'to_improve'
 ? 'bg-warning text-white'
 : 'bg-muted text-muted-foreground hover:bg-muted'
 }`}
 >
 <ThumbsDown className="h-4 w-4 inline mr-1" />
 To Improve
 </button>
 </div>
 </div>
 
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Note <span className="text-destructive">*</span>
 </label>
 <textarea
 value={noteContent}
 onChange={(e) => setNoteContent(e.target.value)}
 placeholder="Share your thoughts..."
 rows={4}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-info resize-none"
 />
 </div>
 </div>
 
 <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/50 rounded-b-xl">
 <button
 onClick={() => {
 setShowNoteForm(false);
 setNoteContent('');
 }}
 className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleAddNote}
 disabled={isSaving || !noteContent.trim()}
 className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info transition-colors text-sm font-medium disabled:opacity-50"
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
 <div className="bg-background rounded-xl shadow-xl w-full max-w-lg">
 <div className="flex items-center justify-between p-4 border-b border-border">
 <h3 className="text-lg font-semibold text-foreground">Create Retrospective</h3>
 <button
 onClick={() => {
 setShowCreateForm(false);
 setSelectedSprintId('');
 setMaxVotes(3);
 }}
 className="p-1 text-muted-foreground hover:text-muted-foreground rounded"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 
 <div className="p-4 space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Select Sprint <span className="text-destructive">*</span>
 </label>
 <select
 value={selectedSprintId}
 onChange={(e) => setSelectedSprintId(e.target.value)}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-info"
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
 </div>
 
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Max Votes Per User
 </label>
 <input
 type="number"
 min="1"
 max="10"
 value={maxVotes}
 onChange={(e) => setMaxVotes(parseInt(e.target.value) || 3)}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-info"
 />
 <p className="text-xs text-muted-foreground mt-1">Each team member can vote up to {maxVotes} times</p>
 </div>
 </div>
 
 <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/50 rounded-b-xl">
 <button
 onClick={() => {
 setShowCreateForm(false);
 setSelectedSprintId('');
 setMaxVotes(3);
 }}
 className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleCreateRetrospective}
 disabled={isSaving || !selectedSprintId}
 className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info transition-colors text-sm font-medium disabled:opacity-50"
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
 <div className="bg-background rounded-xl shadow-xl w-full max-w-lg">
 <div className="flex items-center justify-between p-4 border-b border-border">
 <h3 className="text-lg font-semibold text-foreground">Add Action Item</h3>
 <button
 onClick={() => {
 setShowActionForm(false);
 setActionTitle('');
 setActionDescription('');
 setSelectedNoteId(null);
 }}
 className="p-1 text-muted-foreground hover:text-muted-foreground rounded"
 >
 <X className="h-5 w-5" />
 </button>
 </div>
 
 <div className="p-4 space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Title <span className="text-destructive">*</span>
 </label>
 <input
 type="text"
 value={actionTitle}
 onChange={(e) => setActionTitle(e.target.value)}
 placeholder="Action item title..."
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 
 <div>
 <label className="block text-sm font-medium text-foreground mb-1">
 Description <span className="text-muted-foreground">(optional)</span>
 </label>
 <textarea
 value={actionDescription}
 onChange={(e) => setActionDescription(e.target.value)}
 placeholder="Additional details..."
 rows={3}
 className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
 />
 </div>
 </div>
 
 <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-muted/50 rounded-b-xl">
 <button
 onClick={() => {
 setShowActionForm(false);
 setActionTitle('');
 setActionDescription('');
 setSelectedNoteId(null);
 }}
 className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleAddActionItem}
 disabled={isSaving || !actionTitle.trim()}
 className="px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors text-sm font-medium disabled:opacity-50"
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

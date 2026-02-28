'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Lightbulb,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Users,
  ArrowUp,
  MoreHorizontal,
  ThumbsUp,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface Improvement {
  id: string;
  title: string;
  description: string;
  category: 'waste_reduction' | 'process_improvement' | 'quality' | 'efficiency' | 'automation';
  status: 'idea' | 'evaluating' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  submittedBy: string;
  assignee?: string;
  votes: number;
  expectedImpact: string;
  estimatedSavings?: string;
  createdAt: string;
  completedAt?: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const mapImprovement = (i: Record<string, any>): Improvement => {
  const getName = (u: any) => u?.profile ? `${u.profile.firstName} ${u.profile.lastName}`.trim() : u?.email || 'Unknown';
  return {
    id: i._id, title: i.title, description: i.description,
    category: i.category, status: i.status || 'idea', priority: i.priority || 'medium',
    submittedBy: getName(i.submittedBy), assignee: i.assignee ? getName(i.assignee) : undefined,
    votes: i.votes || 0, expectedImpact: i.expectedImpact || '',
    estimatedSavings: i.estimatedSavings, createdAt: i.createdAt, completedAt: i.completedAt,
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const categoryConfig = {
  waste_reduction: { label: 'Waste Reduction', color: 'bg-red-100 text-red-700', icon: '🗑️' },
  process_improvement: { label: 'Process', color: 'bg-blue-100 text-blue-700', icon: '⚙️' },
  quality: { label: 'Quality', color: 'bg-purple-100 text-purple-700', icon: '✨' },
  efficiency: { label: 'Efficiency', color: 'bg-green-100 text-green-700', icon: '⚡' },
  automation: { label: 'Automation', color: 'bg-orange-100 text-orange-700', icon: '🤖' },
};

const statusConfig = {
  idea: { label: 'Idea', color: 'bg-gray-100 text-gray-600' },
  evaluating: { label: 'Evaluating', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

export default function ImprovementsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewImprovementModal, setShowNewImprovementModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');

  const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchData = useCallback(async (token: string) => {
    try {
      const [projRes, impRes] = await Promise.all([
        fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/pm/projects/${projectId}/improvements`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const projData = await projRes.json();
      if (projData.success) setProject(projData.data.project);
      const impData = await impRes.json();
      if (impData.success) setImprovements((impData.data.improvements || []).map(mapImprovement));
    } catch (error) {
      console.error('Failed to fetch improvements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    fetchData(token);
  }, [projectId, router, fetchData]);

  const handleVote = async (improvementId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/pm/improvements/${improvementId}/vote`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchData(token);
    } catch (error) { console.error('Failed to vote:', error); }
  };

  const getStats = () => {
    return {
      total: improvements.length,
      ideas: improvements.filter(i => i.status === 'idea').length,
      inProgress: improvements.filter(i => ['evaluating', 'approved', 'in_progress'].includes(i.status)).length,
      completed: improvements.filter(i => i.status === 'completed').length,
      totalVotes: improvements.reduce((sum, i) => sum + i.votes, 0),
    };
  };

  const filteredImprovements = improvements
    .filter(imp => {
      if (filterStatus !== 'all' && imp.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'votes') return b.votes - a.votes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const stats = getStats();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header */}
      <ProjectHeader 
        projectKey={project?.key} 
        projectName={project?.name}
        projectId={projectId}
      />

      {/* Navigation Tabs */}
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'lean'} />

      {/* Toolbar */}
      <ProjectToolbar
        searchPlaceholder="Search improvements..."
        primaryAction={{
          label: 'Submit Idea',
          onClick: () => setShowNewImprovementModal(true),
        }}
        rightActions={
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="idea">Ideas</option>
              <option value="evaluating">Evaluating</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'votes' | 'recent')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="votes">Most Voted</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">{stats.total} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats.ideas} Ideas</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-gray-600">{stats.inProgress} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">{stats.completed} Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">{stats.totalVotes} Votes</span>
          </div>
        </div>
      </div>

      {/* Improvements List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredImprovements.map((improvement) => (
            <div
              key={improvement.id}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{categoryConfig[improvement.category].icon}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryConfig[improvement.category].color}`}>
                    {categoryConfig[improvement.category].label}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[improvement.status].color}`}>
                    {statusConfig[improvement.status].label}
                  </span>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <h3 className="font-semibold text-gray-900 mb-2">{improvement.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{improvement.description}</p>

              {/* Impact */}
              <div className="flex items-center gap-2 mb-4 p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">{improvement.expectedImpact}</span>
              </div>

              {/* Savings */}
              {improvement.estimatedSavings && (
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Est. savings: {improvement.estimatedSavings}</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Vote Button */}
                  <button onClick={() => handleVote(improvement.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                    <ArrowUp className="h-4 w-4" />
                    <span className="font-semibold">{improvement.votes}</span>
                  </button>
                  
                  {/* Submitter */}
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>{improvement.submittedBy}</span>
                  </div>
                </div>

                {/* Action */}
                {improvement.status === 'idea' && (
                  <button className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Evaluate
                  </button>
                )}
                {improvement.status === 'approved' && (
                  <button className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Start
                  </button>
                )}
                {improvement.status === 'in_progress' && (
                  <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Improvement Modal */}
      {showNewImprovementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Improvement Idea</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Brief title for your improvement idea"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the improvement and its benefits..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="waste_reduction">Waste Reduction</option>
                    <option value="process_improvement">Process Improvement</option>
                    <option value="quality">Quality</option>
                    <option value="efficiency">Efficiency</option>
                    <option value="automation">Automation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Impact</label>
                <input
                  type="text"
                  placeholder="e.g., Reduce processing time by 50%"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewImprovementModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Submit Idea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

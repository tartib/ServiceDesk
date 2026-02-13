'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageSquare,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ChevronRight,
  MoreHorizontal,
  Send,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface CheckIn {
  id: string;
  date: string;
  author: string;
  authorAvatar?: string;
  keyResultId: string;
  keyResultTitle: string;
  objectiveTitle: string;
  previousValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'on_track' | 'at_risk' | 'behind';
  note?: string;
  blockers?: string[];
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultCheckIns: CheckIn[] = [
  {
    id: 'ci1',
    date: '2024-01-15T10:00:00Z',
    author: 'Sarah Johnson',
    keyResultId: 'kr1',
    keyResultTitle: 'Achieve NPS score of 50+',
    objectiveTitle: 'Increase customer satisfaction',
    previousValue: 42,
    currentValue: 45,
    targetValue: 50,
    unit: 'points',
    confidence: 'medium',
    status: 'at_risk',
    note: 'Good progress this week. Customer feedback sessions helped identify key pain points.',
    blockers: ['Waiting for engineering resources to fix top complaints'],
  },
  {
    id: 'ci2',
    date: '2024-01-15T09:30:00Z',
    author: 'Mike Chen',
    keyResultId: 'kr2',
    keyResultTitle: 'Reduce support ticket response time to 2 hours',
    objectiveTitle: 'Increase customer satisfaction',
    previousValue: 2.0,
    currentValue: 1.5,
    targetValue: 2,
    unit: 'hours',
    confidence: 'high',
    status: 'on_track',
    note: 'Exceeded target! New triage system is working well.',
  },
  {
    id: 'ci3',
    date: '2024-01-14T14:00:00Z',
    author: 'John Doe',
    keyResultId: 'kr4',
    keyResultTitle: 'Release mobile app v2.0',
    objectiveTitle: 'Launch new product features',
    previousValue: 50,
    currentValue: 60,
    targetValue: 100,
    unit: '%',
    confidence: 'high',
    status: 'on_track',
    note: 'Completed user authentication module. Starting on dashboard features.',
  },
  {
    id: 'ci4',
    date: '2024-01-14T11:00:00Z',
    author: 'Tech Lead',
    keyResultId: 'kr5',
    keyResultTitle: 'Implement AI-powered search',
    objectiveTitle: 'Launch new product features',
    previousValue: 25,
    currentValue: 30,
    targetValue: 100,
    unit: '%',
    confidence: 'low',
    status: 'behind',
    note: 'Facing technical challenges with the ML model accuracy.',
    blockers: ['Need ML engineer support', 'Training data quality issues'],
  },
  {
    id: 'ci5',
    date: '2024-01-12T16:00:00Z',
    author: 'Emily Davis',
    keyResultId: 'kr3',
    keyResultTitle: 'Increase customer retention rate to 95%',
    objectiveTitle: 'Increase customer satisfaction',
    previousValue: 90,
    currentValue: 92,
    targetValue: 95,
    unit: '%',
    confidence: 'high',
    status: 'on_track',
    note: 'New onboarding flow showing positive results. Churn rate decreased.',
  },
];

const confidenceConfig = {
  high: { label: 'High', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  low: { label: 'Low', color: 'bg-red-100 text-red-700' },
};

const statusConfig = {
  on_track: { label: 'On Track', color: 'text-green-600', icon: TrendingUp },
  at_risk: { label: 'At Risk', color: 'text-yellow-600', icon: Minus },
  behind: { label: 'Behind', color: 'text-red-600', icon: TrendingDown },
};

export default function CheckInsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [checkIns] = useState<CheckIn[]>(defaultCheckIns);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCheckInModal, setShowNewCheckInModal] = useState(false);
  const [filterWeek, setFilterWeek] = useState<string>('current');

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProject(token);
  }, [projectId, router, fetchProject]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgress = (current: number, target: number, start: number = 0) => {
    const range = target - start;
    if (range === 0) return 100;
    return Math.min(Math.max(((current - start) / range) * 100, 0), 100);
  };

  const getStats = () => {
    return {
      total: checkIns.length,
      onTrack: checkIns.filter(c => c.status === 'on_track').length,
      atRisk: checkIns.filter(c => c.status === 'at_risk').length,
      behind: checkIns.filter(c => c.status === 'behind').length,
    };
  };

  const groupByDate = (items: CheckIn[]) => {
    const groups: Record<string, CheckIn[]> = {};
    items.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  const stats = getStats();
  const groupedCheckIns = groupByDate(checkIns);

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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'okr'} />

      {/* Toolbar */}
      <ProjectToolbar
        searchPlaceholder="Search check-ins..."
        primaryAction={{
          label: 'New Check-in',
          onClick: () => setShowNewCheckInModal(true),
        }}
        rightActions={
          <select
            value={filterWeek}
            onChange={(e) => setFilterWeek(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">This Week</option>
            <option value="last">Last Week</option>
            <option value="all">All Time</option>
          </select>
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats.total} Check-ins</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">{stats.onTrack} On Track</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">{stats.atRisk} At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">{stats.behind} Behind</span>
          </div>
        </div>
      </div>

      {/* Check-ins Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {Object.entries(groupedCheckIns).map(([date, items]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">{date}</h3>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Check-ins for this date */}
              <div className="space-y-4 ml-8">
                {items.map((checkIn) => {
                  const StatusIcon = statusConfig[checkIn.status].icon;
                  const progress = getProgress(checkIn.currentValue, checkIn.targetValue);

                  return (
                    <div
                      key={checkIn.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">
                            {checkIn.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{checkIn.author}</p>
                            <p className="text-xs text-gray-500">{formatDate(checkIn.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 text-sm font-medium ${statusConfig[checkIn.status].color}`}>
                            <StatusIcon className="h-4 w-4" />
                            {statusConfig[checkIn.status].label}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Key Result Info */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Target className="h-3.5 w-3.5" />
                          <span>{checkIn.objectiveTitle}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span className="font-medium text-gray-700">{checkIn.keyResultTitle}</span>
                        </div>
                        
                        {/* Progress */}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">
                                {checkIn.previousValue} → <span className="font-semibold text-gray-900">{checkIn.currentValue}</span> {checkIn.unit}
                              </span>
                              <span className="text-gray-500">Target: {checkIn.targetValue} {checkIn.unit}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  checkIn.status === 'on_track' ? 'bg-green-500' :
                                  checkIn.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-lg font-bold text-gray-900">{Math.round(progress)}%</span>
                        </div>
                      </div>

                      {/* Note */}
                      {checkIn.note && (
                        <p className="text-sm text-gray-700 mb-3">{checkIn.note}</p>
                      )}

                      {/* Confidence & Blockers */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${confidenceConfig[checkIn.confidence].color}`}>
                          Confidence: {confidenceConfig[checkIn.confidence].label}
                        </span>
                        
                        {checkIn.blockers && checkIn.blockers.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-600 font-medium">
                              {checkIn.blockers.length} blocker{checkIn.blockers.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Blockers List */}
                      {checkIn.blockers && checkIn.blockers.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-medium text-red-600 mb-2">Blockers:</p>
                          <ul className="space-y-1">
                            {checkIn.blockers.map((blocker, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-red-400 mt-1">•</span>
                                {blocker}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Check-in Modal */}
      {showNewCheckInModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Check-in</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Result</label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a key result...</option>
                  <option value="kr1">Achieve NPS score of 50+</option>
                  <option value="kr2">Reduce support ticket response time</option>
                  <option value="kr3">Increase customer retention rate</option>
                  <option value="kr4">Release mobile app v2.0</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="high">High - Will achieve</option>
                    <option value="medium">Medium - Might achieve</option>
                    <option value="low">Low - Unlikely to achieve</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress Update</label>
                <textarea
                  placeholder="What progress did you make this week?"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blockers (optional)</label>
                <textarea
                  placeholder="Any blockers or challenges? (one per line)"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewCheckInModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit Check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

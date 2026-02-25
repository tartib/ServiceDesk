'use client';

import { API_URL } from '@/lib/api/config';
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
import { useMethodology, OkrCheckIn } from '@/hooks/useMethodology';
import { useMemo } from 'react';

interface Project {
  _id: string;
  name: string;
  key: string;
}

interface FlatKR {
  id: string;
  title: string;
  objectiveId: string;
  objectiveTitle: string;
  targetValue: number;
  currentValue: number;
  unit: string;
}

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
  const { methodology, config, isLoading: methodLoading, addCheckIn } = useMethodology(projectId);

  const checkIns: OkrCheckIn[] = config?.okr?.checkIns || [];

  const flatKRs: FlatKR[] = useMemo(() => {
    const objectives = config?.okr?.objectives || [];
    const result: FlatKR[] = [];
    objectives.forEach(obj => {
      (obj.keyResults || []).forEach(kr => {
        result.push({
          id: kr.id,
          title: kr.title,
          objectiveId: obj.id,
          objectiveTitle: obj.title,
          targetValue: kr.targetValue,
          currentValue: kr.currentValue,
          unit: kr.unit,
        });
      });
    });
    return result;
  }, [config]);

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewCheckInModal, setShowNewCheckInModal] = useState(false);
  const [filterWeek, setFilterWeek] = useState<string>('all');
  const [submitting, setSubmitting] = useState(false);
  const [selectedKRId, setSelectedKRId] = useState('');
  const [ciValue, setCiValue] = useState('');
  const [ciConfidence, setCiConfidence] = useState<'high' | 'medium' | 'low'>('medium');
  const [ciNote, setCiNote] = useState('');
  const [ciBlockers, setCiBlockers] = useState('');

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
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

  const handleSubmitCheckIn = async () => {
    if (!selectedKRId || !ciValue) return;
    setSubmitting(true);
    try {
      const kr = flatKRs.find(k => k.id === selectedKRId);
      if (!kr) return;

      const newValue = Number(ciValue);
      const progress = kr.targetValue > 0 ? (newValue / kr.targetValue) * 100 : 0;
      let status: 'on_track' | 'at_risk' | 'behind' = 'on_track';
      if (progress < 40) status = 'behind';
      else if (progress < 70) status = 'at_risk';

      const blockersList = ciBlockers.trim() ? ciBlockers.split('\n').filter(b => b.trim()) : [];

      await addCheckIn({
        keyResultId: kr.id,
        objectiveId: kr.objectiveId,
        previousValue: kr.currentValue,
        currentValue: newValue,
        confidence: ciConfidence,
        status,
        note: ciNote.trim() || undefined,
        blockers: blockersList.length > 0 ? blockersList : undefined,
      });

      setShowNewCheckInModal(false);
      setSelectedKRId('');
      setCiValue('');
      setCiConfidence('medium');
      setCiNote('');
      setCiBlockers('');
    } catch (err) {
      console.error('Failed to submit check-in:', err);
    } finally {
      setSubmitting(false);
    }
  };

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

  const groupByDate = (items: OkrCheckIn[]) => {
    const groups: Record<string, OkrCheckIn[]> = {};
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

  const getKRTitle = (krId: string) => {
    return flatKRs.find(k => k.id === krId)?.title || krId;
  };

  const getObjTitle = (objId: string) => {
    const obj = (config?.okr?.objectives || []).find(o => o.id === objId);
    return obj?.title || objId;
  };

  const getKRTarget = (krId: string) => {
    const kr = flatKRs.find(k => k.id === krId);
    return kr ? `${kr.targetValue} ${kr.unit}` : '';
  };

  const stats = getStats();
  const groupedCheckIns = groupByDate(checkIns);

  if (isLoading || methodLoading) {
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
                  const krForCheckIn = flatKRs.find(k => k.id === checkIn.keyResultId);
                  const progress = getProgress(checkIn.currentValue, krForCheckIn?.targetValue || 100);

                  return (
                    <div
                      key={checkIn.id}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-sm font-medium text-purple-700">
                            {(checkIn.authorName || 'U').split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{checkIn.authorName}</p>
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
                          <span>{getObjTitle(checkIn.objectiveId)}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span className="font-medium text-gray-700">{getKRTitle(checkIn.keyResultId)}</span>
                        </div>
                        
                        {/* Progress */}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">
                                {checkIn.previousValue} → <span className="font-semibold text-gray-900">{checkIn.currentValue}</span> {krForCheckIn?.unit || ''}
                              </span>
                              <span className="text-gray-500">Target: {getKRTarget(checkIn.keyResultId)}</span>
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
                <select
                  value={selectedKRId}
                  onChange={(e) => setSelectedKRId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a key result...</option>
                  {flatKRs.map(kr => (
                    <option key={kr.id} value={kr.id}>
                      {kr.objectiveTitle} → {kr.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value</label>
                  <input
                    type="number"
                    value={ciValue}
                    onChange={(e) => setCiValue(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                  <select
                    value={ciConfidence}
                    onChange={(e) => setCiConfidence(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">High - Will achieve</option>
                    <option value="medium">Medium - Might achieve</option>
                    <option value="low">Low - Unlikely to achieve</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress Update</label>
                <textarea
                  value={ciNote}
                  onChange={(e) => setCiNote(e.target.value)}
                  placeholder="What progress did you make this week?"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blockers (optional)</label>
                <textarea
                  value={ciBlockers}
                  onChange={(e) => setCiBlockers(e.target.value)}
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
                <button
                  onClick={handleSubmitCheckIn}
                  disabled={submitting || !selectedKRId || !ciValue}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Submitting...' : 'Submit Check-in'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {checkIns.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No check-ins yet</h3>
          <p className="text-sm text-gray-500 mb-6">Submit your first check-in to track progress</p>
          <button
            onClick={() => setShowNewCheckInModal(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            New Check-in
          </button>
        </div>
      )}
    </div>
  );
}

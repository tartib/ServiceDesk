'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Flag,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Target,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  dueDate: string;
  phaseId?: string;
  phaseName?: string;
  status: 'upcoming' | 'completed' | 'missed' | 'at_risk';
  completedAt?: string;
  owner?: string;
  dependencies: string[];
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultMilestones: Milestone[] = [
  {
    id: 'm1',
    name: 'Requirements Sign-off',
    description: 'All stakeholders approve the requirements document',
    dueDate: '2024-01-15',
    phaseId: 'requirements',
    phaseName: 'Requirements',
    status: 'completed',
    completedAt: '2024-01-14',
    owner: 'John Doe',
    dependencies: [],
  },
  {
    id: 'm2',
    name: 'Design Review Complete',
    description: 'Architecture and UI designs approved by technical lead',
    dueDate: '2024-02-01',
    phaseId: 'design',
    phaseName: 'Design',
    status: 'at_risk',
    owner: 'Jane Smith',
    dependencies: ['m1'],
  },
  {
    id: 'm3',
    name: 'MVP Development Complete',
    description: 'Core features implemented and unit tested',
    dueDate: '2024-03-15',
    phaseId: 'development',
    phaseName: 'Development',
    status: 'upcoming',
    owner: 'Dev Team',
    dependencies: ['m2'],
  },
  {
    id: 'm4',
    name: 'UAT Sign-off',
    description: 'User acceptance testing completed successfully',
    dueDate: '2024-04-01',
    phaseId: 'testing',
    phaseName: 'Testing',
    status: 'upcoming',
    owner: 'QA Team',
    dependencies: ['m3'],
  },
  {
    id: 'm5',
    name: 'Go Live',
    description: 'Production deployment and launch',
    dueDate: '2024-04-15',
    phaseId: 'deployment',
    phaseName: 'Deployment',
    status: 'upcoming',
    owner: 'DevOps Team',
    dependencies: ['m4'],
  },
];

const statusConfig = {
  upcoming: { label: 'Upcoming', color: 'bg-blue-100 text-blue-700', icon: Clock, iconColor: 'text-blue-500' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700', icon: CheckCircle, iconColor: 'text-green-500' },
  missed: { label: 'Missed', color: 'bg-red-100 text-red-700', icon: AlertTriangle, iconColor: 'text-red-500' },
  at_risk: { label: 'At Risk', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, iconColor: 'text-yellow-500' },
};

export default function MilestonesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>(defaultMilestones);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewMilestoneModal, setShowNewMilestoneModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    const dueDate = new Date(dateStr);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStats = () => {
    return {
      total: milestones.length,
      completed: milestones.filter(m => m.status === 'completed').length,
      upcoming: milestones.filter(m => m.status === 'upcoming').length,
      atRisk: milestones.filter(m => m.status === 'at_risk').length,
      missed: milestones.filter(m => m.status === 'missed').length,
    };
  };

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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'waterfall'} />

      {/* Toolbar */}
      <ProjectToolbar
        searchPlaceholder="Search milestones..."
        primaryAction={{
          label: 'Add Milestone',
          onClick: () => setShowNewMilestoneModal(true),
        }}
        rightActions={
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Timeline
            </button>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats.total} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">{stats.completed} Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">{stats.upcoming} Upcoming</span>
          </div>
          {stats.atRisk > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-700">{stats.atRisk} At Risk</span>
            </div>
          )}
          {stats.missed > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{stats.missed} Missed</span>
            </div>
          )}
        </div>
      </div>

      {/* Milestones List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {milestones.map((milestone) => {
            const StatusIcon = statusConfig[milestone.status].icon;
            const daysUntil = getDaysUntil(milestone.dueDate);

            return (
              <div
                key={milestone.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${
                    milestone.status === 'completed' ? 'bg-green-100' :
                    milestone.status === 'at_risk' ? 'bg-yellow-100' :
                    milestone.status === 'missed' ? 'bg-red-100' :
                    'bg-blue-100'
                  }`}>
                    <Flag className={`h-5 w-5 ${statusConfig[milestone.status].iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{milestone.name}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig[milestone.status].color}`}>
                        {statusConfig[milestone.status].label}
                      </span>
                      {milestone.phaseName && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {milestone.phaseName}
                        </span>
                      )}
                    </div>
                    
                    {milestone.description && (
                      <p className="text-sm text-gray-500 mb-2">{milestone.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(milestone.dueDate)}</span>
                        {milestone.status !== 'completed' && milestone.status !== 'missed' && (
                          <span className={`ml-1 ${daysUntil < 0 ? 'text-red-600' : daysUntil <= 7 ? 'text-yellow-600' : 'text-gray-400'}`}>
                            ({daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`})
                          </span>
                        )}
                      </div>
                      {milestone.owner && (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <span>Owner:</span>
                          <span className="font-medium text-gray-700">{milestone.owner}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {milestone.status === 'upcoming' && (
                      <button className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors">
                        Mark Complete
                      </button>
                    )}
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Milestone Modal */}
      {showNewMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Milestone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Milestone Name</label>
                <input
                  type="text"
                  placeholder="e.g., Beta Release"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Describe the milestone..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select phase...</option>
                  <option value="requirements">Requirements</option>
                  <option value="design">Design</option>
                  <option value="development">Development</option>
                  <option value="testing">Testing</option>
                  <option value="deployment">Deployment</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewMilestoneModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Add Milestone
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

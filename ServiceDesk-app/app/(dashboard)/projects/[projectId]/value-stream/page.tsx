'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';

interface ValueStreamStep {
  id: string;
  name: string;
  type: 'process' | 'wait' | 'decision';
  processTime: number; // minutes
  waitTime: number; // minutes
  valueAdded: boolean;
  efficiency: number; // percentage
  bottleneck: boolean;
  owner?: string;
  description?: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultSteps: ValueStreamStep[] = [
  {
    id: 'step1',
    name: 'Request Received',
    type: 'process',
    processTime: 15,
    waitTime: 0,
    valueAdded: true,
    efficiency: 95,
    bottleneck: false,
    owner: 'Support Team',
    description: 'Initial request intake and logging',
  },
  {
    id: 'step2',
    name: 'Queue for Review',
    type: 'wait',
    processTime: 0,
    waitTime: 120,
    valueAdded: false,
    efficiency: 0,
    bottleneck: true,
    description: 'Waiting in queue for analyst review',
  },
  {
    id: 'step3',
    name: 'Analysis',
    type: 'process',
    processTime: 45,
    waitTime: 30,
    valueAdded: true,
    efficiency: 60,
    bottleneck: false,
    owner: 'Business Analyst',
    description: 'Requirements analysis and documentation',
  },
  {
    id: 'step4',
    name: 'Approval',
    type: 'decision',
    processTime: 10,
    waitTime: 240,
    valueAdded: false,
    efficiency: 4,
    bottleneck: true,
    owner: 'Manager',
    description: 'Management approval decision',
  },
  {
    id: 'step5',
    name: 'Development',
    type: 'process',
    processTime: 480,
    waitTime: 60,
    valueAdded: true,
    efficiency: 89,
    bottleneck: false,
    owner: 'Dev Team',
    description: 'Implementation and coding',
  },
  {
    id: 'step6',
    name: 'Testing',
    type: 'process',
    processTime: 120,
    waitTime: 30,
    valueAdded: true,
    efficiency: 80,
    bottleneck: false,
    owner: 'QA Team',
    description: 'Quality assurance testing',
  },
  {
    id: 'step7',
    name: 'Deployment',
    type: 'process',
    processTime: 30,
    waitTime: 0,
    valueAdded: true,
    efficiency: 100,
    bottleneck: false,
    owner: 'DevOps',
    description: 'Production deployment',
  },
];

export default function ValueStreamPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [steps] = useState<ValueStreamStep[]>(defaultSteps);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStep, setSelectedStep] = useState<ValueStreamStep | null>(null);

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

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
    return `${(minutes / 1440).toFixed(1)}d`;
  };

  const getTotalLeadTime = () => {
    return steps.reduce((sum, s) => sum + s.processTime + s.waitTime, 0);
  };

  const getTotalProcessTime = () => {
    return steps.reduce((sum, s) => sum + s.processTime, 0);
  };

  const getTotalWaitTime = () => {
    return steps.reduce((sum, s) => sum + s.waitTime, 0);
  };

  const getOverallEfficiency = () => {
    const processTime = getTotalProcessTime();
    const leadTime = getTotalLeadTime();
    return leadTime > 0 ? Math.round((processTime / leadTime) * 100) : 0;
  };

  const getBottleneckCount = () => {
    return steps.filter(s => s.bottleneck).length;
  };

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
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Value Stream Map</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-4 w-4" />
              Configure
            </button>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Step
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="grid grid-cols-5 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Lead Time</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatTime(getTotalLeadTime())}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Process Time</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatTime(getTotalProcessTime())}</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Wait Time</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{formatTime(getTotalWaitTime())}</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Efficiency</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{getOverallEfficiency()}%</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Bottlenecks</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{getBottleneckCount()}</p>
          </div>
        </div>
      </div>

      {/* Value Stream Visualization */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex items-start gap-2 min-w-max">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step Card */}
              <div
                onClick={() => setSelectedStep(step)}
                className={`relative w-48 cursor-pointer transition-all hover:scale-105 ${
                  selectedStep?.id === step.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Bottleneck Indicator */}
                {step.bottleneck && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <span className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                      <AlertTriangle className="h-3.5 w-3.5 text-white" />
                    </span>
                  </div>
                )}

                {/* Card */}
                <div className={`rounded-xl border-2 overflow-hidden ${
                  step.type === 'wait' 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : step.type === 'decision'
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-blue-300 bg-white'
                }`}>
                  {/* Header */}
                  <div className={`px-3 py-2 text-center ${
                    step.type === 'wait' 
                      ? 'bg-yellow-100' 
                      : step.type === 'decision'
                      ? 'bg-purple-100'
                      : 'bg-blue-100'
                  }`}>
                    <p className="text-sm font-semibold text-gray-900">{step.name}</p>
                    {step.owner && (
                      <p className="text-xs text-gray-500">{step.owner}</p>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3 space-y-2">
                    {/* Process Time */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Process:</span>
                      <span className="font-medium text-green-600">{formatTime(step.processTime)}</span>
                    </div>

                    {/* Wait Time */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Wait:</span>
                      <span className={`font-medium ${step.waitTime > 60 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {formatTime(step.waitTime)}
                      </span>
                    </div>

                    {/* Efficiency Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Efficiency</span>
                        <span className="font-medium">{step.efficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            step.efficiency >= 70 ? 'bg-green-500' :
                            step.efficiency >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${step.efficiency}%` }}
                        />
                      </div>
                    </div>

                    {/* Value Added Indicator */}
                    <div className="flex items-center justify-center pt-1">
                      {step.valueAdded ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Value Added
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3.5 w-3.5" />
                          Non-Value
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              {index < steps.length - 1 && (
                <div className="flex items-center px-2">
                  <ArrowRight className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-8 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-300" />
            <span className="text-sm text-gray-600">Process Step</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-300" />
            <span className="text-sm text-gray-600">Wait/Queue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-300" />
            <span className="text-sm text-gray-600">Decision Point</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-4 h-4 bg-red-500 rounded-full">
              <AlertTriangle className="h-2.5 w-2.5 text-white" />
            </span>
            <span className="text-sm text-gray-600">Bottleneck</span>
          </div>
        </div>
      </div>

      {/* Step Detail Panel */}
      {selectedStep && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l border-gray-200 z-50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{selectedStep.name}</h3>
              <button
                onClick={() => setSelectedStep(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            {selectedStep.description && (
              <p className="text-sm text-gray-600 mb-6">{selectedStep.description}</p>
            )}

            {/* Metrics */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Process Time</span>
                <span className="font-semibold text-green-600">{formatTime(selectedStep.processTime)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Wait Time</span>
                <span className="font-semibold text-yellow-600">{formatTime(selectedStep.waitTime)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Total Time</span>
                <span className="font-semibold text-gray-900">
                  {formatTime(selectedStep.processTime + selectedStep.waitTime)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Efficiency</span>
                <span className={`font-semibold ${
                  selectedStep.efficiency >= 70 ? 'text-green-600' :
                  selectedStep.efficiency >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {selectedStep.efficiency}%
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                {selectedStep.valueAdded ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">
                  {selectedStep.valueAdded ? 'Value-Adding Activity' : 'Non-Value-Adding Activity'}
                </span>
              </div>
              {selectedStep.bottleneck && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-red-700 font-medium">Identified as Bottleneck</span>
                </div>
              )}
            </div>

            {/* Improvement Suggestions */}
            {selectedStep.bottleneck && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Improvement Suggestions</h4>
                </div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Reduce wait time by adding resources</li>
                  <li>• Implement parallel processing</li>
                  <li>• Automate manual steps</li>
                  <li>• Create Kaizen event to address</li>
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <TrendingUp className="h-4 w-4 inline mr-2" />
                Create Improvement
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

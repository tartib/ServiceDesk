'use client';

import { ProjectFormData, MethodologyType } from './ProjectWizard';
import { 
  Zap, 
  Columns, 
  GitBranch, 
  Headphones, 
  TrendingUp, 
  Target,
  Check
} from 'lucide-react';

interface StepMethodologyProps {
  formData: ProjectFormData;
  updateFormData: (updates: Partial<ProjectFormData>) => void;
}

interface MethodologyOption {
  id: MethodologyType;
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  bestFor: string;
  color: string;
}

const methodologies: MethodologyOption[] = [
  {
    id: 'scrum',
    name: 'Scrum',
    description: 'Iterative development with sprints, ceremonies, and defined roles.',
    icon: <Zap className="h-6 w-6" />,
    features: ['Sprints', 'Backlog', 'Daily Standups', 'Sprint Reviews', 'Retrospectives'],
    bestFor: 'Software development teams with changing requirements',
    color: 'blue',
  },
  {
    id: 'kanban',
    name: 'Kanban',
    description: 'Visual workflow management with continuous delivery and WIP limits.',
    icon: <Columns className="h-6 w-6" />,
    features: ['Visual Board', 'WIP Limits', 'Continuous Flow', 'Cycle Time Tracking'],
    bestFor: 'Teams with continuous work streams and support tasks',
    color: 'purple',
  },
  {
    id: 'waterfall',
    name: 'Waterfall',
    description: 'Sequential phases with gate reviews and milestone tracking.',
    icon: <GitBranch className="h-6 w-6" />,
    features: ['Phases', 'Gate Reviews', 'Milestones', 'Approvals', 'Gantt Charts'],
    bestFor: 'Projects with fixed requirements and regulatory compliance',
    color: 'green',
  },
  {
    id: 'itil',
    name: 'ITIL',
    description: 'IT service management with incidents, problems, changes, and SLAs.',
    icon: <Headphones className="h-6 w-6" />,
    features: ['Service Catalog', 'Incident Management', 'Change Management', 'SLA Tracking'],
    bestFor: 'IT operations and service desk teams',
    color: 'orange',
  },
  {
    id: 'lean',
    name: 'Lean',
    description: 'Value stream optimization with waste reduction and continuous improvement.',
    icon: <TrendingUp className="h-6 w-6" />,
    features: ['Value Stream Map', 'Waste Analysis', 'Kaizen Events', 'Throughput Metrics'],
    bestFor: 'Process improvement and operational excellence',
    color: 'teal',
  },
  {
    id: 'okr',
    name: 'OKR',
    description: 'Objectives and Key Results for goal setting and progress tracking.',
    icon: <Target className="h-6 w-6" />,
    features: ['Objectives', 'Key Results', 'Check-ins', 'Progress Scoring', 'Alignment'],
    bestFor: 'Strategic planning and goal-driven organizations',
    color: 'red',
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; light: string }> = {
  blue: { bg: 'bg-blue-600', border: 'border-blue-500', text: 'text-blue-600', light: 'bg-blue-50' },
  purple: { bg: 'bg-purple-600', border: 'border-purple-500', text: 'text-purple-600', light: 'bg-purple-50' },
  green: { bg: 'bg-green-600', border: 'border-green-500', text: 'text-green-600', light: 'bg-green-50' },
  orange: { bg: 'bg-orange-600', border: 'border-orange-500', text: 'text-orange-600', light: 'bg-orange-50' },
  teal: { bg: 'bg-teal-600', border: 'border-teal-500', text: 'text-teal-600', light: 'bg-teal-50' },
  red: { bg: 'bg-red-600', border: 'border-red-500', text: 'text-red-600', light: 'bg-red-50' },
};

export default function StepMethodology({ formData, updateFormData }: StepMethodologyProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Select Methodology</h3>
        <p className="text-sm text-gray-500">
          Choose the project management methodology that best fits your team's workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methodologies.map((methodology) => {
          const isSelected = formData.methodology === methodology.id;
          const colors = colorClasses[methodology.color];

          return (
            <button
              key={methodology.id}
              onClick={() => updateFormData({ methodology: methodology.id, methodologyConfig: {} })}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? `${colors.border} ${colors.light}`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className={`absolute top-3 right-3 w-6 h-6 ${colors.bg} rounded-full flex items-center justify-center`}>
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-gray-100'}`}>
                  <div className={isSelected ? 'text-white' : 'text-gray-600'}>
                    {methodology.icon}
                  </div>
                </div>
                <div>
                  <h4 className={`font-semibold ${isSelected ? colors.text : 'text-gray-900'}`}>
                    {methodology.name}
                  </h4>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">{methodology.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {methodology.features.slice(0, 4).map((feature) => (
                  <span
                    key={feature}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isSelected ? `${colors.light} ${colors.text}` : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {feature}
                  </span>
                ))}
              </div>

              {/* Best For */}
              <p className="text-xs text-gray-500">
                <span className="font-medium">Best for:</span> {methodology.bestFor}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

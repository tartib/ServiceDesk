'use client';

import { ProjectFormData } from './ProjectWizard';
import { 
  Zap, 
  Columns, 
  GitBranch, 
  Headphones, 
  TrendingUp, 
  Target,
  Calendar,
  FileText,
  Key
} from 'lucide-react';

interface StepReviewProps {
  formData: ProjectFormData;
}

const methodologyIcons: Record<string, React.ReactNode> = {
  scrum: <Zap className="h-5 w-5" />,
  kanban: <Columns className="h-5 w-5" />,
  waterfall: <GitBranch className="h-5 w-5" />,
  itil: <Headphones className="h-5 w-5" />,
  lean: <TrendingUp className="h-5 w-5" />,
  okr: <Target className="h-5 w-5" />,
};

const methodologyNames: Record<string, string> = {
  scrum: 'Scrum',
  kanban: 'Kanban',
  waterfall: 'Waterfall',
  itil: 'ITIL',
  lean: 'Lean',
  okr: 'OKR',
};

const methodologyColors: Record<string, string> = {
  scrum: 'bg-blue-100 text-blue-700',
  kanban: 'bg-purple-100 text-purple-700',
  waterfall: 'bg-green-100 text-green-700',
  itil: 'bg-orange-100 text-orange-700',
  lean: 'bg-teal-100 text-teal-700',
  okr: 'bg-red-100 text-red-700',
};

export default function StepReview({ formData }: StepReviewProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Review Project Details</h3>
        <p className="text-sm text-gray-500">
          Please review the project details before creating.
        </p>
      </div>

      {/* Project Info Card */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          Project Information
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Project Name</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{formData.name || '-'}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Key className="h-3 w-3" /> Project Key
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
                {formData.key || '-'}
              </span>
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Start Date
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(formData.startDate)}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Target End Date
            </p>
            <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(formData.targetEndDate)}</p>
          </div>

          {formData.description && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Description</p>
              <p className="text-sm text-gray-700 mt-1">{formData.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Methodology Card */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          {methodologyIcons[formData.methodology]}
          Methodology
        </h4>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${methodologyColors[formData.methodology]}`}>
            {methodologyIcons[formData.methodology]}
            {methodologyNames[formData.methodology]}
          </span>
        </div>

        {/* Methodology-specific summary */}
        <div className="text-sm text-gray-600">
          {formData.methodology === 'scrum' && (
            <p>
              Sprint length: {(formData.methodologyConfig.sprintLength as number) || 14} days
              {' • '}
              Estimation: {(formData.methodologyConfig.estimationMethod as string) || 'Story Points'}
            </p>
          )}
          {formData.methodology === 'kanban' && (
            <p>
              WIP Limit: {(formData.methodologyConfig.globalWipLimit as number) || 15} items
              {' • '}
              Cycle time tracking enabled
            </p>
          )}
          {formData.methodology === 'waterfall' && (
            <p>5 phases with gate reviews</p>
          )}
          {formData.methodology === 'itil' && (
            <p>Incident, Problem, Change, and Release management enabled</p>
          )}
          {formData.methodology === 'lean' && (
            <p>Value stream mapping with improvement board</p>
          )}
          {formData.methodology === 'okr' && (
            <p>
              {(formData.methodologyConfig.cycleType as string) || 'Quarterly'} cycles
              {' • '}
              {(formData.methodologyConfig.checkInFrequency as string) || 'Weekly'} check-ins
            </p>
          )}
        </div>
      </div>

      {/* What happens next */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your project will be created with the selected methodology</li>
          <li>• Default workflows and statuses will be configured</li>
          <li>• You can start adding tasks and team members immediately</li>
          <li>• Settings can be adjusted anytime from project settings</li>
        </ul>
      </div>
    </div>
  );
}

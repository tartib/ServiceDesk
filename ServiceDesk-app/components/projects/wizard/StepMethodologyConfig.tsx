'use client';

import { ProjectFormData } from './ProjectWizard';

interface StepMethodologyConfigProps {
  formData: ProjectFormData;
  updateFormData: (updates: Partial<ProjectFormData>) => void;
}

export default function StepMethodologyConfig({ formData, updateFormData }: StepMethodologyConfigProps) {
  const updateConfig = (key: string, value: unknown) => {
    updateFormData({
      methodologyConfig: {
        ...formData.methodologyConfig,
        [key]: value,
      },
    });
  };

  const renderScrumConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sprint Length</label>
        <select
          value={(formData.methodologyConfig.sprintLength as number) || 14}
          onChange={(e) => updateConfig('sprintLength', parseInt(e.target.value))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>1 week</option>
          <option value={14}>2 weeks</option>
          <option value={21}>3 weeks</option>
          <option value={28}>4 weeks</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Estimation Method</label>
        <select
          value={(formData.methodologyConfig.estimationMethod as string) || 'story_points'}
          onChange={(e) => updateConfig('estimationMethod', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="story_points">Story Points</option>
          <option value="hours">Hours</option>
          <option value="tshirt">T-Shirt Sizes</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Scrum Events</label>
        <div className="space-y-2">
          {['Sprint Planning', 'Daily Standup', 'Sprint Review', 'Retrospective'].map((event) => (
            <label key={event} className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{event}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKanbanConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Global WIP Limit</label>
        <input
          type="number"
          value={(formData.methodologyConfig.globalWipLimit as number) || 15}
          onChange={(e) => updateConfig('globalWipLimit', parseInt(e.target.value))}
          min={1}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Maximum work items in progress across all columns</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Policies</label>
        <div className="space-y-2">
          {[
            { key: 'pullBased', label: 'Pull-based flow' },
            { key: 'cycleTimeTracking', label: 'Cycle time tracking' },
            { key: 'blockerHighlight', label: 'Highlight blockers' },
          ].map((policy) => (
            <label key={policy.key} className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">{policy.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWaterfallConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Default Phases</label>
        <div className="space-y-2">
          {['Requirements', 'Design', 'Development', 'Testing', 'Deployment'].map((phase) => (
            <label key={phase} className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{phase}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Options</label>
        <div className="space-y-2">
          {[
            { key: 'gateReviews', label: 'Enable gate reviews between phases' },
            { key: 'autoAdvance', label: 'Auto-advance on approval' },
          ].map((option) => (
            <label key={option.key} className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderItilConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">ITIL Processes</label>
        <div className="space-y-2">
          {[
            { key: 'incident', label: 'Incident Management' },
            { key: 'problem', label: 'Problem Management' },
            { key: 'change', label: 'Change Management' },
            { key: 'release', label: 'Release Management' },
          ].map((process) => (
            <label key={process.key} className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">{process.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">CAB (Change Advisory Board)</label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">Enable CAB approval workflow</span>
        </label>
      </div>
    </div>
  );

  const renderLeanConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Metrics to Track</label>
        <div className="space-y-2">
          {[
            { key: 'leadTime', label: 'Lead Time' },
            { key: 'cycleTime', label: 'Cycle Time' },
            { key: 'throughput', label: 'Throughput' },
            { key: 'bottlenecks', label: 'Bottleneck Detection' },
          ].map((metric) => (
            <label key={metric.key} className="flex items-center gap-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">{metric.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">Enable Improvement Board</span>
        </label>
      </div>
    </div>
  );

  const renderOkrConfig = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">OKR Cycle</label>
        <select
          value={(formData.methodologyConfig.cycleType as string) || 'quarterly'}
          onChange={(e) => updateConfig('cycleType', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Frequency</label>
        <select
          value={(formData.methodologyConfig.checkInFrequency as string) || 'weekly'}
          onChange={(e) => updateConfig('checkInFrequency', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Scoring Method</label>
        <select
          value={(formData.methodologyConfig.scoringMethod as string) || 'percentage'}
          onChange={(e) => updateConfig('scoringMethod', e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="percentage">Percentage (0-100%)</option>
          <option value="scale_1_10">Scale (1-10)</option>
          <option value="binary">Binary (Done/Not Done)</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-gray-700">Allow cascading objectives</span>
        </label>
      </div>
    </div>
  );

  const renderConfig = () => {
    switch (formData.methodology) {
      case 'scrum':
        return renderScrumConfig();
      case 'kanban':
        return renderKanbanConfig();
      case 'waterfall':
        return renderWaterfallConfig();
      case 'itil':
        return renderItilConfig();
      case 'lean':
        return renderLeanConfig();
      case 'okr':
        return renderOkrConfig();
      default:
        return null;
    }
  };

  const methodologyNames: Record<string, string> = {
    scrum: 'Scrum',
    kanban: 'Kanban',
    waterfall: 'Waterfall',
    itil: 'ITIL',
    lean: 'Lean',
    okr: 'OKR',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Configure {methodologyNames[formData.methodology]}
        </h3>
        <p className="text-sm text-gray-500">
          Customize the settings for your selected methodology. You can change these later.
        </p>
      </div>

      {renderConfig()}
    </div>
  );
}

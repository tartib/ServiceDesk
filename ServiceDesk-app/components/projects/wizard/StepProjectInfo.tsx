'use client';

import { ProjectFormData } from './ProjectWizard';

interface StepProjectInfoProps {
  formData: ProjectFormData;
  updateFormData: (updates: Partial<ProjectFormData>) => void;
}

export default function StepProjectInfo({ formData, updateFormData }: StepProjectInfoProps) {
  const generateKey = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 5);
  };

  const handleNameChange = (name: string) => {
    updateFormData({ name });
    if (!formData.key || formData.key === generateKey(formData.name)) {
      updateFormData({ key: generateKey(name) });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Project Information</h3>
        <p className="text-sm text-gray-500">Enter the basic details for your new project.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Customer Portal Redesign"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Project Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.key}
            onChange={(e) => updateFormData({ key: e.target.value.toUpperCase().slice(0, 10) })}
            placeholder="e.g., CPR"
            maxLength={10}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          />
          <p className="mt-1 text-xs text-gray-500">
            2-10 characters. Used as prefix for task IDs (e.g., {formData.key || 'KEY'}-1)
          </p>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => updateFormData({ startDate: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Target End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target End Date</label>
          <input
            type="date"
            value={formData.targetEndDate}
            onChange={(e) => updateFormData({ targetEndDate: e.target.value })}
            min={formData.startDate}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Describe the project goals and scope..."
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>
    </div>
  );
}

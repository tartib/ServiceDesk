'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import StepProjectInfo from './StepProjectInfo';
import StepMethodology from './StepMethodology';
import StepMethodologyConfig from './StepMethodologyConfig';
import StepReview from './StepReview';

export type MethodologyType = 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';

export interface ProjectFormData {
  // Step 1: Project Info
  name: string;
  key: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  
  // Step 2: Methodology
  methodology: MethodologyType;
  
  // Step 3: Methodology Config
  methodologyConfig: Record<string, unknown>;
}

const initialFormData: ProjectFormData = {
  name: '',
  key: '',
  description: '',
  startDate: '',
  targetEndDate: '',
  methodology: 'scrum',
  methodologyConfig: {},
};

const steps = [
  { id: 1, name: 'Project Info', description: 'Basic project details' },
  { id: 2, name: 'Methodology', description: 'Select project methodology' },
  { id: 3, name: 'Configuration', description: 'Configure methodology settings' },
  { id: 4, name: 'Review', description: 'Review and create' },
];

interface ProjectWizardProps {
  onClose: () => void;
  onSuccess?: (projectId: string) => void;
}

export default function ProjectWizard({ onClose, onSuccess }: ProjectWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '' && formData.key.trim() !== '';
      case 2:
        return formData.methodology !== null;
      case 3:
        return true; // Config is optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length && canProceed()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create project
      const response = await fetch('http://localhost:5000/api/v1/pm/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          key: formData.key.toUpperCase(),
          description: formData.description,
          methodology: formData.methodology,
          startDate: formData.startDate || undefined,
          targetEndDate: formData.targetEndDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errMsg = typeof data.error === 'string' 
          ? data.error 
          : data.errors?.[0]?.message || data.error?.message || 'Failed to create project';
        throw new Error(errMsg);
      }

      const projectId = data.data.project?._id || data.data._id || data.data.id;

      if (!projectId) {
        console.error('Project creation response:', data);
        throw new Error('Project created but ID missing in response');
      }

      // Initialize methodology config
      await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/methodology`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          methodologyCode: formData.methodology,
          ...formData.methodologyConfig,
        }),
      });

      if (onSuccess) {
        onSuccess(projectId);
      } else {
        router.push(`/projects/${projectId}/board`);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepProjectInfo formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <StepMethodology formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <StepMethodologyConfig formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <StepReview formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? <Check className="h-5 w-5" /> : step.id}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.name}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-24 h-1 mx-2 rounded ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Project
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

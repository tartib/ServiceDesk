'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Target, Users, Zap } from 'lucide-react';

interface SprintCommitmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sprintName: string;
  sprintGoal: string;
  itemCount: number;
  totalPoints: number;
  capacity: number;
  validationErrors: string[];
  validationWarnings: string[];
}

export default function SprintCommitmentModal({
  isOpen,
  onClose,
  onConfirm,
  sprintName,
  sprintGoal,
  itemCount,
  totalPoints,
  capacity,
  validationErrors,
  validationWarnings,
}: SprintCommitmentModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const hasErrors = validationErrors.length > 0;
  const capacityPercentage = capacity > 0 ? Math.round((totalPoints / capacity) * 100) : 0;

  const getCapacityStatus = () => {
    if (capacityPercentage > 100) return { color: 'red', label: 'Over Capacity', icon: AlertTriangle };
    if (capacityPercentage >= 80) return { color: 'yellow', label: 'Near Capacity', icon: AlertTriangle };
    return { color: 'green', label: 'Within Capacity', icon: CheckCircle };
  };

  const status = getCapacityStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600">
          <div>
            <h2 className="text-xl font-semibold text-white">Confirm Sprint Commitment</h2>
            <p className="text-sm text-purple-100 mt-1">{sprintName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Sprint Goal */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Sprint Goal</h3>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-gray-900">{sprintGoal || <span className="text-gray-400 italic">No goal set</span>}</p>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sprint Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-gray-600">Items</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{itemCount}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-gray-600">Story Points</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{totalPoints}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-gray-600" />
                  <span className="text-xs text-gray-600">Capacity</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{capacity}</div>
              </div>
            </div>
          </div>

          {/* Capacity Status */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Capacity Status</h3>
            <div className={`bg-${status.color}-50 rounded-lg p-4 border border-${status.color}-200`}>
              <div className="flex items-center gap-3 mb-3">
                <status.icon className={`h-5 w-5 text-${status.color}-600`} />
                <span className={`text-sm font-semibold text-${status.color}-900`}>{status.label}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all bg-${status.color}-500`}
                  style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={`text-${status.color}-700`}>
                  {totalPoints} / {capacity} points
                </span>
                <span className={`font-semibold text-${status.color}-900`}>
                  {capacityPercentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {hasErrors && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Blocking Issues
              </h3>
              <div className="space-y-2">
                {validationErrors.map((error, index) => (
                  <div key={index} className="bg-red-50 rounded-lg p-3 border border-red-200">
                    <p className="text-sm text-red-800">• {error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Warnings */}
          {validationWarnings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </h3>
              <div className="space-y-2">
                {validationWarnings.map((warning, index) => (
                  <div key={index} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="text-sm text-yellow-800">• {warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmation Checkbox */}
          {!hasErrors && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    I confirm that the team commits to this sprint scope
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    The sprint will start immediately and items will be locked for planning.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={hasErrors || !confirmed}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Start Sprint
          </button>
        </div>
      </div>
    </div>
  );
}

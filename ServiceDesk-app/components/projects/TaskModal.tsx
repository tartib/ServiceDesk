'use client';

import { useState, useEffect } from 'react';
import { X, User, Calendar, Tag, MessageSquare, Paperclip, Clock, Target } from 'lucide-react';

interface Task {
  _id: string;
  key: string;
  title: string;
  description?: string;
  type: string;
  status: { id: string; name: string; category: string };
  priority: string;
  storyPoints?: number;
  assignee?: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  reporter?: { _id: string; profile: { firstName: string; lastName: string }; email: string };
  labels: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Transition {
  id: string;
  name: string;
  toStatus: { id: string; name: string; color: string };
}

interface TaskModalProps {
  taskId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskModal({ taskId, onClose, onUpdate }: TaskModalProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [transitions, setTransitions] = useState<Transition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', priority: '', storyPoints: '' });

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTask(data.data.task);
        setTransitions(data.data.transitions || []);
        setEditData({
          title: data.data.task.title,
          description: data.data.task.description || '',
          priority: data.data.task.priority,
          storyPoints: data.data.task.storyPoints?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransition = async (statusId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ statusId }),
      });
      fetchTask();
      onUpdate();
    } catch (error) {
      console.error('Failed to transition task:', error);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await fetch(`http://localhost:5000/api/v1/pm/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editData.title,
          description: editData.description,
          priority: editData.priority,
          storyPoints: editData.storyPoints ? parseInt(editData.storyPoints) : undefined,
        }),
      });
      setIsEditing(false);
      fetchTask();
      onUpdate();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/50',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      low: 'bg-green-500/20 text-green-400 border-green-500/50',
    };
    return colors[priority] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const getStatusColor = (category: string) => {
    const colors: Record<string, string> = {
      todo: 'bg-gray-500/20 text-gray-400',
      in_progress: 'bg-blue-500/20 text-blue-400',
      done: 'bg-green-500/20 text-green-400',
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 font-mono">{task.key}</span>
            <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(task.status.category)}`}>
              {task.status.name}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Main content */}
            <div className="col-span-2 space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-xl font-semibold"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none"
                    rows={6}
                    placeholder="Add a description..."
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-semibold text-white">{task.title}</h1>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300">{task.description || 'No description provided.'}</p>
                  </div>
                </>
              )}

              {/* Transitions */}
              {transitions.length > 0 && (
                <div className="pt-4 border-t border-slate-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Move to</h3>
                  <div className="flex flex-wrap gap-2">
                    {transitions.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleTransition(t.toStatus.id)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-600 text-gray-300 hover:bg-slate-700 transition-colors"
                        style={{ borderColor: t.toStatus.color }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Type</label>
                  <p className="text-white capitalize mt-1">{task.type}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Priority</label>
                  {isEditing ? (
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                      className="w-full mt-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  ) : (
                    <p className={`mt-1 px-2 py-0.5 text-sm rounded border inline-block ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Story Points</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.storyPoints}
                      onChange={(e) => setEditData({ ...editData, storyPoints: e.target.value })}
                      className="w-full mt-1 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-white text-sm"
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-white mt-1 flex items-center gap-1">
                      <Target className="h-4 w-4 text-gray-400" />
                      {task.storyPoints || '-'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Assignee</label>
                  <p className="text-white mt-1 flex items-center gap-2">
                    {task.assignee ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                          {task.assignee.profile.firstName[0]}{task.assignee.profile.lastName[0]}
                        </div>
                        {task.assignee.profile.firstName} {task.assignee.profile.lastName}
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-gray-400" />
                        Unassigned
                      </>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide">Reporter</label>
                  <p className="text-white mt-1 flex items-center gap-2">
                    {task.reporter && (
                      <>
                        <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-xs">
                          {task.reporter.profile.firstName[0]}{task.reporter.profile.lastName[0]}
                        </div>
                        {task.reporter.profile.firstName} {task.reporter.profile.lastName}
                      </>
                    )}
                  </p>
                </div>

                {task.dueDate && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide">Due Date</label>
                    <p className="text-white mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {task.labels.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wide">Labels</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.labels.map((label, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-slate-600 text-gray-300 rounded">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:text-white">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                Save Changes
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

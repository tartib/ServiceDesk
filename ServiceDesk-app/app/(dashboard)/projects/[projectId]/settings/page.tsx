'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Settings,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  Trash2,
  Save,
  ChevronRight,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
  ProjectMembersPanel,
} from '@/components/projects';
import ProjectTeamsPanel from '@/components/projects/ProjectTeamsPanel';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectSettings {
  name: string;
  key: string;
  description: string;
  methodology: string;
  visibility: 'public' | 'private';
  notifications: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
  };
  permissions: {
    allowGuestAccess: boolean;
    requireApproval: boolean;
  };
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const methodologyOptions = [
  { value: 'scrum', label: 'Scrum', description: 'Iterative sprints with ceremonies' },
  { value: 'kanban', label: 'Kanban', description: 'Continuous flow with WIP limits' },
  { value: 'waterfall', label: 'Waterfall', description: 'Sequential phases with gates' },
  { value: 'itil', label: 'ITIL', description: 'IT service management' },
  { value: 'lean', label: 'Lean', description: 'Value stream optimization' },
  { value: 'okr', label: 'OKR', description: 'Objectives and Key Results' },
];

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);
  const { t } = useLanguage();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<ProjectSettings>({
    name: '',
    key: '',
    description: '',
    methodology: 'scrum',
    visibility: 'private',
    notifications: {
      email: true,
      slack: false,
      inApp: true,
    },
    permissions: {
      allowGuestAccess: false,
      requireApproval: true,
    },
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data.project);
        setSettings(prev => ({
          ...prev,
          name: data.data.project.name || '',
          key: data.data.project.key || '',
          description: data.data.project.description || '',
          methodology: data.data.project.methodology?.code || 'scrum',
        }));
      }
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

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const tabs = [
    { id: 'general', label: t('projects.settings.general') || 'General', icon: Settings },
    { id: 'methodology', label: t('projects.settings.methodology') || 'Methodology', icon: Database },
    { id: 'members', label: t('projects.settings.members') || 'Members', icon: Users },
    { id: 'teams', label: t('projects.settings.teams') || 'Teams', icon: Users },
    { id: 'permissions', label: t('projects.settings.permissions') || 'Permissions', icon: Shield },
    { id: 'notifications', label: t('projects.settings.notifications') || 'Notifications', icon: Bell },
    { id: 'appearance', label: t('projects.settings.appearance') || 'Appearance', icon: Palette },
    { id: 'danger', label: t('projects.settings.dangerZone') || 'Danger Zone', icon: Trash2 },
  ];

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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('projects.settings.title') || 'Project Settings'}</h2>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : tab.id === 'danger'
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('projects.settings.generalSettings') || 'General Settings'}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.settings.projectName') || 'Project Name'}</label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.settings.projectKey') || 'Project Key'}</label>
                      <input
                        type="text"
                        value={settings.key}
                        onChange={(e) => setSettings(prev => ({ ...prev, key: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('projects.settings.keyDescription') || 'Used as prefix for issue keys (e.g., PROJ-123)'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.settings.description') || 'Description'}</label>
                      <textarea
                        value={settings.description}
                        onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('projects.settings.visibility') || 'Visibility'}</label>
                      <select
                        value={settings.visibility}
                        onChange={(e) => setSettings(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="private">{t('projects.settings.visibilityPrivate') || 'Private - Only members can access'}</option>
                        <option value="public">{t('projects.settings.visibilityPublic') || 'Public - Anyone in organization can view'}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Methodology Settings */}
            {activeTab === 'methodology' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('projects.settings.projectMethodology') || 'Project Methodology'}</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('projects.settings.methodologyDescription') || 'Choose the methodology that best fits your project workflow.'}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {methodologyOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSettings(prev => ({ ...prev, methodology: option.value }))}
                        className={`p-4 border rounded-xl text-left transition-all ${
                          settings.methodology === option.value
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-semibold text-gray-900">{option.label}</h4>
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('projects.settings.notificationPreferences') || 'Notification Preferences'}</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{t('projects.settings.emailNotifications') || 'Email Notifications'}</p>
                        <p className="text-sm text-gray-500">{t('projects.settings.emailDescription') || 'Receive updates via email'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, email: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{t('projects.settings.slackNotifications') || 'Slack Notifications'}</p>
                        <p className="text-sm text-gray-500">{t('projects.settings.slackDescription') || 'Send updates to Slack channel'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.slack}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, slack: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{t('projects.settings.inAppNotifications') || 'In-App Notifications'}</p>
                        <p className="text-sm text-gray-500">{t('projects.settings.inAppDescription') || 'Show notifications in the app'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.inApp}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, inApp: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">{t('projects.settings.dangerZone') || 'Danger Zone'}</h3>
                  <p className="text-sm text-red-700 mb-4">
                    {t('projects.settings.dangerWarning') || 'These actions are irreversible. Please proceed with caution.'}
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{t('projects.settings.archiveProject') || 'Archive Project'}</p>
                        <p className="text-sm text-gray-500">{t('projects.settings.archiveDescription') || 'Hide project from active list'}</p>
                      </div>
                      <button className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors">
                        {t('projects.settings.archive') || 'Archive'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{t('projects.settings.deleteProject') || 'Delete Project'}</p>
                        <p className="text-sm text-gray-500">{t('projects.settings.deleteDescription') || 'Permanently delete this project and all data'}</p>
                      </div>
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        {t('projects.common.delete') || 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Members */}
            {activeTab === 'members' && (
              <ProjectMembersPanel projectId={projectId} />
            )}

            {/* Teams */}
            {activeTab === 'teams' && (
              <ProjectTeamsPanel projectId={projectId} />
            )}

            {/* Permissions */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('projects.settings.accessPermissions') || 'Access Permissions'}</h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{t('projects.settings.allowGuestAccess') || 'Allow Guest Access'}</p>
                        <p className="text-sm text-gray-500">{t('projects.settings.guestAccessDescription') || 'Let external users view the project'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.permissions.allowGuestAccess}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, allowGuestAccess: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{t('projects.settings.requireApproval') || 'Require Approval'}</p>
                        <p className="text-sm text-gray-500">{t('projects.settings.approvalDescription') || 'New members need approval to join'}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.permissions.requireApproval}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, requireApproval: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('projects.settings.appearance') || 'Appearance'}</h3>
                  <p className="text-sm text-gray-500">{t('projects.settings.appearanceDescription') || 'Customize how your project looks.'}</p>
                </div>
              </div>
            )}

            {/* Save Button */}
            {activeTab !== 'danger' && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? t('projects.settings.saving') || 'Saving...' : t('projects.settings.saveChanges') || 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

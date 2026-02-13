'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MoreHorizontal, 
  Share2, 
  Zap, 
  Maximize2, 
  Star,
  UserPlus,
  FileCode,
  Palette,
  Settings,
  Archive,
  Trash2,
  X,
  Check,
  ChevronDown,
  Monitor,
  Search
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectHeaderProps {
  projectKey?: string;
  projectName?: string;
  projectId?: string;
  breadcrumb?: string;
  projectType?: 'software' | 'business' | 'service';
  managementType?: 'team-managed' | 'company-managed';
  isStarred?: boolean;
  onStarToggle?: (starred: boolean) => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

const backgroundColors = [
  { id: 'default', color: 'bg-white', label: 'Default' },
  { id: 'blue', color: 'bg-blue-50', label: 'Blue' },
  { id: 'green', color: 'bg-green-50', label: 'Green' },
  { id: 'purple', color: 'bg-purple-50', label: 'Purple' },
  { id: 'orange', color: 'bg-orange-50', label: 'Orange' },
  { id: 'pink', color: 'bg-pink-50', label: 'Pink' },
  { id: 'gray', color: 'bg-gray-100', label: 'Gray' },
  { id: 'yellow', color: 'bg-yellow-50', label: 'Yellow' },
];

const memberRoles = [
  { id: 'viewer', label: 'Viewer', description: 'Can view tasks and comments' },
  { id: 'contributor', label: 'Contributor', description: 'Can edit tasks and create new ones' },
  { id: 'manager', label: 'Manager', description: 'Full access to project settings' },
];

export default function ProjectHeader({ 
  projectKey, 
  projectName,
  projectId,
  breadcrumb,
  projectType = 'software',
  managementType = 'team-managed',
  isStarred: initialStarred = false,
  onStarToggle,
  onArchive,
  onDelete,
}: ProjectHeaderProps) {
  const { t } = useLanguage();
  const router = useRouter();
  
  // State
  const [isStarred, setIsStarred] = useState(initialStarred);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAddPeopleModal, setShowAddPeopleModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  
  // Add People Modal State
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('contributor');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Template Modal State
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  
  // Background State
  const [selectedBackground, setSelectedBackground] = useState('default');
  
  // Refs
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const backgroundPickerRef = useRef<HTMLDivElement>(null);
  const projectInfoRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      if (backgroundPickerRef.current && !backgroundPickerRef.current.contains(event.target as Node)) {
        setShowBackgroundPicker(false);
      }
      if (projectInfoRef.current && !projectInfoRef.current.contains(event.target as Node)) {
        setShowProjectInfo(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handleStarToggle = async () => {
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    onStarToggle?.(newStarred);
    
    // API call to save starred status
    try {
      await fetch(`/api/v1/pm/projects/${projectId}/star`, {
        method: newStarred ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Failed to update starred status:', error);
      setIsStarred(!newStarred); // Revert on error
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/users/search?q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data?.users || data.users || []);
        setShowSearchResults(true);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: { _id: string; name: string; email: string }) => {
    if (!inviteEmails.includes(user.email)) {
      setInviteEmails([...inviteEmails, user.email]);
    }
    setSearchEmail('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleAddEmail = () => {
    if (searchEmail && searchEmail.includes('@') && !inviteEmails.includes(searchEmail)) {
      setInviteEmails([...inviteEmails, searchEmail]);
      setSearchEmail('');
      setShowSearchResults(false);
    }
  };

  const handleRemoveEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter(e => e !== email));
  };

  const handleInviteMembers = async () => {
    if (inviteEmails.length === 0) return;
    
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) return;
    
    setIsInviting(true);
    try {
      const promises = inviteEmails.map(email =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/pm/projects/${projectId}/members/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email, role: selectedRole }),
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      const hasError = results.some(r => !r.success);
      
      if (!hasError) {
        setShowAddPeopleModal(false);
        setInviteEmails([]);
        setSearchEmail('');
      }
    } catch (error) {
      console.error('Failed to invite members:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    
    setIsSavingTemplate(true);
    try {
      await fetch(`/api/v1/pm/projects/${projectId}/template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName }),
      });
      setShowTemplateModal(false);
      setTemplateName('');
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleBackgroundChange = async (bgId: string) => {
    setSelectedBackground(bgId);
    setShowBackgroundPicker(false);
    
    try {
      await fetch(`/api/v1/pm/projects/${projectId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background: bgId }),
      });
    } catch (error) {
      console.error('Failed to update background:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await fetch(`/api/v1/pm/projects/${projectId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      setShowArchiveConfirm(false);
      onArchive?.();
      router.push('/projects');
    } catch (error) {
      console.error('Failed to archive project:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/v1/pm/projects/${projectId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      setShowDeleteConfirm(false);
      onDelete?.();
      router.push('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleGoToSettings = () => {
    setShowMoreMenu(false);
    router.push(`/projects/${projectId}/settings`);
  };

  return (
    <>
    <div className="bg-white border-b border-gray-200 px-4 py-2 md:px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/projects" data-testid="breadcrumb-projects" className="hover:text-gray-700 hover:underline">{breadcrumb || t('projects.title')}</Link>
      </div>
      
      {/* Project Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Project Avatar */}
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-sm shrink-0">
            {projectKey?.substring(0, 2) || 'PR'}
          </div>
          
          {/* Project Name */}
          <h1 data-testid="breadcrumb-project-name" className="text-lg md:text-xl font-semibold text-gray-900 truncate">
            {projectName || t('projects.title')}
          </h1>
          
          {/* Quick Actions - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1">
            {/* US1: Star/Favorite Button */}
            <button 
              onClick={handleStarToggle}
              className={`p-1.5 rounded transition-colors ${
                isStarred 
                  ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label={isStarred ? t('projects.header.removeFromStarred') || 'Remove from starred' : t('projects.header.addToStarred') || 'Add to starred'}
              title={isStarred ? t('projects.header.removeFromStarred') || 'Remove from starred' : t('projects.header.addToStarred') || 'Add to starred'}
            >
              <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
            </button>

            {/* US2: Add People Button */}
            <button 
              data-testid="add-people-btn"
              onClick={() => setShowAddPeopleModal(true)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              aria-label={t('projects.header.addPeople') || 'Add people'}
              title={t('projects.header.addPeople') || 'Add people'}
            >
              <UserPlus className="h-4 w-4" />
            </button>

            {/* US8: Project Type Info */}
            <div className="relative" ref={projectInfoRef}>
              <button 
                onClick={() => setShowProjectInfo(!showProjectInfo)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                aria-label={t('projects.header.projectInfo') || 'Project info'}
                title={t('projects.header.projectInfo') || 'Project info'}
              >
                <Monitor className="h-4 w-4" />
              </button>
              
              {showProjectInfo && (
                <div className="absolute start-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Monitor className="h-5 w-5 text-blue-500" />
                    <span className="font-medium text-gray-900">
                      {projectType === 'software' ? t('projects.header.softwareSpace') || 'Software space' : 
                       projectType === 'business' ? t('projects.header.businessSpace') || 'Business space' :
                       t('projects.header.serviceSpace') || 'Service space'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {managementType === 'team-managed' 
                      ? t('projects.header.teamManaged') || 'Team-managed' 
                      : t('projects.header.companyManaged') || 'Company-managed'}
                  </p>
                </div>
              )}
            </div>

            {/* More Options Dropdown */}
            <div className="relative" ref={moreMenuRef}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                aria-label={t('projects.common.moreOptions') || 'More options'}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              
              {showMoreMenu && (
                <div className="absolute end-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                  {/* US3: Save as Template */}
                  <button
                    onClick={() => { setShowTemplateModal(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-start text-gray-700 hover:bg-gray-50"
                  >
                    <FileCode className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="block text-sm">{t('projects.header.saveAsTemplate') || 'Save as template'}</span>
                      <span className="block text-xs text-gray-400">{t('projects.header.enterprise') || 'Enterprise'}</span>
                    </div>
                  </button>
                  
                  {/* US4: Set Background */}
                  <div className="relative" ref={backgroundPickerRef}>
                    <button
                      onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-start text-gray-700 hover:bg-gray-50"
                    >
                      <Palette className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{t('projects.header.setBackground') || 'Set space background'}</span>
                      <ChevronDown className="h-3 w-3 text-gray-400 ms-auto" />
                    </button>
                    
                    {showBackgroundPicker && (
                      <div className="absolute start-full top-0 ms-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 p-2">
                        <p className="text-xs text-gray-500 mb-2 px-1">{t('projects.header.chooseBackground') || 'Choose background'}</p>
                        <div className="grid grid-cols-4 gap-1">
                          {backgroundColors.map((bg) => (
                            <button
                              key={bg.id}
                              onClick={() => handleBackgroundChange(bg.id)}
                              className={`w-8 h-8 rounded border-2 ${bg.color} ${
                                selectedBackground === bg.id ? 'border-blue-500' : 'border-gray-200'
                              } hover:border-blue-300 transition-colors`}
                              title={bg.label}
                            >
                              {selectedBackground === bg.id && (
                                <Check className="h-4 w-4 text-blue-500 mx-auto" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  {/* US5: Space Settings */}
                  <button
                    onClick={handleGoToSettings}
                    className="w-full flex items-center gap-3 px-3 py-2 text-start text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{t('projects.header.spaceSettings') || 'Space settings'}</span>
                  </button>
                  
                  <div className="border-t border-gray-100 my-1" />
                  
                  {/* US6: Archive Space */}
                  <button
                    onClick={() => { setShowArchiveConfirm(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-start text-gray-700 hover:bg-gray-50"
                  >
                    <Archive className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="block text-sm">{t('projects.header.archiveSpace') || 'Archive space'}</span>
                      <span className="block text-xs text-gray-400">{t('projects.header.premium') || 'Premium'}</span>
                    </div>
                  </button>
                  
                  {/* US7: Delete Space */}
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setShowMoreMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-start text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="text-sm">{t('projects.header.deleteSpace') || 'Delete space'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label={t('projects.common.share') || 'Share'}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label={t('projects.common.automations') || 'Automations'}
          >
            <Zap className="h-4 w-4" />
          </button>
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label={t('projects.common.fullscreen') || 'Fullscreen'}
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          
          {/* Mobile menu button */}
          <button 
            className="sm:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            aria-label={t('projects.common.moreOptions') || 'More options'}
            onClick={() => setShowMoreMenu(!showMoreMenu)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    {/* US2: Add People Modal */}
    {showAddPeopleModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('projects.header.addPeopleToProject') || 'Add people to project'}
            </h2>
            <button
              onClick={() => { setShowAddPeopleModal(false); setInviteEmails([]); setSearchEmail(''); }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('projects.header.emailOrName') || 'Email or name'}
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchEmail}
                    onChange={(e) => {
                      setSearchEmail(e.target.value);
                      handleSearchUsers(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                    placeholder={t('projects.header.enterEmailOrName') || 'Enter email or name...'}
                    className="w-full ps-9 pe-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="w-full px-3 py-2 text-start hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {isSearching && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-sm text-gray-500">
                      {t('projects.common.loading') || 'Loading...'}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAddEmail}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('projects.common.add') || 'Add'}
                </button>
              </div>
            </div>
            
            {/* Added Emails */}
            {inviteEmails.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('projects.header.inviteList') || 'Invite list'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {inviteEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="p-0.5 hover:bg-blue-100 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('projects.header.selectRole') || 'Select role'}
              </label>
              <div className="space-y-2">
                {memberRoles.map((role) => (
                  <label
                    key={role.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole === role.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.id}
                      checked={selectedRole === role.id}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <span className="block font-medium text-gray-900">{role.label}</span>
                      <span className="block text-sm text-gray-500">{role.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={() => { setShowAddPeopleModal(false); setInviteEmails([]); setSearchEmail(''); }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {t('projects.common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleInviteMembers}
              disabled={inviteEmails.length === 0 || isInviting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInviting ? t('projects.common.loading') || 'Loading...' : t('projects.header.sendInvites') || 'Send invites'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* US3: Save as Template Modal */}
    {showTemplateModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('projects.header.saveAsTemplate') || 'Save as template'}
            </h2>
            <button
              onClick={() => { setShowTemplateModal(false); setTemplateName(''); }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <FileCode className="h-5 w-5 text-yellow-600 shrink-0" />
              <p className="text-sm text-yellow-700">
                {t('projects.header.templateNote') || 'This feature requires an Enterprise subscription.'}
              </p>
            </div>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('projects.header.templateName') || 'Template name'}
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t('projects.header.enterTemplateName') || 'Enter template name...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={() => { setShowTemplateModal(false); setTemplateName(''); }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {t('projects.common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim() || isSavingTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingTemplate ? t('projects.common.loading') || 'Loading...' : t('projects.common.save') || 'Save'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* US6: Archive Confirmation Modal */}
    {showArchiveConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('projects.header.archiveSpace') || 'Archive space'}
            </h2>
            <button
              onClick={() => setShowArchiveConfirm(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Archive className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  {t('projects.header.archiveConfirmTitle') || 'Are you sure you want to archive this space?'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('projects.header.archiveConfirmMessage') || 'The space will be removed from active view but all data will be preserved. You can restore it later.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={() => setShowArchiveConfirm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {t('projects.common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              {t('projects.header.archive') || 'Archive'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* US7: Delete Confirmation Modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-red-600">
              {t('projects.header.deleteSpace') || 'Delete space'}
            </h2>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  {t('projects.header.deleteConfirmTitle') || 'Are you sure you want to delete this space?'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {t('projects.header.deleteConfirmMessage') || 'This action cannot be undone. All tasks, comments, and attachments will be permanently deleted.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {t('projects.common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {t('projects.common.delete') || 'Delete'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

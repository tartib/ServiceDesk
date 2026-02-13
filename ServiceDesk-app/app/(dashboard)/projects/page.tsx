'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderKanban } from 'lucide-react';
import {
  ProjectsHeader,
  ProjectsTable,
  LoadingState,
  EmptyState,
  SearchModal,
} from '@/components/projects';
import { ProjectWizard } from '@/components/projects/wizard';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface ApiProject {
  _id: string;
  name: string;
  key: string;
  methodology: {
    code: string;
  };
  status: string;
  members?: Array<{
    userId?: {
      _id: string;
      name?: string;
      email?: string;
      profile?: {
        firstName?: string;
        lastName?: string;
      };
    };
    role: string;
  }>;
  createdBy?: {
    _id: string;
    name?: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  } | string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  methodology: {
    code: string;
  };
  status: string;
  lead?: {
    name: string;
    email: string;
  };
  createdBy?: {
    name: string;
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProjects(token);
  }, [router]);

  const fetchProjects = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/pm/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        console.error('Failed to fetch projects:', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        const rawProjects: ApiProject[] = data.data.projects || [];
        const mapped: Project[] = rawProjects.map((p) => {
          const leadMember = p.members?.find((m) => m.role === 'lead');
          const leadUser = leadMember?.userId;
          const leadProfileName = leadUser?.profile
            ? `${leadUser.profile.firstName || ''} ${leadUser.profile.lastName || ''}`.trim()
            : '';
          const leadName = leadProfileName || leadUser?.name || undefined;

          const createdByUser = typeof p.createdBy === 'object' ? p.createdBy : undefined;
          const createdByProfileName = createdByUser?.profile
            ? `${createdByUser.profile.firstName || ''} ${createdByUser.profile.lastName || ''}`.trim()
            : '';
          const createdByName = createdByProfileName || createdByUser?.name || undefined;

          return {
            _id: p._id,
            name: p.name,
            key: p.key,
            methodology: p.methodology,
            status: p.status,
            lead: leadName ? { name: leadName, email: leadUser?.email || '' } : undefined,
            createdBy: createdByName ? { name: createdByName } : undefined,
          };
        });
        setProjects(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const handleProjectCreated = (projectId: string) => {
    router.push(`/projects/${projectId}/board`);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <ProjectsHeader 
          onSearchClick={() => setShowSearch(true)} 
          onCreateClick={() => setShowWizard(true)}
        />

        {/* Content */}
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t('projects.noProjects') || 'No projects yet'}
            description={t('projects.noProjectsDesc') || 'Create your first project to get started'}
            actionLabel={t('projects.createProject') || 'Create Project'}
            onAction={() => setShowWizard(true)}
          />
        ) : (
          <ProjectsTable
            projects={projects}
            onProjectClick={(project) => router.push(`/projects/${project._id}/board`)}
          />
        )}

        {/* Search Modal */}
        <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />

        {/* Project Creation Wizard */}
        {showWizard && (
          <ProjectWizard 
            onClose={() => setShowWizard(false)} 
            onSuccess={handleProjectCreated}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

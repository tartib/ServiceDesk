'use client';

import { API_URL } from '@/lib/api/config';
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
import { getDefaultLandingPage, MethodologyType } from '@/hooks/useMethodology';
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
  const [intakePending, setIntakePending] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProjects(token);

    // Fetch intake pending count
    fetch(`${API_URL}/pm/intake/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const byStage = d.data.byStage || {};
          setIntakePending((byStage.screening || 0) + (byStage.business_case || 0) + (byStage.prioritization || 0));
        }
      })
      .catch(() => {});
  }, [router]);

  const fetchProjects = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/pm/projects`, {
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
    router.push(`/projects/${projectId}/summary`);
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        {/* Header */}
        <ProjectsHeader 
          onSearchClick={() => setShowSearch(true)} 
          onCreateClick={() => setShowWizard(true)}
        />

        {/* Intake Pending Banner */}
        {intakePending > 0 && (
          <div
            onClick={() => router.push('/projects/intake')}
            className="mb-4 flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-600 text-sm font-medium">
                {intakePending} intake request{intakePending > 1 ? 's' : ''} pending review
              </span>
            </div>
            <span className="text-amber-600 text-xs hover:underline">View Intake &rarr;</span>
          </div>
        )}

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
            onProjectClick={(project) => {
              const landing = getDefaultLandingPage((project.methodology?.code || 'scrum') as MethodologyType);
              router.push(`/projects/${project._id}${landing}`);
            }}
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

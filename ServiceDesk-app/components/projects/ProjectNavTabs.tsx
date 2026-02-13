'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Globe,
  List,
  LayoutGrid,
  Calendar,
  Map,
  Plus,
  FileText,
  BarChart2,
  Headphones,
  Target,
  TrendingUp,
  GitBranch,
  Flag,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Package,
  Settings,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavTab {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

type MethodologyType = 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';

interface ProjectNavTabsProps {
  projectId: string;
  methodology?: MethodologyType;
  showExtendedTabs?: boolean;
}

export default function ProjectNavTabs({ projectId, methodology = 'scrum', showExtendedTabs = false }: ProjectNavTabsProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Base tabs for all methodologies
  const summaryTab: NavTab = {
    id: 'summary',
    label: t('projects.summary.title') || 'Summary',
    href: `/projects/${projectId}/summary`,
    icon: <Globe className="h-4 w-4" />,
  };

  // Methodology-specific tabs
  const getMethodologyTabs = (): NavTab[] => {
    switch (methodology) {
      case 'scrum':
        return [
          summaryTab,
          { id: 'board', label: t('projects.board.title') || 'Board', href: `/projects/${projectId}/board`, icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'backlog', label: t('projects.backlog.title') || 'Backlog', href: `/projects/${projectId}/backlog`, icon: <List className="h-4 w-4" /> },
          { id: 'sprints', label: t('projects.sprints.title') || 'Sprints', href: `/projects/${projectId}/sprints`, icon: <RefreshCw className="h-4 w-4" /> },
          { id: 'planning', label: t('projects.planning.title') || 'Planning', href: `/projects/${projectId}/planning`, icon: <Target className="h-4 w-4" /> },
          { id: 'standup', label: t('projects.standup.title') || 'Standup', href: `/projects/${projectId}/standup`, icon: <FileText className="h-4 w-4" /> },
          { id: 'retrospective', label: t('projects.retrospective.title') || 'Retro', href: `/projects/${projectId}/retrospective`, icon: <Headphones className="h-4 w-4" /> },
          { id: 'analytics', label: t('projects.analytics.title') || 'Analytics', href: `/projects/${projectId}/analytics`, icon: <BarChart2 className="h-4 w-4" /> },
          { id: 'settings', label: t('projects.settings.title') || 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
        ];
      case 'kanban':
        return [
          summaryTab,
          { id: 'board', label: t('projects.board.title') || 'Board', href: `/projects/${projectId}/board`, icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'backlog', label: t('projects.backlog.title') || 'Backlog', href: `/projects/${projectId}/backlog`, icon: <List className="h-4 w-4" /> },
          { id: 'metrics', label: t('projects.metrics.title') || 'Metrics', href: `/projects/${projectId}/metrics`, icon: <TrendingUp className="h-4 w-4" /> },
          { id: 'calendar', label: t('projects.calendar.title') || 'Calendar', href: `/projects/${projectId}/calendar`, icon: <Calendar className="h-4 w-4" /> },
          { id: 'analytics', label: t('projects.analytics.title') || 'Analytics', href: `/projects/${projectId}/analytics`, icon: <BarChart2 className="h-4 w-4" /> },
          { id: 'settings', label: t('projects.settings.title') || 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
        ];
      case 'waterfall':
        return [
          summaryTab,
          { id: 'phases', label: t('projects.phases.title') || 'Phases', href: `/projects/${projectId}/phases`, icon: <GitBranch className="h-4 w-4" /> },
          { id: 'milestones', label: t('projects.milestones.title') || 'Milestones', href: `/projects/${projectId}/milestones`, icon: <Flag className="h-4 w-4" /> },
          { id: 'gates', label: t('projects.gates.title') || 'Gate Reviews', href: `/projects/${projectId}/gates`, icon: <CheckCircle className="h-4 w-4" /> },
          { id: 'gantt', label: t('projects.gantt.title') || 'Gantt', href: `/projects/${projectId}/gantt`, icon: <Map className="h-4 w-4" /> },
          { id: 'analytics', label: t('projects.analytics.title') || 'Analytics', href: `/projects/${projectId}/analytics`, icon: <BarChart2 className="h-4 w-4" /> },
          { id: 'settings', label: t('projects.settings.title') || 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
        ];
      case 'itil':
        return [
          summaryTab,
          { id: 'service-catalog', label: t('projects.serviceCatalog.title') || 'Services', href: `/projects/${projectId}/service-catalog`, icon: <Package className="h-4 w-4" /> },
          { id: 'incidents', label: t('projects.incidents.title') || 'Incidents', href: `/projects/${projectId}/incidents`, icon: <AlertCircle className="h-4 w-4" /> },
          { id: 'problems', label: t('projects.problems.title') || 'Problems', href: `/projects/${projectId}/problems`, icon: <Headphones className="h-4 w-4" /> },
          { id: 'changes', label: t('projects.changes.title') || 'Changes', href: `/projects/${projectId}/changes`, icon: <RefreshCw className="h-4 w-4" /> },
          { id: 'cab', label: t('projects.cab.title') || 'CAB', href: `/projects/${projectId}/cab`, icon: <Target className="h-4 w-4" /> },
          { id: 'releases', label: t('projects.releases.title') || 'Releases', href: `/projects/${projectId}/releases`, icon: <Package className="h-4 w-4" /> },
          { id: 'sla', label: t('projects.sla.title') || 'SLA', href: `/projects/${projectId}/sla`, icon: <BarChart2 className="h-4 w-4" /> },
          { id: 'settings', label: t('projects.settings.title') || 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
        ];
      case 'lean':
        return [
          summaryTab,
          { id: 'value-stream', label: t('projects.valueStream.title') || 'Value Stream', href: `/projects/${projectId}/value-stream`, icon: <TrendingUp className="h-4 w-4" /> },
          { id: 'board', label: t('projects.board.title') || 'Board', href: `/projects/${projectId}/board`, icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'improvements', label: t('projects.improvements.title') || 'Improvements', href: `/projects/${projectId}/improvements`, icon: <Target className="h-4 w-4" /> },
          { id: 'analytics', label: t('projects.analytics.title') || 'Analytics', href: `/projects/${projectId}/analytics`, icon: <BarChart2 className="h-4 w-4" /> },
          { id: 'settings', label: t('projects.settings.title') || 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
        ];
      case 'okr':
        return [
          summaryTab,
          { id: 'objectives', label: t('projects.objectives.title') || 'Objectives', href: `/projects/${projectId}/objectives`, icon: <Target className="h-4 w-4" /> },
          { id: 'key-results', label: t('projects.keyResults.title') || 'Key Results', href: `/projects/${projectId}/key-results`, icon: <CheckCircle className="h-4 w-4" /> },
          { id: 'check-ins', label: t('projects.checkIns.title') || 'Check-ins', href: `/projects/${projectId}/check-ins`, icon: <Calendar className="h-4 w-4" /> },
          { id: 'analytics', label: t('projects.analytics.overview') || 'Progress', href: `/projects/${projectId}/analytics`, icon: <BarChart2 className="h-4 w-4" /> },
          { id: 'settings', label: t('projects.settings.title') || 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
        ];
      default:
        return [
          summaryTab,
          { id: 'board', label: t('projects.board.title') || 'Board', href: `/projects/${projectId}/board`, icon: <LayoutGrid className="h-4 w-4" /> },
          { id: 'backlog', label: t('projects.backlog.title') || 'Backlog', href: `/projects/${projectId}/backlog`, icon: <List className="h-4 w-4" /> },
          { id: 'calendar', label: t('projects.calendar.title') || 'Calendar', href: `/projects/${projectId}/calendar`, icon: <Calendar className="h-4 w-4" /> },
          { id: 'roadmap', label: t('roadmap.title') || 'Timeline', href: `/projects/${projectId}/roadmap`, icon: <Map className="h-4 w-4" /> },
          { id: 'settings', label: t('projects.settings.title') || 'Settings', href: `/projects/${projectId}/settings`, icon: <Settings className="h-4 w-4" /> },
        ];
    }
  };

  const extendedTabs: NavTab[] = [
    {
      id: 'pages',
      label: t('projects.common.view') || 'Pages',
      href: `/projects/${projectId}/pages`,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'forms',
      label: t('projects.common.view') || 'Forms',
      href: `/projects/${projectId}/forms`,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      id: 'reports',
      label: t('projects.reports.title') || 'Reports',
      href: `/projects/${projectId}/reports`,
      icon: <BarChart2 className="h-4 w-4" />,
    },
  ];

  const methodologyTabs = getMethodologyTabs();
  const tabs = showExtendedTabs ? [...methodologyTabs, ...extendedTabs] : methodologyTabs;

  const isActiveTab = (tab: NavTab) => {
    return pathname === tab.href || pathname?.startsWith(tab.href + '/');
  };

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-1 px-4 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              data-testid={`tab-${tab.id}`}
              className={`
                flex items-center gap-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap
                transition-colors border-b-2
                ${isActive 
                  ? 'text-blue-600 border-blue-600 active selected' 
                  : 'text-gray-500 border-transparent hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button 
          className="flex items-center gap-2 px-3 py-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          aria-label="Add view"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Navigation - Horizontal scroll */}
      <div className="md:hidden flex items-center gap-1 px-2 overflow-x-auto scrollbar-hide pb-1">
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab);
          return (
            <Link
              key={tab.id}
              href={tab.href}
              data-testid={`tab-${tab.id}`}
              className={`
                flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium whitespace-nowrap
                rounded-lg transition-colors
                ${isActive 
                  ? 'text-blue-600 bg-blue-50 active selected' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

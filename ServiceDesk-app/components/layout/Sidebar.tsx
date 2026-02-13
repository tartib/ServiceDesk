'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ALL_ROLES } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useLocale } from '@/hooks/useLocale';
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardList,
  BarChart3,
  Users,
  UsersRound,
  X,
  Tag,
  Warehouse,
  AlertTriangle,
  FileQuestion,
  GitPullRequest,
  Activity,
  Headphones,
  FileText,
  BookOpen,
  Monitor,
  Send,
  FolderKanban,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  MapIcon,
  HardDrive,
  Workflow,
  CalendarDays,
  Package,
  Timer,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Project {
  _id: string;
  name: string;
  key: string;
  methodology: { code: string };
}

const ADMIN_ROLES = ['manager', 'product_owner', 'project_manager'];
const LEAD_ROLES = ['supervisor', 'manager', 'product_owner', 'project_manager'];

const menuItems = [
  { icon: LayoutDashboard, labelKey: 'nav.homePage', href: '/homePage', roles: ALL_ROLES },
  { icon: FolderKanban, labelKey: 'nav.projects', href: '/projects', roles: ALL_ROLES },
  // { icon: CheckSquare, labelKey: 'nav.myTasks', href: '/tasks/my-tasks', roles: ALL_ROLES },
  // { icon: ClipboardList, labelKey: 'nav.allTasks', href: '/tasks', roles: LEAD_ROLES },
  { icon: HardDrive, labelKey: 'nav.drive', href: '/drive', roles: ALL_ROLES },
  { icon: BookOpen, labelKey: 'nav.knowledge', href: '/knowledge', roles: ALL_ROLES },
  { icon: Workflow, labelKey: 'nav.workflows', href: '/workflows', roles: ALL_ROLES },
  { icon: CalendarDays, labelKey: 'nav.vacations', href: '/vacations', roles: ALL_ROLES },
  { icon: FileText, labelKey: 'nav.smartForms', href: '/smart-forms', roles: LEAD_ROLES },
  { icon: UsersRound, labelKey: 'nav.teams', href: '/teams', roles: LEAD_ROLES },
  { icon: Tag, labelKey: 'nav.categories', href: '/categories', roles: ADMIN_ROLES },
  { icon: Monitor, labelKey: 'nav.assets', href: '/assets', roles: LEAD_ROLES },
  { icon: Warehouse, labelKey: 'nav.inventory', href: '/inventory', roles: ALL_ROLES },
  { icon: BarChart3, labelKey: 'nav.reports', href: '/reports', roles: LEAD_ROLES },
  { icon: Users, labelKey: 'nav.users', href: '/users', roles: ADMIN_ROLES },
];

const itsmMenuItems = [
  { icon: Headphones, labelKey: 'nav.selfService', href: '/self-service', roles: ALL_ROLES },
  { icon: Activity, labelKey: 'nav.itsmDashboard', href: '/itsm-dashboard', roles: ALL_ROLES },
  { icon: AlertTriangle, labelKey: 'nav.incidents', href: '/incidents', roles: ALL_ROLES },
  { icon: Send, labelKey: 'nav.serviceRequests', href: '/itsm-dashboard/service-requests', roles: LEAD_ROLES },
  { icon: FileQuestion, labelKey: 'nav.problems', href: '/problems', roles: LEAD_ROLES },
  { icon: GitPullRequest, labelKey: 'nav.changes', href: '/changes', roles: LEAD_ROLES },
  { icon: Package, labelKey: 'nav.serviceCatalog', href: '/service-catalog', roles: ALL_ROLES },
  { icon: Timer, labelKey: 'nav.sla', href: '/sla', roles: LEAD_ROLES },
  { icon: Rocket, labelKey: 'nav.releases', href: '/releases', roles: LEAD_ROLES },
  { icon: ShieldCheck, labelKey: 'nav.cab', href: '/cab', roles: LEAD_ROLES },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { t } = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await fetch('http://localhost:5000/api/v1/pm/projects?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
          return;
        }
        if (!response.ok) {
          console.error('Failed to fetch projects:', response.status);
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          setProjects(data.data.projects || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const filteredMenuItems = menuItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const filteredItsmItems = itsmMenuItems.filter((item) => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  return (
    <>
      {/* Mobile overlay */}
      {sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={cn(
          'fixed top-0 z-50 h-full w-56 sm:w-64 bg-white transition-transform duration-300 flex flex-col',
          'ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l border-gray-200',
          'md:w-64 md:ltr:translate-x-0 md:rtl:translate-x-0 md:relative md:z-auto',
          sidebarCollapsed 
            ? 'ltr:translate-x-0 rtl:translate-x-0' 
            : 'ltr:-translate-x-full rtl:translate-x-full md:ltr:translate-x-0 md:rtl:translate-x-0'
        )}
      >
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 shrink-0">***</div>
            <span className="text-base sm:text-lg font-bold truncate">{t('app.name')}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav data-testid="nav-container" className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 py-3 scroll-smooth">

          {/* Projects Section */}
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const isProjectsItem = item.href === '/projects';

            if (isProjectsItem && projects.length > 0) {
              return (
                <div key={item.href}>
                  <div
                    className={cn(
                      'flex items-center justify-between px-2 sm:px-3 py-2 md:py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-sm sm:text-base',
                      isActive
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                  >
                    <Link href={item.href} data-testid="nav-projects" className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </Link>
                    {projectsExpanded ? (
                      <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                    )}
                  </div>
                  {projectsExpanded && (
                    <div className="ltr:ml-4 rtl:mr-4 mt-1 md:mt-2 space-y-0.5 md:space-y-1 transition-all duration-200">
                      {projects.map((project) => (
                        <div key={project._id} className="space-y-0.5">
                          <Link
                            href={`/projects/${project._id}`}
                            className={cn(
                              'flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors',
                              pathname === `/projects/${project._id}`
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            <span className="w-5 h-5 flex items-center justify-center bg-gray-200 rounded text-xs font-medium text-gray-600 shrink-0">
                              {project.key.substring(0, 2)}
                            </span>
                            <span className="truncate">{project.name}</span>
                          </Link>
                          {/* Project sub-links */}
                          <div className="ltr:ml-7 rtl:mr-7 space-y-0.5">
                            <Link
                              href={`/projects/${project._id}/backlog`}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors',
                                pathname === `/projects/${project._id}/backlog`
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-500 hover:bg-gray-100'
                              )}
                            >
                              <List className="h-3 w-3" />
                              <span>{t('projects.backlog.title')}</span>
                            </Link>
                            <Link
                              href={`/projects/${project._id}/roadmap`}
                              className={cn(
                                'flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors',
                                pathname === `/projects/${project._id}/roadmap`
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-gray-500 hover:bg-gray-100'
                              )}
                            >
                              <MapIcon className="h-3 w-3" />
                              <span>{t('roadmap.title')}</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                      <Link
                        href="/projects/new"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>{t('projects.createNew')}</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} data-testid={`nav-${item.labelKey.split('.').pop()}`}>
                <div
                  className={cn(
                    'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base',
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{t(item.labelKey)}</span>
                </div>
              </Link>
            );
          })}

          {/* ITSM Section */}
          {filteredItsmItems.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <span className="px-2 sm:px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ITSM</span>
              </div>
              {filteredItsmItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg transition-colors text-sm sm:text-base',
                        isActive
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{t(item.labelKey)}</span>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="border-t border-gray-200 px-3 sm:px-4 py-3 md:py-4 shrink-0">
          <div className="text-xs md:text-sm text-gray-500 leading-relaxed">
            <span className="block">{t('nav.loggedInAs')}</span>
            <span className="font-medium text-gray-700 block truncate">{user?.role}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

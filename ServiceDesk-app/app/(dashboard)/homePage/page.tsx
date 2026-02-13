'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Bell,
  User,
  Users,
  BarChart3,
  AlertTriangle,
  Activity,
  LogOut,
  Settings,
  FolderKanban,
  HardDrive,
  BookOpen,
  Workflow,
  CalendarDays,
  FileText,
  UsersRound,
  Monitor,
  Warehouse,
  Headphones,
  FileQuestion,
  GitPullRequest,
  type LucideIcon,
} from 'lucide-react';
import { useLocale } from '@/hooks/useLocale';
import { useCurrentUser } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ALL_ROLES } from '@/types';

const ADMIN_ROLES = ['manager', 'product_owner', 'project_manager'];
const LEAD_ROLES = ['supervisor', 'manager', 'product_owner', 'project_manager'];

interface ServiceCard {
  icon: LucideIcon;
  labelKey: string;
  descEn: string;
  descAr: string;
  href: string;
  color: string;
  iconColor: string;
  roles: string[];
  section: 'main' | 'itsm';
}

const SERVICE_CARDS: ServiceCard[] = [
  // ── Main Services ──
  {
    icon: FolderKanban,
    labelKey: 'nav.projects',
    descEn: 'Manage projects, sprints & tasks',
    descAr: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0648\u0627\u0644\u0645\u0647\u0627\u0645',
    href: '/projects',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600 bg-blue-100',
    roles: ALL_ROLES,
    section: 'main',
  },
  {
    icon: HardDrive,
    labelKey: 'nav.drive',
    descEn: 'Store & share files securely',
    descAr: '\u062a\u062e\u0632\u064a\u0646 \u0648\u0645\u0634\u0627\u0631\u0643\u0629 \u0627\u0644\u0645\u0644\u0641\u0627\u062a',
    href: '/drive',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600 bg-emerald-100',
    roles: ALL_ROLES,
    section: 'main',
  },
  {
    icon: BookOpen,
    labelKey: 'nav.knowledge',
    descEn: 'Browse articles & documentation',
    descAr: '\u062a\u0635\u0641\u062d \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a \u0648\u0627\u0644\u0648\u062b\u0627\u0626\u0642',
    href: '/knowledge',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600 bg-amber-100',
    roles: ALL_ROLES,
    section: 'main',
  },
  {
    icon: Workflow,
    labelKey: 'nav.workflows',
    descEn: 'Automate business processes',
    descAr: '\u0623\u062a\u0645\u062a\u0629 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a',
    href: '/workflows',
    color: 'bg-violet-50',
    iconColor: 'text-violet-600 bg-violet-100',
    roles: ALL_ROLES,
    section: 'main',
  },
  {
    icon: CalendarDays,
    labelKey: 'nav.vacations',
    descEn: 'Track leave & holidays',
    descAr: '\u062a\u062a\u0628\u0639 \u0627\u0644\u0625\u062c\u0627\u0632\u0627\u062a \u0648\u0627\u0644\u0639\u0637\u0644',
    href: '/vacations',
    color: 'bg-teal-50',
    iconColor: 'text-teal-600 bg-teal-100',
    roles: ALL_ROLES,
    section: 'main',
  },
  {
    icon: FileText,
    labelKey: 'nav.smartForms',
    descEn: 'Create & manage dynamic forms',
    descAr: '\u0625\u0646\u0634\u0627\u0621 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0646\u0645\u0627\u0630\u062c',
    href: '/smart-forms',
    color: 'bg-pink-50',
    iconColor: 'text-pink-600 bg-pink-100',
    roles: LEAD_ROLES,
    section: 'main',
  },
  {
    icon: UsersRound,
    labelKey: 'nav.teams',
    descEn: 'Manage teams & members',
    descAr: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u0642 \u0648\u0627\u0644\u0623\u0639\u0636\u0627\u0621',
    href: '/teams',
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600 bg-indigo-100',
    roles: LEAD_ROLES,
    section: 'main',
  },
  {
    icon: Monitor,
    labelKey: 'nav.assets',
    descEn: 'Track IT assets & devices',
    descAr: '\u062a\u062a\u0628\u0639 \u0627\u0644\u0623\u0635\u0648\u0644 \u0648\u0627\u0644\u0623\u062c\u0647\u0632\u0629',
    href: '/assets',
    color: 'bg-slate-50',
    iconColor: 'text-slate-600 bg-slate-100',
    roles: LEAD_ROLES,
    section: 'main',
  },
  {
    icon: Warehouse,
    labelKey: 'nav.inventory',
    descEn: 'Manage stock & supplies',
    descAr: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u062e\u0632\u0648\u0646',
    href: '/inventory',
    color: 'bg-orange-50',
    iconColor: 'text-orange-600 bg-orange-100',
    roles: ALL_ROLES,
    section: 'main',
  },
  {
    icon: BarChart3,
    labelKey: 'nav.reports',
    descEn: 'View analytics & reports',
    descAr: '\u0639\u0631\u0636 \u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631 \u0648\u0627\u0644\u062a\u062d\u0644\u064a\u0644\u0627\u062a',
    href: '/reports',
    color: 'bg-cyan-50',
    iconColor: 'text-cyan-600 bg-cyan-100',
    roles: LEAD_ROLES,
    section: 'main',
  },
  {
    icon: Users,
    labelKey: 'nav.users',
    descEn: 'Manage user accounts & roles',
    descAr: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0648\u0627\u0644\u0623\u062f\u0648\u0627\u0631',
    href: '/users',
    color: 'bg-rose-50',
    iconColor: 'text-rose-600 bg-rose-100',
    roles: ADMIN_ROLES,
    section: 'main',
  },
  // ── ITSM Services ──
  {
    icon: Headphones,
    labelKey: 'nav.selfService',
    descEn: 'Submit requests & get help',
    descAr: '\u062a\u0642\u062f\u064a\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0648\u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629',
    href: '/self-service',
    color: 'bg-sky-50',
    iconColor: 'text-sky-600 bg-sky-100',
    roles: ALL_ROLES,
    section: 'itsm',
  },
  {
    icon: Activity,
    labelKey: 'nav.itsmDashboard',
    descEn: 'Monitor IT service metrics',
    descAr: '\u0645\u0631\u0627\u0642\u0628\u0629 \u0645\u0642\u0627\u064a\u064a\u0633 \u0627\u0644\u062e\u062f\u0645\u0627\u062a',
    href: '/itsm-dashboard',
    color: 'bg-green-50',
    iconColor: 'text-green-600 bg-green-100',
    roles: ALL_ROLES,
    section: 'itsm',
  },
  {
    icon: AlertTriangle,
    labelKey: 'nav.incidents',
    descEn: 'Report & track incidents',
    descAr: '\u0627\u0644\u0625\u0628\u0644\u0627\u063a \u0639\u0646 \u0627\u0644\u062d\u0648\u0627\u062f\u062b \u0648\u062a\u062a\u0628\u0639\u0647\u0627',
    href: '/incidents',
    color: 'bg-red-50',
    iconColor: 'text-red-600 bg-red-100',
    roles: ALL_ROLES,
    section: 'itsm',
  },
  {
    icon: FileQuestion,
    labelKey: 'nav.problems',
    descEn: 'Investigate root causes',
    descAr: '\u0627\u0644\u062a\u062d\u0642\u064a\u0642 \u0641\u064a \u0627\u0644\u0623\u0633\u0628\u0627\u0628 \u0627\u0644\u062c\u0630\u0631\u064a\u0629',
    href: '/problems',
    color: 'bg-yellow-50',
    iconColor: 'text-yellow-600 bg-yellow-100',
    roles: LEAD_ROLES,
    section: 'itsm',
  },
  {
    icon: GitPullRequest,
    labelKey: 'nav.changes',
    descEn: 'Manage change requests',
    descAr: '\u0625\u062f\u0627\u0631\u0629 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u062a\u063a\u064a\u064a\u0631',
    href: '/changes',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600 bg-purple-100',
    roles: LEAD_ROLES,
    section: 'itsm',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const { user: storedUser, logout } = useAuthStore();
  const { data: currentUser } = useCurrentUser();
  const user = currentUser || storedUser;
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const filteredCards = useMemo(() => {
    const role = user?.role || '';
    let cards = SERVICE_CARDS.filter((c) => c.roles.includes(role));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cards = cards.filter(
        (c) =>
          t(c.labelKey).toLowerCase().includes(q) ||
          c.descEn.toLowerCase().includes(q) ||
          c.descAr.includes(q)
      );
    }
    return cards;
  }, [user?.role, searchQuery, t]);

  const mainCards = filteredCards.filter((c) => c.section === 'main');
  const itsmCards = filteredCards.filter((c) => c.section === 'itsm');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl font-bold leading-tight">
              {locale === 'ar' ? `مرحباً, ${user?.name || ''}!` : `Welcome back, ${user?.name || 'User'}!`}
            </h1>
            <p className="text-sm sm:text-base md:text-base text-gray-600 mt-1 leading-relaxed">
              {locale === 'ar' ? 'اختر خدمة للبدء' : 'Select a service to get started'}
            </p>
          </div>
        </div>

        {/* Top Navigation Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-6 flex-wrap mb-6 md:mb-8">
          {/* Search */}
          <div className="flex-1 min-w-full md:min-w-64 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('common.search')}
              className="pl-10 w-full h-10 md:h-11"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Create Button */}
          <div className="relative w-full md:w-auto">
            <Button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 w-full md:w-auto h-10 md:h-11"
            >
              <Plus className="h-4 w-4" />
              {t('common.add')}
            </Button>
            {showCreateMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    router.push('/projects/new');
                    setShowCreateMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 md:py-4 hover:bg-gray-50 text-sm md:text-base focus:outline-none focus:bg-gray-100 transition-colors"
                >
                  Project
                </button>
                <button
                  onClick={() => {
                    router.push('/tickets/new');
                    setShowCreateMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 md:py-4 hover:bg-gray-50 text-sm md:text-base border-t focus:outline-none focus:bg-gray-100 transition-colors"
                >
                  Ticket
                </button>
                <button
                  onClick={() => {
                    router.push('/changes/new');
                    setShowCreateMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 md:py-4 hover:bg-gray-50 text-sm md:text-base border-t focus:outline-none focus:bg-gray-100 transition-colors"
                >
                  Change
                </button>
                <button
                  onClick={() => {
                    router.push('/tasks/new');
                    setShowCreateMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 md:py-4 hover:bg-gray-50 text-sm md:text-base border-t focus:outline-none focus:bg-gray-100 transition-colors"
                >
                  Task
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Profile Menu */}
          <div className="relative">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <User className="h-4 w-4" />
            </Button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="px-4 py-3 border-b">
                  <p className="font-medium text-sm">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.role || ''}</p>
                </div>
                <button
                  onClick={() => {
                    router.push('/profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  {t('navigation.profile')}
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"
                >
                  <Settings className="h-4 w-4" />
                  {t('navigation.settings')}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Services Grid */}
        <div className="space-y-8">
          {/* Main Services */}
          {mainCards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {locale === 'ar' ? '\u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629' : 'Services'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {mainCards.map((card) => (
                  <ServiceCardItem key={card.href} card={card} locale={locale} label={t(card.labelKey)} />
                ))}
              </div>
            </div>
          )}

          {/* ITSM Services */}
          {itsmCards.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {locale === 'ar' ? '\u062e\u062f\u0645\u0627\u062a ITSM' : 'ITSM Services'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {itsmCards.map((card) => (
                  <ServiceCardItem key={card.href} card={card} locale={locale} label={t(card.labelKey)} />
                ))}
              </div>
            </div>
          )}

          {filteredCards.length === 0 && searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-muted-foreground">
                {locale === 'ar' ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u0627\u0626\u062c' : 'No services found'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ServiceCardItem({ card, locale, label }: { card: ServiceCard; locale: string; label: string }) {
  const Icon = card.icon;
  return (
    <Link href={card.href}>
      <Card className={`${card.color} border-0 hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full`}>
        <CardContent className="pt-5 pb-4 px-4 flex flex-col items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{label}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {locale === 'ar' ? card.descAr : card.descEn}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

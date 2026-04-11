'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  Search,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Shield,
  Settings,
  Beaker,
  Zap,
  Puzzle,
  FolderKanban,
  Workflow,
  ChevronDown,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/config';
import { useLocale } from '@/hooks/useLocale';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  descriptionAr?: string;
  rolloutPercentage: number;
  allowedRoles?: string[];
  allowedOrgs?: string[];
  category: string;
  updatedAt?: string;
  updatedBy?: string;
}

const categoryConfig: Record<string, { label: string; labelAr: string; icon: typeof Flag; color: string }> = {
  core: { label: 'Core', labelAr: 'أساسي', icon: Shield, color: 'bg-blue-100 text-blue-700' },
  itsm: { label: 'ITSM', labelAr: 'إدارة الخدمات', icon: Settings, color: 'bg-orange-100 text-orange-700' },
  pm: { label: 'Project Mgmt', labelAr: 'إدارة المشاريع', icon: FolderKanban, color: 'bg-green-100 text-green-700' },
  workflow: { label: 'Workflow', labelAr: 'سير العمل', icon: Workflow, color: 'bg-red-100 text-red-700' },
  integrations: { label: 'Integrations', labelAr: 'التكاملات', icon: Puzzle, color: 'bg-purple-100 text-purple-700' },
  platform: { label: 'Platform', labelAr: 'المنصة', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
  experimental: { label: 'Experimental', labelAr: 'تجريبي', icon: Beaker, color: 'bg-gray-100 text-gray-700' },
};

function getAuthHeaders() {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token') || localStorage.getItem('accessToken')
    : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function FeatureFlagsPage() {
  const { t, locale } = useLocale();
  const isAr = locale === 'ar';

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/v2/admin/feature-flags`, {
        headers: getAuthHeaders(),
      });
      const data = res.data?.data || res.data || [];
      setFlags(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch feature flags', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleFlag = async (name: string, currentEnabled: boolean) => {
    setUpdating(name);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v2/admin/feature-flags/${name}`,
        { enabled: !currentEnabled },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      setFlags((prev) =>
        prev.map((f) => (f.name === name ? { ...f, enabled: !currentEnabled } : f))
      );
    } catch (err) {
      console.error('Failed to toggle flag', err);
    } finally {
      setUpdating(null);
    }
  };

  const updateRollout = async (name: string, rolloutPercentage: number) => {
    setUpdating(name);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v2/admin/feature-flags/${name}`,
        { rolloutPercentage },
        { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } }
      );
      setFlags((prev) =>
        prev.map((f) => (f.name === name ? { ...f, rolloutPercentage } : f))
      );
    } catch (err) {
      console.error('Failed to update rollout', err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredFlags = flags.filter((f) => {
    const matchSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      (f.descriptionAr && f.descriptionAr.includes(search));
    const matchCategory = categoryFilter === 'all' || f.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const enabledCount = flags.filter((f) => f.enabled).length;
  const disabledCount = flags.filter((f) => !f.enabled).length;
  const experimentalCount = flags.filter((f) => f.category === 'experimental').length;

  const categories = ['all', ...Object.keys(categoryConfig)];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Flag className="w-7 h-7 text-indigo-600" />
              {isAr ? 'أعلام الميزات' : 'Feature Flags'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr
                ? 'تحكم في تفعيل وإيقاف الميزات عبر النظام'
                : 'Control feature rollouts across the system'}
            </p>
          </div>
          <button
            onClick={fetchFlags}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-lg hover:bg-accent text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">{isAr ? 'إجمالي الأعلام' : 'Total Flags'}</div>
            <div className="text-2xl font-bold text-foreground">{flags.length}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">{isAr ? 'مفعّلة' : 'Enabled'}</div>
            <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">{isAr ? 'معطّلة' : 'Disabled'}</div>
            <div className="text-2xl font-bold text-red-600">{disabledCount}</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">{isAr ? 'تجريبية' : 'Experimental'}</div>
            <div className="text-2xl font-bold text-muted-foreground">{experimentalCount}</div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isAr ? 'بحث في الأعلام...' : 'Search flags...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-input rounded-lg text-sm hover:bg-accent min-w-[160px] justify-between"
            >
              <span>
                {categoryFilter === 'all'
                  ? isAr ? 'كل الفئات' : 'All Categories'
                  : isAr
                    ? categoryConfig[categoryFilter]?.labelAr
                    : categoryConfig[categoryFilter]?.label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-card border border-input rounded-lg shadow-lg">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-accent ${
                      cat === categoryFilter ? 'bg-indigo-50 text-indigo-700' : ''
                    }`}
                  >
                    {cat === 'all'
                      ? isAr ? 'كل الفئات' : 'All Categories'
                      : isAr
                        ? categoryConfig[cat]?.labelAr
                        : categoryConfig[cat]?.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flags List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFlags.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {isAr ? 'لا توجد أعلام مطابقة' : 'No matching flags found'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFlags.map((flag) => {
              const catConf = categoryConfig[flag.category] || categoryConfig.core;
              const CatIcon = catConf.icon;
              const isUpdating = updating === flag.name;

              return (
                <div
                  key={flag.name}
                  className={`bg-card rounded-lg border p-4 transition-all ${
                    isUpdating ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${catConf.color}`}>
                          <CatIcon className="w-3 h-3" />
                          {isAr ? catConf.labelAr : catConf.label}
                        </span>
                        <code className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                          {flag.name}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isAr && flag.descriptionAr ? flag.descriptionAr : flag.description}
                      </p>
                      {/* Rollout percentage */}
                      {flag.enabled && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {isAr ? 'نسبة التفعيل:' : 'Rollout:'}
                          </span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={flag.rolloutPercentage}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setFlags((prev) =>
                                prev.map((f) =>
                                  f.name === flag.name ? { ...f, rolloutPercentage: val } : f
                                )
                              );
                            }}
                            onMouseUp={(e) => {
                              updateRollout(flag.name, parseInt((e.target as HTMLInputElement).value));
                            }}
                            onTouchEnd={(e) => {
                              updateRollout(flag.name, parseInt((e.target as HTMLInputElement).value));
                            }}
                            className="w-32 h-1.5 accent-indigo-600"
                          />
                          <span className="text-xs font-medium text-foreground w-10">
                            {flag.rolloutPercentage}%
                          </span>
                        </div>
                      )}
                      {flag.updatedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {isAr ? 'آخر تحديث: ' : 'Updated: '}
                          {new Date(flag.updatedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleFlag(flag.name, flag.enabled)}
                      disabled={isUpdating}
                      className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                        flag.enabled
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-muted-foreground hover:bg-accent'
                      }`}
                      title={flag.enabled ? (isAr ? 'إيقاف' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')}
                    >
                      {flag.enabled ? (
                        <ToggleRight className="w-10 h-10" />
                      ) : (
                        <ToggleLeft className="w-10 h-10" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

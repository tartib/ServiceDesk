'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Grid,
  List,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useServiceCatalog, IServiceCatalogItem } from '@/hooks/useServiceCatalog';

interface Project {
  _id: string;
  name: string;
  key: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-600', icon: XCircle },
  deprecated: { label: 'Deprecated', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
};

export default function ServiceCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: catalogData, isLoading: catalogLoading } = useServiceCatalog();
  const services: IServiceCatalogItem[] = useMemo(() => catalogData?.data || [], [catalogData]);

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category));
    return ['All', ...Array.from(cats)];
  }, [services]);

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setProjectLoading(false);
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

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getServiceStatus = (service: IServiceCatalogItem): string => {
    return service.availability?.is_active ? 'active' : 'inactive';
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-500">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const isLoading = projectLoading || catalogLoading;

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
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'itil'} />

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Services */}
      <div className="flex-1 overflow-y-auto p-4">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const status = getServiceStatus(service);
              const cfg = statusConfig[status] || statusConfig.active;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={service._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{service.category}</span>
                    {renderStars(service.metrics?.satisfaction_score || 0)}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      Est: {service.fulfillment?.estimated_hours || 0}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {service.metrics?.total_requests || 0} requests
                    </span>
                  </div>

                  {/* Action */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Request Service
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Service</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">SLA Target</div>
              <div className="col-span-1">Rating</div>
              <div className="col-span-2">Action</div>
            </div>

            {/* Table Body */}
            {filteredServices.map((service) => {
              const status = getServiceStatus(service);
              const cfg = statusConfig[status] || statusConfig.active;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={service._id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors items-center"
                >
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{service.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">{service.category}</span>
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">{service.fulfillment?.estimated_hours || 0}h</span>
                  </div>
                  <div className="col-span-1">
                    {renderStars(service.metrics?.satisfaction_score || 0)}
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`)}
                      className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Request
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No services found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

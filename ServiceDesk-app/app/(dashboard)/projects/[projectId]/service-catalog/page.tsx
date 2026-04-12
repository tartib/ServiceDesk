'use client';

import { API_URL } from '@/lib/api/config';
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
 Plus,
 Trash2,
 Pencil,
} from 'lucide-react';
import {
 ProjectHeader,
 ProjectNavTabs,
 LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useServiceCatalog, IServiceCatalogItem } from '@/hooks/useServiceCatalog';
import ServiceFormModal from '@/components/service-catalog/ServiceFormModal';
import DeleteServiceDialog from '@/components/service-catalog/DeleteServiceDialog';

interface Project {
 _id: string;
 name: string;
 key: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
 active: { label: 'Active', color: 'bg-success-soft text-success', icon: CheckCircle },
 inactive: { label: 'Inactive', color: 'bg-muted text-muted-foreground', icon: XCircle },
 deprecated: { label: 'Deprecated', color: 'bg-warning-soft text-warning', icon: Clock },
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
 const [showCreateModal, setShowCreateModal] = useState(false);
 const [editTarget, setEditTarget] = useState<IServiceCatalogItem | null>(null);
 const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

 const { data: catalogData, isLoading: catalogLoading } = useServiceCatalog();
 const services: IServiceCatalogItem[] = useMemo(() => catalogData?.data || [], [catalogData]);

 const categories = useMemo(() => {
 const cats = new Set(services.map(s => s.category));
 return ['All', ...Array.from(cats)];
 }, [services]);

 const fetchProject = useCallback(async (token: string) => {
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}`, {
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
 className={`h-3.5 w-3.5 ${star <= rating ? 'text-warning fill-warning/60' : 'text-muted-foreground'}`}
 />
 ))}
 <span className="ml-1 text-xs text-muted-foreground">{rating.toFixed(1)}</span>
 </div>
 );
 };

 const isLoading = projectLoading || catalogLoading;

 if (isLoading) {
 return <LoadingState />;
 }

 return (
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'itil'} />

 {/* Search & Filters */}
 <div className="bg-background border-b border-border px-4 py-4">
 <div className="flex flex-col sm:flex-row gap-4">
 {/* Search */}
 <div className="relative flex-1">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search services..."
 className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>

 {/* Add Service Button */}
 <button
 onClick={() => setShowCreateModal(true)}
 className="flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors whitespace-nowrap"
 >
 <Plus className="h-4 w-4" />
 Add Service
 </button>

 {/* View Toggle */}
 <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
 <button
 onClick={() => setViewMode('grid')}
 className={`p-2 rounded-md transition-colors ${
 viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
 }`}
 >
 <Grid className="h-4 w-4" />
 </button>
 <button
 onClick={() => setViewMode('list')}
 className={`p-2 rounded-md transition-colors ${
 viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-muted-foreground hover:bg-muted'
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
 className="bg-background border border-border rounded-xl p-5 hover:shadow-lg hover:border-brand-border transition-all cursor-pointer group"
 >
 {/* Header */}
 <div className="flex items-start justify-between mb-3">
 <div className="p-2 bg-brand-soft rounded-lg group-hover:bg-brand-soft transition-colors">
 <Package className="h-6 w-6 text-brand" />
 </div>
 <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
 <StatusIcon className="h-3 w-3" />
 {cfg.label}
 </span>
 </div>

 {/* Content */}
 <h3 className="font-semibold text-foreground mb-1 group-hover:text-brand transition-colors">
 {service.name}
 </h3>
 <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>

 {/* Meta */}
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground">{service.category}</span>
 {renderStars(service.metrics?.satisfaction_score || 0)}
 </div>

 {/* Stats */}
 <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <Zap className="h-3.5 w-3.5" />
 Est: {service.fulfillment?.estimated_hours || 0}h
 </span>
 <span className="flex items-center gap-1">
 <Users className="h-3.5 w-3.5" />
 {service.metrics?.total_requests || 0} requests
 </span>
 </div>

 {/* Actions */}
 <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={(e) => {
 e.stopPropagation();
 router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`);
 }}
 className="flex-1 px-4 py-2 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors"
 >
 Request Service
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setEditTarget(service);
 }}
 className="p-2 text-muted-foreground hover:text-brand hover:bg-brand-surface rounded-lg transition-colors"
 title="Edit service"
 >
 <Pencil className="h-4 w-4" />
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 setDeleteTarget({ id: service.service_id, name: service.name });
 }}
 className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive-soft rounded-lg transition-colors"
 title="Delete service"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="bg-background border border-border rounded-xl overflow-hidden">
 {/* Table Header */}
 <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
 className="grid grid-cols-12 gap-4 px-4 py-4 border-b border-border hover:bg-muted/50 transition-colors items-center"
 >
 <div className="col-span-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-brand-soft rounded-lg">
 <Package className="h-5 w-5 text-brand" />
 </div>
 <div>
 <p className="font-medium text-foreground">{service.name}</p>
 <p className="text-xs text-muted-foreground truncate max-w-xs">{service.description}</p>
 </div>
 </div>
 </div>
 <div className="col-span-2">
 <span className="text-sm text-muted-foreground">{service.category}</span>
 </div>
 <div className="col-span-1">
 <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${cfg.color}`}>
 <StatusIcon className="h-3 w-3" />
 {cfg.label}
 </span>
 </div>
 <div className="col-span-2">
 <span className="text-sm text-muted-foreground">{service.fulfillment?.estimated_hours || 0}h</span>
 </div>
 <div className="col-span-1">
 {renderStars(service.metrics?.satisfaction_score || 0)}
 </div>
 <div className="col-span-2 flex items-center gap-2">
 <button
 onClick={() => router.push(`/self-service/new-request?service_id=${service.service_id}&service_name=${encodeURIComponent(service.name)}`)}
 className="px-4 py-1.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors"
 >
 Request
 </button>
 <button
 onClick={() => setEditTarget(service)}
 className="p-1.5 text-muted-foreground hover:text-brand hover:bg-brand-surface rounded-lg transition-colors"
 title="Edit service"
 >
 <Pencil className="h-4 w-4" />
 </button>
 <button
 onClick={() => setDeleteTarget({ id: service.service_id, name: service.name })}
 className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive-soft rounded-lg transition-colors"
 title="Delete service"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {filteredServices.length === 0 && (
 <div className="text-center py-12">
 <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <h3 className="text-lg font-medium text-foreground mb-1">No services found</h3>
 <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
 <button
 onClick={() => setShowCreateModal(true)}
 className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors"
 >
 <Plus className="h-4 w-4" />
 Add First Service
 </button>
 </div>
 )}
 </div>

 {/* Create/Edit Service Modal */}
 <ServiceFormModal
 open={showCreateModal || !!editTarget}
 onOpenChange={(open) => {
 if (!open) { setShowCreateModal(false); setEditTarget(null); }
 }}
 service={editTarget}
 />

 {/* Delete Service Dialog */}
 <DeleteServiceDialog
 open={!!deleteTarget}
 onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
 serviceId={deleteTarget?.id || null}
 serviceName={deleteTarget?.name || ''}
 />
 </div>
 );
}

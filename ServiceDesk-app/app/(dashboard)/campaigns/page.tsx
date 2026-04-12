'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
 Megaphone,
 Plus,
 Search,
 Mail,
 MessageSquare,
 Bell,
 Send,
 Pause,
 Play,
 XCircle,
 Clock,
 CheckCircle,
 BarChart3,
 FileText,
 Users,
 Zap,
 Route,
} from 'lucide-react';
import {
 useCampaigns,
 useAnalyticsOverview,
 ICampaign,
} from '@/hooks/useCampaigns';

const statusColors: Record<string, string> = {
 draft: 'bg-muted text-foreground',
 scheduled: 'bg-brand-soft text-brand',
 running: 'bg-success-soft text-success',
 paused: 'bg-warning-soft text-warning',
 completed: 'bg-info-soft text-info',
 cancelled: 'bg-destructive-soft text-destructive',
};

const statusIcons: Record<string, React.ReactNode> = {
 draft: <FileText className="h-3.5 w-3.5" />,
 scheduled: <Clock className="h-3.5 w-3.5" />,
 running: <Play className="h-3.5 w-3.5" />,
 paused: <Pause className="h-3.5 w-3.5" />,
 completed: <CheckCircle className="h-3.5 w-3.5" />,
 cancelled: <XCircle className="h-3.5 w-3.5" />,
};

const channelIcons: Record<string, React.ReactNode> = {
 email: <Mail className="h-4 w-4 text-brand" />,
 sms: <MessageSquare className="h-4 w-4 text-success" />,
 push: <Bell className="h-4 w-4 text-info" />,
};

export default function CampaignsPage() {
 const router = useRouter();
 const [page, setPage] = useState(1);
 const [search, setSearch] = useState('');
 const [statusFilter, setStatusFilter] = useState<string>('');
 const [channelFilter, setChannelFilter] = useState<string>('');

 const { data: campaignData, isLoading } = useCampaigns({
 page,
 limit: 20,
 status: statusFilter || undefined,
 channel: channelFilter || undefined,
 search: search || undefined,
 });
 const { data: overview } = useAnalyticsOverview();

 const campaigns: ICampaign[] = useMemo(
 () => campaignData?.items || [],
 [campaignData]
 );
 const totalPages = campaignData?.totalPages || 1;

 return (
 <div className="flex flex-col h-full bg-background">
 {/* Header */}
 <div className="bg-card border-b border-border px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Megaphone className="h-6 w-6 text-brand" />
 <h1 className="text-xl font-bold text-foreground">Campaigns</h1>
 </div>
 <div className="flex items-center gap-2">
 <button
 onClick={() => router.push('/campaigns/templates')}
 className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
 >
 <FileText className="h-4 w-4" />
 Templates
 </button>
 <button
 onClick={() => router.push('/campaigns/segments')}
 className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
 >
 <Users className="h-4 w-4" />
 Segments
 </button>
 <button
 onClick={() => router.push('/campaigns/journeys')}
 className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
 >
 <Route className="h-4 w-4" />
 Journeys
 </button>
 <button
 onClick={() => router.push('/campaigns/analytics')}
 className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
 >
 <BarChart3 className="h-4 w-4" />
 Analytics
 </button>
 <button
 onClick={() => router.push('/campaigns/new')}
 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-foreground bg-brand rounded-lg hover:bg-brand-strong transition-colors"
 >
 <Plus className="h-4 w-4" />
 New Campaign
 </button>
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6">
 {/* Overview Stats */}
 {overview && (
 <div className="grid grid-cols-4 gap-4 mb-6">
 <div className="bg-card rounded-xl p-5 border border-border">
 <div className="flex items-center justify-between mb-3">
 <span className="text-sm text-muted-foreground">Total Sent</span>
 <div className="p-2 rounded-lg bg-brand-soft">
 <Send className="h-4 w-4 text-brand" />
 </div>
 </div>
 <p className="text-3xl font-bold text-foreground">
 {overview.totalSent?.toLocaleString() || 0}
 </p>
 </div>
 <div className="bg-card rounded-xl p-5 border border-border">
 <div className="flex items-center justify-between mb-3">
 <span className="text-sm text-muted-foreground">Delivered</span>
 <div className="p-2 rounded-lg bg-success-soft">
 <CheckCircle className="h-4 w-4 text-success" />
 </div>
 </div>
 <p className="text-3xl font-bold text-success">
 {overview.totalDelivered?.toLocaleString() || 0}
 </p>
 </div>
 <div className="bg-card rounded-xl p-5 border border-border">
 <div className="flex items-center justify-between mb-3">
 <span className="text-sm text-muted-foreground">Avg Open Rate</span>
 <div className="p-2 rounded-lg bg-info-soft">
 <BarChart3 className="h-4 w-4 text-info" />
 </div>
 </div>
 <p className="text-3xl font-bold text-info">
 {overview.avgOpenRate?.toFixed(1) || 0}%
 </p>
 </div>
 <div className="bg-card rounded-xl p-5 border border-border">
 <div className="flex items-center justify-between mb-3">
 <span className="text-sm text-muted-foreground">Avg Click Rate</span>
 <div className="p-2 rounded-lg bg-warning-soft">
 <Zap className="h-4 w-4 text-warning" />
 </div>
 </div>
 <p className="text-3xl font-bold text-warning">
 {overview.avgClickRate?.toFixed(1) || 0}%
 </p>
 </div>
 </div>
 )}

 {/* Filters */}
 <div className="flex items-center gap-3 mb-4">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search campaigns..."
 value={search}
 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
 className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 <select
 value={statusFilter}
 onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
 className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
 >
 <option value="">All Status</option>
 <option value="draft">Draft</option>
 <option value="scheduled">Scheduled</option>
 <option value="running">Running</option>
 <option value="paused">Paused</option>
 <option value="completed">Completed</option>
 <option value="cancelled">Cancelled</option>
 </select>
 <select
 value={channelFilter}
 onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
 className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
 >
 <option value="">All Channels</option>
 <option value="email">Email</option>
 <option value="sms">SMS</option>
 <option value="push">Push</option>
 </select>
 </div>

 {/* Loading */}
 {isLoading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
 </div>
 ) : campaigns.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
 <Megaphone className="h-12 w-12 mb-4 opacity-50" />
 <p className="text-lg font-medium">No campaigns found</p>
 <p className="text-sm mt-1">Create your first campaign to get started</p>
 </div>
 ) : (
 <>
 {/* Campaign List */}
 <div className="space-y-3">
 {campaigns.map((campaign) => (
 <div
 key={campaign._id}
 onClick={() => router.push(`/campaigns/${campaign._id}`)}
 className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer"
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 {channelIcons[campaign.channel] || <Mail className="h-4 w-4" />}
 <h3 className="font-semibold text-foreground">{campaign.name}</h3>
 </div>
 <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[campaign.status] || 'bg-muted text-foreground'}`}>
 {statusIcons[campaign.status]}
 {campaign.status}
 </span>
 <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 bg-accent rounded">
 {campaign.mode}
 </span>
 </div>
 <div className="flex items-center gap-6 text-sm text-muted-foreground">
 <div className="flex items-center gap-1">
 <Send className="h-3.5 w-3.5" />
 <span>{campaign.stats?.sent?.toLocaleString() || 0}</span>
 </div>
 <div className="flex items-center gap-1">
 <CheckCircle className="h-3.5 w-3.5" />
 <span>{campaign.stats?.delivered?.toLocaleString() || 0}</span>
 </div>
 <div>
 <span className="text-success font-medium">
 {campaign.stats?.openRate?.toFixed(1) || 0}%
 </span>{' '}
 open
 </div>
 <div>
 <span className="text-brand font-medium">
 {campaign.stats?.clickRate?.toFixed(1) || 0}%
 </span>{' '}
 click
 </div>
 <span className="text-xs">
 {new Date(campaign.createdAt).toLocaleDateString()}
 </span>
 </div>
 </div>
 {campaign.description && (
 <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
 {campaign.description}
 </p>
 )}
 </div>
 ))}
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-center gap-2 mt-6">
 <button
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50 hover:bg-accent transition-colors"
 >
 Previous
 </button>
 <span className="text-sm text-muted-foreground">
 Page {page} of {totalPages}
 </span>
 <button
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50 hover:bg-accent transition-colors"
 >
 Next
 </button>
 </div>
 )}
 </>
 )}
 </div>
 </div>
 );
}

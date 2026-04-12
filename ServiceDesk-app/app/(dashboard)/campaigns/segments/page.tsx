'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
 Users,
 Plus,
 Search,
 Edit,
 Trash2,
 ArrowLeft,
 Hash,
} from 'lucide-react';
import {
 useSegments,
 useDeleteSegment,
 ISegment,
} from '@/hooks/useCampaigns';

export default function SegmentsPage() {
 const router = useRouter();
 const [search, setSearch] = useState('');
 const [page, setPage] = useState(1);

 const { data: segmentData, isLoading } = useSegments({ page, limit: 20, search: search || undefined });
 const deleteMutation = useDeleteSegment();

 const segments: ISegment[] = useMemo(
 () => segmentData?.items || [],
 [segmentData]
 );

 return (
 <div className="flex flex-col h-full bg-background">
 <div className="bg-card border-b border-border px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
 <ArrowLeft className="h-5 w-5" />
 </button>
 <Users className="h-6 w-6 text-brand" />
 <h1 className="text-xl font-bold text-foreground">Audience Segments</h1>
 </div>
 <button
 onClick={() => router.push('/campaigns/segments/new')}
 className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-foreground bg-brand rounded-lg hover:bg-brand-strong transition-colors"
 >
 <Plus className="h-4 w-4" />
 New Segment
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 placeholder="Search segments..."
 value={search}
 onChange={(e) => { setSearch(e.target.value); setPage(1); }}
 className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 </div>

 {isLoading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
 </div>
 ) : segments.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
 <Users className="h-12 w-12 mb-4 opacity-50" />
 <p className="text-lg font-medium">No segments yet</p>
 <p className="text-sm mt-1">Create audience segments to target campaigns</p>
 </div>
 ) : (
 <div className="space-y-3">
 {segments.map((s) => (
 <div
 key={s._id}
 onClick={() => router.push(`/campaigns/segments/${s._id}`)}
 className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer"
 >
 <div className="flex items-center justify-between">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h3 className="font-semibold text-foreground">{s.name}</h3>
 <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'}`}>
 {s.isActive ? 'Active' : 'Inactive'}
 </span>
 </div>
 {s.description && (
 <p className="text-sm text-muted-foreground line-clamp-1">{s.description}</p>
 )}
 <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <Hash className="h-3 w-3" />
 {s.rules.length} rule{s.rules.length !== 1 ? 's' : ''}
 </span>
 {s.estimatedCount !== undefined && (
 <span className="flex items-center gap-1">
 <Users className="h-3 w-3" />
 ~{s.estimatedCount.toLocaleString()} users
 </span>
 )}
 {s.lastEvaluatedAt && (
 <span>Evaluated {new Date(s.lastEvaluatedAt).toLocaleDateString()}</span>
 )}
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={(e) => { e.stopPropagation(); router.push(`/campaigns/segments/${s._id}`); }}
 className="p-2 rounded hover:bg-accent"
 >
 <Edit className="h-4 w-4 text-muted-foreground" />
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 if (confirm('Delete this segment?')) deleteMutation.mutate(s._id);
 }}
 className="p-2 rounded hover:bg-destructive-soft"
 >
 <Trash2 className="h-4 w-4 text-destructive" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Route,
  Plus,
  Search,
  Play,
  Pause,
  Archive,
  FileText,
  Edit,
  Trash2,
  ArrowLeft,
  Users,
} from 'lucide-react';
import {
  useJourneys,
  useDeleteJourney,
  IJourney,
} from '@/hooks/useCampaigns';

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-purple-100 text-purple-700',
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <FileText className="h-3.5 w-3.5" />,
  published: <Play className="h-3.5 w-3.5" />,
  paused: <Pause className="h-3.5 w-3.5" />,
  archived: <Archive className="h-3.5 w-3.5" />,
};

export default function JourneysPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: journeyData, isLoading } = useJourneys({
    page,
    limit: 20,
    status: statusFilter || undefined,
    search: search || undefined,
  });
  const deleteMutation = useDeleteJourney();

  const journeys: IJourney[] = useMemo(
    () => journeyData?.items || [],
    [journeyData]
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Route className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-foreground">Customer Journeys</h1>
          </div>
          <button
            onClick={() => router.push('/campaigns/journeys/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Journey
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search journeys..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : journeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Route className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No journeys yet</p>
            <p className="text-sm mt-1">Design automated customer engagement journeys</p>
          </div>
        ) : (
          <div className="space-y-3">
            {journeys.map((j) => (
              <div
                key={j._id}
                onClick={() => router.push(`/campaigns/journeys/${j._id}`)}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{j.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[j.status] || 'bg-gray-100 text-gray-700'}`}>
                        {statusIcons[j.status]}
                        {j.status}
                      </span>
                    </div>
                    {j.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{j.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{j.steps?.length || 0} steps</span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {j.activeUserCount || 0} active
                      </span>
                      <span>{j.completedUserCount || 0} completed</span>
                      {j.publishedAt && (
                        <span>Published {new Date(j.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/campaigns/journeys/${j._id}`); }}
                      className="p-2 rounded hover:bg-accent"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {j.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this journey?')) deleteMutation.mutate(j._id);
                        }}
                        className="p-2 rounded hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    )}
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

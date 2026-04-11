'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Plus,
  Search,
  ArrowLeft,
  Trash2,
  Edit,
  ToggleLeft,
  ToggleRight,
  Link,
} from 'lucide-react';
import {
  useTriggers,
  useDeleteTrigger,
  useToggleTrigger,
  ITriggerDefinition,
} from '@/hooks/useCampaigns';

export default function TriggersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [eventFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: triggerData, isLoading } = useTriggers({
    page,
    limit: 20,
    event: eventFilter || undefined,
  });
  const deleteMutation = useDeleteTrigger();
  const toggleMutation = useToggleTrigger();

  const triggers: ITriggerDefinition[] = useMemo(
    () => triggerData?.items || [],
    [triggerData]
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Zap className="h-6 w-6 text-yellow-500" />
            <h1 className="text-xl font-bold text-foreground">Event Triggers</h1>
          </div>
          <button
            onClick={() => router.push('/campaigns/triggers/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Trigger
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search triggers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : triggers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Zap className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No triggers yet</p>
            <p className="text-sm mt-1">Create event-driven notification triggers</p>
          </div>
        ) : (
          <div className="space-y-3">
            {triggers.map((trigger) => (
              <div
                key={trigger._id}
                className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{trigger.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${trigger.isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {trigger.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {trigger.event}
                      </span>
                      <span>{trigger.conditions?.length || 0} conditions</span>
                      <span>Cooldown: {trigger.cooldownMinutes}m</span>
                      <span>Fired: {trigger.fireCount} times</span>
                      {trigger.linkedCampaignId && (
                        <span className="flex items-center gap-1">
                          <Link className="h-3 w-3" />
                          Linked to campaign
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleMutation.mutate(trigger._id)}
                      className="p-2 rounded hover:bg-accent"
                      title={trigger.isEnabled ? 'Disable' : 'Enable'}
                    >
                      {trigger.isEnabled ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => router.push(`/campaigns/triggers/${trigger._id}`)}
                      className="p-2 rounded hover:bg-accent"
                    >
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this trigger?')) deleteMutation.mutate(trigger._id);
                      }}
                      className="p-2 rounded hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
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

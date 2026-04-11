'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Server,
  Plus,
  ArrowLeft,
  Trash2,
  Edit,
  Star,
  FlaskConical,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  useProviders,
  useDeleteProvider,
  useTestProvider,
  useSetDefaultProvider,
  IProviderConfig,
} from '@/hooks/useCampaigns';

export default function ProvidersPage() {
  const router = useRouter();
  const [typeFilter] = useState('');

  const { data: providers, isLoading } = useProviders({ type: typeFilter || undefined });
  const deleteMutation = useDeleteProvider();
  const testMutation = useTestProvider();
  const setDefaultMutation = useSetDefaultProvider();

  const providerList: IProviderConfig[] = useMemo(() => {
    if (Array.isArray(providers)) return providers;
    return [];
  }, [providers]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Server className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-foreground">Notification Providers</h1>
          </div>
          <button
            onClick={() => router.push('/campaigns/providers/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Provider
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : providerList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Server className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No providers configured</p>
            <p className="text-sm mt-1">Add email, SMS, or push notification providers</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providerList.map((p) => (
              <div key={p._id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      {p.isDefault && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          <Star className="h-3 w-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize mt-0.5">
                      {p.provider} &middot; {p.type}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {p.lastTestedAt && (
                      <span>Tested {new Date(p.lastTestedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => testMutation.mutate(p._id)}
                      disabled={testMutation.isPending}
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                      title="Test connection"
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                    </button>
                    {!p.isDefault && (
                      <button
                        onClick={() => setDefaultMutation.mutate(p._id)}
                        disabled={setDefaultMutation.isPending}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                        title="Set as default"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/campaigns/providers/${p._id}`)}
                      className="p-1.5 rounded hover:bg-accent"
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this provider?')) deleteMutation.mutate(p._id);
                      }}
                      className="p-1.5 rounded hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
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

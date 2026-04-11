'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Mail,
  MessageSquare,
  Bell,
  Trash2,
  Edit,
  ArrowLeft,
  Tag,
} from 'lucide-react';
import {
  useTemplates,
  useDeleteTemplate,
  INotificationTemplate,
} from '@/hooks/useCampaigns';

export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: templateData, isLoading } = useTemplates({
    page,
    limit: 20,
    channel: channelFilter || undefined,
    search: search || undefined,
  });
  const deleteMutation = useDeleteTemplate();

  const templates: INotificationTemplate[] = useMemo(
    () => templateData?.items || [],
    [templateData]
  );

  const channelIcons: Record<string, React.ReactNode> = {
    email: <Mail className="h-4 w-4 text-blue-500" />,
    sms: <MessageSquare className="h-4 w-4 text-green-500" />,
    push: <Bell className="h-4 w-4 text-purple-500" />,
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-foreground">Notification Templates</h1>
          </div>
          <button
            onClick={() => router.push('/campaigns/templates/new')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Template
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No templates yet</p>
            <p className="text-sm mt-1">Create reusable notification templates</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <div key={t._id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {channelIcons[t.channel] || <Mail className="h-4 w-4" />}
                    <h3 className="font-semibold text-foreground text-sm">{t.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {t.subject && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                    Subject: {t.subject}
                  </p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.body}</p>
                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.variables.slice(0, 4).map((v) => (
                      <span key={v.key} className="text-xs px-1.5 py-0.5 bg-accent rounded flex items-center gap-1">
                        <Tag className="h-2.5 w-2.5" />
                        {v.key}
                      </span>
                    ))}
                    {t.variables.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{t.variables.length - 4}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/campaigns/templates/${t._id}`); }}
                      className="p-1.5 rounded hover:bg-accent"
                    >
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this template?')) deleteMutation.mutate(t._id);
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

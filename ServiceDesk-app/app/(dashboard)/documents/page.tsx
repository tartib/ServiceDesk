'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Download, Clock, Loader2 } from 'lucide-react';

interface DocumentTemplate {
  templateId: string;
  name: string;
  description?: string;
  format: string;
  isActive: boolean;
  createdAt: string;
}

interface RenderedDocument {
  documentId: string;
  templateId: string;
  format: string;
  status: 'pending' | 'rendering' | 'ready' | 'failed';
  downloadUrl?: string;
  renderedAt?: string;
  sourceEntityId?: string;
  sourceEntityType?: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [tab, setTab] = useState<'templates' | 'documents'>('templates');

  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['document-templates'],
    queryFn: async () => {
      const raw = await api.get<{ templates?: DocumentTemplate[] }>('/documents/templates');
      return raw?.templates ?? [];
    },
  });

  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['rendered-documents'],
    queryFn: async () => {
      const raw = await api.get<{ documents?: RenderedDocument[] }>('/documents');
      return raw?.documents ?? [];
    },
    enabled: tab === 'documents',
  });

  const templates: DocumentTemplate[] = templatesData ?? [];
  const documents: RenderedDocument[] = documentsData ?? [];

  return (
    <DashboardLayout>
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage document templates and view generated documents
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(['templates', 'documents'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Templates tab */}
      {tab === 'templates' && (
        <div>
          {templatesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <FileText className="h-10 w-10" />
              <p className="text-sm">No document templates yet</p>
              <Button variant="outline" size="sm">Create your first template</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <div key={tpl.templateId} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm">{tpl.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {tpl.format.toUpperCase()}
                    </Badge>
                  </div>
                  {tpl.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{tpl.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${tpl.isActive ? 'text-success' : 'text-muted-foreground'}`}>
                      {tpl.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Generate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents tab */}
      {tab === 'documents' && (
        <div>
          {documentsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <FileText className="h-10 w-10" />
              <p className="text-sm">No documents generated yet</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              {documents.map((doc) => (
                <div key={doc.documentId} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-muted/50">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      Document {doc.documentId.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {doc.renderedAt
                        ? new Date(doc.renderedAt).toLocaleString()
                        : new Date(doc.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant={doc.status === 'ready' ? 'default' : doc.status === 'failed' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {doc.status}
                  </Badge>
                  {doc.status === 'ready' && doc.downloadUrl && (
                    <a href={doc.downloadUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}

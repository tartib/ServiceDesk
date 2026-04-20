'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import {
  useRecord,
  useApproveRecord,
  useRejectRecord,
  useCancelRecord,
  useAddRecordComment,
} from '@/hooks/useRecords';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, CheckCircle2, XCircle, MessageSquare, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', pending_approval: 'Pending Approval',
  approved: 'Approved', rejected: 'Rejected', in_progress: 'In Progress',
  completed: 'Completed', cancelled: 'Cancelled',
};

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const { data: record, isLoading } = useRecord(id);
  const approve = useApproveRecord();
  const reject = useRejectRecord();
  const cancel = useCancelRecord();
  const addComment = useAddRecordComment();

  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!record) {
    return (
      <DashboardLayout>
        <div className="container max-w-3xl mx-auto py-12 text-center text-muted-foreground">
          Record not found
        </div>
      </DashboardLayout>
    );
  }

  const handleApprove = () => {
    if (!user) return;
    approve.mutate({ id: record.id, approverId: user.id ?? user._id });
  };

  const handleReject = () => {
    if (!user || !rejectReason.trim()) return;
    reject.mutate({ id: record.id, approverId: user.id ?? user._id, reason: rejectReason });
    setShowReject(false);
    setRejectReason('');
  };

  const handleCancel = () => {
    cancel.mutate({ id: record.id });
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    addComment.mutate({ id: record.id, text: comment });
    setComment('');
  };

  return (
    <DashboardLayout>
    <div className="container max-w-3xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Record {record.id}</h1>
          <p className="text-sm text-muted-foreground">
            Created by {record.submittedBy.name} &middot; {new Date(record.createdAt).toLocaleString()}
          </p>
        </div>
        <Badge className="ml-auto">{STATUS_LABEL[record.status] ?? record.status}</Badge>
      </div>

      {/* Field data */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Field Data</h2>
        {Object.entries(record.data).map(([key, value]) => (
          <div key={key} className="flex gap-4 text-sm">
            <span className="font-medium w-40 shrink-0 text-muted-foreground">{key}</span>
            <span className="wrap-break-word">{String(value ?? '')}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      {(record.status === 'pending_approval' || record.status === 'submitted') && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleApprove} disabled={approve.isPending} className="gap-1">
              {approve.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setShowReject(true)} className="gap-1">
              <XCircle className="h-3 w-3" />
              Reject
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={cancel.isPending}>
              Cancel
            </Button>
          </div>
          {showReject && (
            <div className="space-y-2 pt-2">
              <Textarea
                placeholder="Reason for rejection…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || reject.isPending}>
                  {reject.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Confirm Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowReject(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      {record.timeline.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Timeline</h2>
          <div className="space-y-3">
            {record.timeline.map((event, idx) => (
              <div key={event.eventId ?? idx} className="flex gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p>{event.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.actorName && `${event.actorName} · `}
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="rounded-lg border p-4 space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Comments</h2>
        {record.comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet</p>
        )}
        {record.comments.map((c) => (
          <div key={c.commentId} className="flex gap-3 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p>{c.text}</p>
              <p className="text-xs text-muted-foreground">
                {c.authorName ?? c.author} &middot; {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <Separator />
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddComment}
            disabled={!comment.trim() || addComment.isPending}
          >
            {addComment.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
            Add Comment
          </Button>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}

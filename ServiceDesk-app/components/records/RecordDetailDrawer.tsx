'use client';

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Clock, MessageSquare, Paperclip, CheckCircle2, XCircle } from 'lucide-react';
import type { RecordDetail } from '@/lib/domains/forms/records';

interface RecordDetailDrawerProps {
  record?: RecordDetail | null;
  open: boolean;
  onClose: () => void;
  onApprove?: (record: RecordDetail) => void;
  onReject?: (record: RecordDetail, reason: string) => void;
  onComment?: (record: RecordDetail, text: string) => void;
  isActioning?: boolean;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  submitted: 'default',
  pending_approval: 'outline',
  approved: 'default',
  rejected: 'destructive',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'secondary',
};

export function RecordDetailDrawer({
  record,
  open,
  onClose,
  onApprove,
  onReject,
  onComment,
  isActioning = false,
}: RecordDetailDrawerProps) {
  const [commentText, setCommentText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = () => {
    if (record) onApprove?.(record);
  };

  const handleReject = () => {
    if (record && rejectReason.trim()) {
      onReject?.(record, rejectReason.trim());
      setRejectReason('');
      setShowRejectForm(false);
    }
  };

  const handleComment = () => {
    if (record && commentText.trim()) {
      onComment?.(record, commentText.trim());
      setCommentText('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {!record ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader className="mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <SheetTitle className="text-base font-semibold">
                  Record #{record.id.slice(-8).toUpperCase()}
                </SheetTitle>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={STATUS_VARIANT[record.status] ?? 'secondary'}>
                  {record.status.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  by {record.submittedBy.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
              </div>
            </SheetHeader>

            {/* Field data */}
            {Object.keys(record.data).length > 0 && (
              <>
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-medium">Form Data</h3>
                  <div className="space-y-2">
                    {Object.entries(record.data).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium truncate">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="my-4" />
              </>
            )}

            {/* Actions — only shown in pending_approval */}
            {record.status === 'pending_approval' && (onApprove || onReject) && (
              <>
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-medium">Actions</h3>
                  {showRejectForm ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleReject}
                          disabled={!rejectReason.trim() || isActioning}
                        >
                          {isActioning && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                          Confirm Rejection
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {onApprove && (
                        <Button
                          size="sm"
                          onClick={handleApprove}
                          disabled={isActioning}
                          className="flex-1"
                        >
                          {isActioning ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Approve
                        </Button>
                      )}
                      {onReject && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setShowRejectForm(true)}
                          disabled={isActioning}
                          className="flex-1"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1.5" />
                          Reject
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
              </>
            )}

            {/* Timeline */}
            {record.timeline.length > 0 && (
              <>
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Timeline
                  </h3>
                  <div className="relative space-y-3 pl-4 border-l">
                    {record.timeline.map((event) => (
                      <div key={event.eventId} className="text-xs">
                        <p className="font-medium text-foreground">{event.description}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {event.actorName && `${event.actorName} · `}
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator className="my-4" />
              </>
            )}

            {/* Comments */}
            <div className="space-y-3 mb-4">
              <h3 className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comments
                {record.comments.length > 0 && (
                  <Badge variant="secondary" className="text-xs h-4">
                    {record.comments.length}
                  </Badge>
                )}
              </h3>
              {record.comments.length > 0 && (
                <div className="space-y-3">
                  {record.comments.map((comment) => (
                    <div key={comment.commentId} className="bg-muted/50 rounded-lg p-3 text-xs">
                      <p className="font-medium mb-1">{comment.authorName ?? comment.author}</p>
                      <p className="text-muted-foreground">{comment.text}</p>
                      <p className="text-muted-foreground/60 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {onComment && (
                <div className="space-y-2 mt-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleComment}
                    disabled={!commentText.trim() || isActioning}
                  >
                    Post Comment
                  </Button>
                </div>
              )}
            </div>

            {/* Attachments */}
            {record.attachments.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-1.5">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    Attachments
                  </h3>
                  <div className="space-y-2">
                    {record.attachments.map((att) => (
                      <a
                        key={att.attachmentId}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs p-2 rounded border hover:bg-muted/50 transition-colors"
                      >
                        <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{att.fileName}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">
                          {(att.fileSize / 1024).toFixed(1)} KB
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default RecordDetailDrawer;

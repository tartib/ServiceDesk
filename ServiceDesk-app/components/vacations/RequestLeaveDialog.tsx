'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { useCreateLeaveRequest, LeaveType } from '@/hooks/useLeaveRequests';

interface RequestLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

const leaveTypeColors: Record<LeaveType, string> = {
  vacation: 'bg-blue-500',
  wfh: 'bg-purple-500',
  sick: 'bg-orange-500',
  holiday: 'bg-green-500',
  blackout: 'bg-red-500',
};

export default function RequestLeaveDialog({ open, onOpenChange, teamId }: RequestLeaveDialogProps) {
  const { locale } = useLanguage();
  const createLeaveRequest = useCreateLeaveRequest();

  const [type, setType] = useState<LeaveType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const typeLabels: Record<LeaveType, { en: string; ar: string }> = {
    vacation: { en: 'Vacation', ar: 'إجازة' },
    wfh: { en: 'Work from Home', ar: 'عمل من المنزل' },
    sick: { en: 'Sick Day', ar: 'إجازة مرضية' },
    holiday: { en: 'Holiday', ar: 'عطلة رسمية' },
    blackout: { en: 'Blackout', ar: 'فترة محظورة' },
  };

  const isTeamWide = type === 'holiday' || type === 'blackout';

  const handleSubmit = async () => {
    if (!type || !startDate || !endDate) return;
    try {
      await createLeaveRequest.mutateAsync({
        teamId,
        type,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      });
      // Reset form
      setType('');
      setStartDate('');
      setEndDate('');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating leave request:', error);
    }
  };

  const canSubmit = !!type && !!startDate && !!endDate && !createLeaveRequest.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {locale === 'ar' ? 'طلب إجازة' : 'Request Leave'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Leave Type */}
          <div>
            <Label>{locale === 'ar' ? 'نوع الإجازة' : 'Leave Type'}</Label>
            <Select value={type} onValueChange={(v) => setType(v as LeaveType)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={locale === 'ar' ? 'اختر نوع الإجازة' : 'Select leave type'} />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(typeLabels) as LeaveType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${leaveTypeColors[t]}`} />
                      {locale === 'ar' ? typeLabels[t].ar : typeLabels[t].en}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team-wide notice */}
          {isTeamWide && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                {locale === 'ar'
                  ? 'سيتم تطبيق هذا على الفريق بأكمله وسيتم الموافقة عليه تلقائياً'
                  : 'This will apply to the entire team and will be auto-approved'}
              </p>
            </div>
          )}

          {/* Start Date */}
          <div>
            <Label>{locale === 'ar' ? 'تاريخ البدء' : 'Start Date'}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (!endDate || e.target.value > endDate) {
                  setEndDate(e.target.value);
                }
              }}
              className="mt-1"
            />
          </div>

          {/* End Date */}
          <div>
            <Label>{locale === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="mt-1"
            />
          </div>

          {/* Reason */}
          <div>
            <Label>{locale === 'ar' ? 'السبب (اختياري)' : 'Reason (optional)'}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={locale === 'ar' ? 'أدخل سبب الإجازة...' : 'Enter reason for leave...'}
              className="mt-1"
            />
          </div>

          {/* Type preview */}
          {type && (
            <div className="flex items-center gap-2">
              <Badge className={`${leaveTypeColors[type]} text-white`}>
                {locale === 'ar' ? typeLabels[type].ar : typeLabels[type].en}
              </Badge>
              {isTeamWide && (
                <Badge variant="outline" className="text-xs">
                  {locale === 'ar' ? 'للفريق' : 'Team-wide'}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1">
              {createLeaveRequest.isPending
                ? (locale === 'ar' ? 'جاري التقديم...' : 'Submitting...')
                : (locale === 'ar' ? 'تقديم الطلب' : 'Submit Request')}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

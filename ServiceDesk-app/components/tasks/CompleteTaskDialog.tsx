'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCompleteTask } from '@/hooks/useTasks';
import { Loader2, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompleteTaskDialogProps {
  taskId: string;
  taskName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const units = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'cup', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons (tbsp)' },
  { value: 'tsp', label: 'Teaspoons (tsp)' },
];

export default function CompleteTaskDialog({
  taskId,
  taskName,
  open,
  onOpenChange,
  onSuccess,
}: CompleteTaskDialogProps) {
  const { t } = useLanguage();
  const { mutate: completeTask, isPending } = useCompleteTask();
  const [preparedQuantity, setPreparedQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('pcs');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleComplete = () => {
    setError('');

    if (preparedQuantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    completeTask(
      {
        taskId,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setPreparedQuantity(1);
          setUnit('pcs');
          setNotes('');
          setError('');
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (err: Error & { response?: { data?: { message?: string } } }) => {
          setError(err.response?.data?.message || 'Failed to complete task. Please try again.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {t('tasks.completeTask')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Name */}
          <div>
            <p className="text-sm text-gray-600 mb-1">{t('tasks.completingTask')}:</p>
            <p className="font-semibold text-lg">{taskName}</p>
          </div>

          {/* Prepared Quantity */}
          <div className="space-y-2">
            <Label htmlFor="preparedQuantity">
              {t('tasks.preparedQuantity')} *
            </Label>
            <Input
              id="preparedQuantity"
              type="number"
              min="0.01"
              step="0.01"
              value={preparedQuantity}
              onChange={(e) => setPreparedQuantity(parseFloat(e.target.value))}
              disabled={isPending}
              placeholder="1"
            />
            <p className="text-xs text-gray-500">
              {t('tasks.preparedQuantityHelp')}
            </p>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label htmlFor="unit">{t('common.unit')} *</Label>
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              disabled={isPending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              {units.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('common.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              placeholder={t('tasks.completionNotesPlaceholder')}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {notes.length}/500 {t('common.characters')}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('tasks.completing')}...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('tasks.markAsComplete')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DynamicInventoryForm } from './DynamicInventoryForm';
import { useInventoryForm, type UseInventoryFormOptions } from '@/hooks/inventory/useInventoryForm';
import type { InventoryFormSchema } from './types/inventory-form.types';

interface InventoryTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schema: InventoryFormSchema;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  overrides?: Record<string, unknown>;
}

/**
 * Reusable dialog wrapper for any schema-driven inventory form.
 * Opens a modal with DynamicInventoryForm inside.
 */
export function InventoryTransactionDialog({
  open,
  onOpenChange,
  schema,
  onSubmit,
  overrides,
}: InventoryTransactionDialogProps) {
  const formOptions: UseInventoryFormOptions = {
    schema,
    overrides,
    onSubmit: async (data) => {
      try {
        await onSubmit(data);
        onOpenChange(false);
      } catch {
        // Keep dialog open on error — caller handles toast/notification
      }
    },
  };

  const formState = useInventoryForm(formOptions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{schema.title}</DialogTitle>
          <DialogDescription>{schema.description ?? ''}</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6">
          <DynamicInventoryForm formState={formState} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

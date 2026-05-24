import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const editItemZod = z.object({
  partNo: z.string().min(1, 'Part number is required.').max(50),
  partDescription: z.string().min(1, 'Description is required.').max(300),
  partDescriptionAr: z.string().max(300).optional(),
  groupName: z.string().min(1, 'Category / group is required.').max(100),
  uom: z.string().min(1, 'Unit of measure is required.').max(20),
  cost: z.number().min(0, 'Cost cannot be negative.'),
  minStock: z.number().int().min(0),
  maxStock: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  image: z.string().optional(),
});

export type EditItemFormData = z.infer<typeof editItemZod>;

export const editItemDefaults: EditItemFormData = {
  partNo: '',
  partDescription: '',
  partDescriptionAr: '',
  groupName: '',
  uom: 'pcs',
  cost: 0,
  minStock: 0,
  maxStock: 0,
  reorderLevel: 0,
  image: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createEditItemFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);

  return {
    id: 'edit-item',
    title: t('inventory.forms.editItem.title'),
    description: t('inventory.forms.editItem.description'),
    mode: 'edit',
    autosave: false,
    reviewRequired: false,
    submitLabel: t('inventory.forms.editItem.submit'),
    zodSchema: editItemZod,

    fields: [
      { name: 'partNo', label: f('partNo'), type: 'text', required: true },
      { name: 'groupName', label: f('groupName'), type: 'category-picker', required: true },
      { name: 'partDescription', label: f('description'), type: 'textarea', required: true, fullWidth: true },
      { name: 'partDescriptionAr', label: f('descriptionAr'), type: 'textarea', fullWidth: true },
      { name: 'uom', label: f('uom'), type: 'text', required: true },
      { name: 'cost', label: f('unitCost'), type: 'currency', min: 0, step: 0.01 },
      { name: 'minStock', label: f('minStock'), type: 'number', min: 0, advanced: true },
      { name: 'maxStock', label: f('maxStock'), type: 'number', min: 0, advanced: true },
      { name: 'reorderLevel', label: f('reorderLevel'), type: 'number', min: 0, advanced: true },
    ],
  };
}

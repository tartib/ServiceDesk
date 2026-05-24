import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const returnItemZod = z
  .object({
    itemId: z.string().min(1, 'Please select an item to return.'),
    warehouseId: z.string().min(1, 'Please select the return location.'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
    condition: z.enum(['good', 'damaged'], { message: 'Please select the item condition.' }),
    damageDescription: z.string().optional(),
    photo: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.condition !== 'damaged' || (data.damageDescription && data.damageDescription.length > 0),
    { message: 'Please describe the damage.', path: ['damageDescription'] },
  )
  .refine(
    (data) => data.condition !== 'damaged' || (data.photo && data.photo.length > 0),
    { message: 'Please upload a photo of the damaged item.', path: ['photo'] },
  );

export type ReturnItemFormData = z.infer<typeof returnItemZod>;

export const returnItemDefaults: ReturnItemFormData = {
  itemId: '',
  warehouseId: '',
  quantity: 1,
  condition: 'good',
  damageDescription: '',
  photo: '',
  notes: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createReturnItemFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);
  const s = (key: string) => t(`inventory.forms.steps.${key}`);

  return {
    id: 'return-item',
    title: t('inventory.forms.return.title'),
    description: t('inventory.forms.return.description'),
    requestType: 'stock_return',
    mode: 'create',
    autosave: false,
    reviewRequired: true,
    submitLabel: t('inventory.forms.return.submit'),
    zodSchema: returnItemZod,

    steps: [
      {
        id: 'item',
        title: s('selectItem'),
        description: s('selectItemDesc'),
        fields: [
          { name: 'itemId', label: f('item'), type: 'item-picker', required: true, fullWidth: true, helperText: f('itemHelper') },
        ],
      },
      {
        id: 'condition',
        title: s('returnDetails'),
        description: s('returnDetailsDesc'),
        fields: [
          { name: 'warehouseId', label: f('returnLocation'), type: 'warehouse-picker', required: true, helperText: f('returnLocationHelper') },
          { name: 'quantity', label: f('quantity'), type: 'quantity', required: true, min: 1 },
          {
            name: 'condition',
            label: f('condition'),
            type: 'condition-picker',
            required: true,
            fullWidth: true,
            options: [
              { label: f('conditionGood'), value: 'good' },
              { label: f('conditionDamaged'), value: 'damaged' },
            ],
          },
          {
            name: 'damageDescription',
            label: f('damageDescription'),
            type: 'textarea',
            placeholder: f('damageDescriptionPlaceholder'),
            visibleWhen: [{ field: 'condition', operator: 'eq', value: 'damaged' }],
            requiredWhen: [{ field: 'condition', operator: 'eq', value: 'damaged' }],
            fullWidth: true,
          },
          {
            name: 'photo',
            label: f('photo'),
            type: 'attachment-upload',
            accept: 'image/*',
            maxFiles: 5,
            helperText: f('photoHelper'),
            visibleWhen: [{ field: 'condition', operator: 'eq', value: 'damaged' }],
            requiredWhen: [{ field: 'condition', operator: 'eq', value: 'damaged' }],
            fullWidth: true,
          },
          { name: 'notes', label: f('notes'), type: 'textarea', advanced: true },
        ],
      },
    ],
  };
}

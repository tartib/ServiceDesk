import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const warehouseZod = z.object({
  warehouseName: z.string().min(1, 'Warehouse name is required.').max(100),
  warehouseNameAr: z.string().max(100).optional(),
  code: z.string().min(1, 'Code is required.').max(20),
  address: z.string().max(300).optional(),
});

export type WarehouseFormData = z.infer<typeof warehouseZod>;

export const warehouseDefaults: WarehouseFormData = {
  warehouseName: '',
  warehouseNameAr: '',
  code: '',
  address: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createWarehouseFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);

  return {
    id: 'warehouse',
    title: t('inventory.forms.warehouse.title'),
    description: t('inventory.forms.warehouse.description'),
    mode: 'create',
    autosave: false,
    reviewRequired: false,
    submitLabel: t('inventory.forms.warehouse.submit'),
    zodSchema: warehouseZod,

    fields: [
      { name: 'warehouseName', label: f('warehouseName'), type: 'text', required: true, placeholder: f('warehouseNamePlaceholder') },
      { name: 'warehouseNameAr', label: f('warehouseNameAr'), type: 'text', placeholder: f('warehouseNameArPlaceholder') },
      { name: 'code', label: f('code'), type: 'text', required: true, placeholder: f('codePlaceholder') },
      { name: 'address', label: f('address'), type: 'textarea', placeholder: f('addressPlaceholder'), fullWidth: true },
    ],
  };
}

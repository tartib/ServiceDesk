import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const addItemZod = z.object({
  partNo: z.string().min(1, 'Part number is required.').max(50),
  partDescription: z.string().min(1, 'Description is required.').max(300),
  partDescriptionAr: z.string().max(300).optional(),
  groupName: z.string().min(1, 'Category / group is required.').max(100),
  uom: z.string().min(1, 'Unit of measure is required.').max(20),
  inventoryType: z.enum(['asset', 'consumable'], { message: 'Choose Asset or Consumable.' }),

  // Stock
  warehouseId: z.string().min(1, 'Please select a warehouse.'),
  initialQuantity: z.number().int().min(0, 'Quantity cannot be negative.').default(0),
  cost: z.number().min(0, 'Cost cannot be negative.').default(0),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).default(0),
  reorderLevel: z.number().int().min(0).default(0),

  // Asset-specific (conditional)
  assetTag: z.string().max(50).optional(),
  serialNumber: z.string().max(100).optional(),
  ownerId: z.string().optional(),
  warrantyExpiry: z.string().optional(),

  // Consumable-specific (conditional)
  unitOfMeasure: z.string().max(20).optional(),
  minStockLevel: z.number().int().min(0).optional(),

  // Advanced / optional
  supplierId: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
});

export type AddItemFormData = z.infer<typeof addItemZod>;

export const addItemDefaults: AddItemFormData = {
  partNo: '',
  partDescription: '',
  partDescriptionAr: '',
  groupName: '',
  uom: 'pcs',
  inventoryType: 'consumable',
  warehouseId: '',
  initialQuantity: 0,
  cost: 0,
  minStock: 0,
  maxStock: 0,
  reorderLevel: 0,
  assetTag: '',
  serialNumber: '',
  ownerId: '',
  warrantyExpiry: '',
  unitOfMeasure: '',
  minStockLevel: 0,
  supplierId: '',
  purchaseDate: '',
  purchasePrice: 0,
  notes: '',
  image: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createAddItemFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);
  const s = (key: string) => t(`inventory.forms.steps.${key}`);

  return {
    id: 'add-item',
    title: t('inventory.forms.addItem.title'),
    description: t('inventory.forms.addItem.description'),
    mode: 'create',
    autosave: true,
    reviewRequired: true,
    submitLabel: t('inventory.forms.addItem.submit'),
    zodSchema: addItemZod,

    steps: [
      {
        id: 'basic',
        title: s('basicInfo'),
        description: s('basicInfoDesc'),
        fields: [
          { name: 'partNo', label: f('partNo'), type: 'text', required: true, placeholder: f('partNoPlaceholder') },
          { name: 'groupName', label: f('groupName'), type: 'category-picker', required: true },
          { name: 'partDescription', label: f('description'), type: 'textarea', required: true, fullWidth: true, placeholder: f('descriptionPlaceholder') },
          { name: 'partDescriptionAr', label: f('descriptionAr'), type: 'textarea', fullWidth: true, placeholder: f('descriptionArPlaceholder') },
          {
            name: 'inventoryType',
            label: f('inventoryType'),
            type: 'radio',
            required: true,
            fullWidth: true,
            options: [
              { label: f('inventoryTypeAsset'), value: 'asset', description: f('inventoryTypeAssetDesc') },
              { label: f('inventoryTypeConsumable'), value: 'consumable', description: f('inventoryTypeConsumableDesc') },
            ],
          },
        ],
      },
      {
        id: 'stock',
        title: s('stockLocation'),
        description: s('stockLocationDesc'),
        fields: [
          { name: 'warehouseId', label: f('warehouse'), type: 'warehouse-picker', required: true },
          { name: 'uom', label: f('uom'), type: 'text', required: true, placeholder: f('uomPlaceholder') },
          { name: 'initialQuantity', label: f('initialQuantity'), type: 'quantity', min: 0 },
          { name: 'cost', label: f('unitCost'), type: 'currency', min: 0, step: 0.01 },
          { name: 'minStock', label: f('minStock'), type: 'number', min: 0, advanced: true },
          { name: 'maxStock', label: f('maxStock'), type: 'number', min: 0, advanced: true },
          { name: 'reorderLevel', label: f('reorderLevel'), type: 'number', min: 0, advanced: true },
        ],
      },
      {
        id: 'asset-details',
        title: s('assetDetails'),
        description: s('assetDetailsDesc'),
        fields: [
          {
            name: 'assetTag',
            label: f('assetTag'),
            type: 'text',
            placeholder: f('assetTagPlaceholder'),
            visibleWhen: [{ field: 'inventoryType', operator: 'eq', value: 'asset' }],
          },
          {
            name: 'serialNumber',
            label: f('serialNumber'),
            type: 'text',
            visibleWhen: [{ field: 'inventoryType', operator: 'eq', value: 'asset' }],
          },
          {
            name: 'ownerId',
            label: f('owner'),
            type: 'user-picker',
            helperText: f('ownerHelper'),
            visibleWhen: [{ field: 'inventoryType', operator: 'eq', value: 'asset' }],
          },
          {
            name: 'warrantyExpiry',
            label: f('warrantyExpiry'),
            type: 'date',
            visibleWhen: [{ field: 'inventoryType', operator: 'eq', value: 'asset' }],
          },
          { name: 'supplierId', label: f('supplier'), type: 'text', advanced: true },
          { name: 'purchaseDate', label: f('purchaseDate'), type: 'date', advanced: true },
          { name: 'purchasePrice', label: f('purchasePrice'), type: 'currency', min: 0, step: 0.01, advanced: true },
          { name: 'notes', label: f('notes'), type: 'textarea', advanced: true, fullWidth: true },
        ],
      },
    ],
  };
}

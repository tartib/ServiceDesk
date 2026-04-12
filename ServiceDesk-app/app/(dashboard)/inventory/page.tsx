'use client';

import { useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Package, AlertTriangle, Edit, Plus } from 'lucide-react';
import { useInventory, useLowStockItems, useAdjustStock, useCreateInventoryItem } from '@/hooks/useInventory';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface InventoryItem {
 id: string;
 name: string;
 nameAr?: string;
 category: string;
 currentQuantity: number;
 unit: string;
 minThreshold: number;
 maxThreshold: number;
 status: string;
 image?: string;
}

interface StockAdjustmentData {
 itemId: string;
 quantity: number;
 movementType: string;
 reason?: string;
 notes?: string;
}

export default function InventoryPage() {
 const { t } = useLanguage();
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
 const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
 const [isAddModalOpen, setIsAddModalOpen] = useState(false);

 const { data: inventory = [], isLoading } = useInventory();
 const { data: lowStockItems = [] } = useLowStockItems();
 const adjustStockMutation = useAdjustStock();
 const createItemMutation = useCreateInventoryItem();

 const filteredInventory = inventory.filter((item: InventoryItem) =>
 item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
 item.nameAr?.includes(searchQuery) ||
 item.category?.toLowerCase().includes(searchQuery.toLowerCase())
 );

 const inStockCount = inventory.filter((item: InventoryItem) => item.status === 'in_stock').length;
 const outOfStockCount = inventory.filter((item: InventoryItem) => item.status === 'out_of_stock').length;

 const handleAdjustStock = async (data: StockAdjustmentData) => {
 try {
 await adjustStockMutation.mutateAsync(data);
 toast.success(t('inventory.messages.stockAdjusted'));
 setIsAdjustModalOpen(false);
 setSelectedItem(null);
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : t('inventory.messages.stockAdjustFailed');
 toast.error(errorMessage);
 }
 };

 const handleAddItem = async (data: {
 name: string;
 nameAr?: string;
 category: string;
 unit: string;
 currentQuantity: number;
 minThreshold: number;
 maxThreshold: number;
 supplier?: string;
 cost?: number;
 imageFile?: File;
 }) => {
 try {
 await createItemMutation.mutateAsync(data);
 toast.success(t('inventory.messages.itemAdded'));
 setIsAddModalOpen(false);
 } catch (error) {
 const errorMessage = error instanceof Error ? error.message : t('inventory.messages.itemAddFailed');
 toast.error(errorMessage);
 }
 };

 const openAdjustModal = (item: InventoryItem) => {
 setSelectedItem(item);
 setIsAdjustModalOpen(true);
 };

 const getStatusBadge = (item: InventoryItem) => {
 if (item.status === 'out_of_stock') {
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-destructive-soft text-destructive dark:text-destructive">
 <AlertTriangle className="w-3 h-3" />
 {t('inventory.status.outOfStock')}
 </span>
 );
 }
 if (item.status === 'low_stock') {
 return (
 <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-warning-soft text-warning dark:text-warning">
 <AlertTriangle className="w-3 h-3" />
 {t('inventory.status.lowStock')}
 </span>
 );
 }
 return (
 <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-success-soft text-success dark:text-success">
 {t('inventory.status.inStock')}
 </span>
 );
 };

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div>
 <h1 className="text-2xl font-bold text-foreground">{t('inventory.title')}</h1>
 <p className="text-muted-foreground mt-1">
 {t('inventory.subtitle')}
 </p>
 </div>
 <button
 onClick={() => setIsAddModalOpen(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors"
 >
 <Plus className="w-5 h-5" />
 {t('inventory.addItem')}
 </button>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
 <div className="text-2xl font-bold text-foreground">{inventory.length}</div>
 <div className="text-sm text-muted-foreground">{t('inventory.stats.totalItems')}</div>
 </div>
 <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
 <div className="text-2xl font-bold text-success">{inStockCount}</div>
 <div className="text-sm text-muted-foreground">{t('inventory.stats.inStock')}</div>
 </div>
 <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
 <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
 <div className="text-sm text-muted-foreground">{t('inventory.stats.lowStock')}</div>
 </div>
 <div className="bg-card rounded-lg p-4 shadow-sm border border-border">
 <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
 <div className="text-sm text-muted-foreground">{t('inventory.stats.outOfStock')}</div>
 </div>
 </div>

 {/* Search */}
 <div className="bg-card rounded-xl shadow-sm border border-border p-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
 <input
 type="text"
 placeholder={t('inventory.search')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
 />
 </div>
 </div>

 {/* Inventory Table */}
 <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
 {isLoading ? (
 <div className="flex items-center justify-center py-12">
 <div className="text-muted-foreground">{t('inventory.messages.loading')}</div>
 </div>
 ) : filteredInventory.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-12">
 <Package className="w-12 h-12 text-muted-foreground mb-3" />
 <div className="text-muted-foreground">{searchQuery ? t('inventory.messages.noResults') : t('inventory.messages.noItems')}</div>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead className="bg-muted">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t('inventory.table.item')}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t('inventory.table.category')}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t('inventory.table.currentStock')}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t('inventory.table.minMax')}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t('inventory.table.status')}
 </th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
 {t('inventory.table.actions')}
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredInventory.map((item: InventoryItem) => (
 <tr key={item.id} className="hover:bg-accent">
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 {item.image ? (
 <Image src={item.image} alt={item.name} width={40} height={40} className="rounded object-cover" />
 ) : (
 <Package className="w-10 h-10 text-muted-foreground p-2 bg-muted rounded" />
 )}
 <div>
 <div className="text-sm font-medium text-foreground">
 {item.name}
 </div>
 {item.nameAr && (
 <div className="text-xs text-muted-foreground">
 {item.nameAr}
 </div>
 )}
 </div>
 </div>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <span className="text-sm text-foreground">{item.category}</span>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <span className="text-sm font-semibold text-foreground">
 {item.currentQuantity} {item.unit}
 </span>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <span className="text-sm text-muted-foreground">
 {item.minThreshold} / {item.maxThreshold} {item.unit}
 </span>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 {getStatusBadge(item)}
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <button
 onClick={() => openAdjustModal(item)}
 className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-brand dark:text-brand hover:bg-brand-surface dark:hover:bg-brand-strong/20 rounded-lg transition-colors"
 >
 <Edit className="w-4 h-4" />
 {t('inventory.adjustStock')}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>

 {selectedItem && (
 <StockAdjustmentModal
 isOpen={isAdjustModalOpen}
 onClose={() => {
 setIsAdjustModalOpen(false);
 setSelectedItem(null);
 }}
 item={selectedItem}
 onAdjust={handleAdjustStock}
 isLoading={adjustStockMutation.isPending}
 />
 )}

 <AddInventoryModal
 isOpen={isAddModalOpen}
 onClose={() => setIsAddModalOpen(false)}
 onAdd={handleAddItem}
 isLoading={createItemMutation.isPending}
 />
 </DashboardLayout>
 );
}

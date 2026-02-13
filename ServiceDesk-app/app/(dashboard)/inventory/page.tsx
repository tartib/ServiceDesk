'use client';

import { useState } from 'react';
import Image from 'next/image';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Search, Package, AlertTriangle, Edit, Plus } from 'lucide-react';
import { useInventory, useLowStockItems, useAdjustStock, useCreateInventoryItem } from '@/hooks/useInventory';
import StockAdjustmentModal from '@/components/inventory/StockAdjustmentModal';
import AddInventoryModal from '@/components/inventory/AddInventoryModal';
import { useToast } from '@/components/ui/Toast';
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
  const toast = useToast();
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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
          <AlertTriangle className="w-3 h-3" />
          {t('inventory.status.outOfStock')}
        </span>
      );
    }
    if (item.status === 'low_stock') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="w-3 h-3" />
          {t('inventory.status.lowStock')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventory.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('inventory.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('inventory.addItem')}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{inventory.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.stats.totalItems')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600">{inStockCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.stats.inStock')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.stats.lowStock')}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.stats.outOfStock')}</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('inventory.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">{t('inventory.messages.loading')}</div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-3" />
              <div className="text-gray-500 dark:text-gray-400">{searchQuery ? t('inventory.messages.noResults') : t('inventory.messages.noItems')}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.table.item')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.table.category')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.table.currentStock')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.table.minMax')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.table.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {t('inventory.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredInventory.map((item: InventoryItem) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} width={40} height={40} className="rounded object-cover" />
                          ) : (
                            <Package className="w-10 h-10 text-gray-400 p-2 bg-gray-100 dark:bg-gray-700 rounded" />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </div>
                            {item.nameAr && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.nameAr}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">{item.category}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.currentQuantity} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {item.minThreshold} / {item.maxThreshold} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
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

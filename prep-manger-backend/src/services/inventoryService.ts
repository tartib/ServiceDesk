import Inventory, { IInventory } from '../models/Inventory';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

export const getAllInventory = async (category?: string): Promise<IInventory[]> => {
  const query: any = {};
  
  if (category) {
    query.category = category;
  }

  return await Inventory.find(query).sort({ name: 1 });
};

export const getInventoryById = async (id: string): Promise<IInventory> => {
  const item = await Inventory.findById(id);
  
  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }
  
  return item;
};

export const createInventoryItem = async (data: Partial<IInventory>): Promise<IInventory> => {
  const item = await Inventory.create(data);
  
  logger.info(`Inventory item created: ${item.name}`);
  
  return item;
};

export const updateInventory = async (
  id: string,
  updateData: Partial<IInventory>
): Promise<IInventory> => {
  const item = await Inventory.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  logger.info(`Inventory updated: ${item.name} - Quantity: ${item.currentQuantity}${item.unit}`);

  return item;
};

export const restockInventory = async (
  id: string,
  quantity: number
): Promise<IInventory> => {
  const item = await Inventory.findById(id);

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  item.currentQuantity += quantity;
  item.lastRestocked = new Date();
  await item.save();

  logger.info(`Inventory restocked: ${item.name} +${quantity}${item.unit}`);

  return item;
};

export const getLowStockItems = async (): Promise<IInventory[]> => {
  return await Inventory.find({
    $or: [
      { $expr: { $lte: ['$currentQuantity', '$minThreshold'] } },
      { status: 'low_stock' },
      { status: 'out_of_stock' },
    ],
  }).sort({ currentQuantity: 1 });
};

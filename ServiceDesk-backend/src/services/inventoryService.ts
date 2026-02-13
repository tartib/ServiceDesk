import Inventory, { IInventory } from '../models/Inventory';
import StockHistory, { StockMovementType } from '../models/StockHistory';
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

export const adjustStock = async (
  id: string,
  quantity: number,
  movementType: StockMovementType,
  userId: string,
  reason?: string,
  notes?: string
): Promise<IInventory> => {
  const item = await Inventory.findById(id);

  if (!item) {
    throw new ApiError(404, 'Inventory item not found');
  }

  const previousQuantity = item.currentQuantity;
  let newQuantity: number;

  if (movementType === StockMovementType.ADJUSTMENT_ADD || movementType === StockMovementType.RESTOCK) {
    newQuantity = previousQuantity + Math.abs(quantity);
  } else {
    newQuantity = previousQuantity - Math.abs(quantity);
    if (newQuantity < 0) {
      throw new ApiError(400, 'Insufficient stock quantity');
    }
  }

  item.currentQuantity = newQuantity;
  if (movementType === StockMovementType.RESTOCK) {
    item.lastRestocked = new Date();
  }
  await item.save();

  await StockHistory.create({
    inventoryItem: item._id,
    movementType,
    quantity: Math.abs(quantity),
    previousQuantity,
    newQuantity,
    reason,
    performedBy: userId,
    notes,
  });

  logger.info(`Stock adjusted: ${item.name} - ${movementType} ${Math.abs(quantity)}${item.unit} by user ${userId}`);

  return item;
};

export const getStockHistory = async (itemId: string): Promise<any[]> => {
  return await StockHistory.find({ inventoryItem: itemId })
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(50);
};

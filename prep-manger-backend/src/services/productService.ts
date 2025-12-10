import Product, { IProduct } from '../models/Product';
import PrepTask from '../models/PrepTask';
import { TaskStatus } from '../types';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

export const createProduct = async (productData: Partial<IProduct>): Promise<IProduct> => {
  const product = await Product.create(productData);
  
  // Create the first prep task for this product
  await createInitialPrepTask(product);
  
  logger.info(`Product created: ${product.name} (ID: ${product._id})`);
  
  return product;
};

export const createInitialPrepTask = async (product: IProduct): Promise<void> => {
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + product.prepIntervalHours);

  const dueAt = new Date(scheduledAt);
  dueAt.setMinutes(dueAt.getMinutes() + product.prepTimeMinutes);

  await PrepTask.create({
    productId: product._id,
    productName: product.name,
    status: TaskStatus.SCHEDULED,
    taskType: 'daily_recurring',
    scheduledAt,
    dueAt,
    prepTimeMinutes: product.prepTimeMinutes,
    estimatedDuration: product.prepTimeMinutes,
  });

  logger.info(`Initial prep task created for product: ${product.name}`);
};

export const getAllProducts = async (filters: {
  isActive?: boolean;
  category?: string;
}): Promise<IProduct[]> => {
  const query: any = {};
  
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }
  
  if (filters.category) {
    query.category = filters.category;
  }

  return await Product.find(query).sort({ name: 1 });
};

export const getProductById = async (id: string): Promise<IProduct> => {
  const product = await Product.findById(id);
  
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  
  return product;
};

export const updateProduct = async (
  id: string,
  updateData: Partial<IProduct>
): Promise<IProduct> => {
  const product = await Product.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  logger.info(`Product updated: ${product.name} (ID: ${product._id})`);

  return product;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const product = await Product.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  logger.info(`Product deactivated: ${product.name} (ID: ${product._id})`);
};

export const hardDeleteProduct = async (id: string): Promise<void> => {
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Delete all related prep tasks
  await PrepTask.deleteMany({ productId: id });

  logger.info(`Product permanently deleted: ${product.name} (ID: ${product._id})`);
};

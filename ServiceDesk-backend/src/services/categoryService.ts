import Category, { ICategory } from '../models/Category';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

export const createCategory = async (categoryData: Partial<ICategory>): Promise<ICategory> => {
  try {
    const category = await Category.create(categoryData);
    
    logger.info(`Category created: ${category.name} (ID: ${category._id})`);
    
    return category;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new ApiError(409, `Category with name '${categoryData.name}' already exists`);
    }
    throw error;
  }
};

export const getAllCategories = async (filters: {
  isActive?: boolean;
}): Promise<ICategory[]> => {
  const query: any = {};
  
  if (filters.isActive !== undefined) {
    query.isActive = filters.isActive;
  }

  return await Category.find(query).sort({ name: 1 });
};

export const getCategoryById = async (id: string): Promise<ICategory> => {
  const category = await Category.findById(id);
  
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  
  return category;
};

export const updateCategory = async (
  id: string,
  updateData: Partial<ICategory>
): Promise<ICategory> => {
  const category = await Category.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  logger.info(`Category updated: ${category.name} (ID: ${category._id})`);

  return category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const category = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  logger.info(`Category deactivated: ${category.name} (ID: ${category._id})`);
};

export const hardDeleteCategory = async (id: string): Promise<void> => {
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  logger.info(`Category permanently deleted: ${category.name} (ID: ${category._id})`);
};

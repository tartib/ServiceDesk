import { Request, Response } from 'express';
import * as categoryService from '../services/categoryService';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, nameAr, description } = req.body;

  if (!name) {
    throw new ApiError(400, 'Category name is required');
  }

  const category = await categoryService.createCategory({
    name,
    nameAr,
    description,
  });

  res.status(201).json(new ApiResponse(201, 'Category created successfully', { category }));
});

export const getAllCategories = asyncHandler(async (req: Request, res: Response) => {
  const { isActive } = req.query;

  const filters = {
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
  };

  const categories = await categoryService.getAllCategories(filters);

  res.status(200).json(
    new ApiResponse(200, 'Categories retrieved successfully', {
      count: categories.length,
      categories,
    })
  );
});

export const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Category retrieved successfully', { category }));
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  res.status(200).json(new ApiResponse(200, 'Category updated successfully', { category }));
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.deleteCategory(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Category deactivated successfully'));
});

export const hardDeleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.hardDeleteCategory(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Category permanently deleted'));
});

import { Request, Response } from 'express';
import * as productService from '../services/productService';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import { getImageUrl, deleteImage } from '../middleware/upload';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, nameAr, description, category, prepTimeMinutes, prepIntervalHours, ingredients } =
    req.body;

  // Validate required fields
  if (!name || !category || !prepTimeMinutes || !prepIntervalHours) {
    throw new ApiError(400, 'Missing required fields');
  }

  // Handle image upload
  let image: string | undefined;
  if (req.file) {
    image = getImageUrl(req.file.filename);
  }

  // Parse ingredients if sent as JSON string (multipart/form-data)
  let parsedIngredients = ingredients;
  if (typeof ingredients === 'string') {
    try {
      parsedIngredients = JSON.parse(ingredients);
    } catch {
      throw new ApiError(400, 'Invalid ingredients format');
    }
  }

  const product = await productService.createProduct({
    name,
    nameAr,
    description,
    category,
    image,
    prepTimeMinutes: Number(prepTimeMinutes),
    prepIntervalHours: Number(prepIntervalHours),
    ingredients: parsedIngredients,
  });

  res.status(201).json(new ApiResponse(201, 'Product created successfully', { product }));
});

export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const { isActive, category } = req.query;

  const filters = {
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    category: category as string,
  };

  const products = await productService.getAllProducts(filters);

  res.status(200).json(
    new ApiResponse(200, 'Products retrieved successfully', {
      count: products.length,
      products,
    })
  );
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Product retrieved successfully', { product }));
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const updateData = { ...req.body };

  // Handle image upload
  if (req.file) {
    // Get existing product to delete old image
    const existingProduct = await productService.getProductById(req.params.id);
    if (existingProduct.image) {
      deleteImage(existingProduct.image);
    }
    updateData.image = getImageUrl(req.file.filename);
  }

  // Parse ingredients if sent as JSON string (multipart/form-data)
  if (typeof updateData.ingredients === 'string') {
    try {
      updateData.ingredients = JSON.parse(updateData.ingredients);
    } catch {
      throw new ApiError(400, 'Invalid ingredients format');
    }
  }

  // Convert numeric fields
  if (updateData.prepTimeMinutes) {
    updateData.prepTimeMinutes = Number(updateData.prepTimeMinutes);
  }
  if (updateData.prepIntervalHours) {
    updateData.prepIntervalHours = Number(updateData.prepIntervalHours);
  }

  const product = await productService.updateProduct(req.params.id, updateData);

  res.status(200).json(new ApiResponse(200, 'Product updated successfully', { product }));
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.deleteProduct(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Product deactivated successfully'));
});

export const hardDeleteProduct = asyncHandler(async (req: Request, res: Response) => {
  await productService.hardDeleteProduct(req.params.id);

  res.status(200).json(new ApiResponse(200, 'Product permanently deleted'));
});

import { Request, Response } from 'express';
import BrandSettings from '../../../models/BrandSettings';
import ApiResponse from '../../../utils/ApiResponse';
import asyncHandler from '../../../utils/asyncHandler';

export const getBrandSettings = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    res.status(400).json(new ApiResponse(400, 'Organization context required'));
    return;
  }

  const settings = await BrandSettings.findOne({ organizationId });

  res.status(200).json(
    new ApiResponse(200, 'Brand settings retrieved', {
      brandKit: settings?.brandKit ?? {
        brandName: '',
        logoUrl: '',
        faviconUrl: '',
        primaryColor: '#6161FF',
        accentColor: '#00CA72',
      },
      themeOverrides: settings?.themeOverrides ?? {},
    }),
  );
});

export const saveBrandSettings = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    res.status(400).json(new ApiResponse(400, 'Organization context required'));
    return;
  }

  const { brandKit, themeOverrides } = req.body;

  const settings = await BrandSettings.findOneAndUpdate(
    { organizationId },
    {
      $set: {
        ...(brandKit && { brandKit }),
        ...(themeOverrides !== undefined && { themeOverrides }),
        updatedBy: req.user!.id,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  res.status(200).json(
    new ApiResponse(200, 'Brand settings saved', {
      brandKit: settings.brandKit,
      themeOverrides: settings.themeOverrides,
    }),
  );
});

export const resetBrandSettings = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    res.status(400).json(new ApiResponse(400, 'Organization context required'));
    return;
  }

  await BrandSettings.findOneAndDelete({ organizationId });

  res.status(200).json(new ApiResponse(200, 'Brand settings reset to defaults'));
});

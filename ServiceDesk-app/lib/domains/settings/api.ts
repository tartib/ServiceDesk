/**
 * Settings Domain — Brand Settings API
 */

import api from '@/lib/axios';

export interface BrandKit {
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
}

export interface BrandSettingsData {
  brandKit: BrandKit;
  themeOverrides: Record<string, string>;
}

interface RawResponse {
  data?: BrandSettingsData;
  brandKit?: BrandKit;
  themeOverrides?: Record<string, string>;
}

const DEFAULT_BRAND_KIT: BrandKit = {
  brandName: '',
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#6161FF',
  accentColor: '#00CA72',
};

export const brandSettingsApi = {
  get: async (): Promise<BrandSettingsData> => {
    const raw = await api.get<RawResponse>('/core/brand-settings');
    const data = raw?.data ?? raw;
    return {
      brandKit: data?.brandKit ?? DEFAULT_BRAND_KIT,
      themeOverrides: data?.themeOverrides ?? {},
    };
  },

  save: async (payload: BrandSettingsData): Promise<BrandSettingsData> => {
    const raw = await api.put<RawResponse>('/core/brand-settings', payload);
    const data = raw?.data ?? raw;
    return {
      brandKit: data?.brandKit ?? payload.brandKit,
      themeOverrides: data?.themeOverrides ?? payload.themeOverrides,
    };
  },

  reset: async (): Promise<void> => {
    await api.delete('/core/brand-settings');
  },
};

export { DEFAULT_BRAND_KIT };

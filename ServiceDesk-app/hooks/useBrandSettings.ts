import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandSettingsApi, BrandSettingsData, DEFAULT_BRAND_KIT } from '@/lib/domains/settings/api';

const BRAND_SETTINGS_KEY = ['brand-settings'] as const;

export function useBrandSettings() {
  return useQuery<BrandSettingsData>({
    queryKey: BRAND_SETTINGS_KEY,
    queryFn: brandSettingsApi.get,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useSaveBrandSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BrandSettingsData) => brandSettingsApi.save(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(BRAND_SETTINGS_KEY, data);
      // Write-through to localStorage as offline fallback
      try {
        localStorage.setItem('brandKit', JSON.stringify(data.brandKit));
        localStorage.setItem('themeOverrides', JSON.stringify(data.themeOverrides));
      } catch {}
    },
  });
}

export function useResetBrandSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => brandSettingsApi.reset(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_SETTINGS_KEY });
      try {
        localStorage.removeItem('brandKit');
        localStorage.removeItem('themeOverrides');
      } catch {}
    },
  });
}

export function useBrandName(): string {
  const { data } = useBrandSettings();
  if (data?.brandKit?.brandName) return data.brandKit.brandName;
  try {
    const stored = localStorage.getItem('brandKit');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.brandName) return parsed.brandName;
    }
  } catch {}
  return DEFAULT_BRAND_KIT.brandName;
}

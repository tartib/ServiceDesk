'use client';

import { useEffect } from 'react';
import { useBrandName } from '@/hooks/useBrandSettings';

export default function BrandTitleSync() {
  const brandName = useBrandName();

  useEffect(() => {
    if (brandName) {
      document.title = `${brandName} - IT Service Management`;
    }
  }, [brandName]);

  return null;
}

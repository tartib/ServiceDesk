export interface PublicHoliday {
  id: string;
  nameEn: string;
  nameAr: string;
  startDate: string;
  endDate: string;
  year: number;
}

// Saudi Arabia Official Public Holidays
// Islamic holidays (Eid Al-Fitr, Eid Al-Adha) shift each year based on Hijri calendar
// Dates are based on official government announcements

export const SAUDI_PUBLIC_HOLIDAYS: PublicHoliday[] = [
  // ──────────── 2025 ────────────
  {
    id: 'founding-day-2025',
    nameEn: 'Founding Day',
    nameAr: 'يوم التأسيس',
    startDate: '2025-02-22',
    endDate: '2025-02-22',
    year: 2025,
  },
  {
    id: 'eid-al-fitr-2025',
    nameEn: 'Eid Al-Fitr',
    nameAr: 'عيد الفطر',
    startDate: '2025-03-30',
    endDate: '2025-04-03',
    year: 2025,
  },
  {
    id: 'arafat-eid-adha-2025',
    nameEn: 'Arafat Day & Eid Al-Adha',
    nameAr: 'يوم عرفة وعيد الأضحى',
    startDate: '2025-06-05',
    endDate: '2025-06-09',
    year: 2025,
  },
  {
    id: 'national-day-2025',
    nameEn: 'Saudi National Day',
    nameAr: 'اليوم الوطني السعودي',
    startDate: '2025-09-23',
    endDate: '2025-09-23',
    year: 2025,
  },

  // ──────────── 2026 ────────────
  {
    id: 'founding-day-2026',
    nameEn: 'Founding Day',
    nameAr: 'يوم التأسيس',
    startDate: '2026-02-22',
    endDate: '2026-02-22',
    year: 2026,
  },
  {
    id: 'eid-al-fitr-2026',
    nameEn: 'Eid Al-Fitr',
    nameAr: 'عيد الفطر',
    startDate: '2026-03-19',
    endDate: '2026-03-23',
    year: 2026,
  },
  {
    id: 'arafat-eid-adha-2026',
    nameEn: 'Arafat Day & Eid Al-Adha',
    nameAr: 'يوم عرفة وعيد الأضحى',
    startDate: '2026-05-26',
    endDate: '2026-05-30',
    year: 2026,
  },
  {
    id: 'national-day-2026',
    nameEn: 'Saudi National Day',
    nameAr: 'اليوم الوطني السعودي',
    startDate: '2026-09-23',
    endDate: '2026-09-23',
    year: 2026,
  },

  // ──────────── 2027 ────────────
  {
    id: 'founding-day-2027',
    nameEn: 'Founding Day',
    nameAr: 'يوم التأسيس',
    startDate: '2027-02-22',
    endDate: '2027-02-22',
    year: 2027,
  },
  {
    id: 'eid-al-fitr-2027',
    nameEn: 'Eid Al-Fitr',
    nameAr: 'عيد الفطر',
    startDate: '2027-03-09',
    endDate: '2027-03-13',
    year: 2027,
  },
  {
    id: 'arafat-eid-adha-2027',
    nameEn: 'Arafat Day & Eid Al-Adha',
    nameAr: 'يوم عرفة وعيد الأضحى',
    startDate: '2027-05-15',
    endDate: '2027-05-19',
    year: 2027,
  },
  {
    id: 'national-day-2027',
    nameEn: 'Saudi National Day',
    nameAr: 'اليوم الوطني السعودي',
    startDate: '2027-09-23',
    endDate: '2027-09-23',
    year: 2027,
  },
];

/**
 * Get public holidays that overlap with a given date range
 */
export function getHolidaysInRange(startDate: string, endDate: string): PublicHoliday[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return SAUDI_PUBLIC_HOLIDAYS.filter((h) => {
    const hStart = new Date(h.startDate);
    const hEnd = new Date(h.endDate);
    return hStart <= end && hEnd >= start;
  });
}

/**
 * Check if a specific date falls on a public holiday
 */
export function isPublicHoliday(dateStr: string): PublicHoliday | undefined {
  const date = new Date(dateStr);
  return SAUDI_PUBLIC_HOLIDAYS.find((h) => {
    const hStart = new Date(h.startDate);
    const hEnd = new Date(h.endDate);
    return date >= hStart && date <= hEnd;
  });
}

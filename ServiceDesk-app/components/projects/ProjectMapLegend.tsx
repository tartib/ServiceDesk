'use client';

import { useLanguage } from '@/contexts/LanguageContext';

const EDGE_TYPES = [
  { type: 'parent', label: 'Parent → Child', color: '#6366f1', style: 'solid' },
  { type: 'depends_on', label: 'Depends On', color: '#f59e0b', style: 'dashed' },
  { type: 'blocked_by', label: 'Blocked By', color: '#ef4444', style: 'dashed' },
  { type: 'related_to', label: 'Related', color: '#9ca3af', style: 'dotted' },
];

export default function ProjectMapLegend() {
  const { t } = useLanguage();

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {t('projects.map.legend') || 'Legend'}
      </p>
      <div className="flex flex-col gap-1">
        {EDGE_TYPES.map((e) => (
          <div key={e.type} className="flex items-center gap-2">
            <svg width="24" height="8" className="flex-shrink-0">
              <line
                x1="0" y1="4" x2="24" y2="4"
                stroke={e.color}
                strokeWidth="2"
                strokeDasharray={
                  e.style === 'dashed' ? '4,3' : e.style === 'dotted' ? '2,2' : 'none'
                }
              />
            </svg>
            <span className="text-[10px] text-gray-600">{e.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

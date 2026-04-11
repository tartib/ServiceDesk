'use client';

import { Maximize, ZoomIn, ZoomOut, ArrowDownUp, ArrowLeftRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProjectMapToolbarProps {
  onFitView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  orientation: 'TB' | 'LR';
  onToggleOrientation: () => void;
}

export default function ProjectMapToolbar({
  onFitView,
  onZoomIn,
  onZoomOut,
  orientation,
  onToggleOrientation,
}: ProjectMapToolbarProps) {
  const { t } = useLanguage();

  const buttons = [
    { icon: <ZoomIn className="h-4 w-4" />, onClick: onZoomIn, title: t('common.zoomIn') || 'Zoom In' },
    { icon: <ZoomOut className="h-4 w-4" />, onClick: onZoomOut, title: t('common.zoomOut') || 'Zoom Out' },
    { icon: <Maximize className="h-4 w-4" />, onClick: onFitView, title: t('common.fitView') || 'Fit to Screen' },
    {
      icon: orientation === 'TB'
        ? <ArrowLeftRight className="h-4 w-4" />
        : <ArrowDownUp className="h-4 w-4" />,
      onClick: onToggleOrientation,
      title: orientation === 'TB'
        ? (t('projects.map.horizontal') || 'Horizontal Layout')
        : (t('projects.map.vertical') || 'Vertical Layout'),
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 py-1 shadow-sm">
      {buttons.map((btn, i) => (
        <button
          key={i}
          onClick={btn.onClick}
          title={btn.title}
          className="p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
}

'use client';

import {
 ChevronRight,
 ChevronLeft,
 MoreHorizontal,
 ZoomIn,
 ZoomOut,
} from 'lucide-react';
import type { ZoomLevel } from './types';

interface RoadmapFooterProps {
 zoomLevel: ZoomLevel;
 onZoomChange: (zoom: ZoomLevel) => void;
 t: (key: string) => string;
}

export function RoadmapFooter({ zoomLevel, onZoomChange, t }: RoadmapFooterProps) {
 return (
 <div className="bg-background border-t border-border px-4 py-2">
 <div className="flex items-center justify-between">
 {/* Left: Navigation */}
 <div className="flex items-center gap-2">
 <button 
 aria-label="Previous period"
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
 >
 <ChevronLeft className="h-4 w-4" />
 </button>
 <button className="px-3 py-1 text-sm text-brand font-medium hover:bg-brand-surface rounded transition-colors">
 Today
 </button>
 <button 
 aria-label="Next period"
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
 >
 <ChevronRight className="h-4 w-4" />
 </button>
 </div>

 {/* Center: Zoom Level */}
 <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
 <button 
 aria-label="Zoom out"
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors"
 >
 <ZoomOut className="h-4 w-4" />
 </button>
 <button 
 className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'day' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
 onClick={() => onZoomChange('day')}
 >
 {t('roadmap.zoom.days')}
 </button>
 <button 
 className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'week' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
 onClick={() => onZoomChange('week')}
 >
 {t('roadmap.zoom.weeks')}
 </button>
 <button 
 className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
 onClick={() => onZoomChange('month')}
 >
 {t('roadmap.zoom.months')}
 </button>
 <button 
 className={`px-3 py-1 text-sm rounded transition-colors ${zoomLevel === 'quarter' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
 onClick={() => onZoomChange('quarter')}
 >
 {t('roadmap.zoom.quarters')}
 </button>
 <button 
 aria-label="Zoom in"
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors"
 >
 <ZoomIn className="h-4 w-4" />
 </button>
 </div>

 {/* Right: More options */}
 <div className="flex items-center gap-2">
 <button 
 aria-label="More options"
 aria-haspopup="menu"
 className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 </div>
 </div>
 </div>
 );
}

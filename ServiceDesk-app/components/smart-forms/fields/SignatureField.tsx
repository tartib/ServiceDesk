'use client';

/**
 * SignatureField Component - مكون حقل التوقيع
 * Smart Forms System
 */

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField } from '@/types/smart-forms';
import { Eraser } from 'lucide-react';

interface SignatureFieldProps {
  field: RenderedField;
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
}

export default function SignatureField({
  field,
  value,
  onChange,
  error,
  disabled,
  locale = 'en',
}: SignatureFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const label = locale === 'ar' ? field.label_ar : field.label;
  const helpText = locale === 'ar' ? field.help_text_ar : field.help_text;
  const isRequired = field.state?.required || field.validation?.required;
  const isDisabled = disabled || field.state?.disabled;

  const width = (field.settings?.width as number) || 400;
  const height = (field.settings?.height as number) || 200;
  const penColor = (field.settings?.pen_color as string) || '#000000';
  const backgroundColor = (field.settings?.background_color as string) || '#ffffff';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Load existing signature
    if (value) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value, width, height, backgroundColor]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDisabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isDisabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      const dataUrl = canvas.toDataURL('image/png');
      onChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className={cn('space-y-2', field.display?.css_class)}>
      <div className="flex items-center justify-between">
        <Label
          className={cn(
            'text-sm font-medium',
            isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
          )}
        >
          {label}
        </Label>
        {hasSignature && !isDisabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSignature}
          >
            <Eraser className="h-4 w-4 mr-1" />
            {locale === 'ar' ? 'مسح' : 'Clear'}
          </Button>
        )}
      </div>

      <div
        className={cn(
          'border rounded-lg overflow-hidden',
          error && 'border-red-500',
          isDisabled && 'opacity-50'
        )}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={cn(
            'touch-none',
            !isDisabled && 'cursor-crosshair'
          )}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {locale === 'ar' 
          ? 'استخدم الماوس أو اللمس للتوقيع'
          : 'Use mouse or touch to sign'
        }
      </p>

      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

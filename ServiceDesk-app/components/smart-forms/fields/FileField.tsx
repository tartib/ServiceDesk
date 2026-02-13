'use client';

/**
 * FileField Component - مكون حقل الملفات
 * Smart Forms System
 */

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RenderedField, Attachment } from '@/types/smart-forms';
import { Upload, X, File, Image } from 'lucide-react';

interface FileFieldProps {
  field: RenderedField;
  value: Attachment[];
  onChange: (value: Attachment[]) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  locale?: 'en' | 'ar';
  onUpload?: (files: File[]) => Promise<Attachment[]>;
}

export default function FileField({
  field,
  value = [],
  onChange,
  error,
  disabled,
  locale = 'en',
  onUpload,
}: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const label = locale === 'ar' ? field.label_ar : field.label;
  const helpText = locale === 'ar' ? field.help_text_ar : field.help_text;
  const isRequired = field.state?.required || field.validation?.required;
  const isDisabled = disabled || field.state?.disabled;
  const isMultiple = field.type === 'multi_file';
  const isImage = field.type === 'image';
  
  const maxFiles = (field.settings?.max_files as number) || 10;
  const maxSize = (field.settings?.max_file_size_mb as number) || 10;
  const allowedTypes = (field.settings?.allowed_file_types as string[]) || [];

  const accept = isImage 
    ? 'image/*' 
    : allowedTypes.length > 0 
      ? allowedTypes.map(t => `.${t}`).join(',')
      : undefined;

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file count
    if (value.length + files.length > maxFiles) {
      alert(locale === 'ar' 
        ? `الحد الأقصى للملفات هو ${maxFiles}` 
        : `Maximum ${maxFiles} files allowed`
      );
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(f => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(locale === 'ar'
        ? `حجم الملف يجب أن يكون أقل من ${maxSize} ميجابايت`
        : `File size must be less than ${maxSize}MB`
      );
      return;
    }

    if (onUpload) {
      setUploading(true);
      try {
        const uploaded = await onUpload(files);
        onChange([...value, ...uploaded]);
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setUploading(false);
      }
    } else {
      // Create temporary attachments for preview
      const newAttachments: Attachment[] = files.map((file, index) => ({
        attachment_id: `temp-${Date.now()}-${index}`,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: URL.createObjectURL(file),
        uploaded_by: 'current_user',
        uploaded_at: new Date().toISOString(),
      }));
      onChange([...value, ...newAttachments]);
    }

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (attachmentId: string) => {
    onChange(value.filter(a => a.attachment_id !== attachmentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-2', field.display?.css_class)}>
      <Label
        className={cn(
          'text-sm font-medium',
          isRequired && "after:content-['*'] after:ml-0.5 after:text-red-500"
        )}
      >
        {label}
      </Label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={isMultiple}
        onChange={handleChange}
        disabled={isDisabled || uploading}
        className="hidden"
      />

      <div
        onClick={!isDisabled && !uploading ? handleClick : undefined}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          'hover:border-primary hover:bg-primary/5',
          isDisabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500'
        )}
      >
        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {uploading
              ? (locale === 'ar' ? 'جاري الرفع...' : 'Uploading...')
              : (locale === 'ar' 
                  ? 'اضغط لاختيار ملف أو اسحب وأفلت هنا'
                  : 'Click to select or drag and drop'
                )
            }
          </p>
          {allowedTypes.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {locale === 'ar' ? 'الأنواع المسموحة:' : 'Allowed:'} {allowedTypes.join(', ')}
            </p>
          )}
        </div>
      </div>

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((attachment) => (
            <div
              key={attachment.attachment_id}
              className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50"
            >
              {isImage && attachment.file_type.startsWith('image/') ? (
                <Image className="h-5 w-5 text-muted-foreground" />
              ) : (
                <File className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>
              {!isDisabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(attachment.attachment_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

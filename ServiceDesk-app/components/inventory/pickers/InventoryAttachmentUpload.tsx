'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileIcon, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
}

interface InventoryAttachmentUploadProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number;
  disabled?: boolean;
  className?: string;
  helperText?: string;
}

/**
 * Drag-and-drop file upload zone with preview.
 * In Phase 5 this will upload to `/inventory/attachments`.
 * Currently stores files as data URLs for local preview.
 */
export function InventoryAttachmentUpload({
  value,
  onChange,
  accept = 'image/*,.pdf',
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024,
  disabled,
  className,
  helperText,
}: InventoryAttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const files: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);

      const currentCount = files.length;
      const remainingSlots = maxFiles - currentCount;

      if (remainingSlots <= 0) {
        setError(`Maximum ${maxFiles} files allowed.`);
        return;
      }

      const newFiles: string[] = [];
      const filesToProcess = Array.from(fileList).slice(0, remainingSlots);

      for (const file of filesToProcess) {
        if (file.size > maxFileSize) {
          setError(`${file.name} exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit.`);
          continue;
        }
        // For now store file name; in Phase 5 this will be replaced with actual upload
        newFiles.push(file.name);
      }

      if (newFiles.length > 0) {
        const updated = [...files, ...newFiles];
        onChange(maxFiles === 1 ? updated[0] : updated);
      }
    },
    [files, maxFiles, maxFileSize, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled) handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles],
  );

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(maxFiles === 1 ? (updated[0] || '') : updated);
    setError(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-brand bg-brand/5'
            : 'border-input hover:border-muted-foreground/50',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1.5" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or <span className="text-brand font-medium">click to upload</span>
            </p>
            {helperText && <p className="text-xs text-muted-foreground mt-1">{helperText}</p>}
            <p className="text-xs text-muted-foreground mt-0.5">
              Max {maxFiles} file{maxFiles > 1 ? 's' : ''} · {Math.round(maxFileSize / 1024 / 1024)}MB each
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div
              key={`${file}-${index}`}
              className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-2.5 py-1.5"
            >
              <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate flex-1 text-foreground">{file}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-0.5 hover:bg-muted rounded shrink-0"
                aria-label={`Remove ${file}`}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

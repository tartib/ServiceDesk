'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Image,
  CheckSquare,
  AlertCircle,
  Info,
  Lightbulb,
  FileCode,
  Eye,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WikiEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  minHeight?: string;
  locale?: string;
}

interface ToolbarButton {
  icon: React.ElementType;
  label: string;
  action: () => void;
  shortcut?: string;
}

export function WikiEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  dir = 'ltr',
  minHeight = '400px',
  locale = 'en',
}: WikiEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || placeholder;
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    
    const newText = value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }, [value, onChange]);

  const insertBlock = useCallback((block: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const beforeText = value.substring(0, start);
    const afterText = value.substring(start);
    
    // Add newlines if needed
    const needsNewlineBefore = beforeText.length > 0 && !beforeText.endsWith('\n\n');
    const prefix = needsNewlineBefore ? (beforeText.endsWith('\n') ? '\n' : '\n\n') : '';
    
    const newText = beforeText + prefix + block + '\n\n' + afterText;
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const toolbarGroups: { label: string; buttons: ToolbarButton[] }[] = [
    {
      label: 'Text',
      buttons: [
        { icon: Bold, label: locale === 'ar' ? 'عريض' : 'Bold', action: () => insertText('**', '**', 'bold text'), shortcut: 'Ctrl+B' },
        { icon: Italic, label: locale === 'ar' ? 'مائل' : 'Italic', action: () => insertText('*', '*', 'italic text'), shortcut: 'Ctrl+I' },
        { icon: Strikethrough, label: locale === 'ar' ? 'يتوسطه خط' : 'Strikethrough', action: () => insertText('~~', '~~', 'strikethrough') },
        { icon: Code, label: locale === 'ar' ? 'كود' : 'Inline Code', action: () => insertText('`', '`', 'code') },
      ],
    },
    {
      label: 'Headings',
      buttons: [
        { icon: Heading1, label: 'H1', action: () => insertAtLineStart('# ') },
        { icon: Heading2, label: 'H2', action: () => insertAtLineStart('## ') },
        { icon: Heading3, label: 'H3', action: () => insertAtLineStart('### ') },
      ],
    },
    {
      label: 'Lists',
      buttons: [
        { icon: List, label: locale === 'ar' ? 'قائمة' : 'Bullet List', action: () => insertAtLineStart('- ') },
        { icon: ListOrdered, label: locale === 'ar' ? 'قائمة مرقمة' : 'Numbered List', action: () => insertAtLineStart('1. ') },
        { icon: CheckSquare, label: locale === 'ar' ? 'مهام' : 'Task List', action: () => insertAtLineStart('- [ ] ') },
      ],
    },
    {
      label: 'Blocks',
      buttons: [
        { icon: Quote, label: locale === 'ar' ? 'اقتباس' : 'Quote', action: () => insertAtLineStart('> ') },
        { icon: FileCode, label: locale === 'ar' ? 'كود' : 'Code Block', action: () => insertBlock('```javascript\n// Your code here\n```') },
        { icon: Table, label: locale === 'ar' ? 'جدول' : 'Table', action: () => insertBlock('| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |') },
      ],
    },
    {
      label: 'Links',
      buttons: [
        { icon: Link, label: locale === 'ar' ? 'رابط' : 'Link', action: () => insertText('[', '](https://)', 'link text') },
        { icon: Image, label: locale === 'ar' ? 'صورة' : 'Image', action: () => insertText('![', '](image-url)', 'alt text') },
      ],
    },
    {
      label: 'Callouts',
      buttons: [
        { icon: Info, label: locale === 'ar' ? 'معلومة' : 'Info', action: () => insertBlock(':::info\nYour information here\n:::') },
        { icon: AlertCircle, label: locale === 'ar' ? 'تحذير' : 'Warning', action: () => insertBlock(':::warning\nWarning message here\n:::') },
        { icon: Lightbulb, label: locale === 'ar' ? 'نصيحة' : 'Tip', action: () => insertBlock(':::tip\nHelpful tip here\n:::') },
      ],
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          insertText('**', '**', 'bold text');
          break;
        case 'i':
          e.preventDefault();
          insertText('*', '*', 'italic text');
          break;
        case 'k':
          e.preventDefault();
          insertText('[', '](https://)', 'link text');
          break;
      }
    }
    
    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertText('  ', '');
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
        {toolbarGroups.map((group, groupIndex) => (
          <React.Fragment key={group.label}>
            {groupIndex > 0 && <div className="w-px h-6 bg-border mx-1 self-center" />}
            <div className="flex gap-0.5">
              {group.buttons.map((button) => (
                <Button
                  key={button.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={button.action}
                  title={button.shortcut ? `${button.label} (${button.shortcut})` : button.label}
                >
                  <button.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </React.Fragment>
        ))}
        
        {/* View Toggle */}
        <div className="ml-auto flex gap-1">
          <Button
            type="button"
            variant={activeTab === 'edit' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3"
            onClick={() => setActiveTab('edit')}
          >
            <Edit3 className="h-4 w-4 mr-1" />
            {locale === 'ar' ? 'تحرير' : 'Edit'}
          </Button>
          <Button
            type="button"
            variant={activeTab === 'preview' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3"
            onClick={() => setActiveTab('preview')}
          >
            <Eye className="h-4 w-4 mr-1" />
            {locale === 'ar' ? 'معاينة' : 'Preview'}
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ minHeight }}>
        {activeTab === 'edit' ? (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            dir={dir}
            onKeyDown={handleKeyDown}
            className={cn(
              "border-0 rounded-none resize-none font-mono text-sm focus-visible:ring-0",
              "min-h-[400px]"
            )}
            style={{ minHeight }}
          />
        ) : (
          <div className="p-4 overflow-auto" style={{ minHeight }}>
            {value ? (
              <MarkdownRenderer content={value} dir={dir} />
            ) : (
              <p className="text-muted-foreground italic">
                {locale === 'ar' ? 'لا يوجد محتوى للمعاينة' : 'No content to preview'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="border-t bg-muted/30 px-3 py-2 text-xs text-muted-foreground flex justify-between">
        <span>
          {locale === 'ar' 
            ? 'يدعم Markdown - استخدم [[اسم المقالة]] للربط بمقالات أخرى'
            : 'Supports Markdown - Use [[Article Name]] to link to other articles'}
        </span>
        <span>
          {locale === 'ar'
            ? `${value.length} حرف`
            : `${value.length} characters`}
        </span>
      </div>
    </div>
  );
}

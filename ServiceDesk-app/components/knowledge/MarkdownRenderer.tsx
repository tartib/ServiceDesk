'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export function MarkdownRenderer({ content, className, dir = 'ltr' }: MarkdownRendererProps) {
  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let inList = false;
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' = 'ul';
    let inTable = false;
    let tableRows: string[][] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType;
        elements.push(
          <ListTag key={`list-${elements.length}`} className={cn(
            "my-4 space-y-2",
            listType === 'ul' ? "list-disc list-inside" : "list-decimal list-inside"
          )}>
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-700 dark:text-gray-300">{renderInline(item)}</li>
            ))}
          </ListTag>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0) {
        const headers = tableRows[0];
        const body = tableRows.slice(2); // Skip header and separator
        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {headers.map((cell, i) => (
                    <th key={i} className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-semibold">
                      {renderInline(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                    {row.map((cell, j) => (
                      <td key={j} className="border border-gray-200 dark:border-gray-700 px-4 py-2">
                        {renderInline(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    const renderInline = (text: string): React.ReactNode => {
      // Handle inline formatting
      const result: React.ReactNode[] = [];
      let key = 0;

      // Process inline code first
      const codeRegex = /`([^`]+)`/g;
      let lastIndex = 0;
      let match;

      while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          result.push(processInlineFormatting(text.slice(lastIndex, match.index), key++));
        }
        result.push(
          <code key={key++} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-pink-600 dark:text-pink-400">
            {match[1]}
          </code>
        );
        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < text.length) {
        result.push(processInlineFormatting(text.slice(lastIndex), key++));
      }

      return result.length === 1 ? result[0] : result;
    };

    const processInlineFormatting = (text: string, key: number): React.ReactNode => {
      // Bold and italic
      let processed = text
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/~~(.+?)~~/g, '<del>$1</del>');

      // Links
      processed = processed.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // Internal wiki links [[Article Name]]
      processed = processed.replace(
        /\[\[([^\]]+)\]\]/g,
        '<a href="/knowledge/search?q=$1" class="text-green-600 dark:text-green-400 hover:underline font-medium">$1</a>'
      );

      return <span key={key} dangerouslySetInnerHTML={{ __html: processed }} />;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-${elements.length}`} className="my-4">
              {codeBlockLang && (
                <div className="bg-gray-800 text-gray-400 text-xs px-4 py-1 rounded-t-lg font-mono">
                  {codeBlockLang}
                </div>
              )}
              <pre className={cn(
                "bg-gray-900 text-gray-100 p-4 overflow-x-auto font-mono text-sm",
                codeBlockLang ? "rounded-b-lg" : "rounded-lg"
              )}>
                <code>{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          );
          codeBlockContent = [];
          codeBlockLang = '';
          inCodeBlock = false;
        } else {
          flushList();
          flushTable();
          inCodeBlock = true;
          codeBlockLang = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        flushList();
        const cells = line.split('|').filter(c => c.trim() !== '');
        if (!inTable) {
          inTable = true;
        }
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (line.startsWith('######')) {
        flushList();
        elements.push(
          <h6 key={elements.length} className="text-sm font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            {renderInline(line.slice(6).trim())}
          </h6>
        );
        continue;
      }
      if (line.startsWith('#####')) {
        flushList();
        elements.push(
          <h5 key={elements.length} className="text-base font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">
            {renderInline(line.slice(5).trim())}
          </h5>
        );
        continue;
      }
      if (line.startsWith('####')) {
        flushList();
        elements.push(
          <h4 key={elements.length} className="text-lg font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200">
            {renderInline(line.slice(4).trim())}
          </h4>
        );
        continue;
      }
      if (line.startsWith('###')) {
        flushList();
        elements.push(
          <h3 key={elements.length} className="text-xl font-semibold mt-6 mb-3 text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">
            {renderInline(line.slice(3).trim())}
          </h3>
        );
        continue;
      }
      if (line.startsWith('##')) {
        flushList();
        elements.push(
          <h2 key={elements.length} className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100 border-b-2 border-gray-200 dark:border-gray-700 pb-2">
            {renderInline(line.slice(2).trim())}
          </h2>
        );
        continue;
      }
      if (line.startsWith('#')) {
        flushList();
        elements.push(
          <h1 key={elements.length} className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100 border-b-2 border-primary pb-2">
            {renderInline(line.slice(1).trim())}
          </h1>
        );
        continue;
      }

      // Horizontal rule
      if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
        flushList();
        elements.push(<hr key={elements.length} className="my-8 border-gray-200 dark:border-gray-700" />);
        continue;
      }

      // Blockquote
      if (line.startsWith('>')) {
        flushList();
        const quoteContent = line.slice(1).trim();
        elements.push(
          <blockquote key={elements.length} className="my-4 pl-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 py-2 pr-4 italic text-gray-700 dark:text-gray-300">
            {renderInline(quoteContent)}
          </blockquote>
        );
        continue;
      }

      // Callouts/Alerts
      if (line.startsWith(':::')) {
        flushList();
        const type = line.slice(3).trim().toLowerCase();
        const calloutLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(':::')) {
          calloutLines.push(lines[i]);
          i++;
        }
        const calloutStyles: Record<string, string> = {
          info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200',
          warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200',
          danger: 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200',
          success: 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200',
          tip: 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-800 dark:text-purple-200',
        };
        const icons: Record<string, string> = {
          info: 'ℹ️',
          warning: '⚠️',
          danger: '🚨',
          success: '✅',
          tip: '💡',
        };
        elements.push(
          <div key={elements.length} className={cn("my-4 p-4 border-l-4 rounded-r-lg", calloutStyles[type] || calloutStyles.info)}>
            <div className="font-semibold mb-2 flex items-center gap-2">
              <span>{icons[type] || icons.info}</span>
              <span className="capitalize">{type}</span>
            </div>
            <div>{calloutLines.map((l, idx) => <p key={idx}>{renderInline(l)}</p>)}</div>
          </div>
        );
        continue;
      }

      // Unordered list
      if (line.match(/^[\s]*[-*+]\s/)) {
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(line.replace(/^[\s]*[-*+]\s/, ''));
        continue;
      }

      // Ordered list
      if (line.match(/^[\s]*\d+\.\s/)) {
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(line.replace(/^[\s]*\d+\.\s/, ''));
        continue;
      }

      // Task list
      if (line.match(/^[\s]*[-*]\s\[[ x]\]/i)) {
        flushList();
        const checked = line.match(/\[x\]/i);
        const taskText = line.replace(/^[\s]*[-*]\s\[[ x]\]\s*/i, '');
        elements.push(
          <div key={elements.length} className="flex items-center gap-2 my-1">
            <input type="checkbox" checked={!!checked} readOnly className="h-4 w-4 rounded border-gray-300" />
            <span className={checked ? 'line-through text-gray-500' : ''}>{renderInline(taskText)}</span>
          </div>
        );
        continue;
      }

      // Empty line
      if (line.trim() === '') {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={elements.length} className="my-3 text-gray-700 dark:text-gray-300 leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }

    flushList();
    flushTable();

    return elements;
  };

  return (
    <div className={cn("wiki-content", className)} dir={dir}>
      {renderMarkdown(content)}
    </div>
  );
}

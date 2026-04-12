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
 <li key={i} className="text-foreground dark:text-muted-foreground">{renderInline(item)}</li>
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
 <table className="min-w-full border-collapse border border-border dark:border-border">
 <thead className="bg-muted/50 dark:bg-foreground/90">
 <tr>
 {headers.map((cell, i) => (
 <th key={i} className="border border-border dark:border-border px-4 py-2 text-left font-semibold">
 {renderInline(cell.trim())}
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {body.map((row, i) => (
 <tr key={i} className={i % 2 === 0 ? 'bg-background dark:bg-foreground' : 'bg-muted/50 dark:bg-foreground/90'}>
 {row.map((cell, j) => (
 <td key={j} className="border border-border dark:border-border px-4 py-2">
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
 <code key={key++} className="px-1.5 py-0.5 bg-muted dark:bg-foreground/90 rounded text-sm font-mono text-destructive">
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
 '<a href="$2" class="text-brand dark:text-brand hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
 );

 // Internal wiki links [[Article Name]]
 processed = processed.replace(
 /\[\[([^\]]+)\]\]/g,
 '<a href="/knowledge/search?q=$1" class="text-success dark:text-success hover:underline font-medium">$1</a>'
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
 <div className="bg-foreground/90 text-muted-foreground text-xs px-4 py-1 rounded-t-lg font-mono">
 {codeBlockLang}
 </div>
 )}
 <pre className={cn(
 "bg-foreground text-muted-foreground p-4 overflow-x-auto font-mono text-sm",
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
 <h6 key={elements.length} className="text-sm font-semibold mt-4 mb-2 text-foreground dark:text-muted-foreground">
 {renderInline(line.slice(6).trim())}
 </h6>
 );
 continue;
 }
 if (line.startsWith('#####')) {
 flushList();
 elements.push(
 <h5 key={elements.length} className="text-base font-semibold mt-4 mb-2 text-foreground dark:text-muted-foreground">
 {renderInline(line.slice(5).trim())}
 </h5>
 );
 continue;
 }
 if (line.startsWith('####')) {
 flushList();
 elements.push(
 <h4 key={elements.length} className="text-lg font-semibold mt-5 mb-2 text-foreground dark:text-muted-foreground">
 {renderInline(line.slice(4).trim())}
 </h4>
 );
 continue;
 }
 if (line.startsWith('###')) {
 flushList();
 elements.push(
 <h3 key={elements.length} className="text-xl font-semibold mt-6 mb-3 text-foreground dark:text-muted-foreground border-b border-border dark:border-border pb-2">
 {renderInline(line.slice(3).trim())}
 </h3>
 );
 continue;
 }
 if (line.startsWith('##')) {
 flushList();
 elements.push(
 <h2 key={elements.length} className="text-2xl font-bold mt-8 mb-4 text-foreground dark:text-muted-foreground border-b-2 border-border dark:border-border pb-2">
 {renderInline(line.slice(2).trim())}
 </h2>
 );
 continue;
 }
 if (line.startsWith('#')) {
 flushList();
 elements.push(
 <h1 key={elements.length} className="text-3xl font-bold mt-8 mb-4 text-foreground dark:text-muted-foreground border-b-2 border-brand pb-2">
 {renderInline(line.slice(1).trim())}
 </h1>
 );
 continue;
 }

 // Horizontal rule
 if (line.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
 flushList();
 elements.push(<hr key={elements.length} className="my-8 border-border dark:border-border" />);
 continue;
 }

 // Blockquote
 if (line.startsWith('>')) {
 flushList();
 const quoteContent = line.slice(1).trim();
 elements.push(
 <blockquote key={elements.length} className="my-4 pl-4 border-l-4 border-brand bg-brand-surface dark:bg-brand-soft py-2 pr-4 italic text-foreground dark:text-muted-foreground">
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
 info: 'bg-brand-surface dark:bg-brand-soft border-brand text-brand dark:text-muted-foreground',
 warning: 'bg-warning-soft border-warning text-warning',
 danger: 'bg-destructive-soft border-destructive text-destructive',
 success: 'bg-success-soft border-success text-success',
 tip: 'bg-info-soft dark:bg-info-soft border-info/50 text-info dark:text-info/50',
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
 <input type="checkbox" checked={!!checked} readOnly className="h-4 w-4 rounded border-border" />
 <span className={checked ? 'line-through text-muted-foreground' : ''}>{renderInline(taskText)}</span>
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
 <p key={elements.length} className="my-3 text-foreground dark:text-muted-foreground leading-relaxed">
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

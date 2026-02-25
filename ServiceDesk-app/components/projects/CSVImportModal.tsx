'use client';

import { API_URL } from '@/lib/api/config';
import { useState, useCallback, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Download,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import Papa from 'papaparse';

interface CSVImportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ParsedRow {
  [key: string]: string;
}

interface ValidationError {
  row: number;
  field?: string;
  message: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  warnings: number;
  total: number;
  importedKeys: string[];
  skippedRows: { row: number; reason: string }[];
  errors: ValidationError[];
}

const EXPECTED_COLUMNS = ['Title', 'Type', 'Priority', 'Description', 'Story Points', 'Labels', 'Due Date', 'Assignee'];
const REQUIRED_COLUMNS = ['Title'];

const COLUMN_MAP: Record<string, string> = {
  title: 'Title',
  summary: 'Title',
  type: 'Type',
  priority: 'Priority',
  description: 'Description',
  storypoints: 'Story Points',
  points: 'Story Points',
  labels: 'Labels',
  tags: 'Labels',
  duedate: 'Due Date',
  due: 'Due Date',
  deadline: 'Due Date',
  assignee: 'Assignee',
  assignedto: 'Assignee',
  owner: 'Assignee',
};

function normalizeHeader(header: string): string {
  const lower = header.toLowerCase().replace(/[\s_-]+/g, '');
  return COLUMN_MAP[lower] || header;
}

type Step = 'upload' | 'preview' | 'result';

export default function CSVImportModal({ projectId, isOpen, onClose, onImportComplete }: CSVImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappedHeaders, setMappedHeaders] = useState<string[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setMappedHeaders([]);
    setParseErrors([]);
    setImporting(false);
    setImportResult(null);
    setImportError(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setParseErrors(['Please select a CSV file (.csv)']);
      return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      setParseErrors(['File size must be under 2MB']);
      return;
    }

    setFile(selectedFile);
    setParseErrors([]);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawHeaders = results.meta.fields || [];
        const mapped = rawHeaders.map(normalizeHeader);
        setHeaders(rawHeaders);
        setMappedHeaders(mapped);

        const data = results.data as ParsedRow[];
        setParsedData(data);

        // Check for required columns
        const errs: string[] = [];
        const hasTitleCol = mapped.some(h => h === 'Title');
        if (!hasTitleCol) {
          errs.push('CSV must contain a "Title" column');
        }

        // Check for rows without title
        const emptyTitleRows = data.filter((row) => {
          const titleKey = rawHeaders[mapped.indexOf('Title')];
          return titleKey && (!row[titleKey] || !row[titleKey].trim());
        });
        if (emptyTitleRows.length > 0) {
          errs.push(`${emptyTitleRows.length} row(s) have empty titles and will be skipped`);
        }

        if (results.errors.length > 0) {
          errs.push(...results.errors.slice(0, 3).map(e => `Row ${e.row}: ${e.message}`));
        }

        setParseErrors(errs);

        if (data.length > 0 && hasTitleCol) {
          setStep('preview');
        }
      },
      error: (error) => {
        setParseErrors([`Failed to parse CSV: ${error.message}`]);
      },
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    setImportError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) {
        setImportError('Not authenticated');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/pm/projects/${projectId}/import/csv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setImportResult(data.data);
        setStep('result');
        onImportComplete();
      } else {
        setImportError(data.error || 'Import failed');
      }
    } catch {
      setImportError('Network error — could not connect to server');
    } finally {
      setImporting(false);
    }
  }, [file, projectId, onImportComplete]);

  // Preview: first 10 rows
  const previewRows = useMemo(() => parsedData.slice(0, 10), [parsedData]);
  const recognizedCols = useMemo(() => mappedHeaders.filter(h => EXPECTED_COLUMNS.includes(h)), [mappedHeaders]);
  const unknownCols = useMemo(() => headers.filter((_, i) => !EXPECTED_COLUMNS.includes(mappedHeaders[i])), [headers, mappedHeaders]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Import from CSV</h2>
              <p className="text-sm text-gray-500">
                {step === 'upload' && 'Upload a CSV file to import tasks'}
                {step === 'preview' && `${parsedData.length} rows found — review before importing`}
                {step === 'result' && 'Import complete'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ─── Step: Upload ─── */}
          {step === 'upload' && (
            <div>
              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <FileText className={`h-12 w-12 mx-auto mb-4 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className="text-lg font-medium text-gray-700">
                  {dragOver ? 'Drop CSV file here' : 'Drag & drop a CSV file here'}
                </p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                <p className="text-xs text-gray-400 mt-3">Max file size: 2MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
              </div>

              {/* Errors */}
              {parseErrors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  {parseErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Template download */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Need a template?</p>
                    <p className="text-xs text-gray-500 mt-0.5">Download a CSV template with the expected column headers</p>
                  </div>
                  <a
                    href="/templates/backlog-import-template.csv"
                    download
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Template
                  </a>
                </div>
              </div>

              {/* Expected columns */}
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Expected Columns</p>
                <div className="flex flex-wrap gap-2">
                  {EXPECTED_COLUMNS.map(col => (
                    <span
                      key={col}
                      className={`text-xs px-2.5 py-1 rounded-full ${
                        REQUIRED_COLUMNS.includes(col) ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {col}{REQUIRED_COLUMNS.includes(col) ? ' *' : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step: Preview ─── */}
          {step === 'preview' && (
            <div>
              {/* File info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <FileText className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{file?.name}</p>
                  <p className="text-xs text-gray-500">{parsedData.length} rows &middot; {recognizedCols.length} mapped columns</p>
                </div>
                <button
                  onClick={() => { reset(); }}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Change file
                </button>
              </div>

              {/* Column mapping summary */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Column Mapping</p>
                <div className="flex flex-wrap gap-2">
                  {headers.map((h, i) => {
                    const mapped = mappedHeaders[i];
                    const isRecognized = EXPECTED_COLUMNS.includes(mapped);
                    return (
                      <div key={i} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                        isRecognized ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {isRecognized ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        <span>{h}</span>
                        {h !== mapped && isRecognized && <span className="text-green-500">→ {mapped}</span>}
                      </div>
                    );
                  })}
                </div>
                {unknownCols.length > 0 && (
                  <p className="text-xs text-yellow-600 mt-2">
                    {unknownCols.length} column(s) not recognized and will be ignored: {unknownCols.join(', ')}
                  </p>
                )}
              </div>

              {/* Warnings */}
              {parseErrors.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-1">
                  {parseErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-yellow-700">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Data preview table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">#</th>
                        {headers.map((h, i) => {
                          const mapped = mappedHeaders[i];
                          const isRecognized = EXPECTED_COLUMNS.includes(mapped);
                          return (
                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 min-w-[120px]">
                              <span className={isRecognized ? 'text-gray-700' : 'text-gray-400'}>{h}</span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs text-gray-400">{ri + 1}</td>
                          {headers.map((h, ci) => {
                            const val = row[h] || '';
                            const mapped = mappedHeaders[ci];
                            const isTitle = mapped === 'Title';
                            const isEmpty = isTitle && !val.trim();
                            return (
                              <td key={ci} className={`px-3 py-2 text-xs truncate max-w-[200px] ${
                                isEmpty ? 'text-red-500 bg-red-50' : 'text-gray-700'
                              }`}>
                                {val || <span className="text-gray-300">—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 10 && (
                  <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 text-center border-t border-gray-200">
                    Showing first 10 of {parsedData.length} rows
                  </div>
                )}
              </div>

              {/* Import error */}
              {importError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-red-700">{importError}</span>
                </div>
              )}
            </div>
          )}

          {/* ─── Step: Result ─── */}
          {step === 'result' && importResult && (
            <div>
              {/* Success banner */}
              <div className={`p-6 rounded-xl mb-6 ${
                importResult.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {importResult.imported > 0 ? (
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {importResult.imported > 0 ? 'Import Successful' : 'No Tasks Imported'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {importResult.imported} of {importResult.total} tasks imported
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                    <p className="text-xs text-gray-500">Imported</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{importResult.skipped}</p>
                    <p className="text-xs text-gray-500">Skipped</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-600">{importResult.warnings}</p>
                    <p className="text-xs text-gray-500">Warnings</p>
                  </div>
                </div>
              </div>

              {/* Skipped rows */}
              {importResult.skippedRows.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Skipped Rows</p>
                  <div className="space-y-1">
                    {importResult.skippedRows.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 px-3 py-1.5 rounded">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        Row {s.row}: {s.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Warnings</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 px-3 py-1.5 rounded">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Row {e.row}{e.field ? ` (${e.field})` : ''}: {e.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          {step === 'upload' && (
            <>
              <div />
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                Cancel
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <div className="flex items-center gap-3">
                <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={importing || parsedData.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {parsedData.length} tasks
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'result' && (
            <>
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Import another file
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

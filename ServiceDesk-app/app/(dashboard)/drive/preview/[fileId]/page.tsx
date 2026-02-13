'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import JsonView from '@uiw/react-json-view';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

// Initialize PDF.js worker - set at runtime
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// Helper function to get API URL with fallback
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

interface FileMetadata {
  _id: string;
  fileName: string;
  size: number;
  mimeType: string;
  createdAt: string;
  isImage?: boolean;
  isPDF?: boolean;
  isVideo?: boolean;
}

export default function FilePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.fileId as string;

  const [file, setFile] = useState<FileMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Preview states
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [jsonData, setJsonData] = useState<any>(null);
  const [docxHtmlContent, setDocxHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');

  useEffect(() => {
    const loadFilePreview = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();

        // Fetch file metadata
        const fileResponse = await fetch(`${apiUrl}/files/${fileId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!fileResponse.ok) {
          throw new Error('Failed to load file');
        }

        const fileData = await fileResponse.json();
        setFile(fileData.data);

        // Fetch and render file content based on type
        const contentResponse = await fetch(`${apiUrl}/files/${fileId}/preview`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!contentResponse.ok) {
          throw new Error('Failed to load file content');
        }

        if (fileData.data.isImage) {
          const blob = await contentResponse.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } else if (fileData.data.isVideo || fileData.data.fileName?.toLowerCase().endsWith('.mp4')) {
          const blob = await contentResponse.blob();
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        } else if (fileData.data.isPDF) {
          const blob = await contentResponse.blob();
          const arrayBuffer = await blob.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          const pages: string[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (context) {
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              await page.render({
                canvasContext: context,
                viewport: viewport,
              } as any).promise;

              pages.push(canvas.toDataURL());
            }
          }

          setPdfPages(pages);
        } else if (fileData.data.fileName?.endsWith('.docx') && fileData.data.mimeType?.includes('word')) {
          const blob = await contentResponse.blob();
          const arrayBuffer = await blob.arrayBuffer();

          try {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setDocxHtmlContent(result.value);
          } catch (error) {
            console.error('Failed to convert Word document:', error);
            setError('Unable to preview this Word document');
          }
        } else if (fileData.data.fileName?.endsWith('.json')) {
          const text = await contentResponse.text();
          try {
            const parsed = JSON.parse(text);
            setJsonData(parsed);
          } catch (e) {
            setError('Invalid JSON format');
          }
        } else if (fileData.data.mimeType?.startsWith('text/')) {
          const text = await contentResponse.text();
          setTextContent(text);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      loadFilePreview();
    }
  }, [fileId]);

  const handleDownload = () => {
    if (file) {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const downloadUrl = `${apiUrl}/files/${file._id}/download`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      
      // Add auth header by using fetch
      fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          document.body.removeChild(link);
        });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading file preview...</p>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'File not found'}</p>
          <Link href="/drive">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Back to Drive
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/drive">
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{file.fileName}</h1>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                </p>
              </div>
            </div>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {file.isImage ? (
          <div className="flex justify-center">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={file.fileName}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
              />
            )}
          </div>
        ) : file.isVideo || file.fileName?.toLowerCase().endsWith('.mp4') ? (
          <div className="flex justify-center bg-black rounded-lg overflow-hidden shadow-lg">
            {videoUrl && (
              <video
                src={videoUrl}
                controls
                className="max-w-full max-h-[80vh] w-full"
              />
            )}
          </div>
        ) : file.isPDF ? (
          <div className="flex flex-col items-center gap-4">
            {pdfPages.length > 0 && (
              <>
                <div className="flex justify-center w-full">
                  <img
                    src={pdfPages[currentPdfPage - 1]}
                    alt={`Page ${currentPdfPage}`}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPdfPage(Math.max(1, currentPdfPage - 1))}
                    disabled={currentPdfPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[120px] text-center">
                    Page {currentPdfPage} of {pdfPages.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPdfPage(Math.min(pdfPages.length, currentPdfPage + 1))}
                    disabled={currentPdfPage === pdfPages.length}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : file.fileName?.endsWith('.docx') && file.mimeType?.includes('word') ? (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
            {docxHtmlContent ? (
              <div className="prose prose-sm max-w-none">
                <div
                  dangerouslySetInnerHTML={{ __html: docxHtmlContent }}
                  className="text-gray-800"
                />
              </div>
            ) : (
              <p className="text-gray-600">Loading document...</p>
            )}
          </div>
        ) : file.fileName?.endsWith('.json') ? (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto overflow-auto max-h-[80vh]">
            {jsonData ? (
              <JsonView
                value={jsonData}
                collapsed={2}
                displayDataTypes={true}
                displayObjectSize={true}
              />
            ) : (
              <p className="text-gray-600">Loading JSON...</p>
            )}
          </div>
        ) : file.mimeType?.startsWith('text/') ? (
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto font-mono text-sm overflow-auto max-h-[80vh]">
            <pre className="whitespace-pre-wrap break-words text-gray-800">
              {textContent}
            </pre>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">This file type cannot be previewed</p>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download to View
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Download, Image as ImageIcon, Video, FileText, File as FileIcon, Music, Code } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileItem } from '@/types/file.types';
import { downloadFile } from '@/services/file.service';

interface FilePreviewModalProps {
  file: FileItem | null;
  /** Pre-fetched URL — if not provided the modal will attempt to use getFileDirectLink internally */
  previewUrl?: string;
  onClose: () => void;
}

const OFFICE_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/csv',
];

function getFileCategory(type: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'office' | 'other' {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type === 'application/pdf') return 'pdf';
  if (type.startsWith('text/') || type === 'application/json' || type === 'application/xml') return 'text';
  if (OFFICE_TYPES.includes(type)) return 'office';
  return 'other';
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, previewUrl, onClose }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setResolvedUrl(null);
    setTextContent(null);
    setError('');

    if (!file) return;

    if (previewUrl) {
      // URL already fetched by caller — use directly
      setResolvedUrl(previewUrl);
      // For text files, fetch the content
      if (getFileCategory(file.type) === 'text') {
        fetch(previewUrl)
          .then(r => r.text())
          .then(text => { if (mounted) setTextContent(text); })
          .catch(() => { /* fallback: show iframe */ });
      }
      return;
    }

    // Fallback: shouldn't happen since FileList always passes previewUrl
    setError('No preview URL available. Please try downloading the file.');
    return () => { mounted = false; };
  }, [file, previewUrl]);

  const handleDownload = async () => {
    if (!file) return;
    try { await downloadFile(file.id, file.name); }
    catch (e) { console.error('Download failed:', e); }
  };

  if (!file) return null;

  const category = getFileCategory(file.type);

  const HeaderIcon = () => {
    const cls = 'w-5 h-5';
    if (category === 'image') return <ImageIcon className={`${cls} text-blue-400`} />;
    if (category === 'video') return <Video className={`${cls} text-indigo-400`} />;
    if (category === 'audio') return <Music className={`${cls} text-purple-400`} />;
    if (category === 'pdf') return <FileText className={`${cls} text-red-400`} />;
    if (category === 'text') return <Code className={`${cls} text-green-400`} />;
    if (category === 'office') return <FileText className={`${cls} text-emerald-400`} />;
    return <FileIcon className={`${cls} text-gray-400`} />;
  };

  const categoryLabel: Record<string, string> = {
    image: 'Image', video: 'Video', audio: 'Audio', pdf: 'PDF',
    text: 'Text', office: 'Document', other: 'File',
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 backdrop-blur-sm bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 flex-shrink-0">
            <div className="flex items-center space-x-2 overflow-hidden">
              <div className="p-1.5 bg-zinc-800 rounded-md flex-shrink-0">
                <HeaderIcon />
              </div>
              <h3 className="text-zinc-100 font-medium text-sm truncate" title={file.name}>{file.name}</h3>
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded uppercase tracking-wider hidden sm:inline-block">
                {categoryLabel[category]}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <Button variant="outline" size="sm" onClick={handleDownload} className="text-zinc-300 border-zinc-700 hover:bg-zinc-800 hidden sm:flex gap-1.5 h-8">
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
              <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-950/80 min-h-[50vh]">
            {loading && (
              <div className="flex flex-col items-center text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                <p className="text-sm">Loading preview…</p>
              </div>
            )}

            {!loading && error && (
              <div className="text-red-400 bg-red-950/30 px-6 py-5 rounded-lg flex flex-col items-center border border-red-900/50 max-w-sm text-center">
                <X className="w-8 h-8 mb-2" />
                <p className="font-medium mb-4">{error}</p>
                <Button onClick={handleDownload} className="bg-zinc-700 hover:bg-zinc-600 text-white border-0">
                  <Download className="w-4 h-4 mr-2" /> Download Instead
                </Button>
              </div>
            )}

            {!loading && !error && resolvedUrl && (
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-4" style={{ minHeight: '55vh' }}>
                {/* Image */}
                {category === 'image' && (
                  <img src={resolvedUrl} alt={file.name} className="max-w-full max-h-[75vh] object-contain rounded drop-shadow-2xl" />
                )}

                {/* Video */}
                {category === 'video' && (
                  <video controls crossOrigin="anonymous" className="max-w-full max-h-[75vh] rounded w-full bg-black outline-none">
                    <source src={resolvedUrl} type={file.type} />
                    Your browser does not support video playback.
                  </video>
                )}

                {/* Audio */}
                {category === 'audio' && (
                  <div className="flex flex-col items-center gap-6 p-8 bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-md">
                    <Music className="w-20 h-20 text-purple-400 opacity-60" />
                    <p className="text-zinc-200 font-medium text-center truncate w-full">{file.name}</p>
                    <audio controls crossOrigin="anonymous" className="w-full" src={resolvedUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {/* PDF */}
                {category === 'pdf' && (
                  <iframe src={resolvedUrl} className="w-full rounded border-0 bg-zinc-200" style={{ height: '75vh' }} title={file.name} />
                )}

                {/* Text / Code */}
                {category === 'text' && (
                  <div className="w-full h-full overflow-auto rounded-lg bg-zinc-900 border border-zinc-700 p-4" style={{ maxHeight: '75vh' }}>
                    {textContent !== null ? (
                      <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap break-words">{textContent}</pre>
                    ) : (
                      <iframe src={resolvedUrl} className="w-full border-0 bg-transparent" style={{ height: '70vh' }} title={file.name} />
                    )}
                  </div>
                )}

                {/* Office / CSV — Google Docs Viewer */}
                {category === 'office' && (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(resolvedUrl)}&embedded=true`}
                    className="w-full rounded border border-zinc-700"
                    style={{ height: '75vh' }}
                    title={file.name}
                  />
                )}

                {/* Unsupported */}
                {category === 'other' && (
                  <div className="flex flex-col items-center text-center max-w-sm p-8 bg-zinc-900 rounded-xl border border-zinc-800">
                    <FileIcon className="w-16 h-16 text-zinc-600 mb-4" />
                    <h4 className="text-lg font-medium text-zinc-200 mb-2">No Preview Available</h4>
                    <p className="text-sm text-zinc-500 mb-6">
                      Inline preview is not supported for <b>{file.type || 'this file type'}</b>.
                    </p>
                    <Button onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 w-full">
                      <Download className="w-4 h-4 mr-2" /> Download File
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FilePreviewModal;

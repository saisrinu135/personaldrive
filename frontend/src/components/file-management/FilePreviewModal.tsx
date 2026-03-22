import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Download, Image as ImageIcon, Video, FileText, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FileItem } from '@/types/file.types';
import { getFilePreviewUrl, downloadFile } from '@/services/file.service';

interface FilePreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError('');
        const url = await getFilePreviewUrl(file.id);
        if (mounted) setPreviewUrl(url);
      } catch (err: any) {
        if (mounted) setError(err?.response?.data?.detail || 'Failed to generate preview link. Please try again.');
        console.error("Preview failed:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPreview();

    return () => { mounted = false; };
  }, [file]);

  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isPdf = file.type === 'application/pdf';
  const isSupported = isImage || isVideo || isPdf;

  const handleDownload = async () => {
    try {
      await downloadFile(file.id, file.name);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/80">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden border border-zinc-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="p-1.5 bg-zinc-800 rounded-md">
                {isImage ? <ImageIcon className="w-5 h-5 text-blue-400" /> : 
                 isVideo ? <Video className="w-5 h-5 text-indigo-400" /> : 
                 isPdf ? <FileText className="w-5 h-5 text-red-500" /> : 
                 <FileIcon className="w-5 h-5 text-gray-400" />}
              </div>
              <h3 className="text-zinc-100 font-medium truncate shrink" title={file.name}>{file.name}</h3>
              <span className="text-xs font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded uppercase hidden sm:inline-block tracking-wider">
                {isImage ? 'Image' : isVideo ? 'Video' : isPdf ? 'Document' : 'File'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 shrink-0 ml-4">
              <Button variant="outline" size="sm" onClick={handleDownload} className="text-zinc-300 border-zinc-700 hover:bg-zinc-800 hidden sm:flex">
                <Download className="w-4 h-4 mr-1.5" /> Download
              </Button>
              <button 
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-red-500/20 rounded-md transition-colors"
                aria-label="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-950/80 relative min-h-[50vh]">
            {loading && (
              <div className="flex flex-col items-center text-zinc-400 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                <p className="text-sm font-medium">Generating secure streaming link...</p>
              </div>
            )}
            
            {!loading && error && (
              <div className="text-red-400 bg-red-950/30 px-6 py-4 rounded-lg flex flex-col items-center border border-red-900/50">
                <X className="w-8 h-8 mb-2" />
                <p className="font-medium text-center">{error}</p>
                <Button variant="outline" size="sm" onClick={onClose} className="mt-4 border-red-900/50 hover:bg-red-900/30">Go Back</Button>
              </div>
            )}
            
            {!loading && !error && previewUrl && (
              <div className="w-full h-[60vh] sm:h-[75vh] flex items-center justify-center p-2 sm:p-4">
                {isImage && (
                  <img src={previewUrl} alt={file.name} className="max-w-full max-h-full object-contain rounded drop-shadow-2xl" />
                )}
                
                {isVideo && (
                  <video controls crossOrigin="anonymous" className="max-w-full max-h-full rounded drop-shadow-2xl outline-none w-full bg-black">
                    <source src={previewUrl} type={file.type} />
                    Your browser does not support the video playback natively.
                  </video>
                )}
                
                {isPdf && (
                  <iframe src={previewUrl} className="w-full h-full rounded shadow-lg bg-zinc-200 border-0" title={file.name} />
                )}
                
                {!isSupported && (
                  <div className="flex flex-col items-center text-center max-w-sm p-8 bg-zinc-900 rounded-xl border border-zinc-800">
                    <FileIcon className="w-16 h-16 text-zinc-600 mb-4" />
                    <h4 className="text-lg font-medium text-zinc-200 mb-2">No Preview Available</h4>
                    <p className="text-sm text-zinc-500 mb-6">
                      Inline preview is not natively supported for <b>{file.type || 'this file extension'}</b>.
                    </p>
                    <Button onClick={handleDownload} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                      <Download className="w-4 h-4 mr-2" /> Download File Instead
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

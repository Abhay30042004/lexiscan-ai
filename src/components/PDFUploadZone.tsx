import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFUploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export function PDFUploadZone({ onFileSelect, isProcessing }: PDFUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB');
      return;
    }
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  return (
    <div className="w-full">
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative overflow-hidden rounded-xl border-2 border-dashed p-12 text-center cursor-pointer
          transition-colors duration-300
          ${isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
        `}
        whileHover={{ scale: isProcessing ? 1 : 1.005 }}
        onClick={() => {
          if (isProcessing) return;
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.pdf';
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) handleFile(file);
          };
          input.click();
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-glow opacity-0 hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <motion.div
            className={`rounded-2xl p-4 ${isDragging ? 'bg-primary/20' : 'bg-secondary'}`}
            animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
          >
            {isDragging ? (
              <FileText className="h-10 w-10 text-primary" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
          </motion.div>

          <div>
            <p className="text-lg font-semibold text-foreground">
              {isDragging ? 'Drop your PDF here' : 'Upload Legal Contract'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag & drop a PDF file or click to browse · Max 20MB
            </p>
          </div>

          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="rounded-md bg-secondary px-2.5 py-1 font-mono">Digital PDFs</span>
            <span className="rounded-md bg-secondary px-2.5 py-1 font-mono">Scanned PDFs</span>
            <span className="rounded-md bg-secondary px-2.5 py-1 font-mono">Multi-page</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2.5 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

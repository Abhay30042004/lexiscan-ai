import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Zap, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PDFUploadZone } from '@/components/PDFUploadZone';
import { ProcessingStatusBar } from '@/components/ProcessingStatusBar';
import { EntityResultsDashboard } from '@/components/EntityResultsDashboard';
import { extractTextFromPDF } from '@/lib/pdf-utils';
import { extractEntities } from '@/lib/api';
import type { ExtractedEntity, ProcessingStatus } from '@/types/entities';
import { toast } from 'sonner';

const Index = () => {
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState('');
  const [entities, setEntities] = useState<ExtractedEntity | null>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setFileName(file.name);
    setEntities(null);

    try {
      setStatus('uploading');
      setProgress(`Reading ${file.name}...`);
      await new Promise((r) => setTimeout(r, 400));

      setStatus('extracting_text');
      setProgress('Extracting text from PDF...');
      const text = await extractTextFromPDF(file);

      if (!text || text.length < 20) {
        toast.error('Could not extract text. The PDF may be image-only or empty.');
        setStatus('error');
        return;
      }

      setStatus('analyzing');
      setProgress(`Analyzing ${text.length.toLocaleString()} characters with AI...`);
      const result = await extractEntities(text);

      setEntities(result);
      setStatus('complete');
      setProgress('');
      toast.success(`Extracted entities from ${file.name}`);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setProgress('');
      toast.error(err.message || 'Processing failed');
    }
  }, []);

  const handleReset = () => {
    setStatus('idle');
    setFileName('');
    setProgress('');
    setEntities(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />

      {/* Header */}
      <header className="relative border-b border-border bg-card/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
              <Scale className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                LexiScan <span className="text-gradient-gold">Auto</span>
              </h1>
              <p className="text-xs text-muted-foreground">Legal Contract Entity Extractor</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>AI-Powered NER</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span>Secure Processing</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative mx-auto max-w-6xl px-6 py-8 space-y-8">
        <AnimatePresence mode="wait">
          {status === 'idle' && !entities && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Hero */}
              <div className="text-center space-y-3 pt-8 pb-4">
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Extract Entities from
                  <br />
                  <span className="text-gradient-gold">Legal Contracts</span>
                </h2>
                <p className="mx-auto max-w-lg text-muted-foreground">
                  Upload a PDF contract and our AI instantly identifies parties, dates,
                  financial amounts, and termination clauses with high precision.
                </p>
              </div>

              <PDFUploadZone onFileSelect={handleFileSelect} isProcessing={false} />

              {/* Feature pills */}
              <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                {['Party Names', 'Contract Dates', 'Dollar Amounts', 'Termination Clauses', 'JSON Export', 'Post-Processing Validation'].map((f) => (
                  <span key={f} className="rounded-full border border-border bg-secondary px-3 py-1.5">
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing */}
        {status !== 'idle' && !entities && (
          <ProcessingStatusBar status={status} fileName={fileName} progress={progress} />
        )}

        {/* Error retry */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </motion.div>
        )}

        {/* Results */}
        {entities && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Extraction Results</h3>
                <p className="text-sm text-muted-foreground">{fileName}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                New Document
              </Button>
            </div>
            <EntityResultsDashboard entities={entities} fileName={fileName} />
          </>
        )}
      </main>
    </div>
  );
};

export default Index;

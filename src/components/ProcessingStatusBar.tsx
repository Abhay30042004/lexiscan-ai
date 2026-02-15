import { motion } from 'framer-motion';
import { FileText, Brain, CheckCircle2, Loader2, AlertCircle, ScanSearch } from 'lucide-react';
import type { ProcessingStatus } from '@/types/entities';

interface ProcessingStatusBarProps {
  status: ProcessingStatus;
  fileName?: string;
  progress?: string;
}

const steps = [
  { key: 'uploading', label: 'Uploading', icon: FileText },
  { key: 'extracting_text', label: 'Extracting Text', icon: ScanSearch },
  { key: 'analyzing', label: 'AI Analysis', icon: Brain },
  { key: 'complete', label: 'Complete', icon: CheckCircle2 },
] as const;

function getStepState(stepKey: string, status: ProcessingStatus) {
  const order = ['uploading', 'extracting_text', 'analyzing', 'complete'];
  const currentIdx = order.indexOf(status);
  const stepIdx = order.indexOf(stepKey);
  if (status === 'error') return stepIdx <= currentIdx ? 'error' : 'pending';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

export function ProcessingStatusBar({ status, fileName, progress }: ProcessingStatusBarProps) {
  if (status === 'idle') return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      {fileName && (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="font-mono truncate">{fileName}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const state = getStepState(step.key, status);
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    state === 'done'
                      ? 'bg-success/20 text-success'
                      : state === 'active'
                      ? 'bg-primary/20 text-primary'
                      : state === 'error'
                      ? 'bg-destructive/20 text-destructive'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {state === 'active' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : state === 'done' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : state === 'error' ? (
                    <AlertCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  state === 'active' ? 'text-primary' :
                  state === 'done' ? 'text-success' :
                  'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-px flex-1 mx-1 ${
                  state === 'done' ? 'bg-success/40' : 'bg-border'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {progress && (
        <p className="mt-3 text-center text-xs text-muted-foreground">{progress}</p>
      )}
    </motion.div>
  );
}

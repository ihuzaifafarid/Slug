import React, { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Copy, Link2, X, AlertCircle, Info } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  snippet?: string;
  type?: 'success' | 'info' | 'error';
  actionType?: 'slug' | 'url' | 'batch' | 'general';
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(3000);
  const timerRef = useRef<number | null>(null);

  const duration = toast?.duration || 3200;

  useEffect(() => {
    if (!toast) {
      setProgress(100);
      return;
    }

    remainingTimeRef.current = duration;
    startTimeRef.current = Date.now();
    setProgress(100);

    const stepInterval = 25; // 40fps progress tick
    const interval = window.setInterval(() => {
      if (!isPaused) {
        remainingTimeRef.current -= stepInterval;
        const pct = Math.max(0, (remainingTimeRef.current / duration) * 100);
        setProgress(pct);

        if (remainingTimeRef.current <= 0) {
          clearInterval(interval);
          onDismiss();
        }
      }
    }, stepInterval);

    return () => {
      clearInterval(interval);
    };
  }, [toast, duration, isPaused, onDismiss]);

  if (!toast) return null;

  const getIcon = () => {
    if (toast.actionType === 'url') {
      return (
        <span className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <Link2 className="w-4 h-4" />
        </span>
      );
    }
    if (toast.actionType === 'slug' || toast.type === 'success') {
      return (
        <span className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </span>
      );
    }
    if (toast.type === 'error') {
      return (
        <span className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4" />
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
        <Info className="w-4 h-4" />
      </span>
    );
  };

  return (
    <aside
      aria-label="Notification"
      className="fixed bottom-5 right-5 z-50 pointer-events-auto max-w-sm sm:max-w-md w-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        role="status" 
        aria-live="polite"
        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-2xl shadow-xl shadow-black/8 dark:shadow-black/40 overflow-hidden flex flex-col backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 zoom-in-95"
      >
        <div className="p-3.5 sm:p-4 flex items-start gap-3">
          {/* Action icon badge */}
          {getIcon()}

          {/* Toast Message & Snippet */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-semibold tracking-tight text-neutral-900 dark:text-white">
                {toast.title}
              </p>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-900/60 shrink-0">
                Ready to paste
              </span>
            </div>

            {toast.snippet && (
              <p 
                className="mt-1 font-mono text-[11px] text-neutral-600 dark:text-neutral-300 bg-neutral-100/80 dark:bg-neutral-950/80 px-2 py-1 rounded-md border border-neutral-200/70 dark:border-neutral-800/80 truncate max-w-[280px] sm:max-w-[320px] select-all"
                title={toast.snippet}
              >
                {toast.snippet}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Progress Countdown Line */}
        <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
};

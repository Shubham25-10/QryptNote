import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Copy, Link2, X, ExternalLink } from 'lucide-react';

export interface ToastProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  badge?: string;
  icon?: 'check' | 'link' | 'copy';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  show,
  onClose,
  title = 'Link Copied!',
  message,
  badge,
  icon = 'check',
  duration = 3500,
  action,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!show) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (elapsed >= duration) {
        clearInterval(interval);
        onClose();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [show, duration, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-[120] max-w-sm w-full mx-auto px-4 sm:px-0 pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-2xl bg-ink/95 border border-violet/30 shadow-[0_12px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(124,92,255,0.25)] backdrop-blur-xl p-4 text-text-primary group">
            {/* Top ambient glow */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet to-transparent opacity-80" />

            <div className="flex items-start gap-3.5">
              {/* Icon */}
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] mt-0.5">
                {icon === 'link' ? (
                  <Link2 className="w-4 h-4" />
                ) : icon === 'copy' ? (
                  <Copy className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold font-display text-white tracking-wide truncate">
                    {title}
                  </h4>
                  {badge && (
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-violet/20 text-violet border border-violet/30 flex-shrink-0">
                      {badge}
                    </span>
                  )}
                </div>

                {message && (
                  <p className="text-xs font-mono text-text-secondary truncate mt-1 bg-black/40 px-2 py-1 rounded border border-white/5 select-all">
                    {message}
                  </p>
                )}

                {action && (
                  <button
                    onClick={action.onClick}
                    className="mt-2 text-xs font-medium text-violet hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <span>{action.label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet to-emerald-400 transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;

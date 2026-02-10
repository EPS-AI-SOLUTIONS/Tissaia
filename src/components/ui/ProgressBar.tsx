// src/components/ui/ProgressBar.tsx
/**
 * Matrix-style Progress Bar
 * =========================
 * Animated progress bar with message display.
 */
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress?: number;
  message?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  progress,
  message,
  showPercentage = true,
}: ProgressBarProps) {
  // Indeterminate mode if no progress provided
  const isIndeterminate = progress === undefined;

  return (
    <div className="space-y-2">
      {/* Message */}
      {message && (
        <div className="flex items-center gap-2 text-sm text-matrix-text">
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-matrix-accent"
          >
            ▶
          </motion.span>
          <span className="font-mono">{message}</span>
          {showPercentage && !isIndeterminate && progress !== undefined && (
            <span className="ml-auto text-matrix-accent">{Math.round(progress)}%</span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-matrix relative overflow-hidden">
        {isIndeterminate ? (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-accent to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ) : (
          <motion.div
            className="progress-matrix-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        )}

        {/* Scanline effect */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ['-100%', '200%'] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    </div>
  );
}

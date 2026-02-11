// src/components/ui/VerificationBadge.tsx
/**
 * Verification Badge Component
 * ============================
 * Compact badge showing verification status from Gemini 3 Flash QA agent.
 * Expandable panel with detailed checks, issues, and timing.
 */

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { VerificationResult } from '../../hooks/api/types';
import { cn } from '../../utils';

// ============================================
// TYPES
// ============================================

export interface VerificationBadgeProps {
  /** Verification result — null means loading */
  result: VerificationResult | null;
  /** True when verification is in progress */
  isLoading?: boolean;
  /** Compact mode: just icon + confidence */
  compact?: boolean;
  className?: string;
}

// ============================================
// STATUS CONFIG
// ============================================

const statusConfig = {
  pass: {
    icon: CheckCircle,
    color: 'text-white',
    bg: 'bg-white/10',
    border: 'border-white/20',
    label: 'Zweryfikowano',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    label: 'Ostrzeżenia',
  },
  fail: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'Problemy',
  },
};

// ============================================
// COMPONENT
// ============================================

export default function VerificationBadge({
  result,
  isLoading = false,
  compact = false,
  className,
}: VerificationBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Loading state
  if (isLoading || !result) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs',
          'bg-blue-500/10 text-blue-400 border border-blue-500/30',
          className,
        )}
      >
        <Loader2 size={12} className="animate-spin" />
        {!compact && <span>Weryfikacja...</span>}
      </div>
    );
  }

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  // Compact badge only
  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
          config.bg,
          config.color,
          `border ${config.border}`,
          className,
        )}
        title={`${config.label} — ${result.confidence}%`}
      >
        <StatusIcon size={10} />
        <span>{result.confidence}%</span>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border', config.border, config.bg, className)}>
      {/* Badge header — clickable to expand */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 text-xs',
          config.color,
          'hover:opacity-80 transition-opacity',
        )}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} />
          <StatusIcon size={14} />
          <span className="font-medium">{config.label}</span>
          <span className="opacity-70">{result.confidence}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-50 flex items-center gap-1">
            <Clock size={10} />
            {(result.processing_time_ms / 1000).toFixed(1)}s
          </span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expandable detail panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-white/5">
              {/* Checks */}
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-wider text-matrix-text-dim mb-1.5">
                  Sprawdzenia
                </p>
                <div className="space-y-1">
                  {result.checks.map((check) => (
                    <div key={check.name} className="flex items-center gap-2 text-xs">
                      {check.passed ? (
                        <CheckCircle size={12} className="text-white flex-shrink-0" />
                      ) : (
                        <XCircle size={12} className="text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-matrix-text-dim">{check.name}</span>
                      {check.detail && (
                        <span className="text-matrix-text-dim/50 truncate">{check.detail}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-matrix-text-dim mb-1.5">
                    Problemy
                  </p>
                  <div className="space-y-1.5">
                    {result.issues.map((issue, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: static list
                        key={i}
                        className="text-xs p-2 rounded bg-black/20"
                      >
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle size={10} className="text-yellow-400 flex-shrink-0" />
                          <span className="text-yellow-300">{issue.description}</span>
                        </div>
                        {issue.suggestion && (
                          <p className="text-matrix-text-dim mt-1 pl-4">{issue.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-matrix-text-dim mb-1.5">
                    Rekomendacje
                  </p>
                  <ul className="space-y-0.5">
                    {result.recommendations.map((rec) => (
                      <li key={rec} className="text-xs text-matrix-text-dim flex items-start gap-1">
                        <span className="text-white">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model info */}
              <div className="text-[10px] text-matrix-text-dim/50 pt-1 border-t border-white/5">
                Model: {result.model_used} | Etap: {result.stage}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

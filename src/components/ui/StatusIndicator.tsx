// src/components/ui/StatusIndicator.tsx
/**
 * Status Indicator Component
 * ==========================
 * Visual indicator for status states (online/offline, success/error, etc.)
 */
import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle, XCircle, AlertCircle, Loader2, Circle } from 'lucide-react';
import { cn } from '../../utils';

// ============================================
// INDICATOR VARIANTS
// ============================================

const indicatorVariants = cva(
  // Base styles
  'inline-flex items-center gap-2',
  {
    variants: {
      status: {
        online: 'text-green-400',
        offline: 'text-red-400',
        warning: 'text-yellow-400',
        loading: 'text-blue-400',
        idle: 'text-matrix-text-dim',
        success: 'text-green-400',
        error: 'text-red-400',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      status: 'idle',
      size: 'md',
    },
  }
);

const dotVariants = cva(
  // Base dot styles
  'rounded-full',
  {
    variants: {
      status: {
        online: 'bg-green-400',
        offline: 'bg-red-400',
        warning: 'bg-yellow-400',
        loading: 'bg-blue-400',
        idle: 'bg-matrix-text-dim',
        success: 'bg-green-400',
        error: 'bg-red-400',
      },
      size: {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
      },
    },
    defaultVariants: {
      status: 'idle',
      size: 'md',
    },
  }
);

// ============================================
// STATUS INDICATOR COMPONENT
// ============================================

export type StatusType = 'online' | 'offline' | 'warning' | 'loading' | 'idle' | 'success' | 'error';

export interface StatusIndicatorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof indicatorVariants> {
  label?: string;
  showIcon?: boolean;
  showDot?: boolean;
  pulse?: boolean;
}

const statusIcons: Record<StatusType, ReactNode> = {
  online: <CheckCircle className="w-4 h-4" />,
  offline: <XCircle className="w-4 h-4" />,
  warning: <AlertCircle className="w-4 h-4" />,
  loading: <Loader2 className="w-4 h-4 animate-spin" />,
  idle: <Circle className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4" />,
  error: <XCircle className="w-4 h-4" />,
};

export function StatusIndicator({
  className,
  status = 'idle',
  size = 'md',
  label,
  showIcon = false,
  showDot = true,
  pulse = false,
  ...props
}: StatusIndicatorProps) {
  return (
    <div className={cn(indicatorVariants({ status, size }), className)} {...props}>
      {showDot && (
        <span className="relative flex items-center justify-center">
          <span className={cn(dotVariants({ status, size }))} />
          {pulse && (status === 'online' || status === 'loading') && (
            <motion.span
              className={cn(dotVariants({ status, size }), 'absolute opacity-75')}
              animate={{
                scale: [1, 2],
                opacity: [0.75, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}
        </span>
      )}
      {showIcon && statusIcons[status as StatusType]}
      {label && <span>{label}</span>}
    </div>
  );
}

// ============================================
// PRESET INDICATORS
// ============================================

export function OnlineIndicator({ label = 'Online' }: { label?: string }) {
  return <StatusIndicator status="online" label={label} pulse />;
}

export function OfflineIndicator({ label = 'Offline' }: { label?: string }) {
  return <StatusIndicator status="offline" label={label} />;
}

export function LoadingIndicator({ label = 'Ładowanie...' }: { label?: string }) {
  return <StatusIndicator status="loading" label={label} showIcon showDot={false} />;
}

// ============================================
// PROVIDER STATUS
// ============================================

export interface ProviderStatusIndicatorProps {
  available: boolean;
  enabled: boolean;
  name?: string;
}

export function ProviderStatusIndicator({
  available,
  enabled,
  name,
}: ProviderStatusIndicatorProps) {
  const status: StatusType = available && enabled ? 'online' : available ? 'warning' : 'offline';
  const statusLabels: Record<StatusType, string> = {
    online: 'Aktywny',
    warning: 'Wyłączony',
    offline: 'Brak klucza',
    loading: 'Sprawdzanie...',
    idle: 'Nieznany',
    success: 'OK',
    error: 'Błąd',
  };

  return (
    <StatusIndicator
      status={status}
      label={name ? `${name}: ${statusLabels[status]}` : statusLabels[status]}
      pulse={status === 'online'}
    />
  );
}

export default StatusIndicator;

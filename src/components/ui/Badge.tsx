// src/components/ui/Badge.tsx
/**
 * Badge Component
 * ===============
 * Reusable badge/tag component with variants.
 */
import { type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

// ============================================
// BADGE VARIANTS
// ============================================

const badgeVariants = cva(
  // Base styles
  'inline-flex items-center gap-1 font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/30',
        success: 'bg-green-500/10 text-green-400 border border-green-500/30',
        warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
        error: 'bg-red-500/10 text-red-400 border border-red-500/30',
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        muted: 'bg-matrix-bg-secondary text-matrix-text-dim border border-matrix-border',
        outline: 'bg-transparent text-matrix-text border border-matrix-border',
        // Provider-specific variants
        google: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        anthropic: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
        openai: 'bg-green-500/10 text-green-400 border border-green-500/30',
        mistral: 'bg-purple-500/10 text-purple-400 border border-purple-500/30',
        groq: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
        ollama: 'bg-gray-500/10 text-gray-400 border border-gray-500/30',
      },
      size: {
        xs: 'text-[10px] px-1.5 py-0.5 rounded',
        sm: 'text-xs px-2 py-0.5 rounded',
        md: 'text-sm px-2.5 py-1 rounded-md',
        lg: 'text-base px-3 py-1.5 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'sm',
    },
  }
);

// ============================================
// COMPONENT
// ============================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: ReactNode;
  children: ReactNode;
}

export function Badge({
  className,
  variant,
  size,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// ============================================
// PRESET BADGES
// ============================================

export function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' }) {
  const variants: Record<typeof severity, VariantProps<typeof badgeVariants>['variant']> = {
    low: 'success',
    medium: 'warning',
    high: 'error',
    critical: 'error',
  };

  const labels: Record<typeof severity, string> = {
    low: 'Niski',
    medium: 'Średni',
    high: 'Wysoki',
    critical: 'Krytyczny',
  };

  return (
    <Badge variant={variants[severity]} size="xs">
      {labels[severity]}
    </Badge>
  );
}

export function ProviderBadge({ provider }: { provider: string }) {
  const variant = provider as VariantProps<typeof badgeVariants>['variant'];
  return (
    <Badge variant={variant || 'muted'} size="xs">
      {provider}
    </Badge>
  );
}

export function CapabilityBadge({ capability }: { capability: 'vision' | 'text' | 'restoration' }) {
  const variants: Record<typeof capability, VariantProps<typeof badgeVariants>['variant']> = {
    vision: 'info',
    text: 'success',
    restoration: 'default',
  };

  return (
    <Badge variant={variants[capability]} size="xs">
      {capability}
    </Badge>
  );
}

export default Badge;

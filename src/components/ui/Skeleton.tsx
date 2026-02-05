// src/components/ui/Skeleton.tsx
/**
 * Skeleton Loader
 * ===============
 * Loading placeholder component.
 */
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-matrix-border/50';

  const variantStyles = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: '',
    none: '',
  };

  if (animation === 'wave') {
    return (
      <div
        className={clsx(baseStyles, variantStyles[variant], className, 'relative overflow-hidden')}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-accent/10 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        baseStyles,
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
    />
  );
}

// Preset components
Skeleton.Text = ({ className, lines = 1 }: { className?: string; lines?: number }) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}
      />
    ))}
  </div>
);

Skeleton.Avatar = ({ size = 40 }: { size?: number }) => (
  <div
    className="flex-shrink-0 bg-matrix-border/50 rounded-full animate-pulse"
    style={{ width: size, height: size }}
  />
);

Skeleton.Card = ({ className }: { className?: string }) => (
  <div className={clsx('glass-panel p-4 space-y-4', className)}>
    <Skeleton className="h-32 w-full" />
    <Skeleton.Text lines={2} />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

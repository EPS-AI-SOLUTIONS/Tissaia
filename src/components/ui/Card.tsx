// src/components/ui/Card.tsx
/**
 * Card Component
 * ==============
 * Reusable card container with glass effect variants.
 */
import { type ReactNode, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

// ============================================
// CARD VARIANTS
// ============================================

const cardVariants = cva(
  // Base styles
  'rounded-xl transition-all',
  {
    variants: {
      variant: {
        default: 'bg-matrix-bg-secondary border border-matrix-border',
        glass: 'glass-panel',
        elevated: 'bg-matrix-bg-secondary border border-matrix-border shadow-lg',
        outline: 'bg-transparent border border-matrix-border',
        accent: 'bg-matrix-accent/10 border border-matrix-accent/30',
        success: 'bg-green-500/10 border border-green-500/30',
        warning: 'bg-yellow-500/10 border border-yellow-500/30',
        error: 'bg-red-500/10 border border-red-500/30',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-lg hover:-translate-y-0.5',
        glow: 'hover:border-matrix-accent/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)]',
        highlight: 'hover:bg-matrix-accent/5',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: 'none',
    },
  }
);

// ============================================
// CARD COMPONENT
// ============================================

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, hover }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// CARD HEADER
// ============================================

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between pb-4 border-b border-matrix-border', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================
// CARD TITLE
// ============================================

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  icon?: ReactNode;
}

export function CardTitle({ className, children, icon, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold flex items-center gap-2', className)} {...props}>
      {icon && <span className="text-matrix-accent">{icon}</span>}
      {children}
    </h3>
  );
}

// ============================================
// CARD CONTENT
// ============================================

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('pt-4', className)} {...props}>
      {children}
    </div>
  );
}

// ============================================
// CARD FOOTER
// ============================================

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('flex items-center justify-between pt-4 border-t border-matrix-border mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

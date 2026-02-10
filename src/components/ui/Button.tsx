// src/components/ui/Button.tsx
/**
 * Button Component
 * ================
 * Reusable button component with variants.
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';

// ============================================
// BUTTON VARIANTS
// ============================================

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-matrix-accent focus-visible:ring-offset-2 focus-visible:ring-offset-matrix-bg-primary',
  {
    variants: {
      variant: {
        primary: 'btn-glow',
        secondary: 'btn-secondary',
        ghost: 'bg-transparent hover:bg-matrix-accent/10 text-matrix-text',
        outline:
          'bg-transparent border border-matrix-border hover:border-matrix-accent/50 text-matrix-text',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30',
        success: 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30',
        link: 'bg-transparent text-matrix-accent hover:underline p-0',
      },
      size: {
        xs: 'text-xs px-2 py-1 rounded',
        sm: 'text-sm px-3 py-1.5 rounded-md',
        md: 'text-sm px-4 py-2 rounded-lg',
        lg: 'text-base px-6 py-3 rounded-lg',
        xl: 'text-lg px-8 py-4 rounded-xl',
        icon: 'p-2 rounded-lg',
        'icon-sm': 'p-1.5 rounded-md',
        'icon-lg': 'p-3 rounded-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  },
);

// ============================================
// COMPONENT
// ============================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

// ============================================
// ICON BUTTON
// ============================================

export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'icon', ...props }, ref) => {
    return (
      <Button ref={ref} size={size} {...props}>
        {icon}
      </Button>
    );
  },
);

IconButton.displayName = 'IconButton';

export default Button;

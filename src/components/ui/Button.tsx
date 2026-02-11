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
  'inline-flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  {
    variants: {
      variant: {
        primary: 'btn-glow',
        secondary: 'btn-secondary',
        ghost: 'bg-transparent hover:bg-white/10 text-white/80',
        outline: 'bg-transparent border border-white/10 hover:border-white/30 text-white/80',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30',
        success: 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20',
        link: 'bg-transparent text-white hover:underline p-0',
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

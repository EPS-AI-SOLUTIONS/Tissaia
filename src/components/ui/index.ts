// src/components/ui/index.ts
/**
 * UI Components - Barrel Export
 * =============================
 * Centralized exports for all UI components.
 */

export { default as AnalysisProgressBar } from './AnalysisProgressBar';
export type { BadgeProps } from './Badge';
// Badge Component
export { Badge, CapabilityBadge, ProviderBadge, SeverityBadge } from './Badge';
// Browser Mode Warning
export { default as BrowserModeWarning } from './BrowserModeWarning';
export type { ButtonProps, IconButtonProps } from './Button';
// Button Component
export { Button, IconButton } from './Button';
export type {
  CardContentProps,
  CardFooterProps,
  CardHeaderProps,
  CardProps,
  CardTitleProps,
} from './Card';
// Card Component
export { Card, CardContent, CardFooter, CardHeader, CardTitle } from './Card';
// Model Selector
export { default as ModelSelector } from './ModelSelector';
// Progress Components
export { default as ProgressBar } from './ProgressBar';

// Skeleton Component
export { default as Skeleton } from './Skeleton';
export type {
  ProviderStatusIndicatorProps,
  StatusIndicatorProps,
  StatusType,
} from './StatusIndicator';
// Status Indicator Component
export {
  LoadingIndicator,
  OfflineIndicator,
  OnlineIndicator,
  ProviderStatusIndicator,
  StatusIndicator,
} from './StatusIndicator';

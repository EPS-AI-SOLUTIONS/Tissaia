// src/components/ui/index.ts
/**
 * UI Components - Barrel Export
 * =============================
 * Centralized exports for all UI components.
 */

// Badge Component
export { Badge, SeverityBadge, ProviderBadge, CapabilityBadge } from './Badge';
export type { BadgeProps } from './Badge';

// Button Component
export { Button, IconButton } from './Button';
export type { ButtonProps, IconButtonProps } from './Button';

// Card Component
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps, CardFooterProps } from './Card';

// Status Indicator Component
export {
  StatusIndicator,
  OnlineIndicator,
  OfflineIndicator,
  LoadingIndicator,
  ProviderStatusIndicator,
} from './StatusIndicator';
export type { StatusIndicatorProps, StatusType, ProviderStatusIndicatorProps } from './StatusIndicator';

// Progress Components
export { default as ProgressBar } from './ProgressBar';
export { default as AnalysisProgressBar } from './AnalysisProgressBar';

// Skeleton Component
export { default as Skeleton } from './Skeleton';

// Model Selector
export { default as ModelSelector } from './ModelSelector';

// Browser Mode Warning
export { default as BrowserModeWarning } from './BrowserModeWarning';

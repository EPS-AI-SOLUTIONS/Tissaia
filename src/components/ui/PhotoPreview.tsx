// src/components/ui/PhotoPreview.tsx
/**
 * Reusable Photo Preview Component
 * =================================
 * Unified image preview with variant presets.
 */

interface PhotoPreviewProps {
  src: string;
  alt: string;
  variant?: 'thumbnail' | 'card' | 'large' | 'full' | 'compare';
  size?: string;
  fit?: 'cover' | 'contain' | 'none';
  rounded?: string;
  loading?: 'lazy' | 'eager';
  active?: boolean;
  hoverScale?: boolean;
  gradientOverlay?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const VARIANT_DEFAULTS: Record<
  string,
  { size: string; fit: string; rounded: string; loading: 'lazy' | 'eager' }
> = {
  thumbnail: { size: 'w-12 h-12', fit: 'object-cover', rounded: 'rounded-lg', loading: 'eager' },
  card: { size: 'aspect-square', fit: 'object-cover', rounded: 'rounded-lg', loading: 'lazy' },
  large: { size: 'w-48 h-48', fit: 'object-cover', rounded: 'rounded-xl', loading: 'eager' },
  full: { size: 'w-full h-auto', fit: '', rounded: 'rounded-lg', loading: 'eager' },
  compare: { size: 'aspect-square', fit: 'object-contain', rounded: 'rounded-lg', loading: 'lazy' },
};

export default function PhotoPreview({
  src,
  alt,
  variant = 'card',
  size,
  fit,
  rounded,
  loading,
  active,
  hoverScale,
  gradientOverlay,
  className = '',
  children,
}: PhotoPreviewProps) {
  const defaults = VARIANT_DEFAULTS[variant] ?? VARIANT_DEFAULTS.card;

  const resolvedSize = size ?? defaults.size;
  const resolvedFit = fit ? `object-${fit}` : defaults.fit;
  const resolvedRounded = rounded ?? defaults.rounded;
  const resolvedLoading = loading ?? defaults.loading;

  const borderClass =
    active !== undefined
      ? active
        ? 'border-2 border-white'
        : 'border-2 border-white/10 hover:border-white/30'
      : '';

  return (
    <div
      className={`relative ${resolvedSize} ${resolvedRounded} overflow-hidden ${borderClass} ${className}`.trim()}
    >
      <img
        src={src}
        alt={alt}
        className={`w-full h-full ${resolvedFit} ${hoverScale ? 'transition-transform group-hover:scale-105' : ''}`.trim()}
        loading={resolvedLoading}
      />
      {gradientOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      {children}
    </div>
  );
}

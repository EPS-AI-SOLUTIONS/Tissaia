// src/components/ui/ImageLightbox.tsx
/**
 * Image Lightbox / Hover Zoom
 * ============================
 * Shows a fullscreen overlay with the image scaled to fit the window
 * when the user hovers over the image. Closes on mouse leave.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

export default function ImageLightbox({ src, alt, className = '', children }: ImageLightboxProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Trigger element */}
      <button
        type="button"
        className={`relative cursor-zoom-in border-none bg-transparent p-0 ${className}`}
        onMouseEnter={() => setIsHovered(true)}
      >
        {children || <img src={src} alt={alt} className="w-full h-auto rounded-lg" />}
      </button>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-zoom-out"
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsHovered(false)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              src={src}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

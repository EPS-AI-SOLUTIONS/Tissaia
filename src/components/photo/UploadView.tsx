// src/components/photo/UploadView.tsx
/**
 * Photo Upload View
 * =================
 * Drag & drop photo upload with preview - Regis Style.
 */
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Upload, X, ImagePlus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/useAppStore';
import { useViewTheme } from '../../hooks';
import type { PhotoFile } from '../../types';

// ============================================
// CONSTANTS
// ============================================

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};
const AUTO_NAVIGATE_DELAY_MS = 500;

// ============================================
// UPLOAD VIEW COMPONENT
// ============================================

export default function UploadView() {
  const { t } = useTranslation();
  const { photos, addPhoto, removePhoto, clearPhotos, setCurrentView, settings } = useAppStore();
  const [isDragActive, setIsDragActive] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const theme = useViewTheme();

  // Note: No cleanup needed - we now use base64 data URLs instead of blob URLs
  // which don't require manual revocation

  // Convert file to base64 data URL for Tauri compatibility
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach(async (file) => {
        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: ${t('upload.maxSize')}`);
          return;
        }

        // Create preview as base64 data URL (works in Tauri WebView)
        const preview = await fileToDataUrl(file);

        // Add to store
        const photoFile: PhotoFile = {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          file,
          preview,
          mimeType: file.type,
          size: file.size,
          name: file.name,
          uploadedAt: new Date(),
        };

        addPhoto(photoFile);
        toast.success(t('upload.added', { name: file.name }));
      });

      // Auto-navigate if auto-analyze is enabled
      if (settings.autoAnalyze && acceptedFiles.length > 0) {
        setTimeout(() => setCurrentView('analyze'), AUTO_NAVIGATE_DELAY_MS);
      }
    },
    [addPhoto, settings.autoAnalyze, setCurrentView, t]
  );

  // Handle photo removal with proper cleanup
  const handleRemovePhoto = useCallback(
    (photo: PhotoFile) => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      removePhoto(photo.id);
    },
    [removePhoto]
  );

  // Handle clear all with proper cleanup
  const handleClearAll = useCallback(() => {
    photos.forEach((photo) => {
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
    });
    clearPhotos();
  }, [photos, clearPhotos]);

  // Dropzone config
  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
  });

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Animation variants (respect reduced motion)
  const scaleVariant = shouldReduceMotion
    ? {}
    : { scale: isDragActive ? 1.05 : 1 };

  const itemVariants = shouldReduceMotion
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
      };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.accentBg}`}>
            <ImagePlus className={theme.iconAccent} size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${theme.textAccent}`}>{t('upload.title')}</h2>
            <p className={theme.textMuted}>{t('app.tagline')}</p>
          </div>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          flex-1 flex flex-col items-center justify-center rounded-2xl
          border-2 border-dashed transition-all duration-200 cursor-pointer
          ${theme.isLight ? 'border-slate-300/50' : 'border-white/20'}
          ${isDragActive ? `${theme.accentBorder} ${theme.accentBg} scale-[1.01]` : ''}
          ${isDragReject ? 'border-red-500 bg-red-500/5' : ''}
          ${theme.card}
        `}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={scaleVariant}
          className="text-center"
        >
          <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl ${theme.accentBg} flex items-center justify-center`}>
            <Upload
              size={48}
              className={isDragActive ? theme.iconAccent : theme.iconMuted}
            />
          </div>

          <h3 className={`text-xl font-semibold mb-2 ${theme.title}`}>{t('upload.dragdrop')}</h3>
          <p className={`${theme.textMuted} mb-4`}>{t('upload.or')}</p>
          <button className={theme.btnPrimary + ' px-6 py-2.5 font-medium'}>
            {t('upload.browse')}
          </button>

          <div className={`mt-6 text-sm ${theme.textMuted} space-y-1`}>
            <p>{t('upload.formats')}</p>
            <p>{t('upload.maxSize')}</p>
          </div>
        </motion.div>
      </div>

      {/* Uploaded Photos Preview */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={shouldReduceMotion ? {} : { opacity: 0, height: 0 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? {} : { opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${theme.title}`}>
                {t('upload.uploadedPhotos', { count: photos.length })}
              </h3>
              <button
                onClick={handleClearAll}
                className={`text-sm ${theme.textMuted} hover:text-red-400 transition-colors`}
              >
                {t('upload.removeAll')}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  {...itemVariants}
                  className="relative group"
                >
                  <div className={`${theme.card} aspect-square overflow-hidden`}>
                    <img
                      src={photo.preview}
                      alt={photo.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${theme.isLight ? 'from-black/30' : 'from-black/60'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => handleRemovePhoto(photo)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
                    aria-label={t('common.delete')}
                  >
                    <X size={14} />
                  </button>

                  {/* File info */}
                  <div className={`mt-2 text-xs ${theme.textMuted} truncate`}>
                    {photo.name}
                  </div>
                  <div className={`text-xs ${theme.textMuted}`}>
                    {formatSize(photo.size)}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setCurrentView('analyze')}
                className={theme.btnPrimary + ' px-6 py-2.5 font-medium flex items-center gap-2'}
              >
                <Sparkles size={16} />
                {t('upload.analyzePhotos')} →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

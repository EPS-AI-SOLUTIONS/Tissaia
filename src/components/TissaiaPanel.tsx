/**
 * TissaiaPanel Component
 * =====================
 * React component for the Tissaia Forensic Restoration Engine.
 * Provides a complete UI for image processing with progress tracking.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Pause,
  Play,
  X,
  Settings,
  Eye,
  AlertTriangle,
  FileImage,
  Scan,
  Scissors,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  TissaiaPipeline,
  CONFIG_PRESETS,
  type TissaiaConfig,
  type PipelineProgress,
  type RestoredImage,
  type StageNumber,
} from '../services/tissaia';

// ============================================
// TYPES
// ============================================

interface TissaiaPanelProps {
  className?: string;
  defaultPreset?: keyof typeof CONFIG_PRESETS;
  onComplete?: (result: RestoredImage) => void;
  onError?: (error: Error) => void;
}

type ViewMode = 'upload' | 'processing' | 'result';

// ============================================
// STAGE INFO
// ============================================

const STAGE_ICONS: Record<StageNumber, React.ElementType> = {
  1: FileImage,
  2: Scan,
  3: Scissors,
  4: Sparkles,
};

const STAGE_NAMES: Record<StageNumber, string> = {
  1: 'Ingestion',
  2: 'Detection',
  3: 'SmartCrop',
  4: 'Alchemy',
};

const STAGE_DESCRIPTIONS: Record<StageNumber, string> = {
  1: 'Loading and validating image',
  2: 'Detecting objects and damage',
  3: 'Smart cropping and segmentation',
  4: 'Restoration and enhancement',
};

// ============================================
// SUBCOMPONENTS
// ============================================

interface StageIndicatorProps {
  stage: StageNumber;
  currentStage: StageNumber;
  progress: number;
  isComplete: boolean;
}

function StageIndicator({ stage, currentStage, progress, isComplete }: StageIndicatorProps) {
  const Icon = STAGE_ICONS[stage];
  const isActive = stage === currentStage;
  const isPast = stage < currentStage || isComplete;

  return (
    <div className="flex items-center gap-2">
      <motion.div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center
          transition-colors border-2
          ${isPast ? 'bg-green-500/20 border-green-500 text-green-400' :
            isActive ? 'bg-matrix-accent/20 border-matrix-accent text-matrix-accent' :
            'bg-matrix-bg-secondary border-matrix-border text-matrix-text-dim'}
        `}
        animate={isActive ? {
          scale: [1, 1.1, 1],
          boxShadow: ['0 0 0 0 rgba(0, 255, 136, 0)', '0 0 0 8px rgba(0, 255, 136, 0.2)', '0 0 0 0 rgba(0, 255, 136, 0)'],
        } : {}}
        transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
      >
        {isPast ? (
          <CheckCircle className="w-5 h-5" />
        ) : isActive ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </motion.div>

      <div className="flex-1 min-w-0 hidden sm:block">
        <div className="text-sm font-medium truncate">
          {STAGE_NAMES[stage]}
        </div>
        <div className="text-xs text-matrix-text-dim truncate">
          {isActive ? `${progress}%` : isPast ? 'Complete' : STAGE_DESCRIPTIONS[stage]}
        </div>
      </div>
    </div>
  );
}

interface DropZoneProps {
  onFileDrop: (file: File) => void;
  disabled?: boolean;
}

function DropZone({ onFileDrop, disabled }: DropZoneProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileDrop(file);
    } else {
      toast.error('Please drop an image file');
    }
  }, [disabled, onFileDrop]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileDrop(file);
    }
  }, [onFileDrop]);

  return (
    <motion.div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center
        transition-colors cursor-pointer
        ${isDragging ? 'border-matrix-accent bg-matrix-accent/10' :
          'border-matrix-border hover:border-matrix-accent/50 hover:bg-matrix-bg-secondary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      whileHover={disabled ? {} : { scale: 1.01 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-matrix-accent' : 'text-matrix-text-dim'}`} />

      <p className="text-lg font-medium mb-2">
        {isDragging ? 'Drop image here' : t('upload.dragdrop', 'Drag and drop image here')}
      </p>

      <p className="text-sm text-matrix-text-dim mb-4">
        {t('upload.or', 'or')} <span className="text-matrix-accent">{t('upload.browse', 'browse files')}</span>
      </p>

      <p className="text-xs text-matrix-text-dim">
        PNG, JPG, JPEG, TIFF, BMP, WebP • Max 50MB
      </p>
    </motion.div>
  );
}

interface ResultViewProps {
  result: RestoredImage;
  originalPreview?: string;
  onDownload: () => void;
  onReset: () => void;
}

function ResultView({ result, originalPreview, onDownload, onReset }: ResultViewProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [compareMode, setCompareMode] = useState<'side' | 'overlay'>('side');

  const { report } = result;

  return (
    <div className="space-y-6">
      {/* Before/After Comparison */}
      <div className="glass-panel p-4 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{t('results.title', 'Restoration Result')}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCompareMode('side')}
              className={`px-3 py-1 rounded text-sm ${compareMode === 'side' ? 'bg-matrix-accent text-black' : 'bg-matrix-bg-secondary'}`}
            >
              Side by Side
            </button>
            <button
              onClick={() => setCompareMode('overlay')}
              className={`px-3 py-1 rounded text-sm ${compareMode === 'overlay' ? 'bg-matrix-accent text-black' : 'bg-matrix-bg-secondary'}`}
            >
              Overlay
            </button>
          </div>
        </div>

        {compareMode === 'side' ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-matrix-text-dim mb-2 text-center">{t('results.before', 'Before')}</p>
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="Original"
                  className="w-full h-64 object-contain bg-matrix-bg-secondary rounded-lg"
                />
              )}
            </div>
            <div>
              <p className="text-sm text-matrix-text-dim mb-2 text-center">{t('results.after', 'After')}</p>
              <img
                src={result.dataUrl}
                alt="Restored"
                className="w-full h-64 object-contain bg-matrix-bg-secondary rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="relative h-64 bg-matrix-bg-secondary rounded-lg overflow-hidden">
            {originalPreview && (
              <img
                src={originalPreview}
                alt="Original"
                className="absolute inset-0 w-full h-full object-contain"
              />
            )}
            <motion.div
              className="absolute inset-0"
              initial={{ clipPath: 'inset(0 50% 0 0)' }}
              whileHover={{ clipPath: 'inset(0 0 0 0)' }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={result.dataUrl}
                alt="Restored"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-matrix-accent" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-green-400">
            +{report.qualityScore.improvement}%
          </p>
          <p className="text-sm text-matrix-text-dim">Quality Improvement</p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-matrix-accent">
            {report.enhancementsApplied.length}
          </p>
          <p className="text-sm text-matrix-text-dim">Enhancements</p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-matrix-accent">
            {report.damageRepaired.length}
          </p>
          <p className="text-sm text-matrix-text-dim">Damages Repaired</p>
        </div>
        <div className="glass-panel p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-matrix-accent">
            {(report.processingTime.total / 1000).toFixed(1)}s
          </p>
          <p className="text-sm text-matrix-text-dim">Processing Time</p>
        </div>
      </div>

      {/* Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm text-matrix-text-dim hover:text-matrix-accent"
      >
        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-4 rounded-xl space-y-4">
              {/* Enhancements */}
              <div>
                <h4 className="font-medium mb-2">Enhancements Applied</h4>
                <div className="flex flex-wrap gap-2">
                  {report.enhancementsApplied.map((e, i) => (
                    <span key={i} className="px-2 py-1 bg-matrix-accent/20 text-matrix-accent rounded text-sm">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quality Scores */}
              <div>
                <h4 className="font-medium mb-2">Quality Scores</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-matrix-text-dim">Before</p>
                    <p>Sharpness: {report.qualityScore.before.sharpness.toFixed(1)}</p>
                    <p>Contrast: {report.qualityScore.before.contrast.toFixed(1)}</p>
                    <p>Overall: {report.qualityScore.before.overall.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-matrix-text-dim">After</p>
                    <p>Sharpness: {report.qualityScore.after.sharpness.toFixed(1)}</p>
                    <p>Contrast: {report.qualityScore.after.contrast.toFixed(1)}</p>
                    <p>Overall: {report.qualityScore.after.overall.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={onDownload} className="btn-glow flex-1 flex items-center justify-center gap-2">
          <Download size={18} />
          {t('results.download', 'Download')}
        </button>
        <button onClick={onReset} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <RefreshCw size={18} />
          Process Another
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function TissaiaPanel({
  className = '',
  defaultPreset,
  onComplete,
  onError,
}: TissaiaPanelProps) {
  const { t } = useTranslation();

  // State
  const [pipeline] = useState(() => new TissaiaPipeline(
    defaultPreset ? CONFIG_PRESETS[defaultPreset] : undefined
  ));
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [result, setResult] = useState<RestoredImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Pipeline event handlers
  useEffect(() => {
    const handleProgress = () => {
      setProgress(pipeline.getProgress());
    };

    const handleComplete = ({ result }: { result: RestoredImage }) => {
      setResult(result);
      setProgress(null);
      setViewMode('result');
      onComplete?.(result);
      toast.success('Image restored successfully!');
    };

    const handleError = ({ error }: { error: Error }) => {
      setError(error.message);
      setProgress(null);
      setViewMode('upload');
      onError?.(error);
      toast.error(`Processing failed: ${error.message}`);
    };

    pipeline.on('stage:progress', handleProgress);
    pipeline.on('stage:start', handleProgress);
    pipeline.on('pipeline:complete', handleComplete);
    pipeline.on('stage:error', handleError);
    pipeline.on('pipeline:error', handleError);

    return () => {
      pipeline.off('stage:progress', handleProgress);
      pipeline.off('stage:start', handleProgress);
      pipeline.off('pipeline:complete', handleComplete);
      pipeline.off('stage:error', handleError);
      pipeline.off('pipeline:error', handleError);
    };
  }, [pipeline, onComplete, onError]);

  // Handlers
  const handleFileDrop = useCallback(async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setResult(null);
    setViewMode('processing');

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      await pipeline.process(file);
    } catch (err) {
      // Error handled by event listener
    }
  }, [pipeline]);

  const handlePauseResume = useCallback(() => {
    if (pipeline.isPaused()) {
      pipeline.resume();
    } else {
      pipeline.pause();
    }
    setProgress(pipeline.getProgress());
  }, [pipeline]);

  const handleCancel = useCallback(() => {
    pipeline.cancel();
    setProgress(null);
    setViewMode('upload');
  }, [pipeline]);

  const handleDownload = useCallback(() => {
    if (!result) return;

    const link = document.createElement('a');
    link.href = result.dataUrl;
    link.download = `restored_${result.metadata.originalName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  const handleReset = useCallback(() => {
    setViewMode('upload');
    setResult(null);
    setProgress(null);
    setError(null);
    setOriginalPreview(null);
    setSelectedFile(null);
  }, []);

  return (
    <div className={`tissaia-panel ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-matrix-accent flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Tissaia Forensic Restoration
          </h2>
          <p className="text-sm text-matrix-text-dim mt-1">
            Advanced 4-stage image processing pipeline
          </p>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4 text-red-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <DropZone onFileDrop={handleFileDrop} disabled={false} />
          </motion.div>
        )}

        {viewMode === 'processing' && progress && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Stage Indicators */}
            <div className="glass-panel p-4 rounded-xl">
              <div className="grid grid-cols-4 gap-4">
                {([1, 2, 3, 4] as StageNumber[]).map((stage) => (
                  <StageIndicator
                    key={stage}
                    stage={stage}
                    currentStage={progress.currentStage}
                    progress={stage === progress.currentStage ? progress.stageProgress : 0}
                    isComplete={progress.status === 'complete'}
                  />
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="glass-panel p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Overall Progress
                </span>
                <span className="text-sm text-matrix-accent font-mono">
                  {progress.overallProgress}%
                </span>
              </div>

              <div className="h-3 bg-matrix-bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-matrix-accent/80 to-matrix-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.overallProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <p className="text-sm text-matrix-text-dim mt-2">
                {progress.message}
              </p>

              {progress.estimatedTimeRemaining && (
                <p className="text-xs text-matrix-text-dim mt-1">
                  Estimated time remaining: ~{Math.ceil(progress.estimatedTimeRemaining / 1000)}s
                </p>
              )}
            </div>

            {/* Preview */}
            {originalPreview && (
              <div className="glass-panel p-4 rounded-xl">
                <p className="text-sm text-matrix-text-dim mb-2">Processing: {selectedFile?.name}</p>
                <img
                  src={originalPreview}
                  alt="Processing"
                  className="w-full max-h-48 object-contain rounded-lg opacity-50"
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-4">
              <button
                onClick={handlePauseResume}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                {progress.status === 'paused' ? (
                  <>
                    <Play size={18} />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause size={18} />
                    Pause
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                className="btn-secondary flex-1 flex items-center justify-center gap-2 hover:bg-red-500/20 hover:border-red-500/50"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </motion.div>
        )}

        {viewMode === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultView
              result={result}
              originalPreview={originalPreview || undefined}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TissaiaPanel;

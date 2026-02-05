/**
 * AnalysisProgressBar - Animowany pasek postępu analizy obrazu
 *
 * Wyświetla etapy analizy z animacjami:
 * 1. Inicjalizacja
 * 2. Detekcja kolorów
 * 3. Analiza tekstur
 * 4. Wykrywanie twarzy
 * 5. Detekcja uszkodzeń
 * 6. Generowanie raportu AI
 */
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Palette,
  Grid3X3,
  Scan,
  AlertTriangle,
  FileText,
  Check,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';

interface AnalysisProgressBarProps {
  /** Czy analiza jest w toku */
  isAnalyzing: boolean;
  /** Callback po zakończeniu animacji */
  onComplete?: () => void;
}

interface AnalysisStep {
  id: string;
  labelKey: string;
  icon: LucideIcon;
  startPercent: number;
  endPercent: number;
  duration: number;
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: 'init',
    labelKey: 'progress.analysis.init',
    icon: Loader2,
    startPercent: 0,
    endPercent: 10,
    duration: 500,
  },
  {
    id: 'colors',
    labelKey: 'progress.analysis.colors',
    icon: Palette,
    startPercent: 10,
    endPercent: 25,
    duration: 1500,
  },
  {
    id: 'textures',
    labelKey: 'progress.analysis.textures',
    icon: Grid3X3,
    startPercent: 25,
    endPercent: 45,
    duration: 2000,
  },
  {
    id: 'faces',
    labelKey: 'progress.analysis.faces',
    icon: Scan,
    startPercent: 45,
    endPercent: 60,
    duration: 1500,
  },
  {
    id: 'damage',
    labelKey: 'progress.analysis.damage',
    icon: AlertTriangle,
    startPercent: 60,
    endPercent: 80,
    duration: 2000,
  },
  {
    id: 'report',
    labelKey: 'progress.analysis.report',
    icon: FileText,
    startPercent: 80,
    endPercent: 100,
    duration: 1500,
  },
];

// Oblicz całkowity czas animacji
const TOTAL_DURATION = ANALYSIS_STEPS.reduce((sum, step) => sum + step.duration, 0);

export function AnalysisProgressBar({ isAnalyzing, onComplete }: AnalysisProgressBarProps) {
  const { t } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Reset state when analysis starts
  useEffect(() => {
    if (isAnalyzing) {
      setCurrentStepIndex(0);
      setProgress(0);
      setIsComplete(false);
    }
  }, [isAnalyzing]);

  // Animate through steps
  useEffect(() => {
    if (!isAnalyzing || isComplete) return;

    const currentStep = ANALYSIS_STEPS[currentStepIndex];
    if (!currentStep) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Animate progress within current step
    const startProgress = currentStep.startPercent;
    const endProgress = currentStep.endPercent;
    const duration = currentStep.duration;
    const startTime = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const stepProgress = Math.min(elapsed / duration, 1);
      const newProgress = startProgress + (endProgress - startProgress) * stepProgress;

      setProgress(newProgress);

      if (stepProgress < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        // Move to next step
        if (currentStepIndex < ANALYSIS_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      }
    };

    const frameId = requestAnimationFrame(animateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [isAnalyzing, currentStepIndex, isComplete, onComplete]);

  const currentStep = ANALYSIS_STEPS[currentStepIndex];
  const CurrentIcon = currentStep?.icon || Loader2;

  // Estimated remaining time
  const getRemainingTime = useCallback(() => {
    const remainingSteps = ANALYSIS_STEPS.slice(currentStepIndex);
    const remainingMs = remainingSteps.reduce((sum, step) => sum + step.duration, 0);
    return Math.ceil(remainingMs / 1000);
  }, [currentStepIndex]);

  if (!isAnalyzing && !isComplete) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-matrix-bg-secondary/80 backdrop-blur-sm border border-matrix-border rounded-xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-matrix-accent"
        >
          <Zap size={24} />
        </motion.div>
        <h3 className="text-lg font-semibold text-matrix-text">
          {t('analyze.title', 'Analiza zdjęcia')}
        </h3>
        <span className="ml-auto text-matrix-accent font-mono text-sm">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between px-2">
        {ANALYSIS_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              {/* Step dot/icon */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? [1, 1.15, 1] : 1,
                  backgroundColor: isCompleted
                    ? 'rgb(34, 197, 94)'
                    : isCurrent
                      ? 'rgb(0, 255, 65)'
                      : 'rgb(55, 65, 81)',
                }}
                transition={{
                  scale: { duration: 0.6, repeat: isCurrent ? Infinity : 0 },
                  backgroundColor: { duration: 0.3 },
                }}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  border-2 transition-colors
                  ${isCompleted ? 'border-green-500' : isCurrent ? 'border-matrix-accent' : 'border-gray-600'}
                `}
              >
                {isCompleted ? (
                  <Check size={18} className="text-white" />
                ) : (
                  <motion.div
                    animate={isCurrent ? { rotate: 360 } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <StepIcon
                      size={18}
                      className={isCurrent ? 'text-matrix-bg-primary' : 'text-gray-400'}
                    />
                  </motion.div>
                )}
              </motion.div>

              {/* Connector line (except last) */}
              {index < ANALYSIS_STEPS.length - 1 && (
                <div className="hidden sm:block absolute" style={{ left: '50%', width: '100%' }}>
                  {/* Line handled by flex gap */}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Connector lines between steps */}
      <div className="flex items-center justify-between px-7 -mt-12 mb-6">
        {ANALYSIS_STEPS.slice(0, -1).map((step, index) => {
          const isCompleted = index < currentStepIndex;
          return (
            <motion.div
              key={`line-${step.id}`}
              className="flex-1 h-0.5 mx-1"
              initial={{ backgroundColor: 'rgb(55, 65, 81)' }}
              animate={{
                backgroundColor: isCompleted ? 'rgb(34, 197, 94)' : 'rgb(55, 65, 81)',
              }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-matrix-bg-primary rounded-full overflow-hidden border border-matrix-border">
          <motion.div
            className="h-full bg-gradient-to-r from-matrix-accent via-matrix-accent-glow to-matrix-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
          {/* Scanline effect */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Current step message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep?.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          >
            <CurrentIcon size={20} className="text-matrix-accent" />
          </motion.div>
          <span className="text-matrix-text font-mono">
            {currentStep ? t(currentStep.labelKey, currentStep.labelKey) : t('progress.complete')}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Estimated time */}
      <div className="flex items-center justify-between text-sm text-matrix-text-dim">
        <span>{t('progress.estimatedTime', 'Szacowany czas')}:</span>
        <span className="font-mono">~{getRemainingTime()}s</span>
      </div>

      {/* Skeleton preview placeholder */}
      <div className="space-y-3">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="h-4 bg-matrix-border rounded w-3/4"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          className="h-4 bg-matrix-border rounded w-1/2"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          className="h-4 bg-matrix-border rounded w-2/3"
        />
      </div>
    </motion.div>
  );
}

export default AnalysisProgressBar;

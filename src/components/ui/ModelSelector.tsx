// src/components/ui/ModelSelector.tsx
/**
 * AI Model Selector Component
 * ===========================
 * Dropdown for selecting AI model for analysis/restoration.
 */

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Cpu, Eye, Sparkles, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AvailableModel,
  useAvailableModels,
  useSelectedModel,
  useSetSelectedModel,
} from '../../hooks/useApi';

// ============================================
// PROVIDER ICONS
// ============================================

const providerIcons: Record<string, React.ReactNode> = {
  google: <Sparkles size={16} className="text-blue-400" />,
  anthropic: <Zap size={16} className="text-orange-400" />,
  openai: <Eye size={16} className="text-green-400" />,
  mistral: <Cpu size={16} className="text-purple-400" />,
  groq: <Zap size={16} className="text-yellow-400" />,
  ollama: <Cpu size={16} className="text-gray-400" />,
  mock: <Cpu size={16} className="text-white" />,
};

// ============================================
// MODEL SELECTOR COMPONENT
// ============================================

interface ModelSelectorProps {
  className?: string;
  compact?: boolean;
}

export default function ModelSelector({ className = '', compact = false }: ModelSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: models, isLoading: modelsLoading } = useAvailableModels();
  const { data: selectedModelId } = useSelectedModel();
  const setSelectedModel = useSetSelectedModel();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModel = models?.find((m) => m.id === selectedModelId) || models?.[0];

  const handleSelect = (model: AvailableModel) => {
    if (model.isAvailable) {
      setSelectedModel.mutate(model.id);
      setIsOpen(false);
    }
  };

  // Group models by provider
  const groupedModels = models?.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, AvailableModel[]>,
  );

  if (modelsLoading) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg animate-pulse ${className}`}
      >
        <Cpu size={16} className="text-white/50" />
        <span className="text-sm text-white/50">Ładowanie modeli...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          bg-white/5 border border-white/10
          hover:border-white/30 hover:bg-white/10
          ${isOpen ? 'border-white/40 ring-1 ring-white/20' : ''}
          ${compact ? 'text-xs' : 'text-sm'}
        `}
      >
        {selectedModel && providerIcons[selectedModel.provider]}
        <span className="text-white/80 font-medium truncate max-w-[120px]">
          {selectedModel?.name || 'Wybierz model'}
        </span>
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 z-50
              bg-white/5/95 backdrop-blur-xl
              border border-white/10 rounded-xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-black/50">
              <h4 className="text-sm font-semibold text-white/80">
                {t('settings.selectModel', 'Wybierz model AI')}
              </h4>
              <p className="text-xs text-white/50 mt-0.5">
                {t('settings.modelDescription', 'Model używany do analizy i restauracji')}
              </p>
            </div>

            {/* Model List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-3">
              {groupedModels &&
                Object.entries(groupedModels).map(([provider, providerModels]) => (
                  <div key={provider}>
                    {/* Provider Header */}
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      {providerIcons[provider]}
                      <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                        {provider}
                      </span>
                    </div>

                    {/* Provider Models */}
                    <div className="space-y-1">
                      {providerModels.map((model) => (
                        <button
                          type="button"
                          key={model.id}
                          onClick={() => handleSelect(model)}
                          disabled={!model.isAvailable}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg
                            transition-all text-left
                            ${
                              model.isAvailable
                                ? 'hover:bg-white/10 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                            }
                            ${
                              selectedModelId === model.id
                                ? 'bg-white/15 border border-white/30'
                                : 'border border-transparent'
                            }
                          `}
                        >
                          {/* Selection Indicator */}
                          <div className="w-4 h-4 flex items-center justify-center">
                            {selectedModelId === model.id && (
                              <Check size={14} className="text-white" />
                            )}
                          </div>

                          {/* Model Info */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white/80 truncate">
                              {model.name}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {model.capabilities.map((cap) => (
                                <span
                                  key={cap}
                                  className={`
                                    text-[10px] px-1.5 py-0.5 rounded
                                    ${cap === 'vision' ? 'bg-blue-500/20 text-blue-400' : ''}
                                    ${cap === 'text' ? 'bg-white/15 text-white/80' : ''}
                                    ${cap === 'restoration' ? 'bg-purple-500/20 text-purple-400' : ''}
                                  `}
                                >
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Status */}
                          {!model.isAvailable && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                              Brak klucza
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/10 bg-black/50">
              <p className="text-[10px] text-white/50">
                💡 Dodaj klucze API w Ustawienia → Klucze API
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

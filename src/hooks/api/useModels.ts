// src/hooks/api/useModels.ts
/**
 * AI Models Hooks — v4.0 Web Edition
 * ====================================
 * Hooks for AI model selection and management.
 * Always connects to the Axum backend via HTTP.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';
import type { AiModel, AppSettings, AvailableModel } from './types';
import { useProvidersStatus } from './useHealth';
import { apiGet, apiPost } from './utils';

// ============================================
// MODEL CONFIGURATIONS
// ============================================

interface ModelConfig {
  id: string;
  name: string;
  capabilities: ('vision' | 'text' | 'restoration')[];
}

const PROVIDER_MODELS: Record<string, ModelConfig[]> = {
  google: [
    {
      id: 'gemini-2.0-flash-exp',
      name: 'Gemini 2.0 Flash',
      capabilities: ['vision', 'text', 'restoration'],
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      capabilities: ['vision', 'text', 'restoration'],
    },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', capabilities: ['vision', 'text'] },
  ],
  anthropic: [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet',
      capabilities: ['vision', 'text', 'restoration'],
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      capabilities: ['vision', 'text', 'restoration'],
    },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', capabilities: ['vision', 'text'] },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', capabilities: ['vision', 'text', 'restoration'] },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', capabilities: ['vision', 'text', 'restoration'] },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', capabilities: ['vision', 'text'] },
  ],
  mistral: [
    {
      id: 'pixtral-large-latest',
      name: 'Pixtral Large',
      capabilities: ['vision', 'text', 'restoration'],
    },
    { id: 'mistral-large-latest', name: 'Mistral Large', capabilities: ['text'] },
  ],
  groq: [
    {
      id: 'llama-3.2-90b-vision-preview',
      name: 'Llama 3.2 90B Vision',
      capabilities: ['vision', 'text'],
    },
    {
      id: 'llama-3.2-11b-vision-preview',
      name: 'Llama 3.2 11B Vision',
      capabilities: ['vision', 'text'],
    },
  ],
  ollama: [
    { id: 'llama3.2:vision', name: 'Llama 3.2 Vision (Local)', capabilities: ['vision', 'text'] },
    { id: 'llava', name: 'LLaVA (Local)', capabilities: ['vision', 'text'] },
  ],
};

// ============================================
// OLLAMA MODELS
// ============================================

/**
 * Fetch available Ollama models
 */
export function useOllamaModels() {
  return useQuery({
    queryKey: queryKeys.ollamaModels,
    queryFn: async (): Promise<AiModel[]> => {
      return apiGet<AiModel[]>('/api/models/ollama');
    },
  });
}

// ============================================
// AVAILABLE MODELS
// ============================================

/**
 * Fetch all available AI models from all providers
 */
export function useAvailableModels() {
  const { data: providers } = useProvidersStatus();

  return useQuery({
    queryKey: [queryKeys.availableModels, providers],
    queryFn: async (): Promise<AvailableModel[]> => {
      const models: AvailableModel[] = [];

      // Add models for each available provider
      for (const [providerName, modelConfigs] of Object.entries(PROVIDER_MODELS)) {
        const provider = providers?.find((p) => p.name === providerName);
        const isAvailable = provider?.available ?? false;

        // For ollama, always show models but mark as unavailable
        const shouldInclude = isAvailable || providerName === 'ollama';

        if (shouldInclude) {
          for (const config of modelConfigs) {
            models.push({
              id: config.id,
              name: config.name,
              provider: providerName,
              capabilities: config.capabilities,
              isAvailable: providerName === 'ollama' ? false : isAvailable,
            });
          }
        }
      }

      return models;
    },
    enabled: !!providers,
  });
}

// ============================================
// SELECTED MODEL
// ============================================

const SELECTED_MODEL_STORAGE_KEY = 'selected-model';
const DEFAULT_MODEL_ID = 'gemini-2.0-flash-exp';

/**
 * Get selected model — fetches from backend settings
 */
export function useSelectedModel() {
  return useQuery({
    queryKey: queryKeys.selectedModel,
    queryFn: async (): Promise<string> => {
      const settings = await apiGet<AppSettings>('/api/settings');
      return settings?.preferred_provider || DEFAULT_MODEL_ID;
    },
  });
}

/**
 * Save selected model preference — persists via save_settings
 */
export function useSetSelectedModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (modelId: string): Promise<string> => {
      // Save to localStorage for instant UI feedback
      localStorage.setItem(`tissaia-${SELECTED_MODEL_STORAGE_KEY}`, modelId);

      // Also persist to backend settings
      try {
        const currentSettings = await apiGet<AppSettings>('/api/settings');
        await apiPost('/api/settings', {
          settings: { ...currentSettings, preferred_provider: modelId },
        });
      } catch (e) {
        console.warn('[Models] Failed to persist model selection to backend:', e);
      }

      return modelId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      queryClient.invalidateQueries({ queryKey: queryKeys.selectedModel });
    },
  });
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

/**
 * @deprecated Use useProvidersStatus instead
 */
export function useModels() {
  return useProvidersStatus();
}

/**
 * @deprecated Use useSelectedModel instead
 */
export function useDefaultModel() {
  const { data: providers } = useProvidersStatus();
  const defaultProvider = providers?.find((p) => p.available && p.enabled);
  return { data: defaultProvider?.name ?? 'google' };
}

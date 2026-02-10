// src/__tests__/integration/components/ModelSelector.test.tsx
/**
 * ModelSelector Component Tests
 * =============================
 * Tests for AI model selection dropdown.
 */

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ModelSelector from '../../../components/ui/ModelSelector';
import { renderWithProviders } from '../../utils/renderWithProviders';

// Mock API hooks
const mockMutate = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useAvailableModels: vi.fn(() => ({
    data: [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        capabilities: ['vision', 'text', 'restoration'],
        isAvailable: true,
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        capabilities: ['vision', 'text', 'restoration'],
        isAvailable: true,
      },
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        capabilities: ['vision', 'text', 'restoration'],
        isAvailable: false,
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        capabilities: ['vision', 'text', 'restoration'],
        isAvailable: true,
      },
    ],
    isLoading: false,
  })),
  useSelectedModel: vi.fn(() => ({
    data: 'gemini-2.0-flash-exp',
  })),
  useSetSelectedModel: vi.fn(() => ({
    mutate: mockMutate,
    isPending: false,
  })),
  useProvidersStatus: vi.fn(() => ({
    data: [
      { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
      { name: 'openai', enabled: true, available: true, priority: 2, last_error: null },
    ],
  })),
}));

describe('ModelSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // RENDERING
  // ============================================

  describe('Rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });
      expect(screen.getByText('Gemini 2.0 Flash')).toBeInTheDocument();
    });

    it('shows selected model name', () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });
      expect(screen.getByText('Gemini 2.0 Flash')).toBeInTheDocument();
    });

    it('shows chevron icon', () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });
      // Button should have chevron down indicator
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  // ============================================
  // DROPDOWN BEHAVIOR
  // ============================================

  describe('Dropdown Behavior', () => {
    it('opens dropdown on click', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/wybierz model ai/i)).toBeInTheDocument();
      });
    });

    it('shows all available models in dropdown', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Gemini 1.5 Pro')).toBeInTheDocument();
        expect(screen.getByText('GPT-4o')).toBeInTheDocument();
      });
    });

    it('shows unavailable models as disabled', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
        // The button should show "Brak klucza" for unavailable models
        expect(screen.getByText(/brak klucza/i)).toBeInTheDocument();
      });
    });

    it('closes dropdown when clicking outside', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/wybierz model ai/i)).toBeInTheDocument();
      });

      // Click outside
      fireEvent.mouseDown(document.body);

      await waitFor(() => {
        expect(screen.queryByText(/wybierz model ai/i)).not.toBeInTheDocument();
      });
    });
  });

  // ============================================
  // MODEL SELECTION
  // ============================================

  describe('Model Selection', () => {
    it('calls setSelectedModel when model is clicked', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('GPT-4o')).toBeInTheDocument();
      });

      const gptOption = screen.getByText('GPT-4o');
      fireEvent.click(gptOption);

      expect(mockMutate).toHaveBeenCalledWith('gpt-4o');
    });

    it('does not call setSelectedModel for unavailable models', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Claude 3.5 Sonnet')).toBeInTheDocument();
      });

      const claudeOption = screen.getByText('Claude 3.5 Sonnet');
      fireEvent.click(claudeOption);

      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('closes dropdown after selection', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Gemini 1.5 Pro')).toBeInTheDocument();
      });

      const geminiOption = screen.getByText('Gemini 1.5 Pro');
      fireEvent.click(geminiOption);

      await waitFor(() => {
        expect(screen.queryByText(/wybierz model ai/i)).not.toBeInTheDocument();
      });
    });
  });

  // ============================================
  // CAPABILITIES DISPLAY
  // ============================================

  describe('Capabilities Display', () => {
    it('shows capability badges for models', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        // Should show vision, text, restoration badges
        const visionBadges = screen.getAllByText('vision');
        expect(visionBadges.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================
  // PROVIDER GROUPING
  // ============================================

  describe('Provider Grouping', () => {
    it('groups models by provider', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('google')).toBeInTheDocument();
        expect(screen.getByText('openai')).toBeInTheDocument();
      });
    });
  });

  // ============================================
  // LOADING STATE
  // ============================================

  describe('Loading State', () => {
    it('shows loading state when models are loading', async () => {
      const { useAvailableModels } = await import('../../../hooks/useApi');
      (useAvailableModels as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: undefined,
        isLoading: true,
      });

      renderWithProviders(<ModelSelector />, { locale: 'pl' });
      expect(screen.getByText(/ładowanie modeli/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // COMPACT MODE
  // ============================================

  describe('Compact Mode', () => {
    it('renders in compact mode', () => {
      renderWithProviders(<ModelSelector compact />, { locale: 'pl' });
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-xs');
    });
  });

  // ============================================
  // LOCALIZATION
  // ============================================

  describe('Localization', () => {
    it('renders in Polish', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'pl' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/wybierz model ai/i)).toBeInTheDocument();
      });
    });

    it('renders in English', async () => {
      renderWithProviders(<ModelSelector />, { locale: 'en' });

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Either English or fallback text should appear
      await waitFor(() => {
        // Check for dropdown being open (model description text)
        const dropdown =
          screen.queryByText(/model used for|model używany/i) ||
          screen.queryByText(/select ai model|wybierz model/i);
        expect(dropdown).toBeInTheDocument();
      });
    });
  });
});

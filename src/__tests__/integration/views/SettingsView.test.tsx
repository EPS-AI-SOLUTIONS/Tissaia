// src/__tests__/integration/views/SettingsView.test.tsx
/**
 * SettingsView Component Tests
 * ============================
 * Tests for application settings view.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsView from '../../../components/SettingsView';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import i18n from '../../../i18n';
import { useJobStore } from '../../../store/useJobStore';
import { usePhotoStore } from '../../../store/usePhotoStore';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useViewStore } from '../../../store/useViewStore';

// Helper to reset all stores
function resetStores() {
  useViewStore.setState({ currentView: 'upload', isLoading: false, progressMessage: '' });
  usePhotoStore.getState().resetPhotos();
  useJobStore.setState({ currentJob: null });
}

// Mock useApi hooks
const mockProviders = [
  { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
  { name: 'anthropic', enabled: true, available: false, priority: 2, last_error: 'No API key' },
  { name: 'openai', enabled: true, available: false, priority: 3, last_error: null },
];

const mockSetApiKeyMutateAsync = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useProvidersStatus: vi.fn(() => ({
    data: mockProviders,
    isLoading: false,
    isError: false,
  })),
  useSetApiKey: vi.fn(() => ({
    mutateAsync: mockSetApiKeyMutateAsync,
    isPending: false,
  })),
  useOllamaModels: vi.fn(() => ({
    data: [],
    isLoading: false,
    isError: false,
  })),
}));

// Mock sonner
vi.mock('sonner', () => {
  const toastFn = Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  });
  return { default: toastFn, toast: toastFn };
});

// Helper to render with providers
function renderWithProviders(ui: React.ReactElement, locale: string = 'pl') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  i18n.changeLanguage(locale);

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider defaultTheme="dark" storageKey="test-theme">
          {ui}
        </ThemeProvider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      resetStores();
    });
  });

  // ============================================
  // RENDERING
  // ============================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays settings title', () => {
      renderWithProviders(<SettingsView />, 'en');
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });

    it('displays appearance section', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('Wygląd')).toBeInTheDocument();
    });

    it('displays behavior section', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('Zachowanie')).toBeInTheDocument();
    });

    it('displays about section', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('O aplikacji')).toBeInTheDocument();
    });
  });

  // ============================================
  // THEME SETTINGS
  // ============================================

  describe('theme settings', () => {
    it('displays theme options', () => {
      renderWithProviders(<SettingsView />, 'en');
      expect(screen.getByText(/dark/i)).toBeInTheDocument();
      expect(screen.getByText(/light/i)).toBeInTheDocument();
      expect(screen.getByText(/system/i)).toBeInTheDocument();
    });

    it('highlights current theme', () => {
      renderWithProviders(<SettingsView />, 'en');
      // Dark theme should be selected by default
      const darkButton = screen.getByText(/dark/i).closest('button');
      expect(darkButton?.className).toContain('bg-white');
    });
  });

  // ============================================
  // LANGUAGE SETTINGS
  // ============================================

  describe('language settings', () => {
    it('displays language options', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('Polski')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('displays language flags', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('🇵🇱')).toBeInTheDocument();
      expect(screen.getByText('🇬🇧')).toBeInTheDocument();
    });

    it('changes language when option clicked', () => {
      renderWithProviders(<SettingsView />);

      const englishButton = screen.getByText('English').closest('button');
      if (englishButton) {
        fireEvent.click(englishButton);
      }

      expect(i18n.language).toBe('en');
    });
  });

  // ============================================
  // BEHAVIOR SETTINGS
  // ============================================

  describe('behavior settings', () => {
    it('displays auto-analyze toggle', () => {
      renderWithProviders(<SettingsView />, 'en');
      expect(screen.getByText(/auto.*analy/i)).toBeInTheDocument();
    });

    it('displays preserve originals toggle', () => {
      renderWithProviders(<SettingsView />, 'en');
      expect(screen.getByText(/preserve.*original/i)).toBeInTheDocument();
    });

    it('toggles auto-analyze setting', () => {
      renderWithProviders(<SettingsView />, 'en');

      const initialValue = useSettingsStore.getState().settings.autoAnalyze;

      // Find toggle button (after the label)
      const settingRow = screen.getByText(/auto.*analy/i).closest('.flex');
      const toggleButton = settingRow?.querySelector('button');

      if (toggleButton) {
        fireEvent.click(toggleButton);
      }

      expect(useSettingsStore.getState().settings.autoAnalyze).toBe(!initialValue);
    });
  });

  // ============================================
  // API KEYS
  // ============================================

  describe('api keys', () => {
    it('displays API keys section', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('Klucze API')).toBeInTheDocument();
    });

    it('displays provider configurations', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('Google Gemini')).toBeInTheDocument();
      expect(screen.getByText('Anthropic Claude')).toBeInTheDocument();
      expect(screen.getByText('OpenAI GPT-4')).toBeInTheDocument();
    });

    it('displays provider status badges', () => {
      renderWithProviders(<SettingsView />);
      // Google is active, Anthropic has no key
      expect(screen.getByText('Aktywny')).toBeInTheDocument();
      expect(screen.getAllByText('Brak klucza').length).toBeGreaterThan(0);
    });

    it('has password inputs for API keys', () => {
      renderWithProviders(<SettingsView />);
      const passwordInputs = screen.getAllByPlaceholderText(/API_KEY|wpisz nowy/i);
      expect(passwordInputs.length).toBeGreaterThan(0);
      // Should be password type by default
      expect(passwordInputs[0]).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility', () => {
      renderWithProviders(<SettingsView />);
      const passwordInput = screen.getAllByPlaceholderText(/API_KEY|wpisz nowy/i)[0];
      const toggleButton = passwordInput.parentElement?.querySelector('button');

      expect(passwordInput).toHaveAttribute('type', 'password');

      if (toggleButton) {
        fireEvent.click(toggleButton);
      }

      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('has save buttons for each provider', () => {
      renderWithProviders(<SettingsView />);
      const saveButtons = screen.getAllByText('Zapisz');
      expect(saveButtons.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // ABOUT SECTION
  // ============================================

  describe('about section', () => {
    it('displays version', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('3.0.0')).toBeInTheDocument();
    });

    it('displays backend info', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('Rust + Tauri 2.x')).toBeInTheDocument();
    });

    it('displays frontend info', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('React 19 + Vite')).toBeInTheDocument();
    });

    it('displays author', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText('Pawel Serkowski')).toBeInTheDocument();
    });

    it('displays Tissaia quote', () => {
      renderWithProviders(<SettingsView />);
      expect(screen.getByText(/precyzja.*uprzejmość/i)).toBeInTheDocument();
    });
  });
});

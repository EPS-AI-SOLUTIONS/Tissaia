// src/__tests__/integration/views/HealthView.test.tsx
/**
 * HealthView Component Tests
 * ==========================
 * Tests for health dashboard view.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HealthView from '../../../components/HealthView';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../../../i18n';
import { act } from 'react';

// Mock health response
const mockHealthData = {
  status: 'healthy',
  version: '3.0.0',
  uptime_seconds: 3600, // 1 hour
  providers: [
    { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
    { name: 'anthropic', enabled: true, available: true, priority: 2, last_error: null },
    { name: 'openai', enabled: true, available: false, priority: 3, last_error: 'No API key' },
  ],
};

const mockProviders = [
  { name: 'google', enabled: true, available: true, priority: 1, last_error: null },
  { name: 'anthropic', enabled: true, available: true, priority: 2, last_error: null },
  { name: 'openai', enabled: true, available: false, priority: 3, last_error: 'No API key' },
  { name: 'mistral', enabled: false, available: false, priority: 4, last_error: null },
];

const mockRefetch = vi.fn();

vi.mock('../../../hooks/useApi', () => ({
  useHealth: vi.fn(() => ({
    data: mockHealthData,
    isLoading: false,
    isError: false,
    refetch: mockRefetch,
  })),
  useProvidersStatus: vi.fn(() => ({
    data: mockProviders,
    isLoading: false,
    isError: false,
  })),
}));

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
    </QueryClientProvider>
  );
}

describe('HealthView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // RENDERING
  // ============================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays health title', () => {
      renderWithProviders(<HealthView />, 'en');
      // Look for heading specifically
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays refresh button', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText('Odśwież')).toBeInTheDocument();
    });
  });

  // ============================================
  // OVERALL STATUS
  // ============================================

  describe('overall status', () => {
    it('displays system healthy status', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText(/system.*sprawny/i)).toBeInTheDocument();
    });

    it('displays version info', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText(/3\.0\.0/)).toBeInTheDocument();
      // Multiple mentions of Rust/Tauri is expected
      expect(screen.getAllByText(/Rust\/Tauri/).length).toBeGreaterThan(0);
    });

    it('displays uptime', () => {
      renderWithProviders(<HealthView />, 'en');
      // 3600 seconds = 1 hour
      expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
    });
  });

  // ============================================
  // PROVIDERS
  // ============================================

  describe('providers', () => {
    it('displays providers section', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText('Providerzy AI')).toBeInTheDocument();
    });

    it('displays provider cards', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText('google')).toBeInTheDocument();
      expect(screen.getByText('anthropic')).toBeInTheDocument();
      expect(screen.getByText('openai')).toBeInTheDocument();
      expect(screen.getByText('mistral')).toBeInTheDocument();
    });

    it('shows healthy status for available providers', () => {
      renderWithProviders(<HealthView />, 'en');
      // Google and Anthropic are healthy
      const healthyLabels = screen.getAllByText(/healthy|sprawny/i);
      expect(healthyLabels.length).toBeGreaterThanOrEqual(2);
    });

    it('shows unavailable status for providers without keys', () => {
      renderWithProviders(<HealthView />, 'en');
      expect(screen.getByText(/unavailable|niedostępny/i)).toBeInTheDocument();
    });

    it('shows disabled status for disabled providers', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText('Wyłączony')).toBeInTheDocument();
    });

    it('displays provider priority', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText(/priorytet.*1/i)).toBeInTheDocument();
      expect(screen.getByText(/priorytet.*2/i)).toBeInTheDocument();
    });

    it('displays provider error messages', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText('No API key')).toBeInTheDocument();
    });
  });

  // ============================================
  // REFRESH
  // ============================================

  describe('refresh', () => {
    it('calls refetch when refresh button clicked', () => {
      renderWithProviders(<HealthView />);

      const refreshButton = screen.getByText('Odśwież');
      fireEvent.click(refreshButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  // ============================================
  // CONFIGURATION INFO
  // ============================================

  describe('configuration info', () => {
    it('displays configuration section', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText('Konfiguracja')).toBeInTheDocument();
    });

    it('displays API key environment variables', () => {
      renderWithProviders(<HealthView />);
      expect(screen.getByText('GOOGLE_API_KEY')).toBeInTheDocument();
      expect(screen.getByText('ANTHROPIC_API_KEY')).toBeInTheDocument();
      expect(screen.getByText('OPENAI_API_KEY')).toBeInTheDocument();
    });
  });

  // ============================================
  // LOADING STATE
  // ============================================

  describe('loading state', () => {
    it('shows skeleton when health is loading', async () => {
      const { useHealth } = await import('../../../hooks/useApi');
      (useHealth as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: mockRefetch,
      });

      const { container } = renderWithProviders(<HealthView />);
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('shows skeletons when providers are loading', async () => {
      const { useProvidersStatus } = await import('../../../hooks/useApi');
      (useProvidersStatus as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      const { container } = renderWithProviders(<HealthView />);
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // UPTIME FORMATTING
  // ============================================

  describe('uptime formatting', () => {
    it('formats days correctly', async () => {
      const { useHealth } = await import('../../../hooks/useApi');
      (useHealth as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: { ...mockHealthData, uptime_seconds: 86400 + 7200 }, // 1 day 2 hours
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      renderWithProviders(<HealthView />);
      expect(screen.getByText(/1d 2h/)).toBeInTheDocument();
    });

    it('formats minutes only when less than 1 hour', async () => {
      const { useHealth } = await import('../../../hooks/useApi');
      (useHealth as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        data: { ...mockHealthData, uptime_seconds: 1800 }, // 30 minutes
        isLoading: false,
        isError: false,
        refetch: mockRefetch,
      });

      renderWithProviders(<HealthView />);
      expect(screen.getByText(/30m/)).toBeInTheDocument();
    });
  });
});

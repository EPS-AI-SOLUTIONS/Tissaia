// src/__tests__/integration/views/UploadView.test.tsx
/**
 * UploadView Component Tests
 * ==========================
 * Tests for photo upload view with drag & drop functionality.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadView from '../../../components/photo/UploadView';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../../../i18n';
import { useAppStore } from '../../../store/useAppStore';
import { act } from 'react';

// Mock sonner
vi.mock('sonner', () => ({
  default: Object.assign(vi.fn(), {
    error: vi.fn(),
    success: vi.fn(),
  }),
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

// Create mock File
function createMockFile(
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg'
): File {
  const blob = new Blob([''], { type });
  return new File([blob], name, { type });
}

describe('UploadView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    act(() => {
      useAppStore.getState().reset();
    });
  });

  // ============================================
  // RENDERING
  // ============================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      renderWithProviders(<UploadView />);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('displays upload title', () => {
      renderWithProviders(<UploadView />, 'en');
      expect(screen.getByText(/upload/i)).toBeInTheDocument();
    });

    it('displays dropzone area', () => {
      const { container } = renderWithProviders(<UploadView />);
      // Check for file input in dropzone
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('displays file format information', () => {
      renderWithProviders(<UploadView />);
      // Check for formats info
      expect(screen.getByText(/JPG|PNG|WebP|GIF/i)).toBeInTheDocument();
    });

    it('displays max size information', () => {
      renderWithProviders(<UploadView />);
      expect(screen.getByText(/20\s*MB/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // DROPZONE INTERACTION
  // ============================================

  describe('dropzone interaction', () => {
    it('has input element for file selection', () => {
      const { container } = renderWithProviders(<UploadView />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('accepts image file types', () => {
      const { container } = renderWithProviders(<UploadView />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toContain('image/');
    });
  });

  // ============================================
  // UPLOADED PHOTOS
  // ============================================

  describe('uploaded photos', () => {
    it('does not show uploaded photos section when no photos', () => {
      renderWithProviders(<UploadView />);
      expect(screen.queryByText(/uploadedPhotos|Wgrane zdjęcia/i)).not.toBeInTheDocument();
    });

    it('shows uploaded photos section when photos exist', () => {
      // Add a mock photo to store
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test.jpg',
          preview: 'data:image/jpeg;base64,test',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />);
      // Photo name should be visible
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    it('displays remove all button when photos exist', () => {
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test.jpg',
          preview: 'data:image/jpeg;base64,test',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />, 'en');
      expect(screen.getByText(/remove all/i)).toBeInTheDocument();
    });

    it('displays analyze button when photos exist', () => {
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test.jpg',
          preview: 'data:image/jpeg;base64,test',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />, 'en');
      expect(screen.getByText(/analyze/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // NAVIGATION
  // ============================================

  describe('navigation', () => {
    it('navigates to analyze view when analyze button clicked', () => {
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test.jpg',
          preview: 'data:image/jpeg;base64,test',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />, 'en');

      const analyzeButton = screen.getByText(/analyze/i);
      fireEvent.click(analyzeButton);

      expect(useAppStore.getState().currentView).toBe('analyze');
    });
  });

  // ============================================
  // PHOTO REMOVAL
  // ============================================

  describe('photo removal', () => {
    it('removes photo when remove button clicked', async () => {
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test.jpg',
          preview: 'data:image/jpeg;base64,test',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />);

      // Photo should be visible
      expect(screen.getByText('test.jpg')).toBeInTheDocument();

      // Find and click remove button (first one with delete aria-label)
      const removeButtons = screen.getAllByRole('button', { name: /usuń|delete/i });
      fireEvent.click(removeButtons[0]);

      // Photo should be removed from store
      expect(useAppStore.getState().photos).toHaveLength(0);
    });

    it('clears all photos when remove all clicked', async () => {
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test1.jpg',
          preview: 'data:image/jpeg;base64,test1',
          size: 1024,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
        useAppStore.getState().addPhoto({
          id: 'photo-2',
          name: 'test2.jpg',
          preview: 'data:image/jpeg;base64,test2',
          size: 2048,
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />, 'en');

      // Both photos should be visible
      expect(useAppStore.getState().photos).toHaveLength(2);

      // Click remove all
      const removeAllButton = screen.getByText(/remove all/i);
      fireEvent.click(removeAllButton);

      // All photos should be removed
      expect(useAppStore.getState().photos).toHaveLength(0);
    });
  });

  // ============================================
  // FILE SIZE FORMATTING
  // ============================================

  describe('file size formatting', () => {
    it('displays file size in KB for small files', () => {
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test.jpg',
          preview: 'data:image/jpeg;base64,test',
          size: 2048, // 2 KB
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />);
      expect(screen.getByText(/2.*KB/)).toBeInTheDocument();
    });

    it('displays file size in MB for larger files', () => {
      act(() => {
        useAppStore.getState().addPhoto({
          id: 'photo-1',
          name: 'test.jpg',
          preview: 'data:image/jpeg;base64,test',
          size: 5 * 1024 * 1024, // 5 MB
          mimeType: 'image/jpeg',
          uploadedAt: new Date(),
        });
      });

      renderWithProviders(<UploadView />);
      expect(screen.getByText(/5.*MB/)).toBeInTheDocument();
    });
  });
});

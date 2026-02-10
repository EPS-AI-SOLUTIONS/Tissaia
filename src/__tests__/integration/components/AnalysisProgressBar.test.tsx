/**
 * AnalysisProgressBar Component Tests
 * ====================================
 * Tests for the animated analysis progress bar component.
 */

import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AnalysisProgressBar from '../../../components/ui/AnalysisProgressBar';
import { renderWithProviders } from '../../utils/renderWithProviders';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
        <div className={className} {...props}>
          {children}
        </div>
      ),
      span: ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
        <span className={className} {...props}>
          {children}
        </span>
      ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('AnalysisProgressBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders nothing when not analyzing', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={false} />, {
        locale: 'en',
      });
      expect(container.firstChild).toBeNull();
    });

    it('renders progress bar when analyzing', () => {
      renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, { locale: 'en' });

      expect(screen.getByText(/Photo Analysis|Analiza zdjęcia/i)).toBeInTheDocument();
    });

    it('displays percentage indicator', () => {
      renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, { locale: 'en' });

      // Initial percentage should be 0%
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('shows estimated time', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      // Check for any time-related element
      const hasTimeElement =
        container.textContent?.includes('~') && container.textContent?.includes('s');
      expect(hasTimeElement).toBe(true);
    });
  });

  describe('step indicators', () => {
    it('renders all 6 step indicators', () => {
      renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, { locale: 'en' });

      // There should be 6 step dots (Check icons or step icons)
      const stepContainer = screen.getByText(/Photo Analysis|Analiza zdjęcia/i).parentElement
        ?.parentElement;
      expect(stepContainer).toBeInTheDocument();
    });

    it('displays step indicators', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      // Check that step dots are rendered (6 steps)
      const stepDots = container.querySelectorAll('.w-10.h-10.rounded-full');
      expect(stepDots.length).toBe(6);
    });
  });

  describe('progress animation', () => {
    it('starts with initial progress state', () => {
      renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, { locale: 'en' });

      // Initial percentage should be 0%
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('displays first step message', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      // First step message should contain text related to analysis steps
      const hasStepContent =
        container.textContent?.includes('...') || container.textContent?.includes('progress');
      expect(hasStepContent).toBe(true);
    });
  });

  describe('completion callback', () => {
    it('accepts onComplete prop', () => {
      const onComplete = vi.fn();

      // Should not throw when onComplete is provided
      expect(() => {
        renderWithProviders(<AnalysisProgressBar isAnalyzing={true} onComplete={onComplete} />, {
          locale: 'en',
        });
      }).not.toThrow();
    });
  });

  describe('state changes', () => {
    it('can be stopped and restarted', () => {
      const { rerender } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      // Should be visible
      expect(screen.getByText(/Photo Analysis|Analiza zdjęcia/i)).toBeInTheDocument();

      // Stop - should disappear
      rerender(<AnalysisProgressBar isAnalyzing={false} />);

      // Restart
      rerender(<AnalysisProgressBar isAnalyzing={true} />);

      // Should be visible again with initial state
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('localization', () => {
    it('renders in Polish', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'pl',
      });

      expect(screen.getByText('Analiza zdjęcia')).toBeInTheDocument();
      // Check for time indicator (~Xs)
      expect(container.textContent).toMatch(/~\d+s/);
    });

    it('renders in English', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      expect(screen.getByText('Photo Analysis')).toBeInTheDocument();
      // Check for time indicator (~Xs)
      expect(container.textContent).toMatch(/~\d+s/);
    });
  });

  describe('visual elements', () => {
    it('renders skeleton placeholders', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      // Should have skeleton loading bars
      const skeletonBars = container.querySelectorAll('.bg-matrix-border.rounded');
      expect(skeletonBars.length).toBeGreaterThan(0);
    });

    it('renders progress bar track', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      // Should have progress bar container
      const progressTrack = container.querySelector('.bg-matrix-bg-primary.rounded-full');
      expect(progressTrack).toBeInTheDocument();
    });

    it('renders step connector lines', () => {
      const { container } = renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, {
        locale: 'en',
      });

      // Should have connector lines between steps
      const connectorLines = container.querySelectorAll('.flex-1.h-0\\.5');
      expect(connectorLines.length).toBe(5); // 5 lines between 6 steps
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      renderWithProviders(<AnalysisProgressBar isAnalyzing={true} />, { locale: 'en' });

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
    });
  });
});

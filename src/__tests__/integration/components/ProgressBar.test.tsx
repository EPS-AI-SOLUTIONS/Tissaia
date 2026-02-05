// src/__tests__/integration/components/ProgressBar.test.tsx
/**
 * ProgressBar Component Tests
 * ===========================
 * Tests for Matrix-style animated progress bar.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '../../../components/ui/ProgressBar';

describe('ProgressBar', () => {
  // ============================================
  // RENDERING
  // ============================================

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<ProgressBar />);
      // Should render progress bar container
      expect(document.querySelector('.progress-matrix')).toBeInTheDocument();
    });

    it('renders with progress value', () => {
      render(<ProgressBar progress={50} />);
      // Check progress bar element exists
      expect(document.querySelector('.progress-matrix-bar')).toBeInTheDocument();
    });

    it('renders in indeterminate mode when no progress provided', () => {
      render(<ProgressBar />);
      // In indeterminate mode, there should be no progress-matrix-bar class
      expect(document.querySelector('.progress-matrix-bar')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // MESSAGE DISPLAY
  // ============================================

  describe('message display', () => {
    it('displays message when provided', () => {
      render(<ProgressBar message="Processing..." progress={30} />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('does not display message when not provided', () => {
      render(<ProgressBar progress={30} />);
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    });

    it('displays animated indicator with message', () => {
      render(<ProgressBar message="Loading..." progress={50} />);
      expect(screen.getByText('▶')).toBeInTheDocument();
    });
  });

  // ============================================
  // PERCENTAGE DISPLAY
  // ============================================

  describe('percentage display', () => {
    it('shows percentage by default when message and progress provided', () => {
      render(<ProgressBar message="Processing" progress={75} />);
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('hides percentage when showPercentage is false', () => {
      render(<ProgressBar message="Processing" progress={75} showPercentage={false} />);
      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });

    it('rounds percentage to whole number', () => {
      render(<ProgressBar message="Loading" progress={33.7} />);
      expect(screen.getByText('34%')).toBeInTheDocument();
    });

    it('does not show percentage in indeterminate mode', () => {
      render(<ProgressBar message="Loading" showPercentage={true} />);
      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('edge cases', () => {
    it('handles 0% progress', () => {
      render(<ProgressBar message="Starting" progress={0} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles 100% progress', () => {
      render(<ProgressBar message="Complete" progress={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('handles progress without message', () => {
      render(<ProgressBar progress={50} />);
      // Should still render progress bar
      expect(document.querySelector('.progress-matrix')).toBeInTheDocument();
      // But no percentage display (requires message)
      expect(screen.queryByText('50%')).not.toBeInTheDocument();
    });
  });
});

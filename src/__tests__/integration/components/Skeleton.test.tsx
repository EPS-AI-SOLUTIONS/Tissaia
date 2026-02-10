// src/__tests__/integration/components/Skeleton.test.tsx
/**
 * Skeleton Component Tests
 * ========================
 * Tests for loading placeholder components.
 */

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Skeleton from '../../../components/ui/Skeleton';

describe('Skeleton', () => {
  // ============================================
  // BASE SKELETON
  // ============================================

  describe('base Skeleton', () => {
    it('renders without crashing', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton className="custom-class w-full h-10" />);
      expect(container.firstChild).toHaveClass('custom-class');
      expect(container.firstChild).toHaveClass('w-full');
      expect(container.firstChild).toHaveClass('h-10');
    });

    it('applies base background style', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('bg-matrix-border/50');
    });
  });

  // ============================================
  // VARIANTS
  // ============================================

  describe('variants', () => {
    it('applies rectangular variant by default', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('rounded-lg');
    });

    it('applies text variant styles', () => {
      const { container } = render(<Skeleton variant="text" />);
      expect(container.firstChild).toHaveClass('h-4');
      expect(container.firstChild).toHaveClass('rounded');
    });

    it('applies circular variant styles', () => {
      const { container } = render(<Skeleton variant="circular" />);
      expect(container.firstChild).toHaveClass('rounded-full');
    });
  });

  // ============================================
  // ANIMATIONS
  // ============================================

  describe('animations', () => {
    it('applies pulse animation by default', () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('removes pulse for none animation', () => {
      const { container } = render(<Skeleton animation="none" />);
      expect(container.firstChild).not.toHaveClass('animate-pulse');
    });

    it('renders wave animation with motion element', () => {
      const { container } = render(<Skeleton animation="wave" />);
      // Wave animation uses relative positioning and overflow hidden
      expect(container.firstChild).toHaveClass('relative');
      expect(container.firstChild).toHaveClass('overflow-hidden');
    });
  });

  // ============================================
  // SKELETON.TEXT
  // ============================================

  describe('Skeleton.Text', () => {
    it('renders single line by default', () => {
      render(<Skeleton.Text />);
      const skeletons = document.querySelectorAll('.h-4');
      expect(skeletons.length).toBe(1);
    });

    it('renders multiple lines when specified', () => {
      render(<Skeleton.Text lines={3} />);
      const skeletons = document.querySelectorAll('.h-4');
      expect(skeletons.length).toBe(3);
    });

    it('applies shorter width to last line when multiple lines', () => {
      const { container } = render(<Skeleton.Text lines={3} />);
      const skeletons = container.querySelectorAll('.h-4');
      expect(skeletons[2]).toHaveClass('w-3/4');
    });

    it('applies full width to last line when single line', () => {
      const { container } = render(<Skeleton.Text lines={1} />);
      const skeleton = container.querySelector('.h-4');
      expect(skeleton).toHaveClass('w-full');
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton.Text className="my-custom-class" />);
      expect(container.firstChild).toHaveClass('my-custom-class');
    });
  });

  // ============================================
  // SKELETON.AVATAR
  // ============================================

  describe('Skeleton.Avatar', () => {
    it('renders with default size', () => {
      const { container } = render(<Skeleton.Avatar />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar.style.width).toBe('40px');
      expect(avatar.style.height).toBe('40px');
    });

    it('renders with custom size', () => {
      const { container } = render(<Skeleton.Avatar size={60} />);
      const avatar = container.firstChild as HTMLElement;
      expect(avatar.style.width).toBe('60px');
      expect(avatar.style.height).toBe('60px');
    });

    it('applies circular shape', () => {
      const { container } = render(<Skeleton.Avatar />);
      expect(container.firstChild).toHaveClass('rounded-full');
    });

    it('applies pulse animation', () => {
      const { container } = render(<Skeleton.Avatar />);
      expect(container.firstChild).toHaveClass('animate-pulse');
    });
  });

  // ============================================
  // SKELETON.CARD
  // ============================================

  describe('Skeleton.Card', () => {
    it('renders card structure', () => {
      const { container } = render(<Skeleton.Card />);
      expect(container.firstChild).toHaveClass('glass-panel');
      expect(container.firstChild).toHaveClass('p-4');
    });

    it('contains image skeleton', () => {
      const { container } = render(<Skeleton.Card />);
      expect(container.querySelector('.h-32')).toBeInTheDocument();
    });

    it('contains text lines', () => {
      render(<Skeleton.Card />);
      // Skeleton.Text lines=2 creates 2 text skeletons
      const textSkeletons = document.querySelectorAll('.h-4');
      expect(textSkeletons.length).toBe(2);
    });

    it('contains button skeletons', () => {
      const { container } = render(<Skeleton.Card />);
      const buttonSkeletons = container.querySelectorAll('.h-8.w-20');
      expect(buttonSkeletons.length).toBe(2);
    });

    it('applies custom className', () => {
      const { container } = render(<Skeleton.Card className="my-card-class" />);
      expect(container.firstChild).toHaveClass('my-card-class');
    });
  });
});

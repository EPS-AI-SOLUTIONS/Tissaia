import type { Meta, StoryObj } from '@storybook/react';
import HistoryView from '../components/HistoryView';

/**
 * HistoryView Component
 * =====================
 * Restoration history browser and manager.
 *
 * Features:
 * - List of past restorations
 * - Thumbnails and timestamps
 * - Search/filter functionality
 * - Export options
 * - Delete individual or all items
 * - LocalStorage persistence
 */
const meta = {
  title: 'Views/HistoryView',
  component: HistoryView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Browse and manage photo restoration history.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', padding: '24px', background: '#0a1f0a' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HistoryView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default history view
 */
export const Default: Story = {};

/**
 * History view in mobile viewport
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * History view in tablet viewport
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

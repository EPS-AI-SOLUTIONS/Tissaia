import type { Meta, StoryObj } from '@storybook/react';
import Sidebar from '../components/Sidebar';

/**
 * Sidebar Component
 * =================
 * Matrix Glass styled navigation sidebar.
 *
 * Features:
 * - App branding with logo
 * - Navigation items with icons
 * - Active state indicator with animation
 * - Current job status display
 * - Version info footer
 */
const meta = {
  title: 'Organisms/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Left navigation sidebar with Matrix Glass styling and animated indicators.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <Story />
        <div style={{ flex: 1, background: '#0a1f0a' }} />
      </div>
    ),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default sidebar with Upload view active
 */
export const Default: Story = {};

/**
 * Sidebar in mobile view (compact)
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Sidebar in tablet view
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

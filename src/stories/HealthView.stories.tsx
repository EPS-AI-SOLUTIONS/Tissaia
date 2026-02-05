import type { Meta, StoryObj } from '@storybook/react';
import HealthView from '../components/HealthView';

/**
 * HealthView Component
 * ====================
 * System health monitoring dashboard.
 *
 * Features:
 * - AI Provider status display
 * - Response time metrics
 * - Health indicators (green/yellow/red)
 * - Auto-refresh capability
 * - Detailed error messages
 */
const meta = {
  title: 'Views/HealthView',
  component: HealthView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Dashboard showing AI provider health status and system metrics.',
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
} satisfies Meta<typeof HealthView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default health view
 */
export const Default: Story = {};

/**
 * Health view in mobile viewport
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

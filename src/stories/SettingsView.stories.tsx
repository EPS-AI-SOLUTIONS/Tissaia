import type { Meta, StoryObj } from '@storybook/react';
import SettingsView from '../components/SettingsView';

/**
 * SettingsView Component
 * ======================
 * Application settings and preferences panel.
 *
 * Features:
 * - Theme selection (dark/light/system)
 * - Language selection (PL/EN)
 * - Auto-analyze toggle
 * - Default restoration options
 * - Settings persistence
 */
const meta = {
  title: 'Views/SettingsView',
  component: SettingsView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'User preferences and application settings panel.',
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
} satisfies Meta<typeof SettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default settings view
 */
export const Default: Story = {};

/**
 * Settings in mobile viewport
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

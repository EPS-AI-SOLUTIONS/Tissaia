import type { Meta, StoryObj } from '@storybook/react';
import Header from '../components/Header';

/**
 * Header Component
 * ================
 * Application header with status indicator, language toggle, theme toggle and refresh button.
 *
 * Features:
 * - System status indicator (green = healthy, yellow = degraded)
 * - Language toggle (PL/EN)
 * - Theme toggle (dark/light)
 * - Quick refresh action
 */
const meta = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Top navigation bar with quick actions and status display.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['ok', 'degraded', 'error'],
      description: 'System health status',
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default header showing healthy status
 */
export const Default: Story = {
  args: {
    status: 'ok',
  },
};

/**
 * Header showing degraded system status
 */
export const Degraded: Story = {
  args: {
    status: 'degraded',
  },
};

/**
 * Header showing error status
 */
export const Error: Story = {
  args: {
    status: 'error',
  },
};

/**
 * Header without status (loading state)
 */
export const Loading: Story = {
  args: {
    status: undefined,
  },
};

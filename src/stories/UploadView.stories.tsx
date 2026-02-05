import type { Meta, StoryObj } from '@storybook/react';
import UploadView from '../components/photo/UploadView';

/**
 * UploadView Component
 * ====================
 * Photo upload interface with drag-and-drop support.
 *
 * Features:
 * - Drag and drop zone with visual feedback
 * - File type validation (images only)
 * - File size limits
 * - Preview generation
 * - Multiple file support
 * - Responsive design
 */
const meta = {
  title: 'Views/UploadView',
  component: UploadView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main photo upload interface with drag-and-drop functionality and file validation.',
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
} satisfies Meta<typeof UploadView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default upload view - empty state
 */
export const Default: Story = {};

/**
 * Upload view in mobile viewport
 */
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Upload view in tablet viewport
 */
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

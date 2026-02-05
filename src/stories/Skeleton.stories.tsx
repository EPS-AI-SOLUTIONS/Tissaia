// src/stories/Skeleton.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import Skeleton from '../components/ui/Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Skeleton loader component for content placeholders. Uses matrix-themed styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes for sizing',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic skeleton
export const Default: Story = {
  args: {
    className: 'h-4 w-48',
  },
};

// Text line skeleton
export const TextLine: Story = {
  args: {
    className: 'h-4 w-full max-w-md',
  },
};

// Avatar skeleton
export const Avatar: Story = {
  args: {
    className: 'h-12 w-12 rounded-full',
  },
};

// Card skeleton
export const Card: Story = {
  render: () => (
    <div className="space-y-4 p-4 rounded-lg border border-matrix-border bg-matrix-bg-secondary w-80">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  ),
};

// Photo grid skeleton
export const PhotoGrid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-96">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-lg" />
      ))}
    </div>
  ),
};

// Form skeleton
export const Form: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  ),
};

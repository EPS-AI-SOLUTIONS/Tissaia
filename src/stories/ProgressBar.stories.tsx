// src/stories/ProgressBar.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import ProgressBar from '../components/ui/ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Atoms/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Matrix-styled progress bar with animated glow effect and localized messages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    progress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progress percentage (0-100)',
    },
    message: {
      control: 'text',
      description: 'Status message to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default state
export const Default: Story = {
  args: {
    progress: 0,
    message: 'Inicjalizacja systemu...',
  },
};

// Uploading
export const Uploading: Story = {
  args: {
    progress: 25,
    message: 'Przesyłanie danych...',
  },
};

// Analyzing
export const Analyzing: Story = {
  args: {
    progress: 50,
    message: 'Analizowanie struktury obrazu...',
  },
};

// Restoring
export const Restoring: Story = {
  args: {
    progress: 75,
    message: 'Rekonstrukcja pikseli...',
  },
};

// Complete
export const Complete: Story = {
  args: {
    progress: 100,
    message: 'Operacja zakończona pomyślnie',
  },
};

// Indeterminate (no progress)
export const Indeterminate: Story = {
  args: {
    message: 'Oczekiwanie na odpowiedź serwera...',
  },
};

// Long message
export const LongMessage: Story = {
  args: {
    progress: 60,
    message:
      'Przetwarzanie szczegółowej analizy uszkodzeń fotografii z wykrywaniem twarzy i oceną jakości...',
  },
  decorators: [
    (Story) => (
      <div className="w-[500px]">
        <Story />
      </div>
    ),
  ],
};

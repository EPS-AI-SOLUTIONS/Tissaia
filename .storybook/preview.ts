import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  // Global parameters
  parameters: {
    // Actions
    actions: {
      argTypesRegex: '^on[A-Z].*',
      handles: ['click', 'submit', 'change', 'focus', 'blur'],
    },

    // Controls
    controls: {
      expanded: true,
      hideNoControlsWarning: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      sort: 'requiredFirst',
    },

    // Backgrounds
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0f0d' },
        { name: 'light', value: '#f8fafc' },
        { name: 'matrix', value: '#000000' },
      ],
      grid: {
        cellSize: 16,
        opacity: 0.15,
      },
    },

    // Viewports
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        laptop: {
          name: 'Laptop',
          styles: { width: '1280px', height: '800px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1920px', height: '1080px' },
        },
      },
      defaultViewport: 'laptop',
    },

    // Layout
    layout: 'centered',

    // Docs
    docs: {
      toc: {
        headingSelector: 'h2, h3',
        title: 'Spis treści',
      },
      canvas: {
        sourceState: 'shown',
      },
    },

    // A11y accessibility
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
      options: {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    },

    // Story sorting
    options: {
      storySort: {
        order: [
          'Introduction',
          'Getting Started',
          'Atoms',
          'Molecules',
          'Organisms',
          'Templates',
          'Pages',
          '*',
        ],
        method: 'alphabetical',
        locales: 'pl-PL',
      },
    },
  },

  // Global types (toolbar controls)
  globalTypes: {
    theme: {
      description: 'Motyw kolorów',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'dark', title: 'Dark (Matrix)', icon: 'moon' },
          { value: 'light', title: 'Light', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Język interfejsu',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'pl-PL', title: 'Polski', right: '🇵🇱' },
          { value: 'en-US', title: 'English', right: '🇺🇸' },
        ],
        dynamicTitle: true,
      },
    },
  },

  // Initial global values
  initialGlobals: {
    theme: 'dark',
    locale: 'pl-PL',
  },

  // Tags configuration
  tags: ['autodocs'],
};

export default preview;

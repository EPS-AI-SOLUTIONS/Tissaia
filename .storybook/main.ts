import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Story patterns
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  // Addons - Storybook 9 (consolidated core)
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-links',
  ],

  // Framework configuration
  framework: {
    name: '@storybook/react-vite',
    options: {
      strictMode: true,
    },
  },

  // Documentation
  docs: {
    autodocs: true,
    defaultName: 'Documentation',
  },

  // Core settings
  core: {
    disableTelemetry: true,
    enableCrashReports: false,
  },

  // TypeScript settings
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      propFilter: (prop) => {
        if (prop.parent) {
          return !prop.parent.fileName.includes('node_modules');
        }
        return true;
      },
    },
  },

  // Static directories
  staticDirs: ['../public'],

  // Vite customization
  viteFinal: async (config) => {
    return {
      ...config,
      define: {
        ...config.define,
        'process.env': {},
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': '/src',
          '@components': '/src/components',
          '@hooks': '/src/hooks',
          '@services': '/src/services',
          '@store': '/src/store',
          '@types': '/src/types',
          '@utils': '/src/utils',
        },
      },
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [
          ...(config.optimizeDeps?.include || []),
          'react',
          'react-dom',
          'framer-motion',
          'lucide-react',
          'zustand',
          'react-dropzone',
        ],
      },
      server: {
        ...config.server,
        hmr: {
          overlay: true,
        },
      },
    };
  },
};

export default config;

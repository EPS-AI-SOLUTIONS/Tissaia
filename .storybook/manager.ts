import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming/create';

// Custom Tissaia Theme
const tissaiaTheme = create({
  base: 'dark',

  // Brand
  brandTitle: 'Tissaia AI Studio',
  brandUrl: 'https://github.com/pawelserkowski/tissaia',
  brandTarget: '_blank',

  // Colors
  colorPrimary: '#00ff41',
  colorSecondary: '#00ff41',

  // UI
  appBg: '#0a0f0d',
  appContentBg: '#0d1f0d',
  appPreviewBg: '#0a0f0d',
  appBorderColor: '#1a3a1a',
  appBorderRadius: 8,

  // Text colors
  textColor: '#c0ffc0',
  textInverseColor: '#0a0a0a',
  textMutedColor: '#94a3b8',

  // Toolbar
  barTextColor: '#94a3b8',
  barSelectedColor: '#00ff41',
  barHoverColor: '#00ff41',
  barBg: '#0a0f0d',

  // Forms
  inputBg: '#0d1f0d',
  inputBorder: '#1a3a1a',
  inputTextColor: '#c0ffc0',
  inputBorderRadius: 6,

  // Buttons
  buttonBg: '#00ff41',
  buttonBorder: 'transparent',

  // Boolean inputs
  booleanBg: '#1a3a1a',
  booleanSelectedBg: '#00ff41',

  // Typography
  fontBase: '"JetBrains Mono", "Fira Code", monospace',
  fontCode: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
});

// Addon configuration
addons.setConfig({
  theme: tissaiaTheme,

  sidebar: {
    showRoots: true,
    collapsedRoots: ['other'],
    renderLabel: ({ name, type }) => {
      if (type === 'component') {
        return `📦 ${name}`;
      }
      if (type === 'group') {
        return `📁 ${name}`;
      }
      return name;
    },
  },

  panelPosition: 'bottom',
  enableShortcuts: true,
  showToolbar: true,
  initialActive: 'canvas',
  navSize: 300,
  bottomPanelHeight: 300,
  rightPanelWidth: 400,
  selectedPanel: 'controls',
});

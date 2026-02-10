// src/constants/defaults.ts
/**
 * Shared Default Values
 * =====================
 * Single source of truth for default configuration values.
 */
import type { AppSettings, GitLabConfig, RestorationOptions } from '../types';

export const DEFAULT_RESTORATION_OPTIONS: RestorationOptions = {
  removeScratches: true,
  fixFading: true,
  enhanceFaces: true,
  colorize: false,
  denoise: true,
  sharpen: true,
  autoCrop: false,
};

export const DEFAULT_GITLAB_CONFIG: GitLabConfig = {
  enabled: false,
  instanceUrl: 'https://gitlab.com',
  projectId: '',
  privateToken: '',
  branch: 'main',
  uploadPath: 'uploads/restored',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'pl',
  autoAnalyze: true,
  preserveOriginals: true,
  defaultOptions: DEFAULT_RESTORATION_OPTIONS,
  apiEndpoint: '/api',
  gitlab: DEFAULT_GITLAB_CONFIG,
};

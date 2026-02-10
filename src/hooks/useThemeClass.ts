import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook returning the appropriate glass panel class based on current theme.
 * @returns 'glass-panel-light' for light mode, 'glass-panel-dark' for dark mode
 */
export const useGlassPanel = (): string => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'light' ? 'glass-panel-light' : 'glass-panel-dark';
};

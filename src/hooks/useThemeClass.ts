import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook returning the appropriate glass panel class based on current theme.
 * @returns 'glass-panel-light' for light mode, 'glass-panel-dark' for dark mode
 */
export const useGlassPanel = (): string => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'light' ? 'glass-panel-light' : 'glass-panel-dark';
};

/**
 * Hook returning whether current theme is light mode.
 * @returns true if light mode, false if dark mode
 */
export const useIsLightTheme = (): boolean => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'light';
};

/**
 * Hook returning the appropriate class based on current theme.
 * @param lightClass - CSS class for light mode
 * @param darkClass - CSS class for dark mode
 * @returns The appropriate class string
 */
export const useThemeClass = (lightClass: string, darkClass: string): string => {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'light' ? lightClass : darkClass;
};

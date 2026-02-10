import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * Central theme configuration for all view components.
 *
 * Design principles:
 * - Glassmorphism with backdrop-blur
 * - Semi-transparent backgrounds
 * - Light mode: emerald accents, white/slate backgrounds
 * - Dark mode: matrix-accent (#00ff41), black/slate backgrounds
 */

export interface ViewTheme {
  container: string;
  containerInner: string;
  glassPanel: string;
  glassPanelHover: string;
  header: string;
  headerTitle: string;
  headerSubtitle: string;
  headerIcon: string;
  title: string;
  subtitle: string;
  text: string;
  textMuted: string;
  textAccent: string;
  input: string;
  inputIcon: string;
  btnPrimary: string;
  btnSecondary: string;
  btnDanger: string;
  btnGhost: string;
  card: string;
  cardHover: string;
  listItem: string;
  listItemHover: string;
  badge: string;
  badgeAccent: string;
  border: string;
  divider: string;
  scrollbar: string;
  empty: string;
  loading: string;
  error: string;
  dropdown: string;
  dropdownItem: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
  iconDefault: string;
  iconAccent: string;
  iconMuted: string;
  isLight: boolean;
}

// ============================================
// THEME TOKENS
// ============================================

const LIGHT: ViewTheme = {
  isLight: true,
  container: 'bg-[rgba(255,255,255,0.4)] backdrop-blur-xl',
  containerInner: 'bg-white/30',
  glassPanel: 'bg-white/40 backdrop-blur-xl border border-white/20 shadow-lg',
  glassPanelHover: 'hover:bg-white/50 hover:border-emerald-500/30',
  header: 'bg-white/30 backdrop-blur-xl border-b border-white/20',
  headerTitle: 'text-slate-800 font-bold',
  headerSubtitle: 'text-slate-500',
  headerIcon: 'text-emerald-600',
  title: 'text-slate-800',
  subtitle: 'text-slate-600',
  text: 'text-slate-700',
  textMuted: 'text-slate-500',
  textAccent: 'text-emerald-600',
  input:
    'bg-white/50 border border-slate-200/50 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500/50 focus:bg-white/70 rounded-xl outline-none transition-all',
  inputIcon: 'text-slate-400',
  btnPrimary:
    'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 border border-emerald-500/30 backdrop-blur-sm rounded-xl transition-all',
  btnSecondary:
    'bg-white/30 hover:bg-white/50 text-slate-600 border border-slate-200/50 backdrop-blur-sm rounded-xl transition-all',
  btnDanger:
    'bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 backdrop-blur-sm rounded-xl transition-all',
  btnGhost: 'hover:bg-slate-500/10 text-slate-600 rounded-xl transition-all',
  card: 'bg-white/40 backdrop-blur-sm border border-white/20 rounded-2xl shadow-md',
  cardHover: 'hover:bg-white/50 hover:border-emerald-500/30 hover:shadow-lg',
  listItem: 'bg-white/30 border border-white/10 rounded-xl',
  listItemHover: 'hover:bg-white/50 hover:border-emerald-500/20',
  badge: 'bg-slate-500/10 text-slate-600 border border-slate-200/50 rounded-md px-2 py-1 text-xs',
  badgeAccent:
    'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md px-2 py-1 text-xs',
  border: 'border-slate-200/50',
  divider: 'border-t border-slate-200/30',
  scrollbar: 'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent',
  empty: 'text-slate-400 italic',
  loading: 'text-emerald-600 animate-pulse',
  error: 'text-red-600 bg-red-500/10 border border-red-500/20 rounded-xl p-4',
  dropdown: 'bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl',
  dropdownItem: 'hover:bg-emerald-500/10 text-slate-700 rounded-lg transition-all',
  accentBg: 'bg-emerald-500/10',
  accentText: 'text-emerald-600',
  accentBorder: 'border-emerald-500/30',
  iconDefault: 'text-slate-600',
  iconAccent: 'text-emerald-600',
  iconMuted: 'text-slate-400',
};

const DARK: ViewTheme = {
  isLight: false,
  container: 'bg-black/20 backdrop-blur-sm',
  containerInner: 'bg-black/30',
  glassPanel: 'bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl',
  glassPanelHover: 'hover:bg-black/50 hover:border-matrix-accent/30',
  header: 'bg-black/30 backdrop-blur-xl border-b border-white/10',
  headerTitle: 'text-white font-bold',
  headerSubtitle: 'text-slate-400',
  headerIcon: 'text-matrix-accent',
  title: 'text-white',
  subtitle: 'text-slate-300',
  text: 'text-slate-200',
  textMuted: 'text-slate-400',
  textAccent: 'text-matrix-accent',
  input:
    'bg-black/30 border border-white/10 text-slate-200 placeholder:text-slate-500 focus:border-matrix-accent/50 focus:bg-black/50 rounded-xl outline-none transition-all',
  inputIcon: 'text-slate-500',
  btnPrimary:
    'bg-matrix-accent/10 hover:bg-matrix-accent/20 text-matrix-accent border border-matrix-accent/30 backdrop-blur-sm rounded-xl transition-all',
  btnSecondary:
    'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 backdrop-blur-sm rounded-xl transition-all',
  btnDanger:
    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 backdrop-blur-sm rounded-xl transition-all',
  btnGhost: 'hover:bg-white/5 text-slate-400 rounded-xl transition-all',
  card: 'bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl shadow-lg',
  cardHover: 'hover:bg-black/50 hover:border-matrix-accent/30 hover:shadow-xl',
  listItem: 'bg-black/30 border border-white/5 rounded-xl',
  listItemHover: 'hover:bg-black/40 hover:border-white/10',
  badge: 'bg-white/5 text-slate-400 border border-white/10 rounded-md px-2 py-1 text-xs',
  badgeAccent:
    'bg-matrix-accent/10 text-matrix-accent border border-matrix-accent/20 rounded-md px-2 py-1 text-xs',
  border: 'border-white/10',
  divider: 'border-t border-white/5',
  scrollbar: 'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent',
  empty: 'text-slate-500 italic',
  loading: 'text-matrix-accent animate-pulse',
  error: 'text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4',
  dropdown: 'bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl',
  dropdownItem: 'hover:bg-white/5 text-slate-300 rounded-lg transition-all',
  accentBg: 'bg-matrix-accent/10',
  accentText: 'text-matrix-accent',
  accentBorder: 'border-matrix-accent/30',
  iconDefault: 'text-slate-300',
  iconAccent: 'text-matrix-accent',
  iconMuted: 'text-slate-500',
};

// ============================================
// HOOK
// ============================================

export const useViewTheme = (): ViewTheme => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  return useMemo(() => (isLight ? LIGHT : DARK), [isLight]);
};

export default useViewTheme;

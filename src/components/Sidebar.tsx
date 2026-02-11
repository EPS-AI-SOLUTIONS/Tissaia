// src/components/Sidebar.tsx
import {
  Activity,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  type LucideIcon,
  Moon,
  Scissors,
  Settings,
  Sparkles,
  Sun,
  Upload,
} from 'lucide-react';
/**
 * Navigation Sidebar - Regis Style
 * =================================
 * Matrix Glass styled sidebar with grouped navigation.
 */
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useViewTheme } from '../hooks/useViewTheme';
import { useJobStore } from '../store/useJobStore';
import { useViewStore } from '../store/useViewStore';
import type { View } from '../types';

// ============================================
// TYPES
// ============================================

type NavGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  items: { id: View; icon: LucideIcon; label: string }[];
};

// ============================================
// SIDEBAR HELPERS
// ============================================

const STATUS_BADGE_CLASSES: Record<string, string> = {
  completed: 'bg-white/15 text-white/80',
  failed: 'bg-red-500/20 text-red-400',
};

const getStatusBadgeClass = (status: string): string =>
  STATUS_BADGE_CLASSES[status] ?? 'bg-white/10 text-white/70';

const THEME_LABELS: Record<string, Record<string, string>> = {
  dark: { pl: 'TRYB CIEMNY', en: 'DARK MODE' },
  light: { pl: 'TRYB JASNY', en: 'LIGHT MODE' },
};

const getThemeLabel = (theme: string, lang: string): string =>
  THEME_LABELS[theme]?.[lang] ?? THEME_LABELS[theme]?.en ?? 'DARK MODE';

const LOGO_CONFIG = {
  dark: { src: '/logodark.webp', filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' },
  light: { src: '/logolight.webp', filter: 'drop-shadow(0 0 20px rgba(45,106,79,0.5))' },
} as const;

// ============================================
// SIDEBAR COMPONENT
// ============================================

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const currentView = useViewStore((s) => s.currentView);
  const setCurrentView = useViewStore((s) => s.setCurrentView);
  const currentJob = useJobStore((s) => s.currentJob);
  const { resolvedTheme, toggleTheme } = useTheme();
  const theme = useViewTheme();
  const isLight = theme.isLight;

  // Collapsed state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('tissaia_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem('tissaia_sidebar_collapsed', String(isCollapsed));
    } catch {
      /* ignore */
    }
  }, [isCollapsed]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  // Language dropdown state
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showLangDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLangDropdown]);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  ];

  const selectLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLangDropdown(false);
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[1];

  // Navigation groups
  const navGroups: NavGroup[] = [
    {
      id: 'main',
      label: t('sidebar.groups.main', 'GŁÓWNE'),
      icon: Sparkles,
      items: [
        { id: 'upload', icon: Upload, label: t('nav.upload', 'Wgraj') },
        { id: 'crop', icon: Scissors, label: t('nav.crop', 'Rozdziel') },
        { id: 'restore', icon: Sparkles, label: t('nav.restore', 'Restauracja') },
        { id: 'results', icon: CheckCircle, label: t('nav.results', 'Wyniki') },
      ],
    },
    {
      id: 'data',
      label: t('sidebar.groups.data', 'DANE'),
      icon: Clock,
      items: [
        { id: 'history', icon: Clock, label: t('nav.history', 'Historia') },
        { id: 'settings', icon: Settings, label: t('nav.settings', 'Ustawienia') },
      ],
    },
    {
      id: 'system',
      label: t('sidebar.groups.system', 'SYSTEM'),
      icon: Activity,
      items: [{ id: 'health', icon: Activity, label: t('nav.health', 'Status') }],
    },
  ];

  // Track expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('tissaia_expanded_groups');
      return saved ? JSON.parse(saved) : { main: true, data: true, system: true };
    } catch {
      return { main: true, data: true, system: true };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('tissaia_expanded_groups', JSON.stringify(expandedGroups));
    } catch {
      /* ignore */
    }
  }, [expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const glassPanel = resolvedTheme === 'light' ? 'glass-panel-light' : 'glass-panel-dark';

  return (
    <div
      className={`${isCollapsed ? 'w-20' : 'w-64'} h-full flex flex-col z-20 transition-all duration-300 relative p-2 gap-2 overflow-y-auto overflow-x-hidden scrollbar-hide`}
    >
      {/* Logo + Collapse Toggle */}
      <div className="flex items-center justify-between flex-shrink-0 py-4 px-1">
        {/* Logo */}
        <div className={`flex items-center justify-center ${isCollapsed ? 'w-full' : 'flex-1'}`}>
          <img
            src={
              LOGO_CONFIG[resolvedTheme as keyof typeof LOGO_CONFIG]?.src ?? LOGO_CONFIG.dark.src
            }
            alt="TISSAIA"
            className={`${isCollapsed ? 'w-12 h-12' : 'w-40 h-auto'} object-contain transition-all duration-300`}
            style={{
              filter:
                LOGO_CONFIG[resolvedTheme as keyof typeof LOGO_CONFIG]?.filter ??
                LOGO_CONFIG.dark.filter,
            }}
          />
        </div>

        {/* Collapse Toggle Button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={handleToggleCollapse}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all flex-shrink-0 ${
              isLight
                ? 'hover:bg-black/5 text-slate-400 hover:text-emerald-600'
                : 'hover:bg-white/10 text-white/40 hover:text-white'
            }`}
            title="Collapse sidebar"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          type="button"
          onClick={handleToggleCollapse}
          className={`flex items-center justify-center w-full py-2 rounded-lg transition-all flex-shrink-0 ${
            isLight
              ? 'hover:bg-black/5 text-slate-400 hover:text-emerald-600'
              : 'hover:bg-white/10 text-white/40 hover:text-white'
          }`}
          title="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Grouped Navigation */}
      <nav className="flex flex-col gap-2 flex-shrink-0">
        {navGroups.map((group) => {
          const isExpanded = expandedGroups[group.id];
          const hasActiveItem = group.items.some((item) => item.id === currentView);
          const GroupIcon = group.icon;

          return (
            <div key={group.id} className={`${glassPanel} overflow-hidden`}>
              {/* Group Header */}
              {!isCollapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 transition-all group ${
                    hasActiveItem
                      ? `${isLight ? 'text-emerald-600 bg-emerald-500/5' : 'text-white bg-white/5'}`
                      : `${theme.textMuted} ${isLight ? 'hover:text-black hover:bg-black/5' : 'hover:text-white hover:bg-white/5'}`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon size={14} />
                    <span className="text-[10px] font-bold tracking-[0.12em] uppercase">
                      {group.label}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                  />
                </button>
              ) : null}

              {/* Group Items */}
              <div
                className={`px-1.5 pb-1.5 space-y-0.5 overflow-hidden transition-all duration-200 ${
                  !isCollapsed && !isExpanded ? 'max-h-0 opacity-0 pb-0' : 'max-h-96 opacity-100'
                } ${isCollapsed ? 'py-1.5' : ''}`}
              >
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrentView(item.id)}
                    className={`relative w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-all duration-200 group ${
                      currentView === item.id
                        ? `${isLight ? 'bg-emerald-500/15 text-emerald-600' : 'bg-white/10 text-white'}`
                        : `${theme.textMuted} ${isLight ? 'hover:bg-black/5 hover:text-black' : 'hover:bg-white/5 hover:text-white'}`
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon
                      size={16}
                      className={`${currentView === item.id ? (isLight ? 'text-emerald-600' : 'text-white') : `${theme.iconMuted} ${isLight ? 'group-hover:text-black' : 'group-hover:text-white'}`} transition-colors flex-shrink-0`}
                    />
                    {!isCollapsed && (
                      <span className="font-medium text-xs tracking-wide truncate">
                        {item.label}
                      </span>
                    )}
                    {currentView === item.id && (
                      <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${isLight ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'}`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Current Job Status */}
      {currentJob && !isCollapsed && (
        <div className={`${glassPanel} p-3`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs ${theme.textMuted}`}>Bieżące zadanie</span>
            <span
              className={`
              text-xs px-2 py-0.5 rounded-full
              ${getStatusBadgeClass(currentJob.status)}
            `}
            >
              {currentJob.status}
            </span>
          </div>
          <div className={`text-sm truncate ${theme.text}`}>{currentJob.photo.name}</div>
          {currentJob.status !== 'completed' && currentJob.status !== 'failed' && (
            <div className="mt-2 progress-matrix">
              <div className="progress-matrix-bar" style={{ width: `${currentJob.progress}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer / Lang & Theme Toggle */}
      <div className={`${glassPanel} p-2 space-y-1`}>
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} gap-3 w-full p-2 rounded-lg ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/5'} transition-all group`}
          title={isCollapsed ? `Theme: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'}` : undefined}
        >
          <div className="relative">
            {resolvedTheme === 'dark' ? (
              <Moon
                size={18}
                className={`${theme.iconMuted} group-hover:text-white transition-colors`}
              />
            ) : (
              <Sun
                size={18}
                className="text-amber-500 group-hover:text-amber-400 transition-colors"
              />
            )}
          </div>
          {!isCollapsed && (
            <span
              className={`text-xs font-mono ${theme.textMuted} ${isLight ? 'group-hover:text-black' : 'group-hover:text-white'} truncate`}
            >
              {getThemeLabel(resolvedTheme, i18n.language)}
            </span>
          )}
        </button>

        {/* Language Selector */}
        <div className="relative" ref={langDropdownRef}>
          <button
            type="button"
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3 w-full p-2 rounded-lg ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/5'} transition-all group`}
            title={isCollapsed ? `Language: ${currentLang.name}` : undefined}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe
                  size={18}
                  className={`${theme.iconMuted} ${isLight ? 'group-hover:text-emerald-600' : 'group-hover:text-white'} transition-colors`}
                />
              </div>
              {!isCollapsed && (
                <span
                  className={`text-xs font-mono ${theme.textMuted} ${isLight ? 'group-hover:text-black' : 'group-hover:text-white'} truncate`}
                >
                  <span className="mr-1.5">{currentLang.flag}</span>
                  <span className={`font-bold ${theme.textAccent}`}>
                    {currentLang.code.toUpperCase()}
                  </span>
                </span>
              )}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={14}
                className={`${theme.iconMuted} transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`}
              />
            )}
          </button>

          {/* Language Dropdown */}
          {showLangDropdown && (
            <div
              className={`absolute bottom-full left-0 right-0 mb-1 rounded-xl ${isLight ? 'bg-white/95 border-emerald-500/20 shadow-lg' : 'bg-black/90 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)]'} backdrop-blur-xl border overflow-hidden z-50`}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs transition-all ${
                    i18n.language === lang.code
                      ? `${isLight ? 'bg-emerald-500/20 text-emerald-600' : 'bg-white/15 text-white'}`
                      : `${theme.textMuted} ${isLight ? 'hover:bg-black/5 hover:text-black' : 'hover:bg-white/5 hover:text-white'}`
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="font-mono">{lang.name}</span>
                  {i18n.language === lang.code && (
                    <div
                      className={`ml-auto w-1.5 h-1.5 rounded-full ${isLight ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.4)]'}`}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Version */}
      {!isCollapsed && (
        <div className={`text-center text-[10px] ${theme.textMuted} py-2`}>
          <span className={theme.textAccent}>Tissaia</span> v3.0.0 | Gemini Vision
        </div>
      )}
    </div>
  );
}

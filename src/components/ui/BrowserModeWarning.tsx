// src/components/ui/BrowserModeWarning.tsx
/**
 * Browser Mode Warning Banner
 * ===========================
 * Displays a warning when the app is running in browser mode
 * instead of the Tauri desktop application.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const SESSION_STORAGE_KEY = 'tissaia-browser-warning-dismissed';

/**
 * Detects if the app is running inside Tauri
 */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

export default function BrowserModeWarning() {
  // Use lazy initialization to avoid setState in effect
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
  });
  const [isInBrowser] = useState(() => !isTauri());
  const { resolvedTheme } = useTheme();

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    setIsDismissed(true);
  };

  // Don't render if in Tauri or already dismissed
  if (!isInBrowser || isDismissed) {
    return null;
  }

  const isLight = resolvedTheme === 'light';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`
          relative overflow-hidden
          ${isLight
            ? 'bg-amber-50/90 border-amber-300/50 text-amber-900'
            : 'bg-amber-900/20 border-amber-500/30 text-amber-200'
          }
          border-b backdrop-blur-sm
        `}
      >
        {/* Matrix scanline effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff41]/5 to-transparent pointer-events-none"
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        <div className="relative px-4 py-3 flex items-center justify-between gap-4">
          {/* Warning icon and message */}
          <div className="flex items-center gap-3">
            {/* Pulsing warning indicator */}
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="flex-shrink-0"
            >
              <svg
                className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </motion.div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className={`font-semibold text-sm ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
                Tryb przegladarki
              </span>
              <span className={`text-sm ${isLight ? 'text-amber-700' : 'text-amber-200/80'}`}>
                Funkcje AI wymagaja aplikacji desktopowej.
                <span className="hidden sm:inline"> Pobierz aplikacje Tissaia-AI, aby korzystac z pelnych mozliwosci.</span>
              </span>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1.5 rounded-md transition-all duration-200
              ${isLight
                ? 'hover:bg-amber-200/50 text-amber-600 hover:text-amber-800'
                : 'hover:bg-amber-500/20 text-amber-400 hover:text-amber-300'
              }
              focus:outline-none focus:ring-2 focus:ring-[#00ff41]/50
            `}
            aria-label="Zamknij ostrzezenie"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, #00ff41, transparent)`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// src/components/SettingsView.tsx
/**
 * Settings View - Tauri Edition
 * =============================
 * Application settings and preferences.
 */

import { Eye, EyeOff, Key, Monitor, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';
import { useOllamaModels, useProvidersStatus, useSetApiKey } from '../hooks/useApi';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Language, Theme } from '../types';

// ============================================
// SETTING ROW
// ============================================

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-matrix-border last:border-0">
      <div>
        <div className="font-medium">{label}</div>
        {description && <div className="text-sm text-matrix-text-dim mt-1">{description}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ============================================
// SETTINGS VIEW COMPONENT
// ============================================

function OllamaModelsList() {
  const { data: models, isLoading, isError } = useOllamaModels();

  if (isLoading) return <div className="text-sm text-matrix-text-dim">Ładowanie modeli...</div>;
  if (isError) return <div className="text-sm text-red-400">Błąd połączenia z Ollama</div>;
  if (!models || models.length === 0)
    return <div className="text-sm text-yellow-400">Brak dostępnych modeli</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {models.map((model) => (
        <div
          key={model.id}
          className="p-3 bg-matrix-bg-secondary rounded-lg border border-matrix-border flex items-center justify-between"
        >
          <span className="font-mono text-sm">{model.name}</span>
          <span className="text-xs bg-matrix-accent/10 text-matrix-accent px-2 py-0.5 rounded">
            {model.provider}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SettingsView() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { data: providers } = useProvidersStatus();
  const setApiKeyMutation = useSetApiKey();

  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'dark', label: t('settings.theme.dark'), icon: <Moon size={18} /> },
    { value: 'light', label: t('settings.theme.light'), icon: <Sun size={18} /> },
    { value: 'system', label: t('settings.theme.system'), icon: <Monitor size={18} /> },
  ];

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'pl', label: 'Polski', flag: '\u{1F1F5}\u{1F1F1}' },
    { value: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
  ];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('tissaia-language', lang);
  };

  const handleSaveApiKey = async (provider: string) => {
    const key = apiKeys[provider];
    if (!key) return;

    try {
      await setApiKeyMutation.mutateAsync({ provider, key });
      toast.success(`Klucz ${provider} zapisany`);
      setApiKeys((prev) => ({ ...prev, [provider]: '' }));
    } catch {
      toast.error('Błąd zapisywania klucza');
    }
  };

  const providerConfigs = [
    { name: 'google', label: 'Google Gemini', envKey: 'GOOGLE_API_KEY' },
    { name: 'anthropic', label: 'Anthropic Claude', envKey: 'ANTHROPIC_API_KEY' },
    { name: 'openai', label: 'OpenAI GPT-4', envKey: 'OPENAI_API_KEY' },
    { name: 'mistral', label: 'Mistral AI', envKey: 'MISTRAL_API_KEY' },
    { name: 'groq', label: 'Groq', envKey: 'GROQ_API_KEY' },
    { name: 'ollama', label: 'Ollama (Local)', envKey: 'Bez klucza' },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-matrix-accent">{t('settings.title')}</h2>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Appearance */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Wygląd</h3>

          {/* Theme */}
          <SettingRow label={t('settings.theme')} description="Wybierz motyw kolorystyczny">
            <div className="flex gap-2">
              {themes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  type="button"
                  onClick={() => setTheme(themeOption.value)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                    ${
                      theme === themeOption.value
                        ? 'bg-matrix-accent/20 text-matrix-accent border border-matrix-accent/50'
                        : 'bg-matrix-bg-secondary text-matrix-text-dim hover:text-matrix-text'
                    }
                  `}
                >
                  {themeOption.icon}
                  <span className="text-sm">{themeOption.label}</span>
                </button>
              ))}
            </div>
          </SettingRow>

          {/* Language */}
          <SettingRow label={t('settings.language')} description="Zmień język interfejsu">
            <div className="flex gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => handleLanguageChange(lang.value)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all
                    ${
                      settings.language === lang.value
                        ? 'bg-matrix-accent/20 text-matrix-accent border border-matrix-accent/50'
                        : 'bg-matrix-bg-secondary text-matrix-text-dim hover:text-matrix-text'
                    }
                  `}
                >
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.label}</span>
                </button>
              ))}
            </div>
          </SettingRow>
        </div>

        {/* Behavior */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">Zachowanie</h3>

          {/* Auto-analyze */}
          <SettingRow
            label={t('settings.autoAnalyze')}
            description="Automatycznie analizuj zdjęcia po wgraniu"
          >
            <button
              type="button"
              onClick={() => updateSettings({ autoAnalyze: !settings.autoAnalyze })}
              className={`
                w-12 h-6 rounded-full transition-colors flex items-center
                ${settings.autoAnalyze ? 'bg-matrix-accent justify-end' : 'bg-matrix-border justify-start'}
              `}
            >
              <div className="w-5 h-5 rounded-full bg-white mx-0.5" />
            </button>
          </SettingRow>

          {/* Preserve originals */}
          <SettingRow
            label={t('settings.preserveOriginals')}
            description="Zachowaj oryginalne zdjęcia w historii"
          >
            <button
              type="button"
              onClick={() => updateSettings({ preserveOriginals: !settings.preserveOriginals })}
              className={`
                w-12 h-6 rounded-full transition-colors flex items-center
                ${settings.preserveOriginals ? 'bg-matrix-accent justify-end' : 'bg-matrix-border justify-start'}
              `}
            >
              <div className="w-5 h-5 rounded-full bg-white mx-0.5" />
            </button>
          </SettingRow>
        </div>

        {/* Ollama Models */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="text-matrix-accent" size={20} />
            <h3 className="font-semibold">Ollama Local Models</h3>
          </div>

          <p className="text-sm text-matrix-text-dim mb-4">
            Dostępne lokalne modele (wymagane uruchomienie Ollama).
          </p>

          <OllamaModelsList />
        </div>

        {/* AI Providers */}
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-4">
            <Key className="text-matrix-accent" size={20} />
            <h3 className="font-semibold">Klucze API</h3>
          </div>

          <p className="text-sm text-matrix-text-dim mb-4">
            Wprowadź klucze API dla providerów AI. Klucze można też ustawić przez zmienne
            środowiskowe.
          </p>

          <div className="space-y-4">
            {providerConfigs.map((config) => {
              const provider = providers?.find((p) => p.name === config.name);
              const isAvailable = provider?.available ?? false;

              return (
                <div key={config.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{config.label}</div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isAvailable
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {isAvailable ? 'Aktywny' : 'Brak klucza'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showTokens[config.name] ? 'text' : 'password'}
                        value={apiKeys[config.name] || ''}
                        onChange={(e) =>
                          setApiKeys((prev) => ({ ...prev, [config.name]: e.target.value }))
                        }
                        placeholder={`${config.envKey} lub wpisz nowy`}
                        className="w-full px-3 py-2 pr-10 bg-matrix-bg-secondary border border-matrix-border rounded-lg focus:border-matrix-accent focus:outline-none transition-colors text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowTokens((prev) => ({
                            ...prev,
                            [config.name]: !prev[config.name],
                          }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-matrix-text-dim hover:text-matrix-text"
                      >
                        {showTokens[config.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveApiKey(config.name)}
                      disabled={!apiKeys[config.name] || setApiKeyMutation.isPending}
                      className="px-4 py-2 bg-matrix-accent/20 text-matrix-accent border border-matrix-accent/50 rounded-lg hover:bg-matrix-accent/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Zapisz
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* About */}
        <div className="glass-panel p-4">
          <h3 className="font-semibold mb-4">O aplikacji</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-matrix-text-dim">Wersja</span>
              <span className="text-matrix-accent">3.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-matrix-text-dim">Backend</span>
              <span>Rust + Tauri 2.x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-matrix-text-dim">Frontend</span>
              <span>React 19 + Vite</span>
            </div>
            <div className="flex justify-between">
              <span className="text-matrix-text-dim">AI Providers</span>
              <span>Google, Claude, GPT-4, Mistral, Groq</span>
            </div>
            <div className="flex justify-between">
              <span className="text-matrix-text-dim">Autor</span>
              <span>Pawel Serkowski</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-matrix-border">
            <p className="text-xs text-matrix-text-dim text-center italic">
              "Precyzja to nie uprzejmość, to wymóg." — Tissaia de Vries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

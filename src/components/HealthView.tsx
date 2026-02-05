// src/components/HealthView.tsx
/**
 * Health Dashboard View - Tauri Edition
 * ======================================
 * Monitor AI providers status and system health.
 */
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Server,
} from 'lucide-react';
import { useHealth, useProvidersStatus, type ProviderStatus } from '../hooks/useApi';
import { useViewTheme } from '../hooks';
import Skeleton from './ui/Skeleton';

// ============================================
// PROVIDER CARD
// ============================================

interface ProviderCardProps {
  provider: ProviderStatus;
  index: number;
  theme: ReturnType<typeof useViewTheme>;
}

function ProviderCard({ provider, index, theme }: ProviderCardProps) {
  const { t } = useTranslation();

  const status = provider.available && provider.enabled
    ? 'healthy'
    : provider.enabled
    ? 'unavailable'
    : 'disabled';

  const statusConfig = {
    healthy: {
      icon: CheckCircle,
      color: theme.isLight ? 'text-emerald-600' : 'text-green-400',
      bg: theme.isLight ? 'bg-emerald-500/10' : 'bg-green-500/10',
      border: theme.isLight ? 'border-emerald-500/30' : 'border-green-500/30',
      label: t('health.healthy'),
    },
    disabled: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      label: 'Wyłączony',
    },
    unavailable: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: t('health.unavailable'),
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`${theme.card} p-4 border ${config.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-semibold capitalize ${theme.title}`}>{provider.name}</h3>
          <div className={`flex items-center gap-2 mt-2 ${config.color}`}>
            <StatusIcon size={18} />
            <span className="text-sm">{config.label}</span>
          </div>
        </div>

        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Server size={24} className={config.color} />
        </div>
      </div>

      {/* Priority */}
      <div className={`mt-3 text-xs ${theme.textMuted}`}>
        Priorytet: {provider.priority}
      </div>

      {/* Error */}
      {provider.last_error && (
        <div className="mt-3 p-2 rounded-lg bg-red-500/10 text-red-500 text-xs">
          {provider.last_error}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// HEALTH VIEW COMPONENT
// ============================================

export default function HealthView() {
  const { t } = useTranslation();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();
  const { data: providers, isLoading: providersLoading } = useProvidersStatus();
  const theme = useViewTheme();

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const overallStatus = health?.status === 'healthy'
    ? 'healthy'
    : providers?.some(p => p.available)
    ? 'degraded'
    : 'unavailable';

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${theme.accentBg}`}>
            <Activity className={theme.iconAccent} size={24} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${theme.textAccent}`}>{t('health.title')}</h2>
            <p className={theme.textMuted}>Monitorowanie providerów AI (Rust/Tauri)</p>
          </div>
        </div>

        <button
          onClick={() => refetchHealth()}
          className={theme.btnSecondary + ' px-4 py-2 flex items-center gap-2'}
          disabled={healthLoading}
        >
          <RefreshCw size={16} className={healthLoading ? 'animate-spin' : ''} />
          Odśwież
        </button>
      </div>

      {/* Overall Status */}
      {healthLoading ? (
        <Skeleton className="h-24 w-full mb-6" />
      ) : health && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${theme.card} p-6 mb-6 border ${
            overallStatus === 'healthy'
              ? (theme.isLight ? 'border-emerald-500/30' : 'border-green-500/30')
              : overallStatus === 'degraded'
              ? 'border-yellow-500/30'
              : 'border-red-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${
                overallStatus === 'healthy'
                  ? (theme.isLight ? 'bg-emerald-500/20' : 'bg-green-500/20')
                  : overallStatus === 'degraded'
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
              }`}>
                <Activity
                  size={32}
                  className={
                    overallStatus === 'healthy'
                      ? (theme.isLight ? 'text-emerald-600' : 'text-green-400')
                      : overallStatus === 'degraded'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }
                />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${theme.title}`}>
                  System {overallStatus === 'healthy' ? 'sprawny' : overallStatus === 'degraded' ? 'ograniczony' : 'niedostępny'}
                </h3>
                <p className={`text-sm ${theme.textMuted}`}>
                  Wersja: {health.version} (Rust/Tauri)
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className={`flex items-center gap-2 ${theme.textMuted}`}>
                <Clock size={16} />
                <span>{t('health.uptime')}</span>
              </div>
              <div className={`text-2xl font-bold ${theme.textAccent}`}>
                {formatUptime(health.uptime_seconds)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Providers Grid */}
      <div className="mb-6">
        <h3 className={`font-semibold mb-4 ${theme.title}`}>Providerzy AI</h3>

        {providersLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : providers && providers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((provider, index) => (
              <ProviderCard
                key={provider.name}
                provider={provider}
                index={index}
                theme={theme}
              />
            ))}
          </div>
        ) : (
          <p className={theme.textMuted}>Brak skonfigurowanych providerów</p>
        )}
      </div>

      {/* Info Card */}
      <div className={`${theme.card} p-4`}>
        <h3 className={`font-semibold mb-2 ${theme.title}`}>Konfiguracja</h3>
        <p className={`text-sm ${theme.textMuted}`}>
          Aby aktywować providera, ustaw odpowiedni klucz API w zmiennych środowiskowych:
        </p>
        <ul className={`mt-2 text-sm ${theme.textMuted} space-y-1`}>
          <li><code className="bg-black/20 px-1 rounded">GOOGLE_API_KEY</code> - Google Gemini</li>
          <li><code className="bg-black/20 px-1 rounded">ANTHROPIC_API_KEY</code> - Claude</li>
          <li><code className="bg-black/20 px-1 rounded">OPENAI_API_KEY</code> - GPT-4</li>
          <li><code className="bg-black/20 px-1 rounded">MISTRAL_API_KEY</code> - Mistral</li>
          <li><code className="bg-black/20 px-1 rounded">GROQ_API_KEY</code> - Groq</li>
        </ul>
      </div>
    </div>
  );
}

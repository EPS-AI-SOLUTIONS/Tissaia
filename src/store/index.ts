// src/store/index.ts
/**
 * Store Barrel Export
 * ===================
 * Re-exports all domain stores.
 */

export { selectCurrentJob, useJobStore } from './useJobStore';
export { selectOptions, useOptionsStore } from './useOptionsStore';
export { selectPhotos, usePhotoStore } from './usePhotoStore';
export {
  selectPipelineError,
  selectPipelineIsRunning,
  selectPipelineProgress,
  selectPipelineReport,
  usePipelineStore,
} from './usePipelineStore';
export { selectHistory, selectSettings, useSettingsStore } from './useSettingsStore';
// Domain stores
export { selectCurrentView, selectIsLoading, useViewStore } from './useViewStore';

// ============================================
// LEGACY LOCALSTORAGE MIGRATION
// ============================================

function migrateFromLegacyStorage() {
  try {
    const legacyRaw = localStorage.getItem('tissaia-storage');
    if (!legacyRaw) return;

    const legacy = JSON.parse(legacyRaw);
    const legacyState = legacy?.state;
    if (!legacyState) return;

    // Migrate settings + history
    if (legacyState.settings || legacyState.history) {
      const settingsData = {
        state: {
          settings: legacyState.settings,
          history: legacyState.history ?? [],
        },
        version: 0,
      };
      localStorage.setItem('tissaia-settings', JSON.stringify(settingsData));
    }

    // Migrate options
    if (legacyState.options) {
      const optionsData = {
        state: {
          options: legacyState.options,
        },
        version: 0,
      };
      localStorage.setItem('tissaia-options', JSON.stringify(optionsData));
    }

    // Remove legacy key
    localStorage.removeItem('tissaia-storage');
    console.log('[Store] Migrated from legacy tissaia-storage');
  } catch (error) {
    console.warn('[Store] Legacy migration failed:', error);
  }
}

// Run migration on import
migrateFromLegacyStorage();

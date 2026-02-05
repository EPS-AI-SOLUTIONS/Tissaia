// src/i18n.ts
/**
 * Tissaia-AI Internationalization
 * ================================
 * i18next configuration with Polish (default) and English.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ============================================
// TRANSLATIONS
// ============================================

const resources = {
  pl: {
    translation: {
      // App
      'app.title': 'Tissaia-AI',
      'app.subtitle': 'Restauracja zdjęć AI',
      'app.tagline': 'Przywróć wspomnienia do życia',

      // Navigation
      'nav.upload': 'Wgraj zdjęcie',
      'nav.analyze': 'Analiza',
      'nav.restore': 'Restauracja',
      'nav.history': 'Historia',
      'nav.settings': 'Ustawienia',
      'nav.health': 'Status systemu',

      // Upload
      'upload.title': 'Wgraj zdjęcie do restauracji',
      'upload.dragdrop': 'Przeciągnij i upuść zdjęcie tutaj',
      'upload.or': 'lub',
      'upload.browse': 'Wybierz plik',
      'upload.formats': 'Obsługiwane formaty: JPEG, PNG, WebP',
      'upload.maxSize': 'Maksymalny rozmiar: 20MB',
      'upload.added': '{{name}} dodano',
      'upload.uploadedPhotos': 'Wgrane zdjęcia ({{count}})',
      'upload.removeAll': 'Usuń wszystkie',
      'upload.analyzePhotos': 'Analizuj zdjęcia',

      // Analysis
      'analyze.title': 'Analiza zdjęcia',
      'analyze.faces': 'Wykryte twarze',
      'analyze.damage': 'Ocena uszkodzeń',
      'analyze.era': 'Szacowana epoka',
      'analyze.quality': 'Jakość',
      'analyze.recommendations': 'Rekomendacje',
      'analyze.scratches': 'Rysy',
      'analyze.fading': 'Wyblakłe kolory',
      'analyze.tears': 'Rozdarcia',
      'analyze.waterDamage': 'Uszkodzenia wodą',

      // Restoration
      'restore.title': 'Opcje restauracji',
      'restore.removeScratches': 'Usuń rysy',
      'restore.fixFading': 'Napraw kolory',
      'restore.enhanceFaces': 'Popraw twarze',
      'restore.colorize': 'Koloryzuj (B&W)',
      'restore.denoise': 'Redukcja szumu',
      'restore.sharpen': 'Wyostrz',
      'restore.start': 'Rozpocznij restaurację',
      'restore.processing': 'Przetwarzanie...',

      // Results
      'results.title': 'Wynik restauracji',
      'results.before': 'Przed',
      'results.after': 'Po',
      'results.download': 'Pobierz',
      'results.improvements': 'Zastosowane ulepszenia',
      'results.qualityBefore': 'Jakość przed',
      'results.qualityAfter': 'Jakość po',
      'results.processingTime': 'Czas przetwarzania',

      // Progress messages (Matrix style)
      'progress.initializing': 'Inicjalizacja systemu...',
      'progress.uploading': 'Przesyłanie danych...',
      'progress.analyzing': 'Analizowanie struktury obrazu...',
      'progress.detecting': 'Wykrywanie uszkodzeń...',
      'progress.restoring': 'Rekonstrukcja pikseli...',
      'progress.enhancing': 'Ulepszanie detali...',
      'progress.finalizing': 'Finalizacja operacji...',
      'progress.complete': 'Operacja zakończona pomyślnie',

      // Settings
      'settings.title': 'Ustawienia',
      'settings.theme': 'Motyw',
      'settings.theme.dark': 'Ciemny',
      'settings.theme.light': 'Jasny',
      'settings.theme.system': 'Systemowy',
      'settings.language': 'Język',
      'settings.autoAnalyze': 'Auto-analiza po wgraniu',
      'settings.preserveOriginals': 'Zachowaj oryginały',

      // GitLab
      'gitlab.title': 'Integracja GitLab',
      'gitlab.enable': 'Włącz integrację GitLab',
      'gitlab.enableDesc': 'Automatycznie przesyłaj zrestaurowane zdjęcia do repozytorium GitLab',
      'gitlab.instanceUrl': 'GitLab URL',
      'gitlab.instanceUrlDesc': 'Adres instancji GitLab (np. https://gitlab.com lub self-hosted)',
      'gitlab.projectId': 'Project ID / Path',
      'gitlab.projectIdDesc': 'ID projektu lub ścieżka (np. username/repository)',
      'gitlab.token': 'Personal Access Token',
      'gitlab.tokenDesc': 'Token z uprawnieniami api lub write_repository',
      'gitlab.branch': 'Branch',
      'gitlab.uploadPath': 'Ścieżka uploadu',
      'gitlab.uploadPathDesc': 'Folder w repozytorium gdzie będą zapisywane obrazy',
      'gitlab.testConnection': 'Testuj połączenie',
      'gitlab.testing': 'Testowanie...',
      'gitlab.connected': 'Połączono',
      'gitlab.connectionError': 'Błąd połączenia',
      'gitlab.uploadButton': 'GitLab',
      'gitlab.uploading': 'Przesyłanie...',
      'gitlab.uploaded': 'Przesłano',
      'gitlab.uploadedTo': 'Przesłano do GitLab',
      'gitlab.openInGitlab': 'Otwórz w GitLab',
      'gitlab.notConfigured': 'GitLab nie jest skonfigurowany. Przejdź do Ustawień.',
      'gitlab.uploadSuccess': 'Przesłano do GitLab: {{filename}}',
      'gitlab.uploadError': 'Błąd przesyłania do GitLab',

      // Health
      'health.title': 'Status systemu',
      'health.healthy': 'Sprawny',
      'health.degraded': 'Ograniczony',
      'health.unavailable': 'Niedostępny',
      'health.latency': 'Opóźnienie',
      'health.uptime': 'Czas działania',

      // Common
      'common.loading': 'Ładowanie...',
      'common.error': 'Błąd',
      'common.success': 'Sukces',
      'common.cancel': 'Anuluj',
      'common.confirm': 'Potwierdź',
      'common.save': 'Zapisz',
      'common.delete': 'Usuń',
      'common.close': 'Zamknij',
      'common.retry': 'Ponów',
      'common.back': 'Wstecz',
      'common.next': 'Dalej',

      // Errors
      'error.upload': 'Błąd wgrywania pliku',
      'error.analysis': 'Błąd analizy zdjęcia',
      'error.restore': 'Błąd restauracji',
      'error.network': 'Błąd połączenia',
      'error.timeout': 'Przekroczono limit czasu',
    },
  },
  en: {
    translation: {
      // App
      'app.title': 'Tissaia-AI',
      'app.subtitle': 'AI Photo Restoration',
      'app.tagline': 'Bring memories back to life',

      // Navigation
      'nav.upload': 'Upload Photo',
      'nav.analyze': 'Analysis',
      'nav.restore': 'Restoration',
      'nav.history': 'History',
      'nav.settings': 'Settings',
      'nav.health': 'System Status',

      // Upload
      'upload.title': 'Upload photo for restoration',
      'upload.dragdrop': 'Drag and drop photo here',
      'upload.or': 'or',
      'upload.browse': 'Browse files',
      'upload.formats': 'Supported formats: JPEG, PNG, WebP',
      'upload.maxSize': 'Maximum size: 20MB',
      'upload.added': '{{name}} added',
      'upload.uploadedPhotos': 'Uploaded photos ({{count}})',
      'upload.removeAll': 'Remove all',
      'upload.analyzePhotos': 'Analyze photos',

      // Analysis
      'analyze.title': 'Photo Analysis',
      'analyze.faces': 'Detected faces',
      'analyze.damage': 'Damage assessment',
      'analyze.era': 'Estimated era',
      'analyze.quality': 'Quality',
      'analyze.recommendations': 'Recommendations',
      'analyze.scratches': 'Scratches',
      'analyze.fading': 'Fading',
      'analyze.tears': 'Tears',
      'analyze.waterDamage': 'Water damage',

      // Restoration
      'restore.title': 'Restoration Options',
      'restore.removeScratches': 'Remove scratches',
      'restore.fixFading': 'Fix fading',
      'restore.enhanceFaces': 'Enhance faces',
      'restore.colorize': 'Colorize (B&W)',
      'restore.denoise': 'Reduce noise',
      'restore.sharpen': 'Sharpen',
      'restore.start': 'Start Restoration',
      'restore.processing': 'Processing...',

      // Results
      'results.title': 'Restoration Result',
      'results.before': 'Before',
      'results.after': 'After',
      'results.download': 'Download',
      'results.improvements': 'Applied improvements',
      'results.qualityBefore': 'Quality before',
      'results.qualityAfter': 'Quality after',
      'results.processingTime': 'Processing time',

      // Progress messages
      'progress.initializing': 'Initializing system...',
      'progress.uploading': 'Uploading data...',
      'progress.analyzing': 'Analyzing image structure...',
      'progress.detecting': 'Detecting damage...',
      'progress.restoring': 'Reconstructing pixels...',
      'progress.enhancing': 'Enhancing details...',
      'progress.finalizing': 'Finalizing operation...',
      'progress.complete': 'Operation completed successfully',

      // Settings
      'settings.title': 'Settings',
      'settings.theme': 'Theme',
      'settings.theme.dark': 'Dark',
      'settings.theme.light': 'Light',
      'settings.theme.system': 'System',
      'settings.language': 'Language',
      'settings.autoAnalyze': 'Auto-analyze on upload',
      'settings.preserveOriginals': 'Preserve originals',

      // GitLab
      'gitlab.title': 'GitLab Integration',
      'gitlab.enable': 'Enable GitLab integration',
      'gitlab.enableDesc': 'Automatically upload restored images to GitLab repository',
      'gitlab.instanceUrl': 'GitLab URL',
      'gitlab.instanceUrlDesc': 'GitLab instance URL (e.g. https://gitlab.com or self-hosted)',
      'gitlab.projectId': 'Project ID / Path',
      'gitlab.projectIdDesc': 'Project ID or path (e.g. username/repository)',
      'gitlab.token': 'Personal Access Token',
      'gitlab.tokenDesc': 'Token with api or write_repository permissions',
      'gitlab.branch': 'Branch',
      'gitlab.uploadPath': 'Upload path',
      'gitlab.uploadPathDesc': 'Repository folder where images will be saved',
      'gitlab.testConnection': 'Test connection',
      'gitlab.testing': 'Testing...',
      'gitlab.connected': 'Connected',
      'gitlab.connectionError': 'Connection error',
      'gitlab.uploadButton': 'GitLab',
      'gitlab.uploading': 'Uploading...',
      'gitlab.uploaded': 'Uploaded',
      'gitlab.uploadedTo': 'Uploaded to GitLab',
      'gitlab.openInGitlab': 'Open in GitLab',
      'gitlab.notConfigured': 'GitLab is not configured. Go to Settings.',
      'gitlab.uploadSuccess': 'Uploaded to GitLab: {{filename}}',
      'gitlab.uploadError': 'GitLab upload error',

      // Health
      'health.title': 'System Status',
      'health.healthy': 'Healthy',
      'health.degraded': 'Degraded',
      'health.unavailable': 'Unavailable',
      'health.latency': 'Latency',
      'health.uptime': 'Uptime',

      // Common
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.close': 'Close',
      'common.retry': 'Retry',
      'common.back': 'Back',
      'common.next': 'Next',

      // Errors
      'error.upload': 'File upload error',
      'error.analysis': 'Photo analysis error',
      'error.restore': 'Restoration error',
      'error.network': 'Network error',
      'error.timeout': 'Request timeout',
    },
  },
};

// ============================================
// INITIALIZATION
// ============================================

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('tissaia-language') || 'pl',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

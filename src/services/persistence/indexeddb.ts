// src/services/persistence/indexeddb.ts
/**
 * IndexedDB Persistence Layer
 * ===========================
 * Stores pipeline results (detection, crops, restorations, verifications)
 * so they survive page refreshes. Uses a simple key-value store pattern
 * on top of IndexedDB.
 *
 * Data stored per session (identified by scan filename + timestamp):
 * - detectionResult: bounding boxes from AI detection
 * - croppedPhotos: cropped photo base64 data
 * - pipelineResults: restoration results per photo
 * - verificationResults: QA verification data
 */

const DB_NAME = 'tissaia-pipeline';
const DB_VERSION = 1;
const STORE_NAME = 'results';

interface PipelineSession {
  /** Primary key: auto-generated session ID */
  id?: number;
  /** Original filename of the scanned image */
  filename: string;
  /** Timestamp when the session was created */
  createdAt: string;
  /** Detection result JSON */
  detectionResult: unknown | null;
  /** Cropped photos array */
  croppedPhotos: unknown[];
  /** Restoration results map */
  pipelineResults: Record<string, unknown>;
  /** Verification results map */
  verificationResults: Record<string, unknown>;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('filename', 'filename', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a pipeline session to IndexedDB.
 * Returns the auto-generated session ID.
 */
export async function saveSession(session: Omit<PipelineSession, 'id'>): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(session);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an existing pipeline session.
 */
export async function updateSession(session: PipelineSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(session);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a pipeline session by ID.
 */
export async function getSession(id: number): Promise<PipelineSession | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result as PipelineSession | undefined);
    request.onerror = () => reject(request.error);
  });
}

/**
 * List all pipeline sessions, ordered by creation date (newest first).
 * Returns lightweight metadata (without base64 image data).
 */
export async function listSessions(): Promise<
  Array<{ id: number; filename: string; createdAt: string; photoCount: number }>
> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const sessions = (request.result as PipelineSession[])
        .map((s) => ({
          id: s.id!,
          filename: s.filename,
          createdAt: s.createdAt,
          photoCount: s.croppedPhotos?.length ?? 0,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(sessions);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a pipeline session by ID.
 */
export async function deleteSession(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete all pipeline sessions.
 */
export async function clearAllSessions(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get the most recent session for a given filename.
 * Useful for restoring state after page refresh.
 */
export async function getLatestSessionByFilename(
  filename: string,
): Promise<PipelineSession | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('filename');
    const request = index.getAll(filename);
    request.onsuccess = () => {
      const results = request.result as PipelineSession[];
      if (results.length === 0) {
        resolve(undefined);
        return;
      }
      // Return the most recent one
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results[0]);
    };
    request.onerror = () => reject(request.error);
  });
}

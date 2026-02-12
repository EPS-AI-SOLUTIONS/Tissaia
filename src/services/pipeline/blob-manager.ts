// src/services/pipeline/blob-manager.ts
/**
 * Blob Manager
 * ============
 * Manages Blob/ObjectURL lifecycle for pipeline images.
 * Instead of storing large base64 strings in React state,
 * images are stored as Blobs and accessed via ObjectURLs.
 *
 * This reduces memory pressure from ~1.37x (base64 overhead)
 * to raw binary size, and allows garbage collection when URLs
 * are revoked.
 *
 * Usage pattern:
 *   const blobId = blobManager.storeFromBase64(base64, 'image/png');
 *   const url = blobManager.getUrl(blobId); // for <img src>
 *   // ... later
 *   blobManager.revoke(blobId); // free memory
 */

interface BlobEntry {
  blob: Blob;
  url: string;
  size: number;
  createdAt: number;
}

class BlobManager {
  private entries = new Map<string, BlobEntry>();
  private counter = 0;

  /**
   * Store a base64-encoded image as a Blob, returning a unique ID.
   * The base64 string can be released from memory after this call.
   */
  storeFromBase64(base64: string, mimeType: string): string {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return this.storeBlob(blob);
  }

  /**
   * Store a Blob directly, returning a unique ID.
   */
  storeBlob(blob: Blob): string {
    const id = `blob_${++this.counter}_${Date.now()}`;
    const url = URL.createObjectURL(blob);
    this.entries.set(id, {
      blob,
      url,
      size: blob.size,
      createdAt: Date.now(),
    });
    return id;
  }

  /**
   * Get the ObjectURL for a stored blob (for use in <img src>).
   */
  getUrl(id: string): string | null {
    return this.entries.get(id)?.url ?? null;
  }

  /**
   * Get the raw Blob for a stored entry.
   */
  getBlob(id: string): Blob | null {
    return this.entries.get(id)?.blob ?? null;
  }

  /**
   * Convert a stored blob back to base64 (for sending to Tauri/API).
   * Only call this when you actually need the base64 — avoids keeping
   * the string in memory permanently.
   */
  async toBase64(id: string): Promise<string | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(entry.blob);
    });
  }

  /**
   * Revoke a specific blob URL, freeing browser memory.
   */
  revoke(id: string): void {
    const entry = this.entries.get(id);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.entries.delete(id);
    }
  }

  /**
   * Revoke all stored blob URLs.
   */
  revokeAll(): void {
    for (const [id, entry] of this.entries) {
      URL.revokeObjectURL(entry.url);
      this.entries.delete(id);
    }
  }

  /**
   * Get total memory usage of all stored blobs.
   */
  totalSize(): number {
    let total = 0;
    for (const entry of this.entries.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Get count of stored blobs.
   */
  count(): number {
    return this.entries.size;
  }

  /**
   * Get memory usage summary for debugging.
   */
  stats(): { count: number; totalMB: string; entries: Array<{ id: string; sizeMB: string }> } {
    const entries = Array.from(this.entries.entries()).map(([id, e]) => ({
      id,
      sizeMB: (e.size / 1024 / 1024).toFixed(2),
    }));
    return {
      count: this.entries.size,
      totalMB: (this.totalSize() / 1024 / 1024).toFixed(2),
      entries,
    };
  }
}

/** Singleton blob manager for the pipeline */
export const blobManager = new BlobManager();

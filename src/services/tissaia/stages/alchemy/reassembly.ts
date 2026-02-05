/**
 * Tissaia Stage 4: Alchemy - Reassembly
 * ======================================
 * Functions for reassembling processed shards.
 */

import type { CroppedShard } from '../../types';

/**
 * Merge processed shards back into single image
 */
export function reassembleShards(
  shards: Array<{ shard: CroppedShard; processed: ImageData }>,
  originalWidth: number,
  originalHeight: number
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, originalWidth, originalHeight);

  // Draw each shard in its original position
  for (const { shard, processed } of shards) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = processed.width;
    tempCanvas.height = processed.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(processed, 0, 0);

    ctx.drawImage(tempCanvas, shard.bounds.x, shard.bounds.y);
  }

  return ctx.getImageData(0, 0, originalWidth, originalHeight);
}

/**
 * Merge shards with blending at seams
 */
export function reassembleShardsWithBlending(
  shards: Array<{ shard: CroppedShard; processed: ImageData }>,
  originalWidth: number,
  originalHeight: number,
  blendWidth: number = 5
): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, originalWidth, originalHeight);

  // Sort shards by position (top-left first)
  const sortedShards = [...shards].sort((a, b) => {
    const rowA = Math.floor(a.shard.bounds.y / 100);
    const rowB = Math.floor(b.shard.bounds.y / 100);
    if (rowA !== rowB) return rowA - rowB;
    return a.shard.bounds.x - b.shard.bounds.x;
  });

  // Track which pixels have been written
  const written = new Uint8Array(originalWidth * originalHeight);

  for (const { shard, processed } of sortedShards) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = processed.width;
    tempCanvas.height = processed.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(processed, 0, 0);

    // Get existing image data for blending
    const existingData = ctx.getImageData(
      shard.bounds.x,
      shard.bounds.y,
      shard.bounds.width,
      shard.bounds.height
    );

    // Blend at edges where there's overlap
    for (let y = 0; y < processed.height; y++) {
      for (let x = 0; x < processed.width; x++) {
        const globalX = shard.bounds.x + x;
        const globalY = shard.bounds.y + y;

        if (globalX >= originalWidth || globalY >= originalHeight) continue;

        const globalI = globalY * originalWidth + globalX;
        const localI = (y * processed.width + x) * 4;

        if (written[globalI]) {
          // Calculate blend factor based on distance from edge
          const distX = Math.min(x, processed.width - 1 - x);
          const distY = Math.min(y, processed.height - 1 - y);
          const dist = Math.min(distX, distY);

          if (dist < blendWidth) {
            const blend = dist / blendWidth;

            const existingI = (y * existingData.width + x) * 4;
            processed.data[localI] = Math.round(
              processed.data[localI] * blend +
              existingData.data[existingI] * (1 - blend)
            );
            processed.data[localI + 1] = Math.round(
              processed.data[localI + 1] * blend +
              existingData.data[existingI + 1] * (1 - blend)
            );
            processed.data[localI + 2] = Math.round(
              processed.data[localI + 2] * blend +
              existingData.data[existingI + 2] * (1 - blend)
            );
          }
        }

        written[globalI] = 1;
      }
    }

    // Update processed data and draw
    tempCtx.putImageData(processed, 0, 0);
    ctx.drawImage(tempCanvas, shard.bounds.x, shard.bounds.y);
  }

  return ctx.getImageData(0, 0, originalWidth, originalHeight);
}

/**
 * Create a composite preview from multiple shards
 */
export function createShardPreview(
  shards: CroppedShard[],
  maxWidth: number = 800,
  maxHeight: number = 600
): ImageData {
  // Calculate grid layout
  const count = shards.length;
  const cols = Math.ceil(Math.sqrt(count * (maxWidth / maxHeight)));
  const rows = Math.ceil(count / cols);

  const shardWidth = Math.floor(maxWidth / cols);
  const shardHeight = Math.floor(maxHeight / rows);

  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = maxHeight;
  const ctx = canvas.getContext('2d')!;

  // Fill with gray background
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, maxWidth, maxHeight);

  for (let i = 0; i < shards.length; i++) {
    const shard = shards[i];
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = col * shardWidth;
    const y = row * shardHeight;

    // Scale shard to fit in cell
    const scaleX = shardWidth / shard.data.width;
    const scaleY = shardHeight / shard.data.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = Math.round(shard.data.width * scale);
    const scaledHeight = Math.round(shard.data.height * scale);

    const offsetX = Math.round((shardWidth - scaledWidth) / 2);
    const offsetY = Math.round((shardHeight - scaledHeight) / 2);

    // Draw shard
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = shard.data.width;
    tempCanvas.height = shard.data.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(shard.data, 0, 0);

    ctx.drawImage(
      tempCanvas,
      x + offsetX,
      y + offsetY,
      scaledWidth,
      scaledHeight
    );

    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + offsetX, y + offsetY, scaledWidth, scaledHeight);
  }

  return ctx.getImageData(0, 0, maxWidth, maxHeight);
}

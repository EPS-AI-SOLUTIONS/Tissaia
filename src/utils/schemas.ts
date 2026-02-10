/**
 * Tissaia - Zod Schemas & Form Utilities
 * ======================================
 * File validation schemas and FormData utilities
 */

import { z } from 'zod';
import { formatBytes } from './index';

// =============================================================================
// FILE SCHEMAS
// =============================================================================

/**
 * Base file schema with null handling
 * Accepts File | null, transforms null to undefined
 */
export const fileSchema = z
  .custom<File | null>((val) => val instanceof File || val === null)
  .transform((val) => (val === null ? undefined : val))
  .optional();

/**
 * Configuration options for file schema factory
 */
export interface FileSchemaOptions {
  /** Maximum file size in bytes */
  maxSizeBytes?: number;
  /** Allowed MIME types (e.g., ['image/jpeg', 'image/png']) */
  allowedMimeTypes?: string[];
  /** Allowed file extensions (e.g., ['.jpg', '.png']) */
  allowedExtensions?: string[];
  /** Whether file is required */
  required?: boolean;
}

/**
 * Create configurable file validation schema
 */
export function createFileSchema(options: FileSchemaOptions = {}) {
  const {
    maxSizeBytes = 100 * 1024 * 1024, // 100MB default
    allowedMimeTypes,
    allowedExtensions,
    required = false,
  } = options;

  let schema = z.custom<File>((val) => val instanceof File, {
    message: 'Wymagany jest prawidłowy plik',
  });

  // Size validation
  schema = schema.refine((file) => file.size <= maxSizeBytes, {
    message: `Rozmiar pliku przekracza limit (${formatBytes(maxSizeBytes)})`,
  });

  // MIME type validation
  if (allowedMimeTypes?.length) {
    schema = schema.refine((file) => allowedMimeTypes.includes(file.type), {
      message: `Typ pliku nie jest dozwolony. Dozwolone: ${allowedMimeTypes.join(', ')}`,
    });
  }

  // Extension validation
  if (allowedExtensions?.length) {
    schema = schema.refine(
      (file) => {
        const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
        return allowedExtensions.includes(ext);
      },
      {
        message: `Rozszerzenie pliku nie jest dozwolone. Dozwolone: ${allowedExtensions.join(', ')}`,
      },
    );
  }

  // Handle required vs optional
  if (required) {
    return schema;
  }

  return schema
    .nullable()
    .optional()
    .transform((val) => (val === null ? undefined : val));
}

// =============================================================================
// PRESET SCHEMAS
// =============================================================================

/**
 * Image file schema for photo restoration
 * Supports common image formats up to 100MB
 */
export const imageFileSchema = createFileSchema({
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.bmp'],
  maxSizeBytes: 100 * 1024 * 1024, // 100MB
  required: true,
});

/**
 * Optional image file schema
 */
export const optionalImageFileSchema = createFileSchema({
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'image/bmp',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.bmp'],
  maxSizeBytes: 100 * 1024 * 1024,
  required: false,
});

// =============================================================================
// FORM DATA UTILITY
// =============================================================================

/**
 * Convert validated data object to FormData
 * Handles Files, arrays, objects, and primitive values
 * Ignores null and undefined values
 */
export function toFormData<T extends Record<string, unknown>>(data: T): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    // Skip null and undefined
    if (value === null || value === undefined) {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
    } else if (value instanceof Blob) {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item instanceof File || item instanceof Blob) {
          formData.append(key, item);
        } else if (item !== null && item !== undefined) {
          formData.append(key, String(item));
        }
      });
    } else if (typeof value === 'object') {
      // Nested objects as JSON string
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
}

/**
 * Create FormData from schema-validated data
 */
export function createFormDataFromSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: z.infer<z.ZodObject<T>>,
): FormData {
  const validated = schema.parse(data);
  return toFormData(validated);
}

// =============================================================================
// EXAMPLE UPLOAD SCHEMA
// =============================================================================

/**
 * Example upload form schema
 */
export const uploadFormSchema = z.object({
  file: imageFileSchema,
  description: z.string().min(1, 'Opis jest wymagany').optional(),
  tags: z.array(z.string()).optional(),
});

export type UploadFormData = z.infer<typeof uploadFormSchema>;

// =============================================================================
// RE-EXPORT ZOD
// =============================================================================

export { z };

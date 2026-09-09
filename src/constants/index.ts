/**
 * src/constants/index.ts
 * All magic strings in one place (QUAL-005).
 */

export const TIERS = { TIER1: 'tier1', TIER2: 'tier2', TIER3: 'tier3' } as const;
export type Tier = typeof TIERS[keyof typeof TIERS];

export const TIER_LIMITS = {
  TIER1_MAX: 50 * 1024 * 1024,
  TIER2_MAX: 500 * 1024 * 1024,
  TIER3_MAX: 2 * 1024 * 1024 * 1024,
} as const;

export const FILE_CATEGORIES = {
  IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio', CODE: 'code',
  TEXT: 'text', DOCUMENT: 'document', DATA: 'data', MODEL_3D: '3d',
  FONT: 'font', DATABASE: 'database', SPREADSHEET: 'spreadsheet',
  ARCHIVE: 'archive', EXECUTABLE: 'executable', BINARY: 'binary', UNKNOWN: 'unknown',
} as const;
export type FileCategory = typeof FILE_CATEGORIES[keyof typeof FILE_CATEGORIES];

/** How a metadata value was derived — surfaced in ExpertPanel (REVIEW-011/024) */
export const PROVENANCE = {
  PARSED: 'parsed',       // From standards-compliant parser reading actual bytes
  DETECTED: 'detected',   // From magic number / signature match
  INFERRED: 'inferred',   // From extension, size, or context
  COMPUTED: 'computed',   // Computed value (hash, line count, etc.)
  SIMULATED: 'simulated', // Placeholder — not yet implemented
} as const;
export type Provenance = typeof PROVENANCE[keyof typeof PROVENANCE];

export const FORMAT_QUALITY = {
  FULL: 'full',                    // Standards-compliant parser; authoritative
  PARTIAL: 'partial',              // Key fields parsed; some inferred
  SIGNATURE_ONLY: 'signature_only', // Magic bytes only; no structural parse
} as const;
export type FormatQuality = typeof FORMAT_QUALITY[keyof typeof FORMAT_QUALITY];

export const API_ENDPOINTS = {
  HEALTH: '/health',
  UPLOAD: '/api/v1/file/upload',
  METADATA: '/api/v1/metadata/extract',
  ANALYZE_CODE: '/api/v1/analyze/code',
  CORRUPTION: '/api/v1/diagnostics/corruption',
  COST: '/api/v1/cost',
  STATS: '/api/v1/stats',
} as const;

export const UPLOAD_LIMITS = {
  MAX_SIZE_TIER1: TIER_LIMITS.TIER1_MAX,
  MAX_SIZE_TIER2: TIER_LIMITS.TIER2_MAX,
  CONCURRENCY: 3,
  TIMEOUT_MS: 30_000,
} as const;

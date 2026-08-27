/**
 * Manual mock for src/lib/preflight.ts
 * Placed here so jest.mock('../lib/preflight') resolves correctly
 * regardless of JSON-import hoisting issues.
 */

export const TIER_LIMITS = {
  tier1: 50 * 1024 * 1024,
  tier2: 500 * 1024 * 1024,
  tier3: 2 * 1024 * 1024 * 1024,
};

const CATEGORY_MAP: Record<string, string> = {
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
  webp: 'image', bmp: 'image', svg: 'image', ico: 'image',
  mp4: 'video', mkv: 'video', avi: 'video', mov: 'video', webm: 'video',
  mp3: 'audio', wav: 'audio', flac: 'audio', ogg: 'audio', aac: 'audio',
  pdf: 'document', doc: 'document', docx: 'document',
  xls: 'spreadsheet', xlsx: 'spreadsheet',
  ppt: 'document', pptx: 'document',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  exe: 'executable', dll: 'executable', bat: 'executable', elf: 'executable',
  py: 'code', js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
  java: 'code', c: 'code', cpp: 'code', go: 'code', rs: 'code',
  rb: 'code', php: 'code', swift: 'code', kt: 'code',
  html: 'web', htm: 'web', css: 'web', scss: 'web',
  json: 'config', xml: 'config', yaml: 'config', yml: 'config', toml: 'config',
  md: 'text', txt: 'text', log: 'text',
  csv: 'data', tsv: 'data', parquet: 'data',
  obj: '3d', stl: '3d', fbx: '3d', gltf: '3d', glb: '3d',
  ttf: 'font', otf: 'font', woff: 'font', woff2: 'font',
  sqlite: 'database', db: 'database', sql: 'database',
};

export const getFileCategory = jest.fn((ext: string, _mime: string): string => {
  return CATEGORY_MAP[ext.toLowerCase()] ?? 'unknown';
});

export const detectTrueFileType = jest.fn(async (_file: File) => ({
  detectedType: null,
  declaredExtension: '',
  isSuspicious: false,
  warningMessage: null,
  magicBytes: '',
  confidence: 'low' as const,
  corruptionCheck: { isHealthy: true, issues: [] },
}));

export const determineTier = jest.fn((_file: File) => 'tier1');

export const formatBytes = jest.fn((bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

export const detectLanguage = jest.fn((ext: string, _content: string): string => {
  const map: Record<string, string> = {
    py: 'python', js: 'javascript', ts: 'typescript', tsx: 'typescript',
    jsx: 'javascript', java: 'java', c: 'c', cpp: 'cpp', go: 'go',
    rs: 'rust', rb: 'ruby', sh: 'bash', bash: 'bash', sql: 'sql',
    html: 'html', css: 'css', json: 'json', md: 'markdown',
  };
  return map[ext] ?? 'plaintext';
});

export const getSignatureVersion = jest.fn(() => '2.0.0');
export const getSignatureLastUpdated = jest.fn(() => '2026-08-26');
export const getSupportedExtensions = jest.fn(() => Object.keys(CATEGORY_MAP));
export const getSignaturesByCategory = jest.fn(() => []);
export const getSignatureInfo = jest.fn(() => ({
  version: '2.0.0',
  lastUpdated: '2026-08-26',
  totalSignatures: 46,
  categories: ['Images', 'Documents', 'Audio', 'Video', 'Archives'],
  supportedExtensions: Object.keys(CATEGORY_MAP),
}));

export const MIME_TO_EXT: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/pdf': ['pdf'],
  'application/zip': ['zip'],
};

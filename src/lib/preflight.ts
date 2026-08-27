// ─── Magic Number Detection ───
// Comprehensive file signature database (loaded from external JSON)

import signatureData from '../data/file-signatures.json';

// Type definitions for signature data
interface SignatureFormat {
  bytes: string;
  offset?: number;
  ext: string;
  mime: string;
  description: string;
  checkBytes?: string;
  checkOffset?: number;
}

interface SignatureCategory {
  category: string;
  formats: SignatureFormat[];
}

interface TextPatterns {
  [key: string]: string[];
}

interface CorruptionRule {
  check: string;
  pattern?: string;
  altPattern?: string;
  eoi?: string;
  eof?: string;
  issues: string[];
}

interface CorruptionRules {
  [key: string]: CorruptionRule;
}

interface SignatureData {
  version: string;
  lastUpdated: string;
  description: string;
  signatures: SignatureCategory[];
  textPatterns: TextPatterns;
  corruptionRules: CorruptionRules;
}

// Convert hex string to byte array
function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return bytes;
}

// Parse signature data into runtime format
interface ParsedSignature {
  bytes: number[];
  offset: number;
  ext: string;
  mime: string;
  description: string;
  checkBytes?: number[];
  checkOffset?: number;
}

// Cache for parsed signatures
let _parsedSignatures: ParsedSignature[] | null = null;

function getParsedSignatures(): ParsedSignature[] {
  if (_parsedSignatures) return _parsedSignatures;

  _parsedSignatures = [];
  const data = signatureData as SignatureData;

  for (const category of data.signatures) {
    for (const format of category.formats) {
      _parsedSignatures.push({
        bytes: hexToBytes(format.bytes),
        offset: format.offset || 0,
        ext: format.ext,
        mime: format.mime,
        description: format.description,
        checkBytes: format.checkBytes ? hexToBytes(format.checkBytes) : undefined,
        checkOffset: format.checkOffset,
      });
    }
  }

  return _parsedSignatures;
}

// Get signature database version
export function getSignatureVersion(): string {
  return (signatureData as SignatureData).version;
}

// Get last update date
export function getSignatureLastUpdated(): string {
  return (signatureData as SignatureData).lastUpdated;
}

// Get all supported extensions
export function getSupportedExtensions(): string[] {
  const signatures = getParsedSignatures();
  return [...new Set(signatures.map(s => s.ext))];
}

// Get signatures by category
export function getSignaturesByCategory(category: string): ParsedSignature[] {
  const data = signatureData as SignatureData;
  const cat = data.signatures.find(c => c.category === category);
  if (!cat) return [];

  return cat.formats.map(format => ({
    bytes: hexToBytes(format.bytes),
    offset: format.offset || 0,
    ext: format.ext,
    mime: format.mime,
    description: format.description,
    checkBytes: format.checkBytes ? hexToBytes(format.checkBytes) : undefined,
    checkOffset: format.checkOffset,
  }));
}

// ─── File Type Result Interface ───
export interface FileTypeResult {
  detectedType: { ext: string; mime: string; description: string } | null;
  declaredExtension: string;
  isSuspicious: boolean;
  warningMessage: string | null;
  magicBytes: string;
  confidence: 'high' | 'medium' | 'low';
  corruptionCheck?: {
    isHealthy: boolean;
    issues: string[];
  };
}

// ─── Main Detection Function ───
export async function detectTrueFileType(file: File): Promise<FileTypeResult> {
  const buffer = await file.slice(0, 8192).arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // Extract first 32 bytes as hex for display
  const magicBytes = Array.from(uint8.slice(0, 32))
    .map(b => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');

  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Check against known signatures from JSON
  const signatures = getParsedSignatures();
  let detected: { ext: string; mime: string; description: string } | null = null;

  for (const sig of signatures) {
    let match = sig.bytes.every((b, i) => uint8[sig.offset + i] === b);

    // Handle two-stage checks
    if (match && sig.checkBytes && sig.checkOffset !== undefined) {
      const secondOffset = sig.checkOffset;
      match = sig.checkBytes.every((b, i) => uint8[secondOffset + i] === b);
    }

    if (match) {
      detected = { ext: sig.ext, mime: sig.mime, description: sig.description };
      break;
    }
  }

  // Text-based file detection using patterns from JSON
  if (!detected) {
    try {
      const textSample = new TextDecoder('utf-8', { fatal: false }).decode(uint8.slice(0, 1024));
      const data = signatureData as SignatureData;

      // XML-based formats
      if (data.textPatterns.xml.some(p => textSample.includes(p))) {
        if (textSample.includes('<svg') || textSample.includes('<SVG')) {
          detected = { ext: 'svg', mime: 'image/svg+xml', description: 'SVG Image' };
        } else if (textSample.includes('<kml')) {
          detected = { ext: 'kml', mime: 'application/vnd.google-earth.kml+xml', description: 'KML Geographic Data' };
        } else {
          detected = { ext: 'xml', mime: 'application/xml', description: 'XML Document' };
        }
      }
      // HTML
      else if (data.textPatterns.html.some(p => textSample.includes(p))) {
        detected = { ext: 'html', mime: 'text/html', description: 'HTML Document' };
      }
      // JSON
      else if (data.textPatterns.json.some(p => textSample.trim().startsWith(p))) {
        try {
          JSON.parse(textSample.slice(0, 500));
          detected = { ext: 'json', mime: 'application/json', description: 'JSON Data' };
        } catch {
          if (textSample.includes('"glTF"') || textSample.includes('"meshes"')) {
            detected = { ext: 'gltf', mime: 'model/gltf+json', description: 'GLTF 3D Model' };
          }
        }
      }
      // YAML
      else if (textSample.match(/^---\s*\n/) || (textSample.includes(': ') && textSample.includes('\n'))) {
        detected = { ext: 'yaml', mime: 'text/yaml', description: 'YAML Data' };
      }
      // Markdown
      else if (data.textPatterns.markdown.some(p => textSample.match(new RegExp(p)))) {
        detected = { ext: 'md', mime: 'text/markdown', description: 'Markdown Document' };
      }
      // Shell script
      else if (data.textPatterns.shell.some(p => textSample.startsWith(p))) {
        detected = { ext: 'sh', mime: 'application/x-sh', description: 'Shell Script' };
      }
      // Python
      else if (data.textPatterns.python.some(p => textSample.includes(p))) {
        detected = { ext: 'py', mime: 'text/x-python', description: 'Python Script' };
      }
      // SQL
      else if (data.textPatterns.sql.some(p => textSample.match(new RegExp(`^${p}\\s`, 'im')))) {
        detected = { ext: 'sql', mime: 'application/sql', description: 'SQL Script' };
      }
      // CSS
      else if (data.textPatterns.css.some(p => textSample.includes(p)) &&
               textSample.match(/\w+\s*:\s*[\w#]+/)) {
        detected = { ext: 'css', mime: 'text/css', description: 'CSS Stylesheet' };
      }
      // JavaScript/TypeScript
      else if (data.textPatterns.javascript.some(p => textSample.match(new RegExp(`^${p}\\s`, 'm')))) {
        if (data.textPatterns.typescript.some(p => textSample.includes(p))) {
          detected = { ext: 'ts', mime: 'text/typescript', description: 'TypeScript' };
        } else {
          detected = { ext: 'js', mime: 'application/javascript', description: 'JavaScript' };
        }
      }
    } catch {
      // Binary detection failed
    }
  }

  // Check for file type mismatch (suspicious file)
  const zipFamily = ['docx', 'xlsx', 'pptx', 'jar', 'apk', 'epub', 'odt', 'ods', 'odp'];
  const isSuspicious = !!(detected && extension && detected.ext !== extension &&
    !(detected.ext === 'zip' && zipFamily.includes(extension)) &&
    !(detected.ext === 'ttf' && extension === 'otf'));

  // Corruption detection using rules from JSON
  // Run on detected type OR declared extension (catches named-but-invalid files)
  let corruptionCheck = { isHealthy: true, issues: [] as string[] };
  const corruptionExt = detected?.ext ?? extension;
  if (corruptionExt) {
    const data = signatureData as SignatureData;
    const rule = data.corruptionRules[corruptionExt];

    if (rule) {
      const issues: string[] = [];

      if (rule.check === 'soi') {
        if (uint8[0] !== 0xFF || uint8[1] !== 0xD8) {
          issues.push(rule.issues[0]);
        }
        if (!uint8.slice(-2).every((b, i) => i === 0 ? b === 0xFF : b === 0xD9)) {
          issues.push(rule.issues[1]);
        }
      } else if (rule.check === 'signature') {
        const patternBytes = hexToBytes(rule.pattern || '');
        if (!patternBytes.every((b, i) => uint8[i] === b)) {
          issues.push(rule.issues[0]);
        }
      } else if (rule.check === 'header') {
        const header = new TextDecoder().decode(uint8.slice(0, 8));
        if (!header.startsWith('%PDF-')) {
          issues.push(rule.issues[0]);
        }
      } else if (rule.check === 'pe') {
        if (uint8[0] !== 0x4D || uint8[1] !== 0x5A) {
          issues.push(rule.issues[0]);
        }
      } else if (rule.check === 'magic') {
        if (uint8[0] !== 0x7F || uint8[1] !== 0x45 || uint8[2] !== 0x4C || uint8[3] !== 0x46) {
          issues.push(rule.issues[0]);
        }
      } else if (rule.check === 'frame') {
        if (uint8[0] !== 0xFF && uint8[0] !== 0x49) {
          issues.push(rule.issues[0]);
        }
      }

      corruptionCheck = {
        isHealthy: issues.length === 0,
        issues,
      };
    }
  }

  return {
    detectedType: detected,
    declaredExtension: extension,
    isSuspicious,
    warningMessage: isSuspicious
      ? `⚠️ File claims to be .${extension} but appears to be .${detected!.ext}`
      : null,
    magicBytes,
    confidence: detected ? 'high' : 'medium',
    corruptionCheck,
  };
}

// ─── File Size Validation ───
export const TIER_LIMITS = {
  tier1: 50 * 1024 * 1024,        // 50MB  (browser WASM)
  tier2: 500 * 1024 * 1024,       // 500MB (Docker)
  tier3: 2 * 1024 * 1024 * 1024,  // 2GB   (Firecracker)
};

export type Tier = 'tier1' | 'tier2' | 'tier3';

export function determineTier(file: File, detectedMime?: string): Tier {
  const mime = detectedMime || file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // Dangerous files → Tier 3 (Firecracker)
  const dangerousExts = ['exe', 'dll', 'bat', 'cmd', 'msi', 'scr', 'com', 'elf', 'bin', 'macho', 'dex', 'so'];
  if (dangerousExts.includes(ext) || mime.includes('executable')) return 'tier3';

  // Heavy processing → Tier 2 (Docker)
  const heavyExts = ['psd', 'ai', 'dwg', 'blend', 'max', 'obj', 'fbx', 'stl', 'gltf', 'glb', '3ds', 'c4d'];
  if (heavyExts.includes(ext) || file.size > TIER_LIMITS.tier1) return 'tier2';

  // Everything else → Tier 1 (Browser)
  return 'tier1';
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Comprehensive File Category Detection ───
export function getFileCategory(ext: string, mime: string): string {
  // Images
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif', 'psd', 'avif', 'heic', 'jxr', 'jp2', 'jpx'].includes(ext)) {
    return 'image';
  }

  // Video
  if (mime.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv', 'flv', 'm4v', 'mpg', 'mpeg'].includes(ext)) {
    return 'video';
  }

  // Audio
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a', 'opus', 'aiff', 'mid', '-midi', 'wma'].includes(ext)) {
    return 'audio';
  }

  // Documents
  if (mime === 'application/pdf' || ext === 'pdf') return 'document';
  if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf', 'pages', 'numbers', 'keynote'].includes(ext)) {
    return 'document';
  }

  // Code
  if (['py', 'js', 'ts', 'jsx', 'tsx', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'rb', 'php', 'swift', 'kt', 'scala', 'lua', 'r', 'dart', 'vue', 'svelte'].includes(ext)) {
    return 'code';
  }

  // Web
  if (['html', 'htm', 'css', 'scss', 'sass', 'less', 'vue', 'svelte'].includes(ext)) {
    return 'web';
  }

  // Config/Data
  if (['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'config', 'env', 'properties'].includes(ext)) {
    return 'config';
  }

  // Text
  if (['md', 'txt', 'log', 'readme', 'changelog', 'license'].includes(ext)) {
    return 'text';
  }

  // Data files
  if (['csv', 'tsv', 'parquet', 'arrow'].includes(ext)) {
    return 'data';
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'zst', 'tgz'].includes(ext)) {
    return 'archive';
  }

  // Executables
  if (['exe', 'dll', 'bat', 'cmd', 'msi', 'scr', 'com', 'elf', 'bin', 'macho', 'dex', 'so', 'app'].includes(ext)) {
    return 'executable';
  }

  // 3D/CAD
  if (['stl', 'obj', 'fbx', '3ds', 'dae', 'blend', 'max', 'c4d', 'gltf', 'glb', 'usdz', 'dwg', 'dxf', 'iges', 'step', 'usd', '3ds'].includes(ext)) {
    return '3d';
  }

  // Database
  if (['sql', 'sqlite', 'db', 'mdb', 'accdb'].includes(ext)) {
    return 'database';
  }

  // Fonts
  if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(ext)) {
    return 'font';
  }

  // Spreadsheet
  if (['xls', 'xlsx', 'csv', 'numbers', 'ods'].includes(ext)) {
    return 'spreadsheet';
  }

  return 'unknown';
}

// ─── Language Detection for Code Files ───
export function detectLanguage(ext: string, content: string): string {
  const languageMap: Record<string, string> = {
    // Web
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    html: 'html', htm: 'html', css: 'css', scss: 'scss', sass: 'scss', less: 'less',
    vue: 'vue', svelte: 'svelte',

    // Python & Ruby
    py: 'python', pyw: 'python', rb: 'ruby', erb: 'ruby',

    // Java & JVM
    java: 'java', kt: 'kotlin', scala: 'scala', groovy: 'groovy',

    // C family
    c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cc: 'cpp', cxx: 'cpp',
    cs: 'csharp', m: 'objective-c', mm: 'objective-c',

    // Systems
    rs: 'rust', go: 'go', swift: 'swift', d: 'd',

    // Shell
    sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',

    // Data
    json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml',
    toml: 'toml', ini: 'ini', properties: 'properties',

    // SQL & DB
    sql: 'sql', plsql: 'plsql', mysql: 'sql',

    // Documents
    md: 'markdown', rst: 'rst', tex: 'latex',

    // Config
    env: 'dotenv', tfvars: 'hcl',
  };

  // Try to detect from content if extension is ambiguous
  const firstLine = content.split('\n')[0];
  if (firstLine.includes('#!/bin/bash') || firstLine.includes('#!/bin/sh')) return 'bash';
  if (firstLine.includes('#!/usr/bin/env python')) return 'python';
  if (content.includes('package main')) return 'go';
  if (content.includes('fn main')) return 'rust';
  if (content.includes('import Foundation') || content.includes('import Swift')) return 'swift';
  if (content.includes('using System;')) return 'csharp';
  if (content.match(/\bdef\s+\w+\s*\(/)) return 'python';
  if (content.match(/\bfunction\s+\w+\s*\(/)) return 'javascript';
  if (content.match(/\bclass\s+\w+\s*(extends|implements)/)) {
    if (content.includes('extends React')) return 'javascript';
    if (content.match(/\bclass\s+\w+\s+extends\s+\w+/)) return 'java';
  }

  return languageMap[ext] || 'plaintext';
}

// ─── MIME Type to Extension Mapping ───
export const MIME_TO_EXT: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'image/svg+xml': ['svg'],
  'image/bmp': ['bmp'],
  'image/tiff': ['tif', 'tiff'],
  'image/vnd.adobe.photoshop': ['psd'],

  'video/mp4': ['mp4', 'm4v'],
  'video/webm': ['webm'],
  'video/x-matroska': ['mkv'],
  'video/x-msvideo': ['avi'],
  'video/quicktime': ['mov'],

  'audio/mpeg': ['mp3'],
  'audio/wav': ['wav'],
  'audio/flac': ['flac'],
  'audio/ogg': ['ogg'],
  'audio/aac': ['aac'],
  'audio/mp4': ['m4a'],
  'audio/opus': ['opus'],

  'application/pdf': ['pdf'],
  'application/json': ['json'],
  'application/xml': ['xml'],
  'text/html': ['html', 'htm'],
  'text/css': ['css'],
  'text/javascript': ['js'],
  'text/typescript': ['ts'],
  'text/markdown': ['md'],
  'text/yaml': ['yaml', 'yml'],

  'application/zip': ['zip'],
  'application/x-rar-compressed': ['rar'],
  'application/x-7z-compressed': ['7z'],
  'application/x-tar': ['tar'],
  'application/gzip': ['gz'],
  'application/x-bzip2': ['bz2'],

  'model/gltf+json': ['gltf'],
  'model/gltf-binary': ['glb'],

  'font/ttf': ['ttf'],
  'font/otf': ['otf'],
  'font/woff': ['woff'],
  'font/woff2': ['woff2'],
};

// ─── Signature Database Info ───
export interface SignatureInfo {
  version: string;
  lastUpdated: string;
  totalSignatures: number;
  categories: string[];
  supportedExtensions: string[];
}

export function getSignatureInfo(): SignatureInfo {
  const data = signatureData as SignatureData;
  const signatures = getParsedSignatures();

  return {
    version: data.version,
    lastUpdated: data.lastUpdated,
    totalSignatures: signatures.length,
    categories: data.signatures.map(s => s.category),
    supportedExtensions: getSupportedExtensions(),
  };
}

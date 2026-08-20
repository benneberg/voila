/**
 * Unit tests for Magic Number Detection (preflight.ts)
 */

import {
  detectTrueFileType,
  TIER_LIMITS,
  determineTier,
  formatBytes,
  getFileCategory,
  detectLanguage,
} from '../lib/preflight';

describe('Magic Number Detection', () => {
  describe('detectTrueFileType', () => {
    it('should detect JPEG images correctly', async () => {
      // Create a mock JPEG file
      const jpegHeader = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
      const mockFile = new File([jpegHeader], 'test.jpg', { type: 'image/jpeg' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('jpg');
      expect(result.detectedType?.mime).toBe('image/jpeg');
      expect(result.confidence).toBe('high');
    });

    it('should detect PNG images correctly', async () => {
      const pngHeader = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      ]);
      const mockFile = new File([pngHeader], 'test.png', { type: 'image/png' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('png');
      expect(result.detectedType?.mime).toBe('image/png');
    });

    it('should detect PDF documents correctly', async () => {
      const pdfHeader = new TextEncoder().encode('%PDF-1.4');
      const mockFile = new File([pdfHeader], 'test.pdf', { type: 'application/pdf' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('pdf');
      expect(result.detectedType?.mime).toBe('application/pdf');
    });

    it('should detect ZIP archives correctly', async () => {
      const zipHeader = new Uint8Array([0x50, 0x4B, 0x03, 0x04]);
      const mockFile = new File([zipHeader], 'test.zip', { type: 'application/zip' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('zip');
    });

    it('should detect MP3 files correctly', async () => {
      const mp3Header = new Uint8Array([0x49, 0x44, 0x33]); // ID3
      const mockFile = new File([mp3Header], 'test.mp3', { type: 'audio/mpeg' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('mp3');
    });

    it('should detect ELF executables correctly', async () => {
      const elfHeader = new Uint8Array([0x7F, 0x45, 0x4C, 0x46]); // ELF magic
      const mockFile = new File([elfHeader], 'test', { type: 'application/x-elf' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('elf');
    });

    it('should detect JSON files correctly', async () => {
      const jsonContent = '{"name": "test", "value": 123}';
      const mockFile = new File([jsonContent], 'test.json', { type: 'application/json' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('json');
    });

    it('should detect HTML files correctly', async () => {
      const htmlContent = '<!DOCTYPE html><html><body></body></html>';
      const mockFile = new File([htmlContent], 'test.html', { type: 'text/html' });

      const result = await detectTrueFileType(mockFile);

      expect(result.detectedType).not.toBeNull();
      expect(result.detectedType?.ext).toBe('html');
    });

    it('should flag suspicious files with extension mismatch', async () => {
      // A PNG file with .jpg extension
      const pngHeader = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
      ]);
      const mockFile = new File([pngHeader], 'test.jpg', { type: 'image/jpeg' });

      const result = await detectTrueFileType(mockFile);

      expect(result.isSuspicious).toBe(true);
      expect(result.warningMessage).toContain('appears to be');
    });

    it('should return high confidence for known formats', async () => {
      const pdfHeader = new TextEncoder().encode('%PDF-1.4');
      const mockFile = new File([pdfHeader], 'test.pdf', { type: 'application/pdf' });

      const result = await detectTrueFileType(mockFile);

      expect(result.confidence).toBe('high');
    });
  });

  describe('Corruption Detection', () => {
    it('should check JPEG corruption (missing SOI)', async () => {
      const invalidJpeg = new Uint8Array([0xFF, 0xD9, 0xFF, 0xFF]);
      const mockFile = new File([invalidJpeg], 'corrupt.jpg', { type: 'image/jpeg' });

      const result = await detectTrueFileType(mockFile);

      expect(result.corruptionCheck).toBeDefined();
      if (result.corruptionCheck) {
        expect(result.corruptionCheck.issues.length).toBeGreaterThan(0);
        expect(result.corruptionCheck.isHealthy).toBe(false);
      }
    });

    it('should check PDF corruption (missing header)', async () => {
      const invalidPdf = new TextEncoder().encode('NOT A PDF FILE');
      const mockFile = new File([invalidPdf], 'corrupt.pdf', { type: 'application/pdf' });

      const result = await detectTrueFileType(mockFile);

      expect(result.corruptionCheck).toBeDefined();
      if (result.corruptionCheck) {
        expect(result.corruptionCheck.issues.some((i: string) => i.includes('PDF'))).toBe(true);
      }
    });
  });
});

describe('Tier Limits', () => {
  it('should have correct tier limits defined', () => {
    expect(TIER_LIMITS.tier1).toBe(50 * 1024 * 1024); // 50MB
    expect(TIER_LIMITS.tier2).toBe(500 * 1024 * 1024); // 500MB
    expect(TIER_LIMITS.tier3).toBe(2 * 1024 * 1024 * 1024); // 2GB
  });
});

describe('determineTier', () => {
  it('should route executables to tier3', () => {
    const mockFile = {
      name: 'test.exe',
      size: 1024,
      type: 'application/x-msdownload',
    } as File;

    const tier = determineTier(mockFile);
    expect(tier).toBe('tier3');
  });

  it('should route large files to tier2', () => {
    const mockFile = {
      name: 'test.zip',
      size: 100 * 1024 * 1024, // 100MB
      type: 'application/zip',
    } as File;

    const tier = determineTier(mockFile);
    expect(tier).toBe('tier2');
  });

  it('should route small files to tier1', () => {
    const mockFile = {
      name: 'test.jpg',
      size: 1024,
      type: 'image/jpeg',
    } as File;

    const tier = determineTier(mockFile);
    expect(tier).toBe('tier1');
  });
});

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should handle decimal values', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });
});

describe('getFileCategory', () => {
  it('should categorize images correctly', () => {
    expect(getFileCategory('jpg', 'image/jpeg')).toBe('image');
    expect(getFileCategory('png', 'image/png')).toBe('image');
    expect(getFileCategory('gif', 'image/gif')).toBe('image');
  });

  it('should categorize video correctly', () => {
    expect(getFileCategory('mp4', 'video/mp4')).toBe('video');
    expect(getFileCategory('mkv', 'video/x-matroska')).toBe('video');
  });

  it('should categorize audio correctly', () => {
    expect(getFileCategory('mp3', 'audio/mpeg')).toBe('audio');
    expect(getFileCategory('wav', 'audio/wav')).toBe('audio');
  });

  it('should categorize documents correctly', () => {
    expect(getFileCategory('pdf', 'application/pdf')).toBe('document');
    expect(getFileCategory('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('document');
  });

  it('should categorize code correctly', () => {
    expect(getFileCategory('py', 'text/x-python')).toBe('code');
    expect(getFileCategory('js', 'application/javascript')).toBe('code');
    expect(getFileCategory('ts', 'text/typescript')).toBe('code');
  });

  it('should categorize archives correctly', () => {
    expect(getFileCategory('zip', 'application/zip')).toBe('archive');
    expect(getFileCategory('rar', 'application/x-rar-compressed')).toBe('archive');
  });

  it('should categorize 3D models correctly', () => {
    expect(getFileCategory('obj', 'model/obj')).toBe('3d');
    expect(getFileCategory('stl', 'application/sla')).toBe('3d');
    expect(getFileCategory('fbx', 'application/octet-stream')).toBe('3d');
  });

  it('should return unknown for unrecognized formats', () => {
    expect(getFileCategory('xyz', 'application/x-xyz')).toBe('unknown');
  });
});

describe('detectLanguage', () => {
  it('should detect Python files', () => {
    const content = 'def hello():\n    print("Hello")';
    expect(detectLanguage('py', content)).toBe('python');
  });

  it('should detect JavaScript files', () => {
    const content = 'function hello() {\n  console.log("Hello");\n}';
    expect(detectLanguage('js', content)).toBe('javascript');
  });

  it('should detect TypeScript files', () => {
    const content = 'interface User {\n  name: string;\n}';
    expect(detectLanguage('ts', content)).toBe('typescript');
  });

  it('should detect shell scripts', () => {
    const content = '#!/bin/bash\necho "Hello"';
    expect(detectLanguage('sh', content)).toBe('bash');
  });

  it('should detect SQL files', () => {
    const content = 'SELECT * FROM users WHERE id = 1';
    expect(detectLanguage('sql', content)).toBe('sql');
  });

  it('should return plaintext for unknown extensions', () => {
    expect(detectLanguage('xyz', 'some content')).toBe('plaintext');
  });
});

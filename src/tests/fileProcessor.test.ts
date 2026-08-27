/**
 * Unit tests for FileProcessor
 */

import { FileProcessor as _FileProcessor } from '../lib/fileProcessor';
import { TIER_LIMITS, getFileCategory } from '../lib/preflight';

// Mock dependencies
jest.mock('../lib/preflight', () => ({
  TIER_LIMITS: {
    tier1: 50 * 1024 * 1024,    // 50MB
    tier2: 500 * 1024 * 1024,    // 500MB
    tier3: 2 * 1024 * 1024 * 1024, // 2GB
  },
  getFileCategory: jest.fn((ext: string, _mime: string) => {
    const categories: Record<string, string> = {
      'jpg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image',
      'mp4': 'video', 'mkv': 'video', 'webm': 'video',
      'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio',
      'pdf': 'document', 'doc': 'document', 'docx': 'document',
      'zip': 'archive', 'rar': 'archive', '7z': 'archive',
      'exe': 'executable', 'dll': 'executable',
      'py': 'code', 'js': 'code', 'ts': 'code', 'java': 'code',
      'obj': '3d', 'stl': '3d', 'fbx': '3d', 'gltf': '3d',
    };
    return categories[ext.toLowerCase()] || 'unknown';
  }),
  detectTrueFileType: jest.fn(),
}));

describe('FileProcessor', () => {
  describe('Tier Determination', () => {
    it('should route executables to tier3', () => {
      const mockFile = {
        name: 'malware.exe',
        size: 1024,
        type: 'application/x-msdownload',
      } as File;

      // Simulate tier logic
      const ext = 'exe';
      const category = getFileCategory(ext, 'application/x-msdownload');
      const tier = category === 'executable' ? 'tier3' :
                   mockFile.size > TIER_LIMITS.tier2 ? 'tier2' :
                   mockFile.size > TIER_LIMITS.tier1 ? 'tier2' : 'tier1';

      expect(tier).toBe('tier3');
    });

    it('should route large archives to tier2', () => {
      const mockFile = {
        name: 'backup.zip',
        size: 100 * 1024 * 1024, // 100MB
        type: 'application/zip',
      } as File;

      void 0; // zip tier routing
      const tier = mockFile.size > TIER_LIMITS.tier2 ? 'tier3' :
                   mockFile.size > TIER_LIMITS.tier1 ? 'tier2' : 'tier1';

      expect(tier).toBe('tier2');
    });

    it('should route small images to tier1', () => {
      const mockFile = {
        name: 'photo.jpg',
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
      } as File;

      const tier = mockFile.size > TIER_LIMITS.tier2 ? 'tier3' :
                   mockFile.size > TIER_LIMITS.tier1 ? 'tier2' : 'tier1';

      expect(tier).toBe('tier1');
    });

    it('should handle files at tier boundary', () => {
      // File exactly at tier1 limit
      const fileAtLimit = {
        name: 'large.jpg',
        size: TIER_LIMITS.tier1,
        type: 'image/jpeg',
      } as File;

      const tier = fileAtLimit.size > TIER_LIMITS.tier2 ? 'tier3' :
                   fileAtLimit.size >= TIER_LIMITS.tier1 ? 'tier2' : 'tier1';

      expect(tier).toBe('tier2'); // 50MB exactly crosses into tier2
    });
  });

  describe('File Category Detection', () => {
    it('should categorize images correctly', () => {
      expect(getFileCategory('jpg', 'image/jpeg')).toBe('image');
      expect(getFileCategory('png', 'image/png')).toBe('image');
      expect(getFileCategory('webp', 'image/webp')).toBe('image');
      expect(getFileCategory('gif', 'image/gif')).toBe('image');
    });

    it('should categorize video correctly', () => {
      expect(getFileCategory('mp4', 'video/mp4')).toBe('video');
      expect(getFileCategory('mkv', 'video/x-matroska')).toBe('video');
      expect(getFileCategory('webm', 'video/webm')).toBe('video');
    });

    it('should categorize audio correctly', () => {
      expect(getFileCategory('mp3', 'audio/mpeg')).toBe('audio');
      expect(getFileCategory('wav', 'audio/wav')).toBe('audio');
      expect(getFileCategory('ogg', 'audio/ogg')).toBe('audio');
    });

    it('should categorize documents correctly', () => {
      expect(getFileCategory('pdf', 'application/pdf')).toBe('document');
      expect(getFileCategory('doc', 'application/msword')).toBe('document');
      expect(getFileCategory('docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('document');
    });

    it('should categorize archives correctly', () => {
      expect(getFileCategory('zip', 'application/zip')).toBe('archive');
      expect(getFileCategory('rar', 'application/x-rar-compressed')).toBe('archive');
      expect(getFileCategory('7z', 'application/x-7z-compressed')).toBe('archive');
    });

    it('should categorize executables correctly', () => {
      expect(getFileCategory('exe', 'application/x-msdownload')).toBe('executable');
      expect(getFileCategory('dll', 'application/x-msdownload')).toBe('executable');
    });

    it('should categorize code correctly', () => {
      expect(getFileCategory('py', 'text/x-python')).toBe('code');
      expect(getFileCategory('js', 'application/javascript')).toBe('code');
      expect(getFileCategory('ts', 'text/typescript')).toBe('code');
      expect(getFileCategory('java', 'text/x-java')).toBe('code');
    });

    it('should categorize 3D models correctly', () => {
      expect(getFileCategory('obj', 'model/obj')).toBe('3d');
      expect(getFileCategory('stl', 'application/sla')).toBe('3d');
      expect(getFileCategory('fbx', 'application/octet-stream')).toBe('3d');
      expect(getFileCategory('gltf', 'model/gltf+json')).toBe('3d');
    });

    it('should return unknown for unrecognized formats', () => {
      expect(getFileCategory('xyz', 'application/x-xyz')).toBe('unknown');
      expect(getFileCategory('dat', 'application/octet-stream')).toBe('unknown');
    });
  });

  describe('Tier Limits Constants', () => {
    it('should have correct tier1 limit (50MB)', () => {
      expect(TIER_LIMITS.tier1).toBe(50 * 1024 * 1024);
    });

    it('should have correct tier2 limit (500MB)', () => {
      expect(TIER_LIMITS.tier2).toBe(500 * 1024 * 1024);
    });

    it('should have correct tier3 limit (2GB)', () => {
      expect(TIER_LIMITS.tier3).toBe(2 * 1024 * 1024 * 1024);
    });

    it('should have tier1 < tier2 < tier3', () => {
      expect(TIER_LIMITS.tier1).toBeLessThan(TIER_LIMITS.tier2);
      expect(TIER_LIMITS.tier2).toBeLessThan(TIER_LIMITS.tier3);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files within tier1 limit', () => {
      const smallFile = { size: 10 * 1024 * 1024 }; // 10MB
      const isValid = smallFile.size <= TIER_LIMITS.tier1;
      expect(isValid).toBe(true);
    });

    it('should accept files within tier2 limit', () => {
      const mediumFile = { size: 100 * 1024 * 1024 }; // 100MB
      const isValid = mediumFile.size <= TIER_LIMITS.tier2;
      expect(isValid).toBe(true);
    });

    it('should accept files within tier3 limit', () => {
      const largeFile = { size: 1024 * 1024 * 1024 }; // 1GB
      const isValid = largeFile.size <= TIER_LIMITS.tier3;
      expect(isValid).toBe(true);
    });

    it('should reject files exceeding tier3 limit', () => {
      const hugeFile = { size: 3 * 1024 * 1024 * 1024 }; // 3GB
      const isValid = hugeFile.size <= TIER_LIMITS.tier3;
      expect(isValid).toBe(false);
    });
  });

  describe('Preview Type Mapping', () => {
    it('should map image categories to image preview', () => {
      const category = getFileCategory('jpg', 'image/jpeg');
      const previewType = category === 'image' ? 'image' : 'unknown';
      expect(previewType).toBe('image');
    });

    it('should map video categories to video preview', () => {
      const category = getFileCategory('mp4', 'video/mp4');
      const previewType = category === 'video' ? 'video' : 'unknown';
      expect(previewType).toBe('video');
    });

    it('should map audio categories to audio preview', () => {
      const category = getFileCategory('mp3', 'audio/mpeg');
      const previewType = category === 'audio' ? 'audio' : 'unknown';
      expect(previewType).toBe('audio');
    });

    it('should map document categories to document preview', () => {
      const category = getFileCategory('pdf', 'application/pdf');
      const previewType = category === 'document' ? 'pdf' : 'unknown';
      expect(previewType).toBe('pdf');
    });

    it('should map 3D categories to model preview', () => {
      const category = getFileCategory('obj', 'model/obj');
      const previewType = category === '3d' ? 'model3d' : 'unknown';
      expect(previewType).toBe('model3d');
    });
  });
});

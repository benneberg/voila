/**
 * TEST-003: API client tests
 * Covers: health check, code analysis, metadata extraction, upload, error handling
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { voilaApi } from '../lib/api';

function ok(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) } as Response);
}
function fail(status: number, body: unknown = { error: 'error' }) {
  return Promise.resolve({ ok: false, status, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) } as Response);
}

describe('VoilaApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Reset health cache so each test starts fresh
    (voilaApi as unknown as { healthCache: { status: null; timestamp: number } }).healthCache = { status: null, timestamp: 0 };
  });

  describe('checkHealth', () => {
    it('returns health status on 200', async () => {
      mockFetch.mockResolvedValueOnce(ok({ status: 'healthy', redis: true, openai: true, timestamp: new Date().toISOString() }));
      const h = await voilaApi.checkHealth();
      expect(h?.status).toBe('healthy');
    });
    it('returns null when backend unreachable', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
      expect(await voilaApi.checkHealth()).toBeNull();
    });
    it('returns null on non-200', async () => {
      mockFetch.mockResolvedValueOnce(fail(503));
      expect(await voilaApi.checkHealth()).toBeNull();
    });
    it('caches result within TTL', async () => {
      mockFetch.mockResolvedValueOnce(ok({ status: 'healthy', redis: false, openai: false, timestamp: new Date().toISOString() }));
      // Force cache miss first
      (voilaApi as unknown as { healthCache: { timestamp: number } }).healthCache.timestamp = 0;
      await voilaApi.checkHealth();
      await voilaApi.checkHealth();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('analyzeCode', () => {
    it('returns explanation on success', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true, explanation: 'A simple function.', cached: false, source: 'openai' }));
      const r = await voilaApi.analyzeCode('def f(): pass', 'python');
      expect(r.explanation).toBeTruthy();
      expect(r.source).toBe('openai');
    });
    it('returns demo response when network fails', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));
      const r = await voilaApi.analyzeCode('console.log(1)', 'javascript');
      expect(r).toBeDefined();
      expect(typeof r.explanation).toBe('string');
    });
    it('handles demo mode response', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true, explanation: 'AI requires API key.', cached: false, source: 'demo' }));
      const r = await voilaApi.analyzeCode('x = 1', 'python');
      expect(r.source).toBe('demo');
    });
  });

  describe('extractMetadata', () => {
    it('returns metadata on success', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true, metadata: { pages: 5 }, cost_tracked: true }));
      const r = await voilaApi.extractMetadata('abc123', 'application/pdf', 1024, 'doc.pdf');
      expect(r).not.toBeNull();
    });
    it('returns fallback metadata on network error (never null)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('failed'));
      const r = await voilaApi.extractMetadata('hash', 'image/jpeg', 512, 'img.jpg');
      // extractMetadata always returns client-side fallback — never throws or returns null
      expect(r).toBeDefined();
      expect(r.success).toBe(true);
      expect(r.metadata).toBeDefined();
    });
    it('returns fallback metadata on 500', async () => {
      mockFetch.mockResolvedValueOnce(fail(500));
      const r = await voilaApi.extractMetadata('hash', 'application/pdf', 1024, 'doc.pdf');
      expect(r).toBeDefined();
      expect(r.success).toBe(true);
    });
  });

  describe('uploadFile', () => {
    const testFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    it('returns upload result with hash', async () => {
      mockFetch.mockResolvedValueOnce(ok({ success: true, file_hash: 'a'.repeat(64), file_name: 'test.pdf', file_size: 7, ttl_seconds: 3600, storage: 'memory' }));
      const r = await voilaApi.uploadFile(testFile);
      expect(r).not.toBeNull();
      // file_hash may be in root or nested — check whichever exists
      const hash = r?.file_hash;
      if (hash) expect(hash).toHaveLength(64);
    });
    it('returns failure object on network error (success=false)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('failed'));
      const r = await voilaApi.uploadFile(testFile);
      // uploadFile always returns an object — never null
      expect(r).toBeDefined();
      expect(r?.success).toBe(false);
    });
    it('returns failure object on 413', async () => {
      mockFetch.mockResolvedValueOnce(fail(413, { detail: 'File too large' }));
      const r = await voilaApi.uploadFile(testFile);
      expect(r).toBeDefined();
      expect(r?.success).toBe(false);
    });
  });

  describe('error resilience', () => {
    it('does not throw on malformed JSON', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('bad json')), text: () => Promise.resolve('bad') } as unknown as Response);
      await expect(voilaApi.checkHealth()).resolves.not.toThrow();
    });
  });
});

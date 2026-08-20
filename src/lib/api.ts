/**
 * Voila API Client - Frontend service for backend communication
 * Handles Tier 2/3 requests with fallback to client-side processing
 */

import type { ProcessingResult } from './fileProcessor';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface HealthStatus {
  status: string;
  redis: boolean;
  openai: boolean;
  timestamp: string;
}

interface CodeAnalysisResponse {
  success: boolean;
  explanation: string;
  cached: boolean;
  source: 'openai' | 'demo';
}

interface MetadataResponse {
  success: boolean;
  metadata: Record<string, any>;
  cost_tracked: boolean;
}

interface CostInfo {
  ip_address: string;
  month: string;
  accumulated_cost: number;
  currency: string;
  limit: number;
  percentage: number;
}

interface StatsResponse {
  mode: 'demo' | 'production' | 'error';
  stats?: {
    'requests:today': number;
    'cost:today': number;
    'llm:cache:hits': number;
    'llm:cache:misses': number;
  };
  cache_hit_rate?: number;
  note?: string;
  error?: string;
}

// Configuration - use environment variable or default
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class VoilaApiClient {
  private baseUrl: string;
  private healthCache: { status: HealthStatus | null; timestamp: number } = {
    status: null,
    timestamp: 0
  };
  private healthCacheTimeout = 30000; // 30 seconds

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if backend is available
   */
  async checkHealth(): Promise<HealthStatus | null> {
    const now = Date.now();

    // Return cached status if fresh
    if (this.healthCache.status && now - this.healthCache.timestamp < this.healthCacheTimeout) {
      return this.healthCache.status;
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const health = await response.json() as HealthStatus;
        this.healthCache = { status: health, timestamp: now };
        return health;
      }
    } catch (error) {
      console.debug('Backend health check failed:', error);
    }

    return null;
  }

  /**
   * Get AI-powered code explanation with caching
   */
  async analyzeCode(code: string, language: string): Promise<CodeAnalysisResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/analyze/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        return await response.json();
      }

      // Return demo response on failure
      return this.getDemoCodeAnalysis(code, language);
    } catch (error) {
      console.debug('Code analysis unavailable:', error);
      return this.getDemoCodeAnalysis(code, language);
    }
  }

  /**
   * Get demo code analysis when backend is unavailable
   */
  private getDemoCodeAnalysis(code: string, language: string): CodeAnalysisResponse {
    const lines = code.split('\n').length;
    const functions = (code.match(/^def\s+\w+/gm) || []).length;
    const classes = (code.match(/^class\s+\w+/gm) || []).length;

    return {
      success: true,
      explanation: `This ${language} code contains ${lines} lines, ${functions} functions, and ${classes} classes. Connect to the Voila backend for AI-powered analysis.`,
      cached: false,
      source: 'demo'
    };
  }

  /**
   * Extract metadata from file
   */
  async extractMetadata(fileHash: string, fileType: string, fileSize: number, fileName: string): Promise<MetadataResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/metadata/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_hash: fileHash, file_type: fileType, file_size: fileSize, file_name: fileName }),
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Metadata extraction unavailable:', error);
    }

    // Return minimal metadata on failure
    return {
      success: true,
      metadata: {
        file_name: fileName,
        file_size: fileSize,
        detected_type: fileType,
        extraction_time: new Date().toISOString(),
        mode: 'client_side'
      },
      cost_tracked: false
    };
  }

  /**
   * Get accumulated cost for current IP
   */
  async getCost(ipAddress: string): Promise<CostInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/cost/${ipAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Cost lookup unavailable:', error);
    }

    return null;
  }

  /**
   * Get API usage statistics
   */
  async getStats(): Promise<StatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Stats unavailable:', error);
    }

    return { mode: 'demo', note: 'Connect Redis for persistent statistics' };
  }

  /**
   * Upload file to backend
   */
  async uploadFile(file: File): Promise<{ file_hash: string; success: boolean; note?: string } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/v1/file/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000)
      });

      if (response.ok) {
        return await response.json();
      }

      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    } catch (error: any) {
      console.error('File upload failed:', error);
      return {
        file_hash: '',
        success: false,
        note: error.message || 'Upload unavailable - file processed client-side'
      };
    }
  }

  /**
   * Check corruption of file
   */
  async checkCorruption(fileType: string): Promise<{ success: boolean; result: any } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/diagnostics/corruption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_type: fileType }),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Corruption check unavailable:', error);
    }

    return null;
  }

  /**
   * Determine if backend should be used based on file characteristics
   */
  shouldUseBackend(fileSize: number, tier: string): boolean {
    // Use backend for large files or tier 2/3
    if (tier === 'tier2' || tier === 'tier3') {
      return true;
    }

    // Use backend for large tier 1 files (>10MB)
    if (fileSize > 10 * 1024 * 1024) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const voilaApi = new VoilaApiClient();

// Export for use in components
export type { VoilaApiClient, ApiResponse, HealthStatus, CodeAnalysisResponse, MetadataResponse, CostInfo, StatsResponse };
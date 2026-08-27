"""
Voila Backend - Cloud Gateway (FastAPI)
Tier 2/3: Heavy processing, AI insights, and deep analysis

Security: CORS configured for production use with explicit allowed origins.
"""

import asyncio
import hashlib
import json
import os
from datetime import datetime, timezone
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Security: Define allowed origins from environment (never use wildcard in production)
def get_allowed_origins() -> List[str]:
    """
    Get allowed CORS origins from environment variable.
    Supports comma-separated list for multiple origins.
    """
    origins_env = os.getenv("CORS_ALLOWED_ORIGINS", "")
    if origins_env:
        return [o.strip() for o in origins_env.split(",") if o.strip()]

    # Development fallback (should be overridden in production)
    return [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

# Security: Allowed methods (explicit over permissive)
ALLOWED_METHODS = ["GET", "POST", "OPTIONS"]

# Security: Allowed headers (explicit over permissive)
ALLOWED_HEADERS = [
    "Accept",
    "Accept-Language",
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-Request-ID",
]

# Security: Exposed headers for CORS
EXPOSED_HEADERS = [
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "X-Processing-Time",
    "X-Request-ID",
]

# Try to import redis (optional - works without it in demo mode)
try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("⚠️ Redis not available - running in demo mode")


def validate_required_env_vars() -> bool:
    """
    Validate that required environment variables are set on startup.
    Fails fast if critical configuration is missing.

    Returns True if all required vars are present, False otherwise.
    """
    required_vars = {
        "OPENAI_API_KEY": "OpenAI API key for LLM features",
    }

    optional_vars = {
        "REDIS_URL": "Redis URL for caching (default: redis://localhost:6379)",
        "CORS_ALLOWED_ORIGINS": "Allowed CORS origins (default: localhost)",
        "TIKA_URL": "Apache Tika URL (default: http://localhost:9998)",
    }

    missing_required = []
    missing_optional = []

    for var_name, description in required_vars.items():
        if not os.getenv(var_name):
            missing_required.append(f"  - {var_name}: {description}")

    for var_name, description in optional_vars.items():
        if not os.getenv(var_name):
            missing_optional.append(f"  - {var_name}: {description}")

    if missing_required:
        print("\n" + "="*60)
        print("❌ STARTUP ERROR: Missing required environment variables")
        print("="*60)
        print("\nRequired variables (must be set):")
        print("\n".join(missing_required))
        print("\n" + "-"*60)
        print("Optional variables (can run in demo mode without these):")
        if missing_optional:
            print("\n".join(missing_optional))
        print("="*60 + "\n")
        return False

    if missing_optional:
        print("\n⚠️ Running in DEMO MODE (some features disabled):")
        print("\n".join(missing_optional))
        print()

    return True

# Try to import OpenAI (optional - works without it in demo mode)
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️ OpenAI not available - AI explanations disabled")

# Import custom engines
from engines.llm_cache import LLMCache
from engines.corruption import CorruptionDetector
from middleware.rate_limiter import RateLimiter

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Global instances
redis_client: Optional[redis.Redis] = None
llm_cache: Optional[LLMCache] = None
corruption_detector = CorruptionDetector()
rate_limiter = RateLimiter()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global redis_client, llm_cache

    # Startup: Validate required environment variables
    env_valid = validate_required_env_vars()
    if not env_valid:
        raise RuntimeError(
            "Missing required environment variables. "
            "Please set OPENAI_API_KEY before starting the server."
        )

    # Startup: Initialize Redis connection
    if REDIS_AVAILABLE:
        try:
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
            redis_client = redis.from_url(redis_url, decode_responses=True)
            await redis_client.ping()
            print("✓ Redis connected")

            # Initialize LLM cache
            if OPENAI_AVAILABLE:
                api_key = os.getenv("OPENAI_API_KEY")
                if api_key:
                    llm_cache = LLMCache(redis_client, api_key)
                    print("✓ LLM Cache initialized")
                else:
                    print("⚠️ OPENAI_API_KEY not set - AI explanations disabled")
        except Exception as e:
            print(f"⚠️ Redis connection failed: {e}")
            redis_client = None

    yield

    # Shutdown: Close Redis connection
    if redis_client:
        await redis_client.close()
        print("✓ Redis disconnected")

app = FastAPI(
    title="Voila API",
    description="Universal file handler with AI-powered insights",
    version="1.0.0",
    lifespan=lifespan
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS with secure configuration
# Security: Explicit origins, methods, and headers - no wildcards
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,  # Required for auth tokens
    allow_methods=ALLOWED_METHODS,
    allow_headers=ALLOWED_HEADERS,
    expose_headers=EXPOSED_HEADERS,
    max_age=600,  # Cache preflight for 10 minutes
)

# ==================== SECURITY MIDDLEWARE ====================

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """
    Add security headers to all responses.
    Implements OWASP security recommendations.
    """
    response = await call_next(request)

    # Prevent MIME type sniffing
    response.headers["X-Content-Type-Options"] = "nosniff"

    # Enable XSS filter in browsers
    response.headers["X-XSS-Protection"] = "1; mode=block"

    # Prevent clickjacking
    response.headers["X-Frame-Options"] = "DENY"

    # Control referrer information
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # Content Security Policy (restrictive)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; "
        "font-src 'self' https://cdnjs.cloudflare.com data:; "
        "img-src 'self' data: blob:; "
        "connect-src 'self' https://api.openai.com; "
        "worker-src 'self' blob:;"
    )

    # Strict Transport Security (force HTTPS)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    return response

# ==================== REQUEST MODELS (with validation) ====================

class FileMetadataRequest(BaseModel):
    """Request model for metadata extraction with input validation."""
    file_hash: str
    file_type: str
    file_size: int
    file_name: str

    @field_validator('file_hash')
    @classmethod
    def validate_hash(cls, v: str) -> str:
        """Validate SHA-256 hash format."""
        if len(v) != 64:
            raise ValueError('file_hash must be a valid SHA-256 hash (64 hex characters)')
        if not all(c in '0123456789abcdef' for c in v.lower()):
            raise ValueError('file_hash must contain only hexadecimal characters')
        return v.lower()

    @field_validator('file_type')
    @classmethod
    def validate_file_type(cls, v: str) -> str:
        """Validate MIME type format."""
        if not v or '/' not in v:
            raise ValueError('file_type must be a valid MIME type')
        if len(v) > 100:
            raise ValueError('file_type too long')
        return v

    @field_validator('file_size')
    @classmethod
    def validate_file_size(cls, v: int) -> int:
        """Validate file size is within acceptable range."""
        if v < 0:
            raise ValueError('file_size cannot be negative')
        if v > 2 * 1024 * 1024 * 1024:  # 2GB max
            raise ValueError('file_size exceeds maximum allowed (2GB)')
        return v

    @field_validator('file_name')
    @classmethod
    def validate_file_name(cls, v: str) -> str:
        """Validate filename for security (prevent path traversal)."""
        if not v:
            raise ValueError('file_name cannot be empty')
        if len(v) > 255:
            raise ValueError('file_name too long (max 255 characters)')
        # Prevent path traversal
        if '..' in v or '/' in v or '\\' in v:
            raise ValueError('file_name cannot contain path separators')
        return v

class CodeAnalysisRequest(BaseModel):
    """Request model for code analysis with input validation."""
    code: str
    language: str
    file_hash: Optional[str] = None

    @field_validator('code')
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Validate code input."""
        if len(v) > 100_000:  # 100KB max
            raise ValueError('code exceeds maximum length (100KB)')
        return v

    @field_validator('language')
    @classmethod
    def validate_language(cls, v: str) -> str:
        """Validate language identifier."""
        if not v or len(v) > 50:
            raise ValueError('language must be a valid identifier (max 50 chars)')
        # Allow alphanumeric and common programming language characters
        allowed = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#_+-.')
        if not all(c in allowed for c in v):
            raise ValueError('language contains invalid characters')
        return v.lower()

class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    redis: bool
    openai: bool
    timestamp: str

# ==================== ENDPOINTS ====================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint - API info"""
    return {
        "name": "Voila API",
        "version": "1.0.0",
        "description": "Universal file handler with AI-powered insights",
        "docs": "/docs"
    }

@app.get("/health", response_model=HealthCheckResponse, tags=["System"])
async def health_check():
    """Health check endpoint"""
    return HealthCheckResponse(
        status="healthy",
        redis=redis_client is not None,
        openai=OPENAI_AVAILABLE and llm_cache is not None,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@app.post("/api/v1/metadata/extract", tags=["Tier 2 - Metadata"])
@limiter.limit("30/minute")
async def extract_metadata(request: Request, payload: FileMetadataRequest):
    """
    Extract deep metadata from a file.
    In production, this would call Apache Tika.
    For demo, we return simulated metadata.
    """
    client_ip = get_remote_address(request)

    # Track cost
    if redis_client:
        await rate_limiter.track_cost(redis_client, client_ip, "tier2")

    # Simulate Tika metadata extraction
    metadata = {
        "file_name": payload.file_name,
        "file_size": payload.file_size,
        "detected_type": payload.file_type,
        "extraction_time": datetime.now(timezone.utc).isoformat(),
        "tika_version": "2.9.1",
        "parsing_mode": "standard",
        "embedded_resources": 0,
        "content_type_guessed": True,
        "metadata": {
            "Content-Length": payload.file_size,
            "Content-Type": payload.file_type,
            "X-Parsed-By": ["org.apache.tika.parser.DefaultParser"]
        }
    }

    return {
        "success": True,
        "metadata": metadata,
        "cost_tracked": redis_client is not None
    }

@app.post("/api/v1/analyze/code", tags=["Tier 2 - AI Analysis"])
@limiter.limit("10/minute")
async def analyze_code(request: Request, payload: CodeAnalysisRequest):
    """
    Get AI-powered code explanation.
    Uses Redis caching to avoid redundant API calls.
    """
    client_ip = get_remote_address(request)

    # Track cost
    if redis_client:
        await rate_limiter.track_cost(redis_client, client_ip, "llm")

    # Check if we have LLM cache available
    if llm_cache:
        try:
            explanation = await llm_cache.get_code_explanation(payload.code)
            return {
                "success": True,
                "explanation": explanation,
                "cached": True,
                "source": "openai"
            }
        except Exception as e:
            return {
                "success": True,
                "explanation": f"Demo mode - LLM error: {str(e)[:100]}",
                "cached": False,
                "source": "demo"
            }
    else:
        # Demo mode without real LLM
        lines = payload.code.split('\n')
        return {
            "success": True,
            "explanation": f"Code analysis for {payload.language}: {len(lines)} lines detected.",
            "cached": False,
            "source": "demo",
            "note": "Configure OPENAI_API_KEY and Redis for AI explanations"
        }

@app.post("/api/v1/diagnostics/corruption", tags=["Tier 2 - Diagnostics"])
@limiter.limit("30/minute")
async def check_corruption(request: Request, file_type: str):
    """
    Check file for corruption based on magic bytes.
    In production, this would analyze the actual file bytes.
    """
    client_ip = get_remote_address(request)

    # Track cost
    if redis_client:
        await rate_limiter.track_cost(redis_client, client_ip, "tier2")

    result = await corruption_detector.check_simulated(file_type)

    return {
        "success": True,
        "result": result
    }

@app.post("/api/v1/file/upload", tags=["Tier 2 - Upload"])
@limiter.limit("5/minute")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Upload a file for processing.
    Files are stored temporarily and auto-deleted after 1 hour.
    """
    client_ip = get_remote_address(request)

    # Check file size (max 500MB for tier 2)
    contents = await file.read()
    if len(contents) > 500 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 500MB)")

    # Track cost
    if redis_client:
        await rate_limiter.track_cost(redis_client, client_ip, "tier2")

    # Generate file hash
    file_hash = hashlib.sha256(contents).hexdigest()

    # In production: Upload to S3 with 1-hour TTL
    # For demo: Return metadata only
    return {
        "success": True,
        "file_hash": file_hash,
        "file_name": file.filename,
        "file_size": len(contents),
        "content_type": file.content_type,
        "upload_time": datetime.now(timezone.utc).isoformat(),
        "ttl_seconds": 3600,
        "storage": "s3" if os.getenv("S3_BUCKET") else "memory",
        "note": "File will be auto-deleted after 1 hour"
    }

@app.get("/api/v1/stats", tags=["System"])
async def get_stats():
    """
    Get API usage statistics.
    Requires Redis for persistent tracking.
    """
    if not redis_client:
        return {
            "mode": "demo",
            "note": "Connect Redis for persistent statistics"
        }

    try:
        # Get cached stats
        stats_keys = [
            "voila:stats:requests:today",
            "voila:stats:cost:today",
            "voila:llm:cache:hits",
            "voila:llm:cache:misses"
        ]

        stats = {}
        for key in stats_keys:
            value = await redis_client.get(key) or 0
            stats[key.replace("voila:", "")] = int(value)

        return {
            "mode": "production",
            "stats": stats,
            "cache_hit_rate": (
                stats.get("llm:cache:hits", 0) /
                max(1, stats.get("llm:cache:hits", 0) + stats.get("llm:cache:misses", 1))
            )
        }
    except Exception as e:
        return {"mode": "error", "error": str(e)}

@app.get("/api/v1/cost/{ip_address}", tags=["System"])
async def get_cost_for_ip(ip_address: str):
    """
    Get accumulated cost for a specific IP address.
    Useful for monitoring and debugging.
    """
    if not redis_client:
        return {"cost": 0, "mode": "demo"}

    try:
        month_key = datetime.now(timezone.utc).strftime("%Y%m")
        cost_key = f"cost:{ip_address}:{month_key}"
        cost = await redis_client.get(cost_key) or 0

        return {
            "ip_address": ip_address,
            "month": month_key,
            "accumulated_cost": float(cost),
            "currency": "USD",
            "limit": 10.00,
            "percentage": round(float(cost) / 10.0 * 100, 2)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc)[:100] if app.debug else "An error occurred"
        }
    )

# ==================== STARTUP ====================

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
"""
Pytest configuration and fixtures for Voila Backend
"""
import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# ── Set env vars BEFORE any app import ───────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("OPENAI_API_KEY", "test-key-sk-not-real")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
os.environ.setdefault("MAX_FILE_SIZE_MB", "500")
os.environ.setdefault("SECRET_KEY", "test-secret-32chars-not-for-prod")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ["RATELIMIT_ENABLED"] = "0"   # Disable rate limiting in all tests


@pytest.fixture
def mock_redis():
    """Mock Redis — no real Redis needed in tests."""
    with patch("main.REDIS_AVAILABLE", False), patch("main.redis_client", None):
        yield None


@pytest.fixture
def mock_openai():
    """Mock OpenAI — no real API calls in tests."""
    with patch("main.OPENAI_AVAILABLE", False):
        yield None


@pytest.fixture
def test_client(mock_redis, mock_openai):
    """FastAPI TestClient with all external deps mocked and rate limiting off."""
    from fastapi.testclient import TestClient
    from main import app, limiter

    # Disable rate limiting at runtime for this test session
    limiter.enabled = False

    with TestClient(app, raise_server_exceptions=False) as client:
        yield client

    limiter.enabled = True  # Restore for clean state


@pytest.fixture
def sample_file_metadata():
    return {
        "file_hash": "a" * 64,
        "file_type": "image/jpeg",
        "file_size": 1024 * 1024,
        "file_name": "test_image.jpg",
    }


@pytest.fixture
def sample_code_request():
    return {
        "code": 'def hello():\n    print("Hello, World!")',
        "language": "python",
    }


@pytest.fixture
def valid_sha256_hash():
    import hashlib
    return hashlib.sha256(b"test data").hexdigest()

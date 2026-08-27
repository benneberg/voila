"""
Pytest configuration and fixtures for Voila Backend
"""

import os
import sys
import pytest
from unittest.mock import patch

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set required env vars BEFORE app import so startup checks pass in test mode
os.environ.setdefault("OPENAI_API_KEY", "test-key-sk-not-real")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
os.environ.setdefault("MAX_FILE_SIZE_MB", "50")
os.environ.setdefault("SECRET_KEY", "test-secret-32chars-not-for-prod")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")


@pytest.fixture
def mock_redis():
    """Mock Redis client — no real Redis needed in tests."""
    with patch("main.REDIS_AVAILABLE", False):
        with patch("main.redis_client", None):
            yield None


@pytest.fixture
def mock_openai():
    """Mock OpenAI — no real API calls in tests."""
    with patch("main.OPENAI_AVAILABLE", False):
        yield None


@pytest.fixture
def test_client(mock_redis, mock_openai):
    """Create FastAPI TestClient with all external deps mocked."""
    from fastapi.testclient import TestClient
    from main import app
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client


@pytest.fixture
def sample_file_metadata():
    """Valid file metadata payload."""
    return {
        "file_hash": "a" * 64,           # Valid 64-char SHA-256
        "file_type": "image/jpeg",
        "file_size": 1024 * 1024,         # 1 MB
        "file_name": "test_image.jpg",
    }


@pytest.fixture
def sample_code_request():
    """Valid code analysis payload."""
    return {
        "code": 'def hello():\n    print("Hello, World!")',
        "language": "python",
    }


@pytest.fixture
def valid_sha256_hash():
    """A real SHA-256 hex digest for test assertions."""
    import hashlib
    return hashlib.sha256(b"test data").hexdigest()

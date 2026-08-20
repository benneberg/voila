"""
Pytest configuration and fixtures for Voila Backend
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock, patch
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing without Redis"""
    with patch('main.REDIS_AVAILABLE', False):
        with patch('main.redis_client', None):
            yield None


@pytest.fixture
def mock_openai():
    """Mock OpenAI availability"""
    with patch('main.OPENAI_AVAILABLE', False):
        yield None


@pytest.fixture
def test_client(mock_redis, mock_openai):
    """Create test client for FastAPI app"""
    # Import app after patching
    from main import app
    with TestClient(app) as client:
        yield client


@pytest.fixture
def sample_file_metadata():
    """Sample file metadata for testing"""
    return {
        "file_hash": "a" * 64,  # Valid SHA-256 hash
        "file_type": "image/jpeg",
        "file_size": 1024 * 1024,  # 1MB
        "file_name": "test_image.jpg"
    }


@pytest.fixture
def sample_code_request():
    """Sample code analysis request"""
    return {
        "code": 'def hello():\n    print("Hello, World!")',
        "language": "python"
    }


@pytest.fixture
def valid_sha256_hash():
    """Generate a valid SHA-256 hash for testing"""
    import hashlib
    test_data = b"test data"
    return hashlib.sha256(test_data).hexdigest()

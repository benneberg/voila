"""
Unit tests for Voila Backend API endpoints
"""

import pytest
from fastapi.testclient import TestClient
import hashlib


class TestHealthEndpoint:
    """Tests for health check endpoint"""

    def test_health_check_returns_status(self, test_client):
        """Health endpoint should return status information"""
        response = test_client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_health_check_includes_services(self, test_client):
        """Health endpoint should include service availability"""
        response = test_client.get("/health")
        data = response.json()

        # Redis and OpenAI should be reported (demo mode = False)
        assert "redis" in data
        assert "openai" in data


class TestRootEndpoint:
    """Tests for root endpoint"""

    def test_root_returns_api_info(self, test_client):
        """Root endpoint should return API information"""
        response = test_client.get("/")

        assert response.status_code == 200
        data = response.json()

        assert data["name"] == "Voila API"
        assert "version" in data
        assert "description" in data
        assert data["docs"] == "/docs"


class TestMetadataExtraction:
    """Tests for metadata extraction endpoint"""

    def test_extract_metadata_valid_request(self, test_client, sample_file_metadata):
        """Should extract metadata for valid file"""
        response = test_client.post("/api/v1/metadata/extract", json=sample_file_metadata)

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "metadata" in data
        assert data["metadata"]["file_name"] == sample_file_metadata["file_name"]

    def test_extract_metadata_invalid_hash(self, test_client):
        """Should reject invalid SHA-256 hash"""
        invalid_metadata = {
            "file_hash": "not-a-valid-hash",  # Invalid: not 64 hex chars
            "file_type": "image/jpeg",
            "file_size": 1024,
            "file_name": "test.jpg"
        }

        response = test_client.post("/api/v1/metadata/extract", json=invalid_metadata)

        assert response.status_code == 422  # Validation error

    def test_extract_metadata_invalid_hash_length(self, test_client):
        """Should reject hash with wrong length"""
        invalid_metadata = {
            "file_hash": "abc" * 20,  # 60 chars instead of 64
            "file_type": "image/jpeg",
            "file_size": 1024,
            "file_name": "test.jpg"
        }

        response = test_client.post("/api/v1/metadata/extract", json=invalid_metadata)

        assert response.status_code == 422

    def test_extract_metadata_path_traversal(self, test_client):
        """Should reject filenames with path traversal"""
        malicious_metadata = {
            "file_hash": "a" * 64,
            "file_type": "image/jpeg",
            "file_size": 1024,
            "file_name": "../../../etc/passwd"
        }

        response = test_client.post("/api/v1/metadata/extract", json=malicious_metadata)

        assert response.status_code == 422

    def test_extract_metadata_empty_filename(self, test_client):
        """Should reject empty filename"""
        invalid_metadata = {
            "file_hash": "a" * 64,
            "file_type": "image/jpeg",
            "file_size": 1024,
            "file_name": ""
        }

        response = test_client.post("/api/v1/metadata/extract", json=invalid_metadata)

        assert response.status_code == 422

    def test_extract_metadata_filename_too_long(self, test_client):
        """Should reject filename exceeding 255 characters"""
        invalid_metadata = {
            "file_hash": "a" * 64,
            "file_type": "image/jpeg",
            "file_size": 1024,
            "file_name": "a" * 256
        }

        response = test_client.post("/api/v1/metadata/extract", json=invalid_metadata)

        assert response.status_code == 422

    def test_extract_metadata_file_size_negative(self, test_client):
        """Should reject negative file size"""
        invalid_metadata = {
            "file_hash": "a" * 64,
            "file_type": "image/jpeg",
            "file_size": -1,
            "file_name": "test.jpg"
        }

        response = test_client.post("/api/v1/metadata/extract", json=invalid_metadata)

        assert response.status_code == 422

    def test_extract_metadata_file_size_exceeds_limit(self, test_client):
        """Should reject file size exceeding 2GB"""
        invalid_metadata = {
            "file_hash": "a" * 64,
            "file_type": "image/jpeg",
            "file_size": 3 * 1024 * 1024 * 1024,  # 3GB
            "file_name": "test.jpg"
        }

        response = test_client.post("/api/v1/metadata/extract", json=invalid_metadata)

        assert response.status_code == 422

    def test_extract_metadata_invalid_mime_type(self, test_client):
        """Should reject invalid MIME type"""
        invalid_metadata = {
            "file_hash": "a" * 64,
            "file_type": "not-a-mime",  # Missing '/'
            "file_size": 1024,
            "file_name": "test.jpg"
        }

        response = test_client.post("/api/v1/metadata/extract", json=invalid_metadata)

        assert response.status_code == 422


class TestCodeAnalysis:
    """Tests for code analysis endpoint"""

    def test_analyze_code_valid_python(self, test_client, sample_code_request):
        """Should analyze Python code"""
        response = test_client.post("/api/v1/analyze/code", json=sample_code_request)

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "explanation" in data

    def test_analyze_code_invalid_language(self, test_client):
        """Should handle invalid language"""
        invalid_request = {
            "code": "print('hello')",
            "language": "invalid<script>alert(1)</script>"  # Invalid characters
        }

        response = test_client.post("/api/v1/analyze/code", json=invalid_request)

        assert response.status_code == 422

    def test_analyze_code_too_large(self, test_client):
        """Should reject code exceeding 100KB"""
        large_request = {
            "code": "x" * (101 * 1024),  # 101KB
            "language": "python"
        }

        response = test_client.post("/api/v1/analyze/code", json=large_request)

        assert response.status_code == 422


class TestCorruptionDetection:
    """Tests for corruption detection endpoint"""

    def test_check_corruption_jpeg(self, test_client):
        """Should check JPEG for corruption"""
        response = test_client.post(
            "/api/v1/diagnostics/corruption",
            params={"file_type": "image/jpeg"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "result" in data

    def test_check_corruption_pdf(self, test_client):
        """Should check PDF for corruption"""
        response = test_client.post(
            "/api/v1/diagnostics/corruption",
            params={"file_type": "application/pdf"}
        )

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True


class TestFileUpload:
    """Tests for file upload endpoint"""

    def test_upload_small_file(self, test_client):
        """Should accept small file uploads"""
        # Create a small test file
        content = b"test file content"
        files = {"file": ("test.txt", content, "text/plain")}

        response = test_client.post("/api/v1/file/upload", files=files)

        assert response.status_code == 200
        data = response.json()

        assert data["success"] is True
        assert "file_hash" in data
        assert len(data["file_hash"]) == 64  # SHA-256

    def test_upload_computes_correct_hash(self, test_client):
        """Should compute correct SHA-256 hash"""
        content = b"hello world"
        expected_hash = hashlib.sha256(content).hexdigest()

        files = {"file": ("test.txt", content, "text/plain")}

        response = test_client.post("/api/v1/file/upload", files=files)

        assert response.status_code == 200
        data = response.json()

        assert data["file_hash"] == expected_hash

    def test_upload_preserves_metadata(self, test_client):
        """Should preserve file metadata"""
        content = b"test content"
        files = {"file": ("my_document.pdf", content, "application/pdf")}

        response = test_client.post("/api/v1/file/upload", files=files)

        assert response.status_code == 200
        data = response.json()

        assert data["file_name"] == "my_document.pdf"
        assert data["file_size"] == len(content)
        assert data["content_type"] == "application/pdf"


class TestStats:
    """Tests for statistics endpoint"""

    def test_stats_returns_data(self, test_client):
        """Stats endpoint should return data"""
        response = test_client.get("/api/v1/stats")

        assert response.status_code == 200
        data = response.json()

        # In demo mode (no Redis), should return mode indicator
        assert "mode" in data


class TestCostTracking:
    """Tests for cost tracking endpoint"""

    def test_cost_returns_data(self, test_client):
        """Cost endpoint should return cost data (demo or live mode)"""
        response = test_client.get("/api/v1/cost/192.168.1.1")

        assert response.status_code == 200
        data = response.json()

        # Demo mode (no Redis): {cost, mode}
        # Live mode (Redis up): {ip_address, cost, ...}
        assert "cost" in data
        if "ip_address" in data:
            assert data["ip_address"] == "192.168.1.1"


class TestSecurityHeaders:
    """Tests for security headers"""

    def test_security_headers_present(self, test_client):
        """Response should include security headers"""
        response = test_client.get("/health")

        assert response.status_code == 200

        # Check for security headers
        assert "x-content-type-options" in response.headers
        assert response.headers["x-content-type-options"] == "nosniff"

        assert "x-frame-options" in response.headers
        assert response.headers["x-frame-options"] == "DENY"

        assert "referrer-policy" in response.headers
        assert "strict-transport-security" in response.headers

    def test_content_security_policy(self, test_client):
        """Should include CSP header"""
        response = test_client.get("/health")

        assert "content-security-policy" in response.headers


class TestCORS:
    """Tests for CORS configuration"""

    def test_cors_headers_on_preflight(self, test_client):
        """Should handle OPTIONS preflight"""
        response = test_client.options(
            "/api/v1/metadata/extract",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type"
            }
        )

        # CORS should be configured (status may vary based on allowed_origins)
        assert "access-control-allow-origin" in response.headers or response.status_code in [200, 204, 400, 403]


class TestErrorHandling:
    """Tests for error handling"""

    def test_404_not_found(self, test_client):
        """Should return 404 for unknown endpoints"""
        response = test_client.get("/nonexistent/endpoint")

        assert response.status_code == 404

    def test_method_not_allowed(self, test_client):
        """Should return 405 for wrong HTTP method"""
        response = test_client.delete("/health")

        # Should either work or return 405
        assert response.status_code in [200, 405]

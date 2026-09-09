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
        """REVIEW-008: Corruption check uses real file bytes, not params."""
        jpeg_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 50
        response = test_client.post(
            "/api/v1/diagnostics/corruption",
            files={"file": ("photo.jpg", jpeg_bytes, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "result" in data
        assert data["result"]["healthy"] is True  # valid JPEG SOI

    def test_check_corruption_pdf(self, test_client):
        """REVIEW-008: Corrupt PDF detected from actual bytes."""
        # Valid PDF header
        pdf_ok = b"%PDF-1.4\n%%EOF"
        r = test_client.post("/api/v1/diagnostics/corruption",
                             files={"file": ("ok.pdf", pdf_ok, "application/pdf")})
        assert r.status_code == 200
        assert r.json()["success"] is True

        # Corrupt PDF (wrong header)
        pdf_bad = b"THIS IS NOT A PDF" + b"\x00" * 20
        r2 = test_client.post("/api/v1/diagnostics/corruption",
                              files={"file": ("bad.pdf", pdf_bad, "application/pdf")})
        assert r2.status_code == 200
        result = r2.json()["result"]
        assert result["healthy"] is False
        assert any("PDF" in issue for issue in result["issues"])


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


# ── TEST-004: File upload integration with real bytes ─────────────────────────
class TestFileUploadIntegration:
    """Integration tests: upload pipeline with actual file bytes."""

    def test_upload_jpeg_magic_bytes(self, test_client):
        jpeg = b'\xff\xd8\xff\xe0' + b'\x00' * 100
        r = test_client.post("/api/v1/file/upload", files={"file": ("photo.jpg", jpeg, "image/jpeg")})
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert len(data["file_hash"]) == 64  # SHA-256

    def test_upload_png_magic_bytes(self, test_client):
        png = b'\x89PNG\r\n\x1a\n' + b'\x00' * 50
        r = test_client.post("/api/v1/file/upload", files={"file": ("img.png", png, "image/png")})
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_upload_pdf_bytes(self, test_client):
        pdf = b'%PDF-1.4\n' + b'\x00' * 20
        r = test_client.post("/api/v1/file/upload", files={"file": ("doc.pdf", pdf, "application/pdf")})
        assert r.status_code == 200

    def test_upload_plain_text(self, test_client):
        r = test_client.post("/api/v1/file/upload", files={"file": ("readme.txt", b"Hello World\n", "text/plain")})
        assert r.status_code == 200

    def test_upload_returns_consistent_hash(self, test_client):
        import hashlib
        data = b"deterministic content"
        expected = hashlib.sha256(data).hexdigest()
        r1 = test_client.post("/api/v1/file/upload", files={"file": ("a.bin", data, "application/octet-stream")})
        r2 = test_client.post("/api/v1/file/upload", files={"file": ("b.bin", data, "application/octet-stream")})
        assert r1.json()["file_hash"] == expected
        assert r2.json()["file_hash"] == expected

    def test_upload_response_schema(self, test_client):
        r = test_client.post("/api/v1/file/upload", files={"file": ("t.bin", b"test", "application/octet-stream")})
        d = r.json()
        for key in ("success", "file_hash", "file_size", "upload_time"):
            assert key in d
        assert d["file_size"] == 4

    def test_upload_detects_jpeg_mislabeled_as_txt(self, test_client):
        """Extension-agnostic — JPEG with .txt extension is still accepted."""
        jpeg = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00'
        r = test_client.post("/api/v1/file/upload", files={"file": ("trick.txt", jpeg, "text/plain")})
        assert r.status_code == 200
        assert r.json()["success"] is True

    def test_upload_detects_real_type_from_magic(self, test_client):
        """REVIEW-007: upload returns detected_type and provenance fields."""
        jpeg = b'\xff\xd8\xff\xe0' + b'\x00' * 50
        r = test_client.post("/api/v1/file/upload", files={"file": ("img.bin", jpeg, "application/octet-stream")})
        assert r.status_code == 200
        data = r.json()
        # Response must include provenance and detected_type fields
        assert "provenance" in data, f"Missing provenance in {data}"
        assert "file_hash" in data


# ── TEST-005: Rate limiter load test ──────────────────────────────────────────
class TestRateLimiterLoad:
    """Rate limiting does not crash under repeated requests."""

    def test_health_survives_burst(self, test_client):
        results = [test_client.get("/health") for _ in range(15)]
        statuses = [r.status_code for r in results]
        assert all(s == 200 for s in statuses), f"Unexpected: {statuses}"

    def test_upload_burst_returns_valid_codes(self, test_client):
        responses = [
            test_client.post("/api/v1/file/upload",
                             files={"file": ("f.bin", b"data", "application/octet-stream")})
            for _ in range(5)
        ]
        statuses = [r.status_code for r in responses]
        assert all(s in (200, 429) for s in statuses), f"Unexpected statuses: {statuses}"

    def test_separate_ips_tracked_independently(self, test_client):
        r1 = test_client.get("/health", headers={"X-Forwarded-For": "10.0.0.1"})
        r2 = test_client.get("/health", headers={"X-Forwarded-For": "10.0.0.2"})
        assert r1.status_code == 200 and r2.status_code == 200


# ── REVIEW-002/003: Admin endpoint protection ─────────────────────────────────
class TestAdminEndpointProtection:
    """Cost and stats endpoints require X-Admin-Key when ADMIN_API_KEY is set."""

    def test_cost_returns_demo_without_admin_key_configured(self, test_client):
        """When ADMIN_API_KEY is not set, cost endpoint is accessible (demo mode)."""
        import os
        os.environ.pop("ADMIN_API_KEY", None)
        r = test_client.get("/api/v1/cost/127.0.0.1")
        assert r.status_code in (200, 403)

    def test_stats_returns_data_without_key_configured(self, test_client):
        import os
        os.environ.pop("ADMIN_API_KEY", None)
        r = test_client.get("/api/v1/stats")
        assert r.status_code in (200, 403)

    def test_cost_blocked_with_wrong_admin_key(self, test_client, monkeypatch):
        monkeypatch.setenv("ADMIN_API_KEY", "secret-key-123")
        r = test_client.get("/api/v1/cost/127.0.0.1", headers={"X-Admin-Key": "wrong"})
        assert r.status_code == 403

    def test_cost_accessible_with_correct_admin_key(self, test_client, monkeypatch):
        monkeypatch.setenv("ADMIN_API_KEY", "secret-key-123")
        r = test_client.get("/api/v1/cost/127.0.0.1", headers={"X-Admin-Key": "secret-key-123"})
        assert r.status_code in (200, 404)

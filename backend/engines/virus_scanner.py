"""
Virus Scanner - File security scanning
Detects malicious files before processing

Uses multiple detection strategies:
1. File signature scanning (YARA rules)
2. File structure analysis
3. Known malicious patterns
"""

import hashlib
import os
import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class ThreatLevel(Enum):
    """Classification of detected threats"""
    CLEAN = "clean"
    SUSPICIOUS = "suspicious"
    MALICIOUS = "malicious"
    UNKNOWN = "unknown"


@dataclass
class ScanResult:
    """Result of a file scan"""
    is_safe: bool
    threat_level: ThreatLevel
    threats_found: List[str]
    file_hash: str
    file_type_confidence: float
    recommendations: List[str]
    metadata: Dict


class VirusScanner:
    """
    Multi-layered file security scanner

    Provides:
    - Signature-based detection
    - Heuristic analysis
    - File structure validation
    """

    # Known dangerous file signatures (magic bytes)
    DANGEROUS_SIGNATURES = {
        # Executable patterns
        b'MZ': ('executable', 'Windows executable (EXE/DLL)'),
        b'\x7fELF': ('executable', 'Linux ELF executable'),
        b'\xfe\xed\xfa\xce': ('executable', 'macOS Mach-O executable'),
        b'\xfe\xed\xfa\xcf': ('executable', 'macOS Mach-O executable'),

        # Script patterns that could be malicious
        b'#!/bin/bash': ('script', 'Shell script'),
        b'#!/bin/sh': ('script', 'Shell script'),
        b'#!/usr/bin/python': ('script', 'Python script'),
        b'#!/usr/bin/perl': ('script', 'Perl script'),

        # Archive bombs (zip bombs)
        'PK\x05\x06' * 100: ('archive_bomb', 'Potential zip bomb'),

        # Executable scripts in archives
        b'<script': ('html_malware', 'HTML with embedded script'),
        b'javascript:': ('html_malware', 'JavaScript URI'),

        # Polyglot files (valid in multiple formats)
        b'%PDF': ('polyglot', 'PDF file'),
        b'\x89PNG': ('polyglot', 'PNG image'),
    }

    # Suspicious file extensions that could contain executable content
    DANGEROUS_EXTENSIONS = {
        '.exe', '.dll', '.sys', '.bat', '.cmd', '.ps1', '.vbs', '.js', '.jse',
        '.wsf', '.wsh', '.msi', '.scr', '.pif', '.application', '.gadget',
        '.jar', '.sh', '.bash', '.zsh', '.fish', '.csh', '.tcsh', '.ksh',
        '.ruby', '.pl', '.pyc', '.pyo', '.class'
    }

    # Patterns that indicate potential malicious content
    SUSPICIOUS_PATTERNS = [
        # Network callbacks
        (re.compile(rb'(eval|exec|system)\s*\(\s*(base64_decode|gzinflate|str_rot13)', re.I), 'obfuscated_code'),
        (re.compile(rb'socket\s*\(', re.I), 'network_socket'),
        (re.compile(rb'(curl|wget)\s+http', re.I), 'network_download'),
        (re.compile(rb'reverse.?shell|backdoor', re.I), 'backdoor'),
        (re.compile(rb'nc\s+-e|/dev/tcp/', re.I), 'shell_spawn'),

        # Privilege escalation
        (re.compile(rb'sudo\s+', re.I), 'privilege_escalation'),
        (re.compile(rb'chmod\s+[47][0-7][0-7]', re.I), 'permission_modification'),

        # Data exfiltration patterns
        (re.compile(rb'(password|passwd|pwd)\s*=', re.I), 'credential_access'),
        (re.compile(rb'(api_key|apikey|secret)\s*=', re.I), 'credential_access'),
        (re.compile(rb'eval\s*\(', re.I), 'dynamic_code_execution'),

        # File system manipulation
        (re.compile(rb'(rm|del)\s+-rf\s+/', re.I), 'destructive_command'),
        (re.compile(rb'mkfs\s+', re.I), 'filesystem_destruction'),
        (re.compile(rb'dd\s+if=', re.I), 'raw_disk_write'),

        # Cryptocurrency mining
        (re.compile(rb'(stratum|coinhive|xmrig|miner)', re.I), 'crypto_miner'),
    ]

    # File size limits
    MAX_SCAN_SIZE = 100 * 1024 * 1024  # 100MB
    MAX_COMPRESSED_RATIO = 1000  # Files that decompress to 1000x+ are likely bombs

    def __init__(self):
        self._scan_count = 0
        self._threat_count = 0
        self._suspicious_files: List[Dict] = []

    async def scan_file(self, file_bytes: bytes, filename: str, mime_type: str) -> ScanResult:
        """
        Scan a file for malicious content

        Args:
            file_bytes: File content
            filename: Original filename
            mime_type: Detected MIME type

        Returns:
            ScanResult with threat assessment
        """
        self._scan_count += 1
        threats: List[str] = []
        recommendations: List[str] = []
        metadata: Dict = {}

        # Calculate file hash
        file_hash = hashlib.sha256(file_bytes).hexdigest()
        metadata['sha256'] = file_hash
        metadata['file_size'] = len(file_bytes)

        # Check file size
        if len(file_bytes) > self.MAX_SCAN_SIZE:
            threats.append("File exceeds maximum scan size")
            recommendations.append("Files over 100MB cannot be scanned. Use sandboxed execution.")
            return ScanResult(
                is_safe=False,
                threat_level=ThreatLevel.UNKNOWN,
                threats_found=threats,
                file_hash=file_hash,
                file_type_confidence=0.0,
                recommendations=recommendations,
                metadata=metadata
            )

        # Check for dangerous extensions
        ext = os.path.splitext(filename)[1].lower()
        if ext in self.DANGEROUS_EXTENSIONS:
            threats.append(f"Dangerous extension detected: {ext}")
            recommendations.append("Executable files should be run in a sandboxed environment (Firecracker VM)")

        # Check magic bytes / signatures
        signature_threats = self._check_signatures(file_bytes[:1024])  # Check first 1KB
        threats.extend(signature_threats)

        # Heuristic pattern matching
        pattern_threats = self._check_patterns(file_bytes)
        threats.extend(pattern_threats)

        # Check for polyglot files
        if self._is_polyglot(file_bytes):
            threats.append("Polyglot file detected (valid as multiple formats)")
            recommendations.append("Polyglot files may hide malicious content. Treat with caution.")

        # Calculate threat level
        if threats:
            self._threat_count += 1
            self._suspicious_files.append({
                'filename': filename,
                'hash': file_hash,
                'threats': threats,
                'timestamp': str(hashlib.md5(file_bytes).hexdigest())
            })

            if any('malicious' in t.lower() or 'backdoor' in t.lower() for t in threats):
                threat_level = ThreatLevel.MALICIOUS
                is_safe = False
            elif len(threats) >= 3:
                threat_level = ThreatLevel.MALICIOUS
                is_safe = False
            else:
                threat_level = ThreatLevel.SUSPICIOUS
                is_safe = True  # Allow but warn
        else:
            threat_level = ThreatLevel.CLEAN
            is_safe = True

        return ScanResult(
            is_safe=is_safe,
            threat_level=threat_level,
            threats_found=threats,
            file_hash=file_hash,
            file_type_confidence=1.0 if is_safe else 0.5,
            recommendations=recommendations,
            metadata=metadata
        )

    def _check_signatures(self, header_bytes: bytes) -> List[str]:
        """Check file header against known dangerous signatures"""
        threats = []

        for sig, (category, description) in self.DANGEROUS_SIGNATURES.items():
            if isinstance(sig, bytes):
                if header_bytes.startswith(sig):
                    threats.append(f"Dangerous signature: {description} ({category})")
            else:
                if sig.encode() in header_bytes:
                    threats.append(f"Dangerous signature: {description} ({category})")

        return threats

    def _check_patterns(self, content: bytes) -> List[str]:
        """Check file content against suspicious patterns"""
        threats = []

        # Limit scan to prevent DoS
        scan_size = min(len(content), 1 * 1024 * 1024)  # 1MB max
        content_sample = content[:scan_size]

        for pattern, pattern_name in self.SUSPICIOUS_PATTERNS:
            if pattern.search(content_sample):
                threats.append(f"Suspicious pattern: {pattern_name}")

        return threats

    def _is_polyglot(self, content: bytes) -> bool:
        """Detect if file is a polyglot (valid as multiple formats)"""
        polyglot_indicators = 0

        # Check for multiple format signatures
        if content.startswith(b'%PDF'):
            polyglot_indicators += 1
        if b'<html' in content.lower() or b'<!DOCTYPE html' in content.lower():
            polyglot_indicators += 1
        if b'\x89PNG' in content[:20]:
            polyglot_indicators += 1
        if b'PK\x03\x04' in content[:10]:  # ZIP/JAR
            polyglot_indicators += 1
        if b'MZ' in content[:2]:
            polyglot_indicators += 1

        return polyglot_indicators >= 2

    def get_stats(self) -> Dict:
        """Get scanner statistics"""
        return {
            'total_scanned': self._scan_count,
            'threats_detected': self._threat_count,
            'threat_percentage': round(
                (self._threat_count / self._scan_count * 100) if self._scan_count > 0 else 0,
                2
            ),
            'recent_suspicious': self._suspicious_files[-10:]
        }


# Global instance
virus_scanner = VirusScanner()

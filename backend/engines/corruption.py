"""
Corruption Detector - Structural file integrity checking
Diagnoses broken files before AI analysis
"""

import struct
from typing import Dict, List, Optional, Any

# Magic byte signatures for common formats
MAGIC_SIGNATURES = {
    'jpeg': {'header': b'\xff\xd8\xff', 'footer': b'\xff\xd9', 'name': 'JPEG Image'},
    'png': {'header': b'\x89PNG\r\n\x1a\n', 'footer': b'IEND\xaeB`\x82', 'name': 'PNG Image'},
    'gif87': {'header': b'GIF87a', 'name': 'GIF (1987)'},
    'gif89': {'header': b'GIF89a', 'name': 'GIF (1989)'},
    'pdf': {'header': b'%PDF-', 'footer': b'%%EOF', 'name': 'PDF Document'},
    'zip': {'header': b'PK\x03\x04', 'footer': b'PK\x05\x06', 'name': 'ZIP Archive'},
    'gz': {'header': b'\x1f\x8b', 'name': 'GZIP Archive'},
    'bzip2': {'header': b'BZ', 'name': 'BZIP2 Archive'},
    'png': {'header': b'\x89PNG', 'name': 'PNG Image'},
    'mp3': {'header': b'ID3', 'name': 'MP3 Audio'},
    'mp3_id3': {'header': b'\xff\xfb', 'name': 'MP3 Audio'},
    'wav': {'header': b'RIFF', 'name': 'WAV Audio'},
    'avi': {'header': b'RIFF', 'name': 'AVI Video'},
    'mp4': {'header': b'\x00\x00\x00', 'name': 'MP4 Video'},
    'flac': {'header': b'fLaC', 'name': 'FLAC Audio'},
    'ogg': {'header': b'OggS', 'name': 'OGG Media'},
    'webp': {'header': b'RIFF', 'name': 'WebP Image'},
    'exe': {'header': b'MZ', 'name': 'Windows Executable'},
    'elf': {'header': b'\x7fELF', 'name': 'ELF Executable'},
    'dll': {'header': b'MZ', 'name': 'Windows DLL'},
    'class': {'header': b'\xca\xfe\xba\xbe', 'name': 'Java Class'},
    'wasm': {'header': b'\x00asm', 'name': 'WebAssembly'},
    'woff': {'header': b'wOF2', 'name': 'WOFF2 Font'},
    'woff': {'header': b'wOFF', 'name': 'WOFF Font'},
    'ttf': {'header': b'\x00\x01\x00\x00', 'name': 'TrueType Font'},
    'otf': {'header': b'OTTO', 'name': 'OpenType Font'},
    'sqlite': {'header': b'SQLite format 3', 'name': 'SQLite Database'},
    'tar': {'header': b'ustar', 'name': 'TAR Archive'},
    'rar': {'header': b'Rar!\x1a\x07', 'name': 'RAR Archive'},
    '7z': {'header': b'7z\xbc\xaf\x27\x1c', 'name': '7-Zip Archive'},
    'xz': {'header': b'\xfd7zXZ\x00', 'name': 'XZ Archive'},
    'deb': {'header': b'!<arch>', 'name': 'Debian Package'},
    'rpm': {'header': b'\xed\xab\xee\xdb', 'name': 'RPM Package'},
    'iso': {'header': b'CD001', 'name': 'ISO Image'},
    'mpg': {'header': b'\x00\x00\x01\xba', 'name': 'MPEG Video'},
    'mov': {'header': b'\x00\x00\x00', 'name': 'QuickTime Video'},
    'rtf': {'header': b'{\\rtf', 'name': 'RTF Document'},
    'docx': {'header': b'PK\x03\x04', 'name': 'Word Document'},
    'xlsx': {'header': b'PK\x03\x04', 'name': 'Excel Spreadsheet'},
    'pptx': {'header': b'PK\x03\x04', 'name': 'PowerPoint'},
    'odt': {'header': b'PK\x03\x04', 'name': 'OpenDocument Text'},
    'xml': {'header': b'<?xml', 'name': 'XML Document'},
    'html': {'header': b'<!DOCTYPE', 'name': 'HTML Document'},
    'json': {'header': b'{', 'name': 'JSON Document'},
}

class CorruptionDetector:
    """Detect file corruption and structural issues"""

    def __init__(self):
        self.signatures = MAGIC_SIGNATURES

    def check_header(self, data: bytes, file_type: str) -> Dict[str, Any]:
        """
        Check if file header matches expected format

        Args:
            data: First 64 bytes of file
            file_type: Expected file type

        Returns:
            Dict with check results
        """
        if len(data) < 4:
            return {
                'valid': False,
                'issue': 'File too small to check header',
                'severity': 'critical'
            }

        for sig_type, sig_info in self.signatures.items():
            header = sig_info.get('header')
            if header and data.startswith(header):
                if sig_type == file_type.lower() or sig_info['name'].lower().startswith(file_type.lower()):
                    return {
                        'valid': True,
                        'format': sig_info['name'],
                        'signature': sig_type
                    }

        # Check for generic signatures
        for sig_type, sig_info in self.signatures.items():
            if data.startswith(sig_info.get('header', b'')):
                return {
                    'valid': True,
                    'format': sig_info['name'],
                    'signature': sig_type,
                    'mismatch_warning': True,
                    'note': f"Header matches {sig_info['name']}, expected {file_type}"
                }

        return {
            'valid': False,
            'issue': f'Unknown or corrupted header',
            'severity': 'high',
            'hex_header': data[:16].hex()
        }

    def check_footer(self, data: bytes, file_type: str) -> Dict[str, Any]:
        """
        Check if file footer is present and valid

        Args:
            data: Last 64 bytes of file
            file_type: Expected file type

        Returns:
            Dict with check results
        """
        # Most formats don't have strict footer requirements
        # Only check for formats known to have trailers
        footer_formats = {
            'jpeg': b'\xff\xd9',
            'png': b'IEND\xaeB`\x82',
            'pdf': b'%%EOF',
            'zip': b'PK\x05\x06',
            'tar': b'',
            'gz': b''
        }

        if file_type.lower() in footer_formats:
            expected_footer = footer_formats[file_type.lower()]

            if expected_footer and not data.endswith(expected_footer):
                # Check if footer exists but is corrupted
                trimmed = data.rstrip(b'\x00')
                if not trimmed.endswith(expected_footer):
                    return {
                        'valid': False,
                        'issue': f'Missing or corrupted {file_type.upper()} footer',
                        'severity': 'medium',
                        'suggestion': 'File may be truncated'
                    }

        return {'valid': True}

    def check_structure(self, data: bytes, file_type: str) -> Dict[str, Any]:
        """
        Perform format-specific structural checks

        Args:
            data: File bytes
            file_type: Expected file type

        Returns:
            Dict with structural check results
        """
        checks = []

        if file_type.lower() == 'jpeg':
            # Check for complete SOI and EOI markers
            if not data.startswith(b'\xff\xd8'):
                checks.append({
                    'type': 'header',
                    'severity': 'critical',
                    'issue': 'Missing JPEG SOI (Start of Image) marker'
                })

            if not data.rstrip(b'\x00\xff').endswith(b'\xff\xd9'):
                checks.append({
                    'type': 'footer',
                    'severity': 'high',
                    'issue': 'Missing JPEG EOI (End of Image) marker - file may be truncated'
                })

            # Check for embedded APP markers (EXIF, XMP, etc.)
            app_count = data.count(b'\xff\xe0') + data.count(b'\xff\xe1') + data.count(b'\xff\xe2')
            if app_count > 5:
                checks.append({
                    'type': 'structure',
                    'severity': 'low',
                    'issue': f'Many embedded APP markers ({app_count}) - possible metadata bloat'
                })

        elif file_type.lower() == 'png':
            if not data.startswith(b'\x89PNG\r\n\x1a\n'):
                checks.append({
                    'type': 'header',
                    'severity': 'critical',
                    'issue': 'Invalid PNG signature'
                })

            # Check for IEND chunk
            if b'IEND' not in data:
                checks.append({
                    'type': 'footer',
                    'severity': 'high',
                    'issue': 'Missing PNG IEND chunk'
                })

        elif file_type.lower() == 'pdf':
            if not data.startswith(b'%PDF-'):
                checks.append({
                    'type': 'header',
                    'severity': 'critical',
                    'issue': 'Invalid PDF header'
                })

            if b'%%EOF' not in data:
                checks.append({
                    'type': 'footer',
                    'severity': 'medium',
                    'issue': 'Missing PDF EOF marker'
                })

        elif file_type.lower() in ['zip', 'docx', 'xlsx', 'pptx', 'odt']:
            # ZIP-based formats
            if not data.startswith(b'PK\x03\x04'):
                checks.append({
                    'type': 'header',
                    'severity': 'critical',
                    'issue': 'Invalid ZIP signature'
                })

            # Count central directory entries
            cd_count = data.count(b'PK\x01\x02')
            eocd_count = data.count(b'PK\x05\x06')

            if eocd_count == 0:
                checks.append({
                    'type': 'structure',
                    'severity': 'high',
                    'issue': 'Missing ZIP End of Central Directory'
                })

            if eocd_count > 1:
                checks.append({
                    'type': 'structure',
                    'severity': 'medium',
                    'issue': f'Multiple ZIP EOCD markers ({eocd_count})'
                })

        elif file_type.lower() == 'elf':
            if not data.startswith(b'\x7fELF'):
                checks.append({
                    'type': 'header',
                    'severity': 'critical',
                    'issue': 'Invalid ELF magic number'
                })

        elif file_type.lower() == 'exe':
            if not data.startswith(b'MZ'):
                checks.append({
                    'type': 'header',
                    'severity': 'critical',
                    'issue': 'Invalid PE/COFF header (MZ signature missing)'
                })

        return {
            'issues': checks,
            'issue_count': len(checks),
            'is_healthy': len(checks) == 0
        }

    async def check_simulated(self, file_type: str) -> Dict[str, Any]:
        """
        Simulated check for demo purposes (doesn't analyze real bytes)

        Args:
            file_type: File type to check

        Returns:
            Simulated check results
        """
        return {
            'is_healthy': True,
            'format': file_type,
            'checks_performed': ['header', 'footer', 'structure'],
            'issues': [],
            'recommendation': 'File appears structurally sound',
            'note': 'Configure Tika server for real byte-level analysis'
        }

    def get_format_info(self, file_type: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific format

        Args:
            file_type: File format

        Returns:
            Format information or None
        """
        for sig_type, sig_info in self.signatures.items():
            if sig_type == file_type.lower() or sig_info['name'].lower().startswith(file_type.lower()):
                return {
                    'type': sig_type,
                    'name': sig_info['name'],
                    'header': sig_info.get('header', b'').hex(),
                    'has_footer': 'footer' in sig_info,
                    'footer': sig_info.get('footer', b'').hex() if 'footer' in sig_info else None
                }
        return None

    def detect_type_from_bytes(self, data: bytes) -> Optional[str]:
        """
        Detect file type from magic bytes

        Args:
            data: First 64 bytes of file

        Returns:
            Detected type or None
        """
        for sig_type, sig_info in self.signatures.items():
            if data.startswith(sig_info.get('header', b'')):
                return sig_type
        return None
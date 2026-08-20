"""
Rate Limiter - Advanced rate limiting and cost tracking
Tracks API usage and prevents abuse

Security: Includes IP spoofing detection to prevent rate limit bypass
"""

import ipaddress
import os
import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple

# Trusted proxy IPs (configure via environment)
TRUSTED_PROXIES: List[str] = []


def init_trusted_proxies():
    """Initialize trusted proxy list from environment variable"""
    global TRUSTED_PROXIES
    proxies_env = os.getenv("TRUSTED_PROXY_IPS", "")
    if proxies_env:
        TRUSTED_PROXIES.extend([p.strip() for p in proxies_env.split(",") if p.strip()])


def is_trusted_proxy(ip: str) -> bool:
    """Check if IP is in the trusted proxy list"""
    return ip in TRUSTED_PROXIES


def is_valid_ipv4(ip: str) -> bool:
    """Validate IPv4 address format"""
    try:
        ipaddress.IPv4Address(ip)
        return True
    except (ipaddress.AddressValueError, ValueError):
        return False


def is_valid_ipv6(ip: str) -> bool:
    """Validate IPv6 address format"""
    try:
        ipaddress.IPv6Address(ip)
        return True
    except (ipaddress.AddressValueError, ValueError):
        return False


def is_private_ip(ip: str) -> bool:
    """Check if IP is a private/internal IP address"""
    try:
        addr = ipaddress.ip_address(ip)
        return addr.is_private or addr.is_loopback or addr.is_reserved
    except ValueError:
        return False


class IPSpoofingDetector:
    """
    Detects potential IP spoofing attempts to bypass rate limiting.

    Security concerns:
    - X-Forwarded-For can be spoofed by clients
    - Only trust proxy headers from known trusted proxies
    - Detect suspicious patterns (multiple IPs, internal IPs from external)
    """

    # Suspicious patterns
    SUSPICIOUS_PATTERNS = [
        r'^10\.\d+\.\d+\.\d+$',           # 10.x.x.x (private)
        r'^172\.(1[6-9]|2\d|3[01])\.',   # 172.16-31.x.x (private)
        r'^192\.168\.',                     # 192.168.x.x (private)
        r'^127\.',                          # localhost
        r'^0\.',                            # 0.x.x.x
        r'^(::1|fe80:|fc00:|fd00:)',      # IPv6 private/link-local
    ]

    # Maximum number of IPs in X-Forwarded-For header
    MAX_FORWARDED_IPS = 5

    def __init__(self):
        self._suspicious_ips: Dict[str, List[datetime]] = {}
        self._spoof_attempts: List[Dict] = []

    def extract_real_ip(self, request) -> Tuple[str, List[str], bool]:
        """
        Extract the real client IP from request, respecting trusted proxies.

        Returns:
            Tuple of (real_ip, all_ips, is_suspicious)
        """
        is_suspicious = False
        all_ips: List[str] = []

        # Get direct connection IP
        remote_addr = request.client.host if request.client else "unknown"

        # Check X-Forwarded-For header
        forwarded_for = request.headers.get("X-Forwarded-For", "")
        x_real_ip = request.headers.get("X-Real-IP", "")

        # Parse X-Forwarded-For
        if forwarded_for:
            all_ips = [ip.strip() for ip in forwarded_for.split(",")]
            all_ips = [ip for ip in all_ips if ip]  # Remove empty strings

        if x_real_ip:
            all_ips.insert(0, x_real_ip)

        if not all_ips:
            all_ips = [remote_addr]

        # Validate all IPs in chain
        for ip in all_ips:
            if not is_valid_ipv4(ip) and not is_valid_ipv6(ip):
                is_suspicious = True

        # Check if the direct connection is from a trusted proxy
        if is_trusted_proxy(remote_addr) and all_ips:
            # Trust the first IP in the chain (original client)
            real_ip = all_ips[0]
        elif is_trusted_proxy(remote_addr):
            real_ip = remote_addr
        else:
            # Not behind a trusted proxy - use direct connection
            real_ip = remote_addr
            # But also check if client claims to be forwarded
            if all_ips and all_ips[0] != remote_addr:
                is_suspicious = True

        # Validate real IP
        if not is_valid_ipv4(real_ip) and not is_valid_ipv6(real_ip):
            real_ip = remote_addr
            is_suspicious = True

        return real_ip, all_ips, is_suspicious

    def detect_spoofing(self, ip: str, all_ips: List[str], request_headers: dict) -> Optional[str]:
        """
        Detect potential IP spoofing attempts.

        Returns:
            None if no spoofing detected, or description of the issue
        """
        reasons = []

        # Check for private IPs in external requests
        if is_private_ip(ip) and not is_trusted_proxy(ip):
            # Client claiming to be private IP - likely spoofing
            reasons.append(f"Client claims private IP: {ip}")

        # Check for suspicious X-Forwarded-For chain
        if len(all_ips) > self.MAX_FORWARDED_IPS:
            reasons.append(f"Too many IPs in forwarded chain: {len(all_ips)}")

        # Check for loopback in non-local request
        if ip == "127.0.0.1" or ip == "::1":
            if not request_headers.get("Host", "").startswith("127."):
                reasons.append("Loopback IP from non-local request")

        # Check for suspicious patterns in X-Forwarded-For
        forwarded_for = request_headers.get("X-Forwarded-For", "")
        if forwarded_for:
            for pattern in self.SUSPICIOUS_PATTERNS:
                if re.search(pattern, forwarded_for):
                    reasons.append(f"Suspicious pattern in X-Forwarded-For: {forwarded_for[:50]}")

        # Check for repeated spoofing attempts from same IP
        current_time = datetime.now()
        if ip in self._suspicious_ips:
            recent_attempts = [
                t for t in self._suspicious_ips[ip]
                if (current_time - t).total_seconds() < 300  # Last 5 minutes
            ]
            if len(recent_attempts) >= 3:
                reasons.append(f"Multiple spoofing attempts detected ({len(recent_attempts)} in 5 min)")

        if reasons:
            self._suspicious_ips.setdefault(ip, []).append(current_time)
            self._spoof_attempts.append({
                'ip': ip,
                'all_ips': all_ips,
                'reasons': reasons,
                'timestamp': current_time.isoformat()
            })
            return "; ".join(reasons)

        return None

    def get_spoof_attempts(self, limit: int = 100) -> List[Dict]:
        """Get recent spoofing attempts for monitoring"""
        return self._spoof_attempts[-limit:]


# Global instance
spoofing_detector = IPSpoofingDetector()


class RateLimiter:
    """
    Advanced rate limiter with cost tracking and IP spoofing protection

    Tracks:
    - Request counts per IP
    - Cost accumulation per IP
    - Rate limit violations
    - Suspicious activity
    """

    # Cost per request by tier (in USD cents)
    COSTS = {
        'tier1': 0,          # Free - browser processing
        'tier2': 0.1,        # Light cloud processing
        'tier3': 10.0,       # Heavy - Firecracker VMs
        'llm': 2.0,          # LLM API calls
    }

    # Rate limits per IP
    LIMITS = {
        'tier2': {'requests': 30, 'window': 60},      # 30/min
        'tier3': {'requests': 5, 'window': 60},     # 5/min
        'llm': {'requests': 10, 'window': 60},      # 10/min
        'upload': {'requests': 5, 'window': 60},    # 5/min
    }

    # Monthly cost limit per IP
    COST_LIMIT = 10.0  # USD

    def __init__(self):
        # In-memory tracking for demo (use Redis in production)
        self._request_counts: Dict[str, list] = {}
        self._cost_accumulated: Dict[str, Dict[str, float]] = {}

        # Initialize trusted proxies
        init_trusted_proxies()

    async def track_request(self, ip: str, endpoint: str) -> bool:
        """
        Track a request and check if within limits

        Args:
            ip: Client IP address
            endpoint: API endpoint called

        Returns:
            True if request allowed, False if rate limited
        """
        now = time.time()

        # Initialize tracking for IP
        if ip not in self._request_counts:
            self._request_counts[ip] = []
        if ip not in self._cost_accumulated:
            self._cost_accumulated[ip] = {}

        # Determine endpoint category
        if 'llm' in endpoint or 'analyze' in endpoint:
            category = 'llm'
        elif 'tier3' in endpoint or 'firecracker' in endpoint:
            category = 'tier3'
        elif 'upload' in endpoint:
            category = 'upload'
        else:
            category = 'tier2'

        # Get limit for category
        limit = self.LIMITS.get(category, self.LIMITS['tier2'])
        window_start = now - limit['window']

        # Clean old requests
        self._request_counts[ip] = [
            t for t in self._request_counts[ip]
            if t > window_start
        ]

        # Check rate limit
        if len(self._request_counts[ip]) >= limit['requests']:
            return False

        # Record request
        self._request_counts[ip].append(now)
        return True

    async def track_cost(self, redis_client, ip: str, tier: str) -> None:
        """
        Track cost for a request

        Args:
            redis_client: Redis client (optional)
            ip: Client IP address
            tier: Processing tier used
        """
        cost = self.COSTS.get(tier, 0)
        if cost == 0:
            return

        if redis_client:
            # Store in Redis for persistence
            month_key = datetime.utcnow().strftime("%Y%m")
            cost_key = f"cost:{ip}:{month_key}"

            try:
                current = await redis_client.get(cost_key) or 0
                await redis_client.set(cost_key, float(current) + cost, ex=2592000)

                # Check if over limit
                if float(current) + cost > self.COST_LIMIT:
                    print(f"🚨 Cost Alert: IP {ip} approaching limit (${float(current) + cost:.2f})")
            except Exception:
                pass
        else:
            # In-memory tracking for demo
            if ip not in self._cost_accumulated:
                self._cost_accumulated[ip] = {}

            month_key = datetime.utcnow().strftime("%Y%m")
            if month_key not in self._cost_accumulated[ip]:
                self._cost_accumulated[ip][month_key] = 0

            self._cost_accumulated[ip][month_key] += cost

    async def get_cost(self, redis_client, ip: str) -> Dict[str, float]:
        """
        Get accumulated cost for an IP

        Args:
            redis_client: Redis client (optional)
            ip: Client IP address

        Returns:
            Cost information
        """
        month_key = datetime.utcnow().strftime("%Y%m")

        if redis_client:
            try:
                cost_key = f"cost:{ip}:{month_key}"
                total = float(await redis_client.get(cost_key) or 0)

                return {
                    'total': total,
                    'limit': self.COST_LIMIT,
                    'remaining': max(0, self.COST_LIMIT - total),
                    'percentage': round(total / self.COST_LIMIT * 100, 2)
                }
            except Exception:
                pass

        # Fallback to in-memory
        if ip in self._cost_accumulated:
            total = self._cost_accumulated[ip].get(month_key, 0)
            return {
                'total': total,
                'limit': self.COST_LIMIT,
                'remaining': max(0, self.COST_LIMIT - total),
                'percentage': round(total / self.COST_LIMIT * 100, 2)
            }

        return {
            'total': 0,
            'limit': self.COST_LIMIT,
            'remaining': self.COST_LIMIT,
            'percentage': 0
        }

    async def get_rate_limit_status(self, ip: str, endpoint: str) -> Dict:
        """
        Get current rate limit status for an IP

        Args:
            ip: Client IP address
            endpoint: API endpoint

        Returns:
            Rate limit status
        """
        now = time.time()

        # Determine category
        if 'llm' in endpoint:
            category = 'llm'
        elif 'tier3' in endpoint:
            category = 'tier3'
        elif 'upload' in endpoint:
            category = 'upload'
        else:
            category = 'tier2'

        limit = self.LIMITS.get(category, self.LIMITS['tier2'])
        window_start = now - limit['window']

        requests = [
            t for t in self._request_counts.get(ip, [])
            if t > window_start
        ]

        remaining = max(0, limit['requests'] - len(requests))
        reset_time = int(window_start + limit['window'])

        return {
            'limit': limit['requests'],
            'remaining': remaining,
            'reset': reset_time,
            'reset_in': max(0, int(reset_time - now)),
            'window_seconds': limit['window']
        }

    def get_costs(self) -> Dict[str, float]:
        """Get cost rates for all tiers"""
        return self.COSTS.copy()

    def get_limits(self) -> Dict[str, Dict]:
        """Get rate limits for all categories"""
        return self.LIMITS.copy()
"""
LLM Cache - Smart caching for AI code explanations
Prevents redundant API calls and controls costs
"""

import hashlib
import json
from typing import Optional

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

class LLMCache:
    """Cache LLM responses to reduce API costs"""

    def __init__(self, redis_client, api_key: str, ttl_seconds: int = 2592000):
        """
        Initialize LLM cache with Redis backend

        Args:
            redis_client: Async Redis client
            api_key: OpenAI API key
            ttl_seconds: Cache TTL (default: 30 days)
        """
        self.redis = redis_client
        self.ttl = ttl_seconds
        self.enabled = OPENAI_AVAILABLE

        if self.enabled:
            self.client = AsyncOpenAI(api_key=api_key)

    def _hash_content(self, content: str) -> str:
        """Generate cache key hash"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    async def get_code_explanation(self, code_string: str, max_length: int = 3000) -> str:
        """
        Get code explanation with caching

        Args:
            code_string: The code to explain
            max_length: Maximum code length to send to LLM

        Returns:
            AI-generated explanation
        """
        if not self.enabled:
            return "LLM not available - configure OpenAI API key"

        # Truncate if too long
        code = code_string[:max_length]
        cache_key = f"voila:llm:explain:{self._hash_content(code)}"

        # Check cache
        try:
            cached = await self.redis.get(cache_key)
            if cached:
                await self.redis.incr('voila:llm:cache:hits')
                return json.loads(cached)["explanation"]
        except Exception:
            pass  # Continue without cache

        # Cache miss - call LLM
        await self.redis.incr('voila:llm:cache:misses')

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are Voila, an AI assistant embedded in a universal file handler.
Explain code briefly and clearly. Focus on:
- What the code does (1 sentence)
- Key functions and their purposes
- Any potential issues or security concerns
Keep it concise - max 3 sentences for simple code, 5 for complex."""
                    },
                    {
                        "role": "user",
                        "content": f"Explain this {self._detect_language(code_string)} code:\n\n{code}"
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )

            explanation = response.choices[0].message.content

            # Cache the result
            try:
                await self.redis.setex(
                    cache_key,
                    self.ttl,
                    json.dumps({"explanation": explanation})
                )
            except Exception:
                pass  # Cache failure is non-fatal

            return explanation

        except Exception as e:
            return f"Error calling LLM: {str(e)[:100]}"

    def _detect_language(self, code: str) -> str:
        """Simple language detection based on code patterns"""
        code_lower = code.lower()

        if 'import torch' in code_lower or 'import tensorflow' in code_lower:
            return 'Python (ML)'
        elif 'def ' in code and ':' in code and 'self' in code:
            return 'Python'
        elif 'function' in code_lower or 'const ' in code or 'let ' in code:
            return 'JavaScript'
        elif 'fn ' in code and '->' in code:
            return 'Rust'
        elif 'func ' in code and '{' in code:
            return 'Go'
        elif 'public class' in code or 'private void' in code:
            return 'Java'
        elif '#include' in code:
            return 'C/C++'
        elif 'SELECT' in code.upper() and 'FROM' in code.upper():
            return 'SQL'
        else:
            return 'code'

    async def get_file_description(self, file_content: str, file_type: str) -> str:
        """
        Get AI description of a file's purpose

        Args:
            file_content: File contents
            file_type: MIME type or extension

        Returns:
            AI-generated description
        """
        if not self.enabled:
            return f"{file_type} file"

        cache_key = f"voila:llm:desc:{self._hash_content(file_content[:1000])}"

        # Check cache
        try:
            cached = await self.redis.get(cache_key)
            if cached:
                return json.loads(cached)["description"]
        except Exception:
            pass

        # Call LLM
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are Voila. Describe what this file is in one sentence. Be specific about its purpose and type."
                    },
                    {
                        "role": "user",
                        "content": f"File type: {file_type}\n\n{file_content[:1500]}"
                    }
                ],
                max_tokens=50
            )

            description = response.choices[0].message.content

            # Cache
            try:
                await self.redis.setex(cache_key, self.ttl, json.dumps({"description": description}))
            except Exception:
                pass

            return description

        except Exception as e:
            return f"{file_type} file"

    async def analyze_security(self, code: str) -> dict:
        """
        Analyze code for security concerns

        Args:
            code: Source code

        Returns:
            Security analysis results
        """
        if not self.enabled:
            return {"status": "unavailable", "reason": "LLM not configured"}

        cache_key = f"voila:llm:security:{self._hash_content(code[:2000])}"

        # Check cache
        try:
            cached = await self.redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

        # Call LLM
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are Voila Security Analyzer. Analyze this code for security issues.
Respond ONLY with valid JSON:
{
  "risk_level": "low|medium|high",
  "issues": ["issue1", "issue2"],
  "recommendations": ["fix1", "fix2"]
}"""
                    },
                    {
                        "role": "user",
                        "content": code[:2000]
                    }
                ],
                max_tokens=200,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            # Cache
            try:
                await self.redis.setex(cache_key, self.ttl, json.dumps(result))
            except Exception:
                pass

            return result

        except Exception as e:
            return {"status": "error", "error": str(e)[:100]}

    async def get_cache_stats(self) -> dict:
        """Get cache performance statistics"""
        try:
            hits = await self.redis.get('voila:llm:cache:hits') or 0
            misses = await self.redis.get('voila:llm:cache:misses') or 0
            total = int(hits) + int(misses)

            return {
                "hits": int(hits),
                "misses": int(misses),
                "total": total,
                "hit_rate": round(int(hits) / max(1, total) * 100, 2),
                "savings_percent": round((int(misses) * 0.02 - int(hits) * 0.001) / max(0.001, int(misses) * 0.02) * 100, 2)
            }
        except Exception as e:
            return {"error": str(e)}
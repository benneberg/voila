FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Security: Ensure .env.example exists for reference
# Production should set CORS_ALLOWED_ORIGINS via environment
RUN if [ ! -f .env.example ]; then \
    echo '# Production: Set CORS_ALLOWED_ORIGINS environment variable' > .env.example; \
    fi

# Create non-root user for security
RUN useradd -m -u 1000 voila && chown -R voila:voila /app
USER voila

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
# Note: In production, set CORS_ALLOWED_ORIGINS env var
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
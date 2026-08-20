#!/bin/bash
# Redis TLS Certificate Setup Script
# Usage: ./docker/redis-tls-setup.sh

set -e

CERT_DIR="$(dirname "$0")/certs"
mkdir -p "$CERT_DIR"

echo "Generating Redis TLS certificates..."

# Generate CA key and certificate
openssl genrsa -out "$CERT_DIR/ca.key" 4096
openssl req -x509 -new -nodes -key "$CERT_DIR/ca.key" -sha256 -days 3650 \
    -out "$CERT_DIR/ca.crt" \
    -subj "/C=US/ST=State/L=City/O=Voila/CN=Voila-CA"

# Generate Redis server key
openssl genrsa -out "$CERT_DIR/redis.key" 2048

# Generate Redis server certificate
openssl req -new -key "$CERT_DIR/redis.key" \
    -out "$CERT_DIR/redis.csr" \
    -subj "/C=US/ST=State/L=City/O=Voila/CN=redis"

# Sign the certificate with CA
openssl x509 -req -in "$CERT_DIR/redis.csr" -CA "$CERT_DIR/ca.crt" \
    -CAkey "$CERT_DIR/ca.key" -CAcreateserial \
    -out "$CERT_DIR/redis.crt" -days 365 -sha256

# Set permissions
chmod 600 "$CERT_DIR"/*.key
chmod 644 "$CERT_DIR"/*.crt

# Cleanup CSR
rm -f "$CERT_DIR/redis.csr"

echo "Certificates generated in $CERT_DIR:"
ls -la "$CERT_DIR"

echo ""
echo "To enable TLS, use:"
echo "  docker-compose -f docker-compose.yml -f docker-compose.tls.yml up"

#!/bin/bash

# Stop Demo Script for SolrLens
# This script stops all demo services and cleans up

set -e

echo "🛑 Stopping SolrLens Demo Environment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Stop all services
print_status "Stopping SolrLens Application..."
docker compose -f docker-compose-app.yml down

print_status "Stopping Datacenter 1 (London)..."
docker compose -f docker-compose-dc1.yml down

print_status "Stopping Datacenter 2 (Virginia)..."
docker compose -f docker-compose-dc2.yml down

# Optional: Remove volumes (uncomment if you want to clear all data)
# print_status "Removing volumes..."
# docker compose -f docker-compose-dc1.yml down -v
# docker compose -f docker-compose-dc2.yml down -v

print_success "All services stopped!"

echo ""
echo "🎯 Demo Environment Stopped"
echo "=========================="
echo ""
echo "💡 To restart: ./start-demo.sh"
echo "🧹 To remove all data: docker compose -f docker-compose-dc1.yml down -v && docker compose -f docker-compose-dc2.yml down -v"
echo ""

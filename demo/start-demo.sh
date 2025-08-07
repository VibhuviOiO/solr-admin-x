#!/bin/bash

# Demo Setup Script for Solr Admin X
# This script sets up the complete demo environment

set -e

echo "🚀 Setting up Solr Admin X Demo Environment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running ✅"

# Create networks if they don't exist
print_status "Creating Docker networks..."
docker network create solr_dc1_net 2>/dev/null || print_warning "Network solr_dc1_net already exists"
docker network create solr_dc2_net 2>/dev/null || print_warning "Network solr_dc2_net already exists"
print_success "Networks created/verified"

# Function to start a compose service
start_service() {
    local service_name="$1"
    local compose_file="$2"
    
    print_status "Starting $service_name..."
    docker compose -f "$compose_file" up -d
    
    # Wait for services to be healthy
    print_status "Waiting for $service_name to be healthy..."
    local max_wait=120
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        if docker compose -f "$compose_file" ps --services --filter "status=running" | wc -l | grep -q "$(docker compose -f "$compose_file" ps --services | wc -l)"; then
            print_success "$service_name is running"
            break
        fi
        
        sleep 5
        wait_time=$((wait_time + 5))
        echo -n "."
    done
    
    if [ $wait_time -ge $max_wait ]; then
        print_warning "$service_name may not be fully healthy yet, but continuing..."
    fi
}

# Start Datacenter 1
start_service "Datacenter 1 (London)" "docker-compose-dc1.yml"

# Start Datacenter 2  
start_service "Datacenter 2 (Virginia)" "docker-compose-dc2.yml"

# Wait a bit for all services to stabilize
print_status "Waiting for all services to stabilize..."
sleep 10

# Start the Solr Admin X application
print_status "Starting Solr Admin X Application..."
docker compose -f docker-compose-app.yml up -d
sleep 5

print_success "Demo environment is ready!"

echo ""
echo "🎉 Solr Admin X Demo Environment Setup Complete!"
echo "=============================================="
echo ""
echo "📊 Access Points:"
echo "  • Solr Admin X: http://localhost:3001"
echo ""
echo "🏢 Datacenter 1 (London):"
echo "  • Solr Node 1: http://localhost:8983"
echo "  • Solr Node 2: http://localhost:8982"
echo "  • ZooKeeper 1: localhost:2181"
echo "  • ZooKeeper 2: localhost:2182"
echo "  • ZooKeeper 3: localhost:2183"
echo ""
echo "🏢 Datacenter 2 (Virginia):"
echo "  • Solr Node 1: http://localhost:8883"
echo "  • Solr Node 2: http://localhost:8882"
echo "  • ZooKeeper 1: localhost:5181"
echo "  • ZooKeeper 2: localhost:4182"
echo "  • ZooKeeper 3: localhost:5183"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: ./logs.sh"
echo "  • Stop demo: ./stop-demo.sh"
echo "  • Restart: ./restart-demo.sh"
echo ""
echo "💡 Next Steps:"
echo "  1. Open http://localhost:3001 in your browser"
echo "  2. Explore the multi-datacenter setup"
echo "  3. Try switching between London and Virginia datacenters"
echo ""

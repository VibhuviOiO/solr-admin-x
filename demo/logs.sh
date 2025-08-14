#!/bin/bash

# Logs Script for UniSolr Demo
# Shows logs from all services

echo "📋 UniSolr Demo Logs"
echo "========================"
echo ""

# Function to show logs for a service
show_logs() {
    local service_name="$1"
    local compose_file="$2"
    
    echo "--- $service_name Logs ---"
    docker compose -f "$compose_file" logs --tail=20 || echo "No logs available for $service_name"
    echo ""
}

# Show logs for all services
show_logs "UniSolr Application" "docker-compose-app.yml"
show_logs "Datacenter 1 (London)" "docker-compose-dc1.yml"
show_logs "Datacenter 2 (Virginia)" "docker-compose-dc2.yml"

echo "💡 For real-time logs, use: docker compose -f <compose-file> logs -f"

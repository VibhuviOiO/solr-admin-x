#!/bin/bash

# Restart Demo Script for Solr Admin X
# This script restarts the entire demo environment

echo "🔄 Restarting Solr Admin X Demo Environment"
echo "=========================================="

./stop-demo.sh
echo ""
echo "⏳ Waiting 5 seconds before restart..."
sleep 5
echo ""
./start-demo.sh

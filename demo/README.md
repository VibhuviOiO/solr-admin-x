# 🧪 SolrLens Demo Environment

This folder contains a complete multi-datacenter SolrCloud demo setup for testing SolrLens.

## 🎯 What's Included

- **2 Complete SolrCloud Datacenters**: Singapore & Tokyo
- **10 Services Total**: 4 Solr nodes + 6 ZooKeeper nodes
- **SolrLens Application**: Pre-configured Docker container
- **Automated Setup**: One-command deployment

## 🚀 Quick Start

### 1. Start the Demo
```bash
cd demo
chmod +x *.sh
./start-demo.sh
```

### 2. Access the Application
- **SolrLens**: http://localhost:3001
- **Solr DC1**: http://localhost:8983, http://localhost:8982
- **Solr DC2**: http://localhost:8883, http://localhost:8882

### 3. Stop the Demo
```bash
./stop-demo.sh
```

## 🏗️ Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│   Datacenter 1      │    │   Datacenter 2      │
│   (Singapore)       │    │   (Tokyo)           │
├─────────────────────┤    ├─────────────────────┤
│ Solr 1  :8983       │    │ Solr 1  :8883       │
│ Solr 2  :8982       │    │ Solr 2  :8882       │
│ ZK 1    :2181       │    │ ZK 1    :5181       │
│ ZK 2    :2182       │    │ ZK 2    :4182       │
│ ZK 3    :2183       │    │ ZK 3    :5183       │
└─────────────────────┘    └─────────────────────┘
           │                           │
           └─────────┬─────────────────┘
                     │
              ┌─────────────┐
              │ SolrLens│
              │   :3001     │
              └─────────────┘
```

## 📁 Files Overview

| File | Description |
|------|-------------|
| `docker-compose-dc1.yml` | Singapore datacenter (Solr + ZK cluster) |
| `docker-compose-dc2.yml` | Tokyo datacenter (Solr + ZK cluster) |
| `docker-compose-app.yml` | SolrLens application |
| `demo-config/` | Configuration files for demo |
| `start-demo.sh` | 🚀 Start entire demo environment |
| `stop-demo.sh` | 🛑 Stop all services |
| `restart-demo.sh` | 🔄 Restart demo |
| `logs.sh` | 📋 View logs from all services |

## 🔧 Management Commands

```bash
# Start demo (automated setup)
./start-demo.sh

# Stop demo
./stop-demo.sh

# Restart demo
./restart-demo.sh

# View logs
./logs.sh

# Follow live logs
docker compose -f docker-compose-app.yml logs -f

# Check service status
docker compose -f docker-compose-dc1.yml ps
docker compose -f docker-compose-dc2.yml ps
```

## 🌐 Access Points

### SolrLens Application
- **Main Interface**: http://localhost:3001

### Datacenter 1 (Singapore)
- **Solr Node 1**: http://localhost:8983/solr
- **Solr Node 2**: http://localhost:8982/solr
- **ZooKeeper**: localhost:2181, localhost:2182, localhost:2183
- **ZK Metrics**: localhost:7001, localhost:7002, localhost:7003

### Datacenter 2 (Tokyo)
- **Solr Node 1**: http://localhost:8883/solr
- **Solr Node 2**: http://localhost:8882/solr
- **ZooKeeper**: localhost:5181, localhost:4182, localhost:5183
- **ZK Metrics**: localhost:5001, localhost:5002, localhost:5003

## 🧪 Testing Scenarios

1. **Multi-DC Navigation**: Switch between Singapore and Tokyo datacenters
2. **Node Health**: Stop/start individual Solr nodes to test failover
3. **ZooKeeper Status**: Monitor ZK ensemble health across datacenters
4. **Configuration Changes**: Modify `demo-config/dc-data.demo.json` and restart

## 🐳 Docker Configuration

### Networks
- `solr_dc1_net`: Isolated network for Singapore datacenter
- `solr_dc2_net`: Isolated network for Tokyo datacenter
- Application connects to both networks

### Volumes
- Persistent data storage for each Solr node
- ZooKeeper data persistence
- Configuration mounted read-only

### Resource Limits
- **CPU**: 0.5 cores per Solr node
- **Memory**: 1GB per Solr node
- **Heap**: 512MB per Solr instance

## 🔍 Troubleshooting

### Services won't start
```bash
# Check Docker networks
docker network ls | grep solr

# Create networks manually if needed
docker network create solr_dc1_net
docker network create solr_dc2_net
```

### Port conflicts
```bash
# Check what's using ports
lsof -i :3001
lsof -i :8983

# Stop conflicting services
docker ps
docker stop <container_id>
```

### Application can't connect to Solr
```bash
# Verify Solr is healthy
curl http://localhost:8983/solr/admin/info/system
curl http://localhost:8883/solr/admin/info/system

# Check application logs
docker compose -f docker-compose-app.yml logs
```

### Reset everything
```bash
# Complete cleanup (removes all data)
./stop-demo.sh
docker compose -f docker-compose-dc1.yml down -v
docker compose -f docker-compose-dc2.yml down -v
./start-demo.sh
```

## 📝 Configuration

The demo uses configuration files that are **separate from the main application**:

1. **`demo-config/dc-data.demo.json`**: For containerized app (uses container names)
2. **`demo-config/dc-data.localhost.json`**: For local development (uses localhost)

**Note**: The main application no longer includes a `config/` folder. You must create your own configuration files and set `DC_CONFIG_PATH` - see the main README for details.

Switch configs by updating the `DC_CONFIG_PATH` in `docker-compose-app.yml`.

## 🎛️ Advanced Usage

### Custom Configuration
```bash
# Edit the demo config
vim demo-config/dc-data.demo.json

# Restart just the app
docker compose -f docker-compose-app.yml restart
```

### Development Mode
```bash
# Use local config for local development
DC_CONFIG_PATH=../demo/demo-config/dc-data.localhost.json npm run start
```

### Production Testing
```bash
# Test production Docker image
docker run -p 3001:3001 \
  -v $(pwd)/demo-config:/app/config:ro \
  -e DC_CONFIG_PATH=/app/config/dc-data.demo.json \
  ghcr.io/vibhuvioio/SolrLens:latest
```

## 🚨 Important Notes

- **Data Persistence**: Solr data is preserved between restarts
- **Port Usage**: Uses ports 2181-2183, 3001, 4182, 5001-5003, 5181-5183, 6888-6890, 7001-7003, 8882-8883, 8982-8983
- **Resource Usage**: ~2GB RAM total when all services running
- **Network Requirements**: Creates external Docker networks

---

**🎉 Happy Testing!** 

This demo environment provides a complete multi-datacenter SolrCloud setup for thoroughly testing SolrLens functionality.

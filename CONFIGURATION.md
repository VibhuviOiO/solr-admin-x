# 🔧 Configuration Management Guide

This guide explains how to configure Solr Admin X with external datacenter configuration. **Configuration files are not included in the repository** - you must create them yourself.

## 🎯 Configuration Philosophy

Solr Admin X follows the **externalized configuration** pattern:
- ✅ **No config files in the codebase**
- ✅ **DC_CONFIG_PATH environment variable required**
- ✅ **Create configurations outside the repository**
- ✅ **Full control over your datacenter setup**

## 📋 Required Setup

**Before running Solr Admin X, you MUST:**

1. **Create a configuration file** (see format below)
2. **Set DC_CONFIG_PATH** to point to your file
3. **Mount the config file** in Docker containers

## 📄 Configuration File Format

Create a JSON file with your Solr datacenters:

```json
{
  "datacenters": [
    {
      "name": "Your Datacenter Name",
      "default": true,
      "zookeeperNodes": [
        { "host": "your-zk-host", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr1", "host": "your-solr-host", "port": 8983 }
      ]
    }
  ]
}
```

## 🚀 Quick Configuration Setup

### Step 1: Create Config Directory
```bash
# Create config directory (anywhere you want)
mkdir -p /path/to/your/solr-configs
```

### Step 2: Create Configuration File
```bash
# Create your datacenter config
cat > /path/to/your/solr-configs/datacenters.json << 'EOF'
{
  "datacenters": [
    {
      "name": "Production DC",
      "default": true,
      "zookeeperNodes": [
        { "host": "zk1.prod.example.com", "port": 2181 },
        { "host": "zk2.prod.example.com", "port": 2181 },
        { "host": "zk3.prod.example.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr1", "host": "solr1.prod.example.com", "port": 8983 },
        { "name": "solr2", "host": "solr2.prod.example.com", "port": 8983 }
      ]
    }
  ]
}
EOF
```

### Step 3: Set Environment Variable
```bash
export DC_CONFIG_PATH=/path/to/your/solr-configs/datacenters.json
```

## 🐳 Docker Configuration Methods

### Method 1: External JSON File (Recommended)

**Docker Run:**
```bash
docker run -d \
  --name solr-admin-x \
  -p 3000:3000 \
  -v $(pwd)/config:/app/config:ro \
  -e DC_CONFIG_PATH=/app/config/dc-data.json \
  ghcr.io/vibhuvioio/solr-admin-x:latest
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  solr-admin-x:
    image: ghcr.io/vibhuvioio/solr-admin-x:latest
    ports:
      - "3000:3000"
    volumes:
      - ./config:/app/config:ro
    environment:
      - DC_CONFIG_PATH=/app/config/dc-data.json
```

### Method 2: Environment Variable JSON

Pass configuration as a JSON string:

```bash
export DC_CONFIG_JSON='{
  "datacenters": [
    {
      "name": "Production",
      "default": true,
      "zookeeperNodes": [
        {"host": "zk1.prod.com", "port": 2181},
        {"host": "zk2.prod.com", "port": 2181}
      ],
      "nodes": [
        {"name": "solr1", "host": "solr1.prod.com", "port": 8983},
        {"name": "solr2", "host": "solr2.prod.com", "port": 8983}
      ]
    }
  ]
}'

docker run -d \
  --name solr-admin-x \
  -p 3000:3000 \
  -e DC_CONFIG_JSON="$DC_CONFIG_JSON" \
  ghcr.io/vibhuvioio/solr-admin-x:latest
```

### Method 3: Kubernetes ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: solr-admin-config
data:
  dc-data.json: |
    {
      "datacenters": [
        {
          "name": "Kubernetes Cluster",
          "default": true,
          "zookeeperNodes": [
            {"host": "zookeeper-service.default.svc.cluster.local", "port": 2181}
          ],
          "nodes": [
            {"name": "solr-0", "host": "solr-0.solr-service.default.svc.cluster.local", "port": 8983},
            {"name": "solr-1", "host": "solr-1.solr-service.default.svc.cluster.local", "port": 8983}
          ]
        }
      ]
    }
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: solr-admin-x
spec:
  replicas: 1
  selector:
    matchLabels:
      app: solr-admin-x
  template:
    metadata:
      labels:
        app: solr-admin-x
    spec:
      containers:
      - name: solr-admin-x
        image: ghcr.io/vibhuvioio/solr-admin-x:latest
        ports:
        - containerPort: 3000
        env:
        - name: DC_CONFIG_PATH
          value: /app/config/dc-data.json
        volumeMounts:
        - name: config-volume
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: config-volume
        configMap:
          name: solr-admin-config
```

## 📋 Configuration Schema

```typescript
interface DatacenterConfig {
  datacenters: Datacenter[];
}

interface Datacenter {
  name: string;           // Display name for the datacenter
  default?: boolean;      // Mark as default datacenter (optional)
  zookeeperNodes: ZKNode[];
  nodes: SolrNode[];
}

interface ZKNode {
  host: string;          // ZooKeeper hostname/IP
  port: number;          // ZooKeeper port (usually 2181)
}

interface SolrNode {
  name: string;          // Display name for the Solr node
  host: string;          // Solr hostname/IP
  port: number;          // Solr port (usually 8983)
}
```

## 🌍 Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `DC_CONFIG_PATH` | Path to JSON config file | `/app/config/dc-data.json` | `/custom/path/config.json` |
| `DC_CONFIG_JSON` | JSON string with configuration | - | `'{"datacenters":[...]}'` |
| `NODE_ENV` | Application environment | `production` | `development` |

## 📁 Configuration Examples

### Single Datacenter
```json
{
  "datacenters": [
    {
      "name": "Main Cluster",
      "default": true,
      "zookeeperNodes": [
        { "host": "zk1.company.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr-main", "host": "solr.company.com", "port": 8983 }
      ]
    }
  ]
}
```

### Multi-Datacenter Setup
```json
{
  "datacenters": [
    {
      "name": "US East",
      "default": true,
      "zookeeperNodes": [
        { "host": "us-east-zk1.company.com", "port": 2181 },
        { "host": "us-east-zk2.company.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr-east-1", "host": "solr1.us-east.company.com", "port": 8983 },
        { "name": "solr-east-2", "host": "solr2.us-east.company.com", "port": 8983 }
      ]
    },
    {
      "name": "US West",
      "zookeeperNodes": [
        { "host": "us-west-zk1.company.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr-west-1", "host": "solr1.us-west.company.com", "port": 8983 }
      ]
    }
  ]
}
```

### Development Environment
```json
{
  "datacenters": [
    {
      "name": "Local Development",
      "default": true,
      "zookeeperNodes": [
        { "host": "localhost", "port": 2181 }
      ],
      "nodes": [
        { "name": "dev-solr", "host": "localhost", "port": 8983 }
      ]
    }
  ]
}
```

## 🔒 Security Best Practices

### File Permissions
```bash
# Set proper permissions for config files
chmod 644 config/dc-data.json
chown root:root config/dc-data.json
```

### Docker Security
```bash
# Mount config as read-only
-v $(pwd)/config:/app/config:ro

# Use non-root user (add to Dockerfile)
USER node
```

### Secrets Management
```bash
# For sensitive configurations, use Docker secrets
docker secret create solr-config config/dc-data.json

# In docker-compose.yml
services:
  solr-admin-x:
    secrets:
      - solr-config
    environment:
      - DC_CONFIG_PATH=/run/secrets/solr-config

secrets:
  solr-config:
    external: true
```

## 🚀 Deployment Patterns

### Development
```bash
# Use local configuration
docker run -d \
  --name solr-admin-dev \
  -p 3000:3000 \
  -v $(pwd)/config/dc-data.json:/app/config/dc-data.json:ro \
  ghcr.io/vibhuvioio/solr-admin-x:latest
```

### Staging
```bash
# Use staging configuration
docker run -d \
  --name solr-admin-staging \
  -p 3000:3000 \
  -v /opt/solr-admin/staging-config.json:/app/config/dc-data.json:ro \
  ghcr.io/vibhuvioio/solr-admin-x:latest
```

### Production
```bash
# Use production configuration with health checks
docker run -d \
  --name solr-admin-prod \
  -p 3000:3000 \
  -v /opt/solr-admin/prod-config.json:/app/config/dc-data.json:ro \
  --health-cmd="wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  --restart=unless-stopped \
  ghcr.io/vibhuvioio/solr-admin-x:latest
```

## 🔧 Troubleshooting

### Configuration Loading Issues
```bash
# Check if config file is accessible
docker exec solr-admin-x cat /app/config/dc-data.json

# Check environment variables
docker exec solr-admin-x env | grep DC_CONFIG

# View application logs
docker logs solr-admin-x
```

### Common Issues

1. **File Not Found**
   - Verify the mount path: `-v $(pwd)/config:/app/config:ro`
   - Check file permissions: `ls -la config/`

2. **Invalid JSON**
   - Validate JSON: `cat config/dc-data.json | jq .`
   - Check for syntax errors

3. **Network Connectivity**
   - Test Solr connectivity: `curl http://solr-host:8983/solr/admin/info/system`
   - Test ZooKeeper: `echo ruok | nc zk-host 2181`

## 📝 Configuration Management Tips

### Version Control
```bash
# Keep configurations in separate repo
git clone https://github.com/company/solr-admin-configs.git config/

# Or use git submodules
git submodule add https://github.com/company/solr-configs.git config
```

### Configuration Validation
```bash
# Create a validation script
#!/bin/bash
echo "Validating Solr Admin configuration..."
cat config/dc-data.json | jq . > /dev/null && echo "✅ Valid JSON" || echo "❌ Invalid JSON"

# Test connectivity to all nodes
jq -r '.datacenters[].nodes[].host' config/dc-data.json | while read host; do
  if curl -s -f "http://$host:8983/solr/admin/info/system" > /dev/null; then
    echo "✅ $host is accessible"
  else
    echo "❌ $host is not accessible"
  fi
done
```

---

**🎯 Quick Setup for Production:**

1. Create your configuration: `cp config/dc-data.production.json config/dc-data.json`
2. Edit with your actual hosts: `vim config/dc-data.json`
3. Validate: `cat config/dc-data.json | jq .`
4. Deploy: `docker run -v $(pwd)/config:/app/config:ro ghcr.io/vibhuvioio/solr-admin-x:latest`

Your Solr Admin X is now completely configurable without code changes! 🚀

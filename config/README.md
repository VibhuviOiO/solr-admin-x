# 📁 Configuration Files

This directory contains environment-specific configuration files for Solr Admin X.

## 📋 Available Configurations

| File | Environment | Description |
|------|-------------|-------------|
| `dc-data.json` | Local/Default | Basic local development setup |
| `dc-data.dev.json` | Development | Full development environment with multiple DCs |
| `dc-data.staging.json` | Staging | Staging environment configuration |
| `dc-data.production.json` | Production | Production environment example |

## 🚀 Usage

### Development
```bash
# Uses dc-data.dev.json automatically
npm run dev
```

### Staging
```bash
# Uses dc-data.staging.json automatically
npm run staging
```

### Production
```bash
# Uses dc-data.production.json automatically
npm run prod
```

### Custom Configuration
```bash
# Use any configuration file
docker run -v $(pwd)/config:/app/config:ro \
  -e DC_CONFIG_PATH=/app/config/your-custom-config.json \
  ghcr.io/vibhuvioio/solr-admin-x:latest
```

## ✅ Validation

Validate all configuration files:
```bash
npm run config:validate
```

## 🔧 File Structure

```json
{
  "datacenters": [
    {
      "name": "Datacenter Name",
      "default": true,  // Optional: mark as default
      "zookeeperNodes": [
        { "host": "zk-hostname", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr-node-name", "host": "solr-hostname", "port": 8983 }
      ]
    }
  ]
}
```

## 🔒 Security Notes

- Never commit sensitive hostnames or credentials
- Use `.env` files for secrets if needed
- Mount config files as read-only in production
- Validate configurations before deployment

## 📝 Adding New Environments

1. Copy an existing config: `cp dc-data.dev.json dc-data.mynew.json`
2. Edit the configuration: `vim dc-data.mynew.json`
3. Validate: `cat dc-data.mynew.json | jq .`
4. Use: `DC_CONFIG_PATH=/app/config/dc-data.mynew.json`

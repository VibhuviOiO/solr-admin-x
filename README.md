# SolrLens

A modern web application for managing Apache Solr clusters with real-time monitoring and administration capabilities.

[![Build Status](https://github.com/YOUR_ORG/SolrLens/workflows/Build%20and%20Push%20Docker%20Image/badge.svg)](https://github.com/YOUR_ORG/SolrLens/actions)
[![Docker Image](https://img.shields.io/badge/docker-gcr.io-blue)](https://gcr.io/YOUR_PROJECT_ID/SolrLens)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)

## 🌟 **Open Source Project**

SolrLens is an **open source project** welcoming contributions from the community! Whether you're a seasoned developer or just starting out, there are many ways to contribute.

### 🤝 **How to Contribute**
- 🐛 **Report bugs** and request features
- 💻 **Contribute code** improvements
- 📚 **Improve documentation**
- 🎨 **Enhance UI/UX**
- 🧪 **Add tests** and improve coverage

👉 **Read our [Contributing Guide](CONTRIBUTING.md)** to get started!

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions with Google Container Registry

## 🚀 Quick Start
docker pull ghcr.io/vibhuvioio/SolrLens:latest
docker run -p 3000:3000 ghcr.io/vibhuvioio/SolrLens:latest
docker run -p 3000:3000 ghcr.io/vibhuvioio/SolrLens:latest
git clone <repository-url>
cd SolrLens

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

---

## 🏗️ Development (Local)

1. **Clone the repository:**
  ```bash
  git clone <repository-url>
  cd SolrLens
  ```

3. **Set up environment variables:**
  - Create `.env` files in both `backend/` and `fronend/` directories (see Environment Variables section below).

4. **Start backend:**
  ```bash
  cd backend
  npm i
  npm run build 
  DC_CONFIG_PATH="../demo/demo-config/dc-data.localhost.json" npm run start
  ```
> To get the real data run the demo solr

5. **Start frontend (in a new terminal):**
  ```bash
  cd fronend
  npm i
  npm run dev
  ```

6. **Access the app:**
  - Frontend: http://localhost:3000
  - Backend API: http://localhost:3001

---

## 🚢 Production Deployment (Docker)

1. **Build and run with Docker Compose:**
  ```bash
  docker-compose -f docker-compose.prod.yml up --build
  ```
  - The app will be available at: http://localhost:3000

2. **Or run with Docker only:**
  ```bash
  docker build -t SolrLens:latest .
  docker run -d \
    --name SolrLens \
    -p 3000:3000 \
    -e NODE_ENV=production \
    -e DC_CONFIG_PATH=/app/config/solr-datacenters.json \
    -v /path/to/your/config:/app/config:ro \
    SolrLens:latest
  ```
  - The app will be available at: http://localhost:3000

---

## 🧪 Demo Environment

1. **Use the provided demo config:**
  ```bash
  export DC_CONFIG_PATH=./demo/demo-config/dc-data.localhost.json
  cd backend && npm run dev
  ```
  - Or use Docker Compose with the demo config:
  ```bash
  docker-compose -f demo/docker-compose-app.yml up --build
  ```

---

## 📁 Project Structure

```
SolrLens/
├── backend/                 # Node.js + Express backend
│   ├── src/
│   │   ├── server.ts       # Main server file
│   │   ├── routes/         # API routes
│   │   └── config/         # Configuration files
│   ├── package.json
│   └── tsconfig.json
├── fronend/                # React + Vite frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── lib/           # Utilities
│   ├── package.json
│   └── vite.config.ts
├── demo/                   # Complete demo environment
│   ├── docker-compose-*.yml # Demo Solr clusters
│   └── demo-config/        # Demo configurations
├── docker-compose.dev.yml   # Development environment
├── docker-compose.prod.yml  # Production environment
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
└── package.json            # Root package.json
```

## ⚙️ Configuration

SolrLens requires a datacenter configuration file to define your Solr clusters. The application uses the `DC_CONFIG_PATH` environment variable to locate this file.

### 📋 Required Configuration

**You MUST create a configuration file and set `DC_CONFIG_PATH`** before running the application.

### 📄 Configuration File Format

Create a JSON file with this structure:

```json
{
  "datacenters": [
    {
      "name": "Your Datacenter Name",
      "default": true,
      "zookeeperNodes": [
        { "host": "zk1.example.com", "port": 2181 },
        { "host": "zk2.example.com", "port": 2181 },
        { "host": "zk3.example.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr1", "host": "solr1.example.com", "port": 8983 },
        { "name": "solr2", "host": "solr2.example.com", "port": 8983 }
      ]
    },
    {
      "name": "Secondary Datacenter",
      "zookeeperNodes": [
        { "host": "zk1-dc2.example.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr1_dc2", "host": "solr1-dc2.example.com", "port": 8983 }
      ]
    }
  ]
}
```

### 🚀 Quick Setup

1. **Create your config directory**:
   ```bash
   mkdir -p /path/to/your/config
   ```

2. **Create your configuration file**:
   ```bash
   vim /path/to/your/config/solr-datacenters.json
   # Add your datacenter configuration (see format above)
   ```

3. **Set the environment variable**:
   ```bash
   export DC_CONFIG_PATH=/path/to/your/config/solr-datacenters.json
   ```

### 🐳 Docker Configuration

#### With Docker Compose:
```yaml
services:
  SolrLens:
    image: ghcr.io/vibhuvioio/SolrLens:latest
    ports:
      - "3000:3000"
    environment:
      - DC_CONFIG_PATH=/app/config/solr-datacenters.json
    volumes:
      - /path/to/your/config:/app/config:ro
```

#### With Docker Run:
```bash
docker run -d \
  -p 3000:3000 \
  -v /path/to/your/config:/app/config:ro \
  -e DC_CONFIG_PATH=/app/config/solr-datacenters.json \
  ghcr.io/vibhuvioio/SolrLens:latest
```

### 🧪 Demo Configuration

For testing, you can use the demo environment which includes sample configurations:

```bash
# Use demo configuration
export DC_CONFIG_PATH=./demo/demo-config/dc-data.localhost.json

# Or for Docker demo
export DC_CONFIG_PATH=./demo/demo-config/dc-data.demo.json
```

### 🏗️ Development Configuration

During development, if no config is provided, the application will:

1. **Show an error** requiring `DC_CONFIG_PATH` to be set
2. **Fall back to sample config** with APAC Singapore/Tokyo datacenters
3. **Display a warning** to create a proper configuration

### 📝 Configuration Examples

#### Local Development:
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
        { "name": "solr1", "host": "localhost", "port": 8983 }
      ]
    }
  ]
}
```

#### Production Multi-DC:
```json
{
  "datacenters": [
    {
      "name": "US East",
      "default": true,
      "zookeeperNodes": [
        { "host": "zk1.us-east.example.com", "port": 2181 },
        { "host": "zk2.us-east.example.com", "port": 2181 },
        { "host": "zk3.us-east.example.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr1", "host": "solr1.us-east.example.com", "port": 8983 },
        { "name": "solr2", "host": "solr2.us-east.example.com", "port": 8983 },
        { "name": "solr3", "host": "solr3.us-east.example.com", "port": 8983 }
      ]
    },
    {
      "name": "EU West",
      "zookeeperNodes": [
        { "host": "zk1.eu-west.example.com", "port": 2181 },
        { "host": "zk2.eu-west.example.com", "port": 2181 },
        { "host": "zk3.eu-west.example.com", "port": 2181 }
      ],
      "nodes": [
        { "name": "solr1", "host": "solr1.eu-west.example.com", "port": 8983 },
        { "name": "solr2", "host": "solr2.eu-west.example.com", "port": 8983 }
      ]
    }
  ]
}
```

### ✅ Configuration Validation

Validate your configuration file:

```bash
# Check JSON syntax
cat your-config.json | jq .

# Test with application
DC_CONFIG_PATH=your-config.json npm run backend:dev
```

### 🔒 Security Notes

- **Never commit** configuration files with production hostnames
- **Use read-only mounts** in production Docker containers
- **Validate** configuration files before deployment
- **Use secrets management** for sensitive information

## 🐳 Docker Configuration

### Development Environment (`docker-compose.dev.yml`)

- **Hot Reload**: Enabled for both frontend and backend
- **Volume Mounting**: Source code is mounted for live editing
- **Ports**: 
  - Frontend: 5173
  - Backend: 3000

### Production Environment (`docker-compose.prod.yml`)

- **Optimized Build**: Multi-stage build for minimal image size
- **Static Serving**: Backend serves frontend static files
- **Health Checks**: Automated health monitoring
- **Ports**: 3000 (serves both frontend and API)

## 🔧 Environment Variables

### Backend (`backend/.env`)
```bash
NODE_ENV=development|production
PORT=3000
SOLR_BASE_URL=http://localhost:8983
SOLR_SECONDARY_URL=http://localhost:8982
ZK_HOST=localhost:2181
```

### Frontend (`fronend/.env`)

#### For Local Development (Vite dev server, backend on Node):
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_TITLE=SolrLens
VITE_APP_VERSION=1.0.0
```

#### For Production (Docker or all-in-one container):
```bash
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=SolrLens
VITE_APP_VERSION=1.0.0
```

> In production, the frontend and backend are typically served from the same domain and port, so the API base URL should point to the backend’s `/api` route.

**How it works:**
- The frontend uses `VITE_API_BASE_URL` to make API requests.
- In development, this points to your backend’s dev port (e.g., 3001).
- In production, this points to the backend’s `/api` endpoint (e.g., 3000).

**Don’t forget:**
- Update your `.env` files accordingly before building or running containers.
- Restart the frontend after changing environment variables.

## 📦 Docker Commands

### Building Images

```bash
# Build production image
docker build -t SolrLens .

# Build development image
docker build -f Dockerfile.dev -t SolrLens:dev .
```

### Running Containers

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Production optimized
docker-compose -f docker-compose.prod.yml up --build

# Run in background
docker-compose -f docker-compose.prod.yml up -d --build
```

### Managing Containers

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop containers
docker-compose -f docker-compose.prod.yml down

# Remove volumes
docker-compose -f docker-compose.prod.yml down -v

# Rebuild without cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

## 🔍 Health Monitoring

### Health Check Endpoint
```bash
curl http://localhost:3000/health
```

### Container Health Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

## 🚢 Deployment

### Production Deployment

1. **Build the image**:
   ```bash
   docker build -t SolrLens:latest .
   ```

2. **Run in production**:
   ```bash
   docker run -d \
     --name SolrLens \
     -p 3000:3000 \
     -e NODE_ENV=production \
     SolrLens:latest
   ```

### Docker Hub Deployment

```bash
# Images are automatically published to GitHub Container Registry
# Available tags:
docker pull ghcr.io/vibhuvioio/SolrLens:latest        # Latest main branch
docker pull ghcr.io/vibhuvioio/SolrLens:main          # Main branch
docker pull ghcr.io/vibhuvioio/SolrLens:develop       # Develop branch  
docker pull ghcr.io/vibhuvioio/SolrLens:v1.0.0        # Specific version

# All images are publicly available - no authentication required
```

## 🔧 Development

### Adding Dependencies

```bash
# Backend dependencies
docker-compose -f docker-compose.dev.yml exec SolrLens-dev sh
cd backend && npm install <package-name>

# Frontend dependencies
docker-compose -f docker-compose.dev.yml exec SolrLens-dev sh
cd fronend && npm install <package-name>
```

### Database Integration

The application is ready for database integration. Environment variables are configured for:
- Database connections
- External service URLs
- API keys and secrets

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development environment with Docker |
| `npm run dev:down` | Stop development environment |
| `npm run prod` | Start production environment with Docker |
| `npm run prod:down` | Stop production environment |
| `npm run build` | Build Docker production image |
| `npm run frontend:dev` | Start frontend locally |
| `npm run backend:dev` | Start backend locally |
| `npm run frontend:build` | Build frontend locally |
| `npm run backend:build` | Build backend locally |
| `npm run install:all` | Install all dependencies locally |

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000 and 5173 are available
2. **Docker permissions**: Ensure Docker daemon is running
3. **Node modules**: Delete node_modules and rebuild if issues persist

### Debugging

```bash
# Check container logs
docker-compose logs -f

# Access container shell
docker-compose exec SolrLens-dev sh

# Check Docker images
docker images | grep SolrLens

# Check running containers
docker ps
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on:
- Setting up your development environment
- Code style and conventions  
- Submitting pull requests
- Reporting bugs and requesting features

### 👥 Contributors

Thanks to all our contributors! 🎉

<!-- Add contributor list here as project grows -->

## 🔒 Security

For security-related issues, please read our [Security Policy](SECURITY.md) and report vulnerabilities responsibly.

## 📞 Support & Community

- 📋 **Issues**: [GitHub Issues](https://github.com/YOUR_ORG/SolrLens/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/YOUR_ORG/SolrLens/discussions)
- 📧 **Email**: [your-email@domain.com]

---

**Built with ❤️ by the open source community**

⭐ **Star this repo** if you find it useful!  
🍴 **Fork it** to start contributing!  
📢 **Share it** with your network!

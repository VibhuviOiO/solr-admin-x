# Solr Admin X

A modern web application for managing Apache Solr clusters with real-time monitoring and administration capabilities.

[![Build Status](https://github.com/YOUR_ORG/solr-admin-x/workflows/Build%20and%20Push%20Docker%20Image/badge.svg)](https://github.com/YOUR_ORG/solr-admin-x/actions)
[![Docker Image](https://img.shields.io/badge/docker-gcr.io-blue)](https://gcr.io/YOUR_PROJECT_ID/solr-admin-x)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](CONTRIBUTING.md)

## 🌟 **Open Source Project**

Solr Admin X is an **open source project** welcoming contributions from the community! Whether you're a seasoned developer or just starting out, there are many ways to contribute.

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

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)

### 🐳 Using Pre-built Docker Images

```bash
# Pull and run the latest version
docker pull ghcr.io/vibhuvioio/solr-admin-x:latest
docker run -p 3000:3000 ghcr.io/vibhuvioio/solr-admin-x:latest

# Or run directly
docker run -p 3000:3000 ghcr.io/vibhuvioio/solr-admin-x:latest
```

The application will be available at: http://localhost:3000

### 🐳 Docker Development

```bash
# Clone the repository
git clone <repository-url>
cd solr-admin-x

# Start development environment
npm run dev

# Stop development environment
npm run dev:down
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

### 🏭 Docker Production

```bash
# Build and start production environment
npm run prod

# Stop production environment
npm run prod:down
```

The application will be available at:
- **Application**: http://localhost:3000

### 🛠️ Local Development (without Docker)

```bash
# Install all dependencies
npm run install:all

# Terminal 1: Start backend
npm run backend:dev

# Terminal 2: Start frontend
npm run frontend:dev
```

## 📁 Project Structure

```
solr-admin-x/
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
├── docker-compose.dev.yml   # Development environment
├── docker-compose.prod.yml  # Production environment
├── Dockerfile              # Production build
├── Dockerfile.dev          # Development build
└── package.json            # Root package.json
```

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

### Backend (.env)
```bash
NODE_ENV=development|production
PORT=3000
SOLR_BASE_URL=http://localhost:8983
SOLR_SECONDARY_URL=http://localhost:8982
ZK_HOST=localhost:2181
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=Solr Admin X
VITE_APP_VERSION=1.0.0
```

## 📦 Docker Commands

### Building Images

```bash
# Build production image
docker build -t solr-admin-x .

# Build development image
docker build -f Dockerfile.dev -t solr-admin-x:dev .
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
   docker build -t solr-admin-x:latest .
   ```

2. **Run in production**:
   ```bash
   docker run -d \
     --name solr-admin-x \
     -p 3000:3000 \
     -e NODE_ENV=production \
     solr-admin-x:latest
   ```

### Docker Hub Deployment

```bash
# Images are automatically published to GitHub Container Registry
# Available tags:
docker pull ghcr.io/vibhuvioio/solr-admin-x:latest        # Latest main branch
docker pull ghcr.io/vibhuvioio/solr-admin-x:main          # Main branch
docker pull ghcr.io/vibhuvioio/solr-admin-x:develop       # Develop branch  
docker pull ghcr.io/vibhuvioio/solr-admin-x:v1.0.0        # Specific version

# All images are publicly available - no authentication required
```

## 🔧 Development

### Adding Dependencies

```bash
# Backend dependencies
docker-compose -f docker-compose.dev.yml exec solr-admin-x-dev sh
cd backend && npm install <package-name>

# Frontend dependencies
docker-compose -f docker-compose.dev.yml exec solr-admin-x-dev sh
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
docker-compose exec solr-admin-x-dev sh

# Check Docker images
docker images | grep solr-admin-x

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

- 📋 **Issues**: [GitHub Issues](https://github.com/YOUR_ORG/solr-admin-x/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/YOUR_ORG/solr-admin-x/discussions)
- 📧 **Email**: [your-email@domain.com]

---

**Built with ❤️ by the open source community**

⭐ **Star this repo** if you find it useful!  
🍴 **Fork it** to start contributing!  
📢 **Share it** with your network!

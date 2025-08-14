# Contributing to UniSolr

Thank you for your interest in contributing to UniSolr! We welcome contributions from the community.

## 🚀 Quick Start for Contributors

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 20+** (for local development)
- **Git**

### 🛠️ Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/unisolr.git
   cd unisolr
   ```

2. **Start with Docker (Recommended)**
   ```bash
   # Start development environment with hot reload
   npm run dev
   
   # Access the application
   # Frontend: http://localhost:3000
   # Backend: http://localhost:3001
   ```

3. **Or setup locally**
   ```bash
   # Install all dependencies
   npm run install:all
   
   # Terminal 1: Start backend
   npm run backend:dev
   
   # Terminal 2: Start frontend  
   npm run frontend:dev
   ```

## 📝 How to Contribute

### 🐛 Bug Reports

1. **Search existing issues** first
2. **Use the bug report template**
3. **Include reproduction steps**
4. **Provide environment details**

### ✨ Feature Requests

1. **Check existing feature requests**
2. **Use the feature request template**
3. **Explain the use case**
4. **Describe the proposed solution**

### 🔧 Code Contributions

#### Step 1: Pick an Issue
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to let others know you're working on it

#### Step 2: Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

#### Step 3: Make Changes
- Follow the existing code style
- Write meaningful commit messages
- Add tests if applicable
- Update documentation if needed

#### Step 4: Test Your Changes
```bash
# Run tests
npm run test

# Build the project
npm run build

# Test with Docker
docker build -t unisolr:test .
```

#### Step 5: Submit a Pull Request
- **Push your branch** to your fork
- **Create a PR** against the `main` branch
- **Fill out the PR template** completely
- **Link related issues**

## 🎨 Code Style

### Frontend (React/TypeScript)
- Use **TypeScript** for type safety
- Follow **React best practices**
- Use **Tailwind CSS** for styling
- Leverage **shadcn/ui** components

### Backend (Node.js/TypeScript)
- Use **TypeScript** throughout
- Follow **RESTful API** conventions
- Add proper **error handling**
- Include **JSDoc** comments

### General Guidelines
- **Consistent naming**: camelCase for variables, PascalCase for components
- **Meaningful names**: Functions and variables should be self-documenting
- **Small commits**: Make atomic commits with clear messages
- **No console.logs**: Use proper logging in production code

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd fronend && npm test

# Backend tests  
cd backend && npm test

# E2E tests
npm run test:e2e
```

### Writing Tests
- **Unit tests** for utilities and pure functions
- **Component tests** for React components
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows

## 📚 Documentation

### Code Documentation
- **JSDoc** for functions and classes
- **README** updates for new features
- **API documentation** for new endpoints

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(sidebar): add datacenter selection dropdown
fix(api): handle solr connection timeout errors
docs(readme): update docker setup instructions
```

## 🏗️ Project Structure

```
unisolr/
├── 📁 backend/           # Node.js + Express API
│   ├── src/
│   │   ├── server.ts     # Main server
│   │   ├── routes/       # API routes
│   │   └── config/       # Configuration
│   └── package.json
├── 📁 fronend/           # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Utilities
│   └── package.json
├── 📁 .github/           # GitHub workflows
└── 🐳 Docker files       # Containerization
```

## 🌟 Good First Issues

Perfect for newcomers:

- 🎨 **UI improvements**: Enhance existing components
- 📝 **Documentation**: Improve README, add code comments
- 🐛 **Small bug fixes**: Fix minor issues
- ✨ **Component additions**: Add new shadcn/ui components
- 🧪 **Test coverage**: Add missing tests

## 💬 Getting Help

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord/Slack**: [Link if available]

### Development Questions
- **Architecture decisions**: Create a discussion
- **Implementation help**: Comment on the issue
- **Code review feedback**: Address PR comments

## 📋 Pull Request Checklist

Before submitting your PR:

- [ ] **Code compiles** without errors
- [ ] **All tests pass** locally
- [ ] **Docker build succeeds**
- [ ] **Code follows** style guidelines
- [ ] **Documentation** is updated
- [ ] **Commit messages** are clear
- [ ] **PR template** is filled out
- [ ] **Related issues** are linked

## 🏆 Recognition

Contributors will be:
- **Listed** in the README
- **Mentioned** in release notes
- **Invited** to join the maintainers team (for significant contributions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## 🎯 Development Priorities

### Current Focus Areas
1. **Solr Integration**: Enhance Solr cluster management
2. **Real-time Monitoring**: Add live metrics and alerts  
3. **User Experience**: Improve UI/UX and accessibility
4. **Performance**: Optimize frontend and backend performance
5. **Testing**: Increase test coverage

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Infrastructure**: Docker, GitHub Actions, Google Cloud
- **Monitoring**: UniSolr API, ZooKeeper integration

---

**Happy coding! 🚀**

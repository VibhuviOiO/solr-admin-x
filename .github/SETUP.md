# 🔐 GitHub Repository Setup Guide

This guide explains how to set up your GitHub repository for automatic Docker image builds and deployment to GitHub Container Registry (GHCR).

## 📋 Prerequisites

1. **GitHub Repository** with admin access
2. **GitHub Account** (free tier supports public packages)

## 🛠️ GitHub Setup

### 1. Enable GitHub Packages

GitHub Container Registry (GHCR) is automatically available for all GitHub repositories. No additional setup required!

### 2. Repository Permissions

The GitHub Actions workflows use the built-in `GITHUB_TOKEN` with the following permissions:
- `contents: read` - Read repository contents
- `packages: write` - Push container images to GHCR

These permissions are automatically granted and require no additional configuration.

## 🔑 GitHub Repository Secrets

**✅ No additional secrets required!**

The workflows use the built-in `GITHUB_TOKEN` which is automatically provided by GitHub Actions.

## 🚀 Container Registry Access

### Image URLs

After successful builds, your images will be available at:

```
ghcr.io/vibhuvioio/solr-admin-x:latest
ghcr.io/vibhuvioio/solr-admin-x:main
ghcr.io/vibhuvioio/solr-admin-x:develop
ghcr.io/vibhuvioio/solr-admin-x:v1.0.0
```

### Pull Images (Public Access)

```bash
# Pull the latest image (no authentication required for public packages)
docker pull ghcr.io/vibhuvioio/solr-admin-x:latest

# Run the container
docker run -p 3000:3000 ghcr.io/vibhuvioio/solr-admin-x:latest
```

### Making Packages Public

By default, packages are private. To make them publicly accessible:

1. Go to your repository on GitHub
2. Click on "Packages" in the right sidebar
3. Click on your package name
4. Click "Package settings"
5. Scroll down to "Danger Zone"
6. Click "Change visibility" → "Public"

## 🔄 Workflow Triggers

### Automatic Builds

GitHub Actions will automatically build and push images when:

- **Push to main branch** → `ghcr.io/owner/repo:main` + `:latest`
- **Push to develop branch** → `ghcr.io/owner/repo:develop`
- **Create release tag** (v*) → `ghcr.io/owner/repo:v1.0.0`

### Manual Triggers

You can also trigger builds manually:
1. Go to Actions tab in your repository
2. Select "Build and Push Docker Image" workflow
3. Click "Run workflow"

## 🏗️ Multi-Platform Builds

The workflow builds for multiple architectures:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)

## 📊 Monitoring

### Build Status

Monitor build status:
- **Repository**: Actions tab shows workflow runs
- **Badges**: Add workflow badges to README
- **Notifications**: Configure GitHub notifications for failed builds

### Package Registry

View pushed images:
1. Go to your repository on GitHub
2. Click "Packages" in the right sidebar
3. View all published container images and their tags

## 🔧 Troubleshooting

### Common Issues

1. **Permission Denied**
   ```
   Error: denied: permission_denied
   ```
   - Check repository permissions
   - Ensure `packages: write` permission is set in workflow

2. **Package Not Found**
   ```
   Error: pull access denied
   ```
   - Verify package is set to public visibility
   - Check the exact image name and tag

3. **Workflow Fails**
   ```
   Error: buildx failed
   ```
   - Check the Dockerfile syntax
   - Verify all COPY paths exist
   - Review build logs in Actions tab

### Debug Commands

```bash
# Test local build
docker build -t test-image .

# Test local run
docker run -p 3000:3000 test-image

# Check available tags
curl -s https://api.github.com/user/packages/container/solr-admin-x/versions \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.[].metadata.container.tags'
```

## 🌟 Best Practices

### Security
- ✅ Use built-in `GITHUB_TOKEN` (automatically managed)
- ✅ Enable branch protection rules
- ✅ Review workflow permissions regularly
- ✅ Set packages to public only when intended

### Development
- ✅ Test builds locally before pushing
- ✅ Use semantic versioning for releases
- ✅ Include proper commit messages for changelog generation
- ✅ Review workflow runs for optimization opportunities

### Deployment
- ✅ Use specific image tags in production
- ✅ Implement health checks in containers
- ✅ Monitor container resource usage
- ✅ Set up alerting for failed deployments

## � Additional Resources

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Multi-platform Builds](https://docs.docker.com/build/building/multi-platform/)
- [GitHub Packages Permissions](https://docs.github.com/en/packages/learn-github-packages/about-permissions-for-github-packages)

---

**🎯 Quick Start Checklist:**

- [ ] Repository exists on GitHub
- [ ] Push code to trigger first build
- [ ] Verify image appears in Packages section
- [ ] Set package visibility to public
- [ ] Test pulling the image
- [ ] Add image pull instructions to README

Your Docker images will be automatically built and publicly available for anyone to use! 🚀

## 🔄 Workflow Triggers

### Automatic Builds

GitHub Actions will automatically build and push images when:

- **Push to main branch** → `gcr.io/PROJECT_ID/solr-admin-x:main` + `:latest`
- **Push to develop branch** → `gcr.io/PROJECT_ID/solr-admin-x:develop`
- **Create release tag** (v*) → `gcr.io/PROJECT_ID/solr-admin-x:v1.0.0`

### Manual Triggers

You can also trigger builds manually:
1. Go to Actions tab in your repository
2. Select "Build and Push Docker Image" workflow
3. Click "Run workflow"

## 🏗️ Multi-Platform Builds

The workflow builds for multiple architectures:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (Apple Silicon, ARM servers)

## 📊 Monitoring

### Build Status

Monitor build status:
- **Repository**: Actions tab shows workflow runs
- **Badges**: Add workflow badges to README
- **Notifications**: Configure GitHub notifications for failed builds

### Image Registry

View pushed images:
```bash
# List all images
gcloud container images list --repository=gcr.io/YOUR_PROJECT_ID

# List tags for solr-admin-x
gcloud container images list-tags gcr.io/YOUR_PROJECT_ID/solr-admin-x
```

## 🔧 Troubleshooting

### Common Issues

1. **Authentication Failed**
   ```
   Error: Error response from daemon: unauthorized
   ```
   - Check service account permissions
   - Verify `GCP_SA_KEY` secret is correct JSON

2. **Project Not Found**
   ```
   Error: Project 'PROJECT_ID' not found
   ```
   - Verify `GCP_PROJECT_ID` secret
   - Ensure project exists and billing is enabled

3. **Permission Denied**
   ```
   Error: Permission denied
   ```
   - Check service account has `storage.admin` role
   - Verify Container Registry API is enabled

### Debug Commands

```bash
# Test local authentication
gcloud auth activate-service-account --key-file=github-actions-key.json
gcloud auth configure-docker gcr.io

# Test image push
docker tag local-image gcr.io/YOUR_PROJECT_ID/test:latest
docker push gcr.io/YOUR_PROJECT_ID/test:latest
```

## 🌟 Best Practices

### Security
- ✅ Use service accounts with minimal required permissions
- ✅ Regularly rotate service account keys
- ✅ Use repository secrets, never commit credentials
- ✅ Enable branch protection rules

### Development
- ✅ Test builds locally before pushing
- ✅ Use semantic versioning for releases
- ✅ Include proper commit messages for changelog generation
- ✅ Review workflow runs for optimization opportunities

### Deployment
- ✅ Use specific image tags in production
- ✅ Implement health checks in containers
- ✅ Monitor container resource usage
- ✅ Set up alerting for failed deployments

## 📚 Additional Resources

- [Google Container Registry Documentation](https://cloud.google.com/container-registry/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Multi-platform Builds](https://docs.docker.com/build/building/multi-platform/)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-for-service-accounts)

---

**🎯 Quick Start Checklist:**

- [ ] Create Google Cloud Project
- [ ] Enable Container Registry API
- [ ] Create service account with proper permissions
- [ ] Download service account key
- [ ] Add `GCP_PROJECT_ID` to GitHub Secrets
- [ ] Add `GCP_SA_KEY` to GitHub Secrets
- [ ] Push code to trigger first build
- [ ] Verify image appears in GCR
- [ ] Test pulling and running the image

Your Docker images will be automatically built and available for deployment! 🚀

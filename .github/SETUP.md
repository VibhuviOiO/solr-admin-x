# 🔐 GitHub Repository Setup Guide

This guide explains how to set up your GitHub repository for automatic Docker image builds and deployment to Google Container Registry (GCR).

## 📋 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Google Container Registry** enabled
3. **GitHub Repository** with admin access
4. **Service Account** with appropriate permissions

## 🛠️ Google Cloud Setup

### 1. Create a Service Account

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions \
    --description="Service account for GitHub Actions" \
    --display-name="GitHub Actions"

# Get the service account email
export SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
```

### 2. Grant Required Permissions

```bash
# Grant Storage Admin role for GCR
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/storage.admin"

# Grant Container Registry Service Agent role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/containerregistry.ServiceAgent"
```

### 3. Create and Download Service Account Key

```bash
# Create key file
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=$SA_EMAIL

# Display the key content (you'll need this for GitHub Secrets)
cat github-actions-key.json
```

## 🔑 GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

### Required Secrets

Add the following repository secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `my-solr-project-123456` |
| `GCP_SA_KEY` | Service Account JSON key (entire content) | `{ "type": "service_account", ... }` |

### How to Add Secrets

1. **Navigate to Secrets**:
   ```
   GitHub Repository → Settings → Secrets and variables → Actions → New repository secret
   ```

2. **Add GCP_PROJECT_ID**:
   - Name: `GCP_PROJECT_ID`
   - Value: Your Google Cloud Project ID

3. **Add GCP_SA_KEY**:
   - Name: `GCP_SA_KEY`
   - Value: Complete JSON content from `github-actions-key.json`

## 🚀 Container Registry Access

### Image URLs

After successful builds, your images will be available at:

```
gcr.io/YOUR_PROJECT_ID/solr-admin-x:latest
gcr.io/YOUR_PROJECT_ID/solr-admin-x:main
gcr.io/YOUR_PROJECT_ID/solr-admin-x:v1.0.0
```

### Pull Images

```bash
# Configure Docker to use gcloud credentials
gcloud auth configure-docker gcr.io

# Pull the latest image
docker pull gcr.io/YOUR_PROJECT_ID/solr-admin-x:latest

# Run the container
docker run -p 3000:3000 gcr.io/YOUR_PROJECT_ID/solr-admin-x:latest
```

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

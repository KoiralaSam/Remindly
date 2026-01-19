# GitHub Deployment Guide for DigitalOcean

This guide explains how to set up automated deployment to DigitalOcean using GitHub Actions.

## Prerequisites

- GitHub repository with your code
- DigitalOcean Droplet with Docker and Docker Compose installed
- SSH access to your Droplet
- SSH key pair (public key on Droplet, private key for GitHub)

## Setup Instructions

### 1. Prepare Your DigitalOcean Droplet

```bash
# SSH into your Droplet
ssh root@your-droplet-ip

# Install Docker and Docker Compose (if not already installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y

# Create a deployment user (optional but recommended)
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Switch to deployment user
su - deploy

# Clone your repository
cd ~
git clone https://github.com/your-username/your-repo.git Remindly
cd Remindly

# Create environment files (do this once, then they'll persist)
nano backend/.env
# Add your environment variables here

nano client/.env
# Add your environment variables here
```

### 2. Set Up SSH Access

#### On Your Droplet

```bash
# As deploy user, ensure .ssh directory exists
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# The public key will be added by GitHub Actions
# But you can also add it manually if needed
```

#### Generate SSH Key Pair (if you don't have one)

```bash
# On your local machine or Droplet
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy

# Copy public key to Droplet's authorized_keys
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub deploy@your-droplet-ip

# Copy private key content to use in GitHub Secrets
cat ~/.ssh/github_actions_deploy
```

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

#### Required Secrets

1. **`DROPLET_IP`**

   - Value: Your DigitalOcean Droplet IP address
   - Example: `157.230.123.45`

2. **`DROPLET_USER`**

   - Value: SSH username (usually `root` or `deploy`)
   - Example: `deploy` or `root`

3. **`SSH_PRIVATE_KEY`**
   - Value: Your private SSH key (the entire key including `-----BEGIN` and `-----END` lines)
   - Example:
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
     ...
     -----END OPENSSH PRIVATE KEY-----
     ```

#### Optional: Additional Secrets (if using protected branches)

4. **`SSH_PASSPHRASE`** (only if your SSH key has a passphrase)
   - Value: Passphrase for your SSH key

### 4. Verify Workflow File

The workflow file `.github/workflows/deploy.yml` is already configured. It will:

- Trigger on pushes to `main` or `master` branch
- Can also be triggered manually from GitHub Actions tab
- Pull latest code from repository
- Build and deploy using `docker-compose.prod.yaml`
- Clean up old Docker images

### 5. First Deployment

#### Option A: Trigger Manually

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select "Deploy to DigitalOcean" workflow
4. Click "Run workflow"
5. Select branch (usually `main` or `master`)
6. Click "Run workflow" button

#### Option B: Push to Main Branch

```bash
# On your local machine
git checkout main
git push origin main
```

The workflow will automatically trigger.

### 6. Monitor Deployment

```bash
# SSH into your Droplet
ssh deploy@your-droplet-ip

# Check container status
cd ~/Remindly
docker compose -f docker-compose.prod.yaml ps

# View logs
docker compose -f docker-compose.prod.yaml logs -f

# Check specific service logs
docker compose -f docker-compose.prod.yaml logs -f backend
docker compose -f docker-compose.prod.yaml logs -f client
```

## Workflow Details

### CI Workflow (`.github/workflows/ci.yml`)

- Runs on pull requests and pushes
- Builds backend and frontend to verify they compile
- Builds Docker images to ensure Dockerfiles are correct
- Does not deploy, only validates code

### Deploy Workflow (`.github/workflows/deploy.yml`)

- Runs on pushes to `main`/`master` branches
- Can be triggered manually
- SSH into Droplet
- Pulls latest code
- Deploys using production docker-compose
- Cleans up old images

## Troubleshooting

### SSH Connection Fails

```bash
# Test SSH connection manually
ssh -i ~/.ssh/github_actions_deploy deploy@your-droplet-ip

# Check if authorized_keys is correct
cat ~/.ssh/authorized_keys

# Ensure correct permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Environment Variables Not Found

```bash
# Check if .env files exist on Droplet
ls -la ~/Remindly/backend/.env
ls -la ~/Remindly/client/.env

# The .env files should be created manually on the server
# They are not in git (should be in .gitignore)
```

### Docker Compose Fails

```bash
# Check Docker Compose version
docker compose version

# Verify docker-compose.prod.yaml exists
cat ~/Remindly/docker-compose.prod.yaml

# Test locally on Droplet
cd ~/Remindly
docker compose -f docker-compose.prod.yaml config
```

### Permission Denied Errors

```bash
# Ensure user is in docker group
groups deploy
# Should include 'docker'

# If not, add user to docker group
sudo usermod -aG docker deploy
# Then logout and login again
```

### GitHub Actions Fails to Find Directory

The workflow looks for the project in `~/Remindly` or `~/remindly`. If you cloned it with a different name:

1. Update the workflow file `.github/workflows/deploy.yml`
2. Change the `cd` line to match your directory name
3. Or create a symlink: `ln -s ~/your-directory-name ~/Remindly`

## Security Best Practices

1. **Never commit `.env` files** - They should be in `.gitignore`
2. **Use deployment user** - Don't use root user for deployments
3. **Restrict SSH access** - Only allow SSH from trusted IPs if possible
4. **Rotate SSH keys** - Change SSH keys periodically
5. **Use GitHub Environments** - For more advanced secret management
6. **Monitor deployments** - Check logs regularly for issues

## Updating Environment Variables

If you need to update environment variables:

```bash
# SSH into Droplet
ssh deploy@your-droplet-ip

# Edit environment files
nano ~/Remindly/backend/.env
nano ~/Remindly/client/.env

# Restart services to apply changes
cd ~/Remindly
docker compose -f docker-compose.prod.yaml restart
```

## Rollback

If a deployment fails or causes issues:

```bash
# SSH into Droplet
ssh deploy@your-droplet-ip

# Check git log
cd ~/Remindly
git log --oneline -10

# Checkout previous commit
git checkout <previous-commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yaml up -d --build
```

## Advanced: Using GitHub Environments

For better secret management with multiple environments (staging, production):

1. Go to Settings → Environments
2. Create environments (e.g., "production", "staging")
3. Add environment-specific secrets
4. Update workflow to reference environment:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production # Add this line
    steps:
      # ... rest of steps
```

## Support

For issues:

1. Check GitHub Actions logs in the Actions tab
2. Check Droplet logs (SSH in and check Docker logs)
3. Verify all secrets are set correctly
4. Test SSH connection manually

# GitHub Actions Setup for Vercel Deployment

This document explains how to configure GitHub Actions to automatically deploy your Lazy Habbit App to Vercel.

## Overview

Two workflows are configured:
1. **Production Deployment** (`deploy-production.yml`) - Triggers on push to `master` branch
2. **Preview Deployment** (`deploy-preview.yml`) - Triggers on pull requests to `master` branch

## Required GitHub Secrets

You need to add three secrets to your GitHub repository:

### 1. VERCEL_TOKEN

This is your Vercel authentication token.

**How to get it:**
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions Deploy")
4. Select the appropriate scope (Full Account or specific teams)
5. Click "Create Token" and copy the token

### 2. VERCEL_ORG_ID

Your Vercel organization/user ID.

**How to get it:**
1. Navigate to your project directory: `cd frontend/lazy-habbit-app`
2. Run: `vercel link` (if not already linked)
3. Open the `.vercel/project.json` file
4. Copy the `orgId` value

**Alternative method:**
1. Go to your [Vercel Settings](https://vercel.com/account)
2. Your User ID is displayed in the account settings

### 3. VERCEL_PROJECT_ID

Your Vercel project ID.

**How to get it:**
1. Navigate to your project directory: `cd frontend/lazy-habbit-app`
2. Run: `vercel link` (if not already linked)
3. Open the `.vercel/project.json` file
4. Copy the `projectId` value

**Alternative method:**
1. Go to your project on Vercel dashboard
2. Go to Settings > General
3. Copy the Project ID

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add each of the three secrets:
   - Name: `VERCEL_TOKEN`, Value: [your token]
   - Name: `VERCEL_ORG_ID`, Value: [your org ID]
   - Name: `VERCEL_PROJECT_ID`, Value: [your project ID]

## Verifying Setup

After adding the secrets:

1. Make a change to your code
2. Commit and push to `master`:
   ```bash
   git add .
   git commit -m "test: verify GitHub Actions deployment"
   git push origin master
   ```
3. Go to your repository's **Actions** tab
4. You should see the "Deploy to Vercel Production" workflow running
5. Once complete, check the deployment URL in the workflow logs

## Workflow Features

### Production Deployment
- Automatically deploys when code is merged to `master`
- Uses Vercel's production environment
- Posts deployment URL as a commit comment

### Preview Deployment
- Creates preview deployments for pull requests
- Posts preview URL as a PR comment
- Updates the comment when new commits are pushed to the PR

## Troubleshooting

### Workflow fails with "VERCEL_TOKEN not set"
- Ensure you've added the `VERCEL_TOKEN` secret in GitHub repository settings
- Secret names are case-sensitive

### Workflow fails with "Project not found"
- Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match the values in `.vercel/project.json`
- Run `vercel link` locally to ensure the project is properly linked

### Build fails on Vercel
- Check that all required files are being uploaded (verify `.vercelignore`)
- Ensure `angular.json` and source files are not excluded
- Check Node.js version compatibility (workflow uses Node 20)

## Manual Deployment

You can also trigger deployments manually:

1. Go to **Actions** tab in your GitHub repository
2. Select "Deploy to Vercel Production" workflow
3. Click "Run workflow"
4. Select the branch and click "Run workflow"

## Resources

- [Vercel GitHub Actions Documentation](https://vercel.com/docs/deployments/git/vercel-for-github)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

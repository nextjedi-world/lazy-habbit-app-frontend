# Deployment Information

## Current Deployment

✅ **Lazy Habbit App** is successfully deployed to Vercel!

- **Production URL**: https://lazy-habbit-app.vercel.app
- **Latest Deployment**: https://lazy-habbit-m3aer9xpt-arunabh-priyadarshis-projects.vercel.app
- **Vercel Project Dashboard**: https://vercel.com/arunabh-priyadarshis-projects/lazy-habbit-app

## Project Details

- **Project ID**: `prj_comr5ecPFMRiS9uOfQWepGjP5yza`
- **Organization ID**: `team_2HkYcnkFTZw7QFb44fby6Y3c`
- **Project Name**: `lazy-habbit-app`
- **Framework**: Angular 21
- **Node Version**: 20.x

## GitHub Actions CI/CD

### Status
⚙️ **Setup Required**: GitHub Secrets need to be configured

### Required Secrets

To enable automatic deployment on push to `master`, add these **5 secrets** to your GitHub repository:

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create a new token with appropriate scope

2. **VERCEL_ORG_ID**
   - Value: `team_2HkYcnkFTZw7QFb44fby6Y3c`

3. **VERCEL_PROJECT_ID**
   - Value: `prj_comr5ecPFMRiS9uOfQWepGjP5yza`

4. **SUPABASE_URL**
   - Value: `https://mgifcqdadcsutrzsxmvk.supabase.co`
   - Your Supabase project URL

5. **SUPABASE_ANON_KEY**
   - Value: Your Supabase anon/public key (JWT token)
   - Get from: Supabase Dashboard → Settings → API → anon/public key
   - Note: This key is safe for client-side use (protected by RLS)

### How to Add Secrets

1. Go to: https://github.com/nextjedi/lazy-habbit-app-frontend/settings/secrets/actions
2. Click **New repository secret**
3. Add each secret with the name and value listed above

### Workflows

Two workflows are configured:

1. **Production Deployment** (`.github/workflows/deploy-production.yml`)
   - Triggers: Push to `master` branch
   - Action: Deploys to Vercel production
   - Output: Posts deployment URL as commit comment

2. **Preview Deployment** (`.github/workflows/deploy-preview.yml`)
   - Triggers: Pull requests to `master`
   - Action: Creates preview deployment
   - Output: Posts preview URL as PR comment

## Manual Deployment

### Using Vercel CLI

```bash
cd frontend/lazy-habbit-app

# Deploy to production
vercel --prod

# Deploy preview
vercel
```

### Build Locally

```bash
cd frontend/lazy-habbit-app

# Install dependencies
npm install

# Build for production
npm run build

# Output will be in: dist/lazy-habbit-app/browser
```

## Environment Variables

### Required for Runtime

Configure these in Vercel dashboard (Settings > Environment Variables):

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key

### Build-time Variables

Currently using values from `src/environments/environment.ts` (committed to repo for MVP).

**Note**: For production with sensitive data, move these to environment variables.

## Deployment Checklist

- [x] Angular project builds successfully
- [x] Vercel project created and linked
- [x] First deployment completed
- [x] GitHub Actions workflows created
- [ ] GitHub Secrets configured (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID)
- [ ] Test automatic deployment (push to master)
- [ ] Configure Vercel environment variables (if needed)
- [ ] Set up custom domain (optional)

## Troubleshooting

### Build Fails on Vercel

1. Check `.vercelignore` - ensure it's not excluding required files
2. Verify `angular.json` and source files are included
3. Check Node.js version compatibility

### GitHub Actions Fails

1. Verify all three secrets are set correctly
2. Check secret names are exactly: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
3. Review workflow logs in the Actions tab

### App Doesn't Load

1. Check browser console for errors
2. Verify Supabase credentials are correct
3. Check Vercel deployment logs

## Next Steps

1. **Add GitHub Secrets** - Follow instructions above to enable CI/CD
2. **Test Deployment** - Push a commit to master and verify automatic deployment
3. **Custom Domain** (Optional) - Configure in Vercel dashboard
4. **Environment Variables** - Add Supabase credentials in Vercel settings if needed
5. **Monitoring** - Set up Vercel Analytics and error tracking

## Resources

- [Vercel Dashboard](https://vercel.com/arunabh-priyadarshis-projects/lazy-habbit-app)
- [GitHub Repository](https://github.com/nextjedi/lazy-habbit-app-frontend)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Setup](.github/SETUP.md)

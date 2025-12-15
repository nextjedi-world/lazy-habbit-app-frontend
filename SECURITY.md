# Security & Secrets Management

## 🔒 Current Security Status

### ✅ Repository Security
Your GitHub repository is **secure**:
- `environment.ts` and `environment.prod.ts` are **NOT committed** to git
- `.gitignore` properly excludes these files
- Only `environment.example.ts` is tracked (contains placeholders)

### 🔑 How Supabase Credentials Are Handled

#### Local Development
- You have `environment.ts` locally with real Supabase credentials
- This file is ignored by git (never pushed to GitHub)
- Safe for local development

#### Current Vercel Deployment
- When you ran `vercel --prod` locally, it uploaded files from your machine
- This included your local `environment.ts` with Supabase credentials
- **This works fine** because Supabase anon keys are safe for client-side use

#### GitHub Actions (Automated Deployments)
- GitHub Actions **cannot access** your local `environment.ts` (not in repo)
- Workflows now create `environment.ts` from **GitHub Secrets** during build
- This allows automated deployments without committing credentials

---

## 🛡️ Supabase Security Model

### Anon Key (Client-Side) - ✅ Safe to Expose
Your `supabaseAnonKey` is designed for client-side use:
- It's a JWT token with limited permissions
- Protected by **Row-Level Security (RLS)** policies in your database
- Users can only access data allowed by RLS rules
- Safe to include in client-side bundles (Angular, React, etc.)

**Example:**
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://mgifcqdadcsutrzsxmvk.supabase.co',
  supabaseAnonKey: 'eyJhbG...' // ← Safe for client-side
};
```

### Service Role Key - ⛔ NEVER Expose
The `service_role` key **bypasses all RLS policies**:
- Only use server-side (backend, Edge Functions, migrations)
- NEVER include in client-side code
- NEVER commit to git
- Keep it secret

---

## 📋 Required GitHub Secrets

To enable GitHub Actions automatic deployment, add these **5 secrets**:

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `VERCEL_TOKEN` | Vercel authentication | https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Your Vercel organization ID | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Your Vercel project ID | `.vercel/project.json` → `projectId` |
| `SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |

### Add Secrets Here:
https://github.com/nextjedi/lazy-habbit-app-frontend/settings/secrets/actions

---

## 🔄 How It Works

### 1. Local Development
```bash
# You have environment.ts locally (not in git)
src/environments/environment.ts
  ├─ supabaseUrl: 'https://...'
  └─ supabaseAnonKey: 'eyJhbG...'

# Build and test locally
npm run build
```

### 2. Manual Vercel Deployment
```bash
# Uploads your local files to Vercel
vercel --prod

# Includes your local environment.ts
# ✅ Works because anon key is safe for client-side
```

### 3. GitHub Actions Automated Deployment
```yaml
# Workflow creates environment.ts from secrets
- name: Create Environment File
  run: |
    cat > src/environments/environment.ts << EOF
    export const environment = {
      production: true,
      supabaseUrl: '${{ secrets.SUPABASE_URL }}',
      supabaseAnonKey: '${{ secrets.SUPABASE_ANON_KEY }}'
    };
    EOF

# Then builds and deploys
- name: Build Project
  run: vercel build --prod
```

---

## ✅ Security Best Practices Checklist

- [x] Environment files excluded from git (`.gitignore`)
- [x] Only example/template files committed to repo
- [x] Supabase anon key used for client-side (safe)
- [x] Service role key never exposed client-side
- [x] GitHub Actions uses secrets for credentials
- [x] Row-Level Security (RLS) policies enabled on database tables
- [ ] GitHub Secrets configured for CI/CD (action required)
- [ ] Database RLS policies tested and verified

---

## 🚨 Security Checklist for Production

Before launching to real users, verify:

### Database Security
1. **RLS Enabled**: Check all tables have RLS enabled
   ```sql
   -- Verify RLS is on
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```

2. **RLS Policies Tested**: Ensure users can only access their own data
   - Test in Supabase SQL Editor with different user contexts
   - Verify policies prevent unauthorized access

3. **No Service Role Key Client-Side**: Confirm only anon key in `environment.ts`

### Vercel Security
1. **Environment Variables**: Consider moving to Vercel env vars for better management
2. **Custom Domain**: Add custom domain with HTTPS (free with Vercel)
3. **Security Headers**: Already configured in `vercel.json`:
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `X-Content-Type-Options: nosniff`

### Code Security
1. **Dependencies**: Run `npm audit` and fix vulnerabilities
2. **Secrets Scanning**: Enable GitHub secret scanning in repo settings
3. **Branch Protection**: Require PR reviews before merging to `master`

---

## 📚 Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🆘 If Credentials Are Compromised

### If Supabase Anon Key Leaked:
**Don't panic** - anon keys are designed to be public. However:
1. Review and tighten RLS policies
2. Consider rotating the key in Supabase dashboard (Settings → API → Project API Keys)
3. Update the key in GitHub Secrets and redeploy

### If Supabase Service Role Key Leaked:
**⚠️ URGENT** - This bypasses all security:
1. Immediately rotate in Supabase dashboard
2. Audit database for unauthorized access (check auth.users, audit logs)
3. Review all RLS policies
4. Update key in secure server locations only

### If Vercel Token Leaked:
1. Revoke token immediately at https://vercel.com/account/tokens
2. Create new token
3. Update `VERCEL_TOKEN` in GitHub Secrets

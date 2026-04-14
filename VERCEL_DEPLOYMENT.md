# Vercel Deployment Guide

## Landing Page (apps/web)

### Configuration Settings

When deploying to Vercel, use these settings:

**Framework Preset:** Next.js

**Root Directory:** `apps/web`

**Build Command:**
```bash
cd ../.. && pnpm install && pnpm build --filter=@laporin/web
```

**Output Directory:** `.next` (default)

**Install Command:**
```bash
pnpm install
```

**Development Command:**
```bash
pnpm dev
```

### Environment Variables

No environment variables required for the landing page (static site).

### Steps to Deploy

1. **Import Repository**
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import from GitHub: `itzcaesar/laporin`

2. **Configure Project**
   - Framework Preset: **Next.js**
   - Root Directory: **apps/web**
   - Build Command: `cd ../.. && pnpm install && pnpm build --filter=@laporin/web`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Alternative: Using Turbo

If the above doesn't work, try:

**Build Command:**
```bash
pnpm turbo build --filter=@laporin/web
```

### Troubleshooting

**Error: "No Next.js version detected"**
- Make sure Root Directory is set to `apps/web`
- Verify the build command includes the filter flag

**Error: "pnpm not found"**
- Vercel should auto-detect pnpm from `pnpm-lock.yaml`
- If not, add this to package.json in root:
  ```json
  {
    "packageManager": "pnpm@9.0.0"
  }
  ```

**Build fails with workspace errors**
- Make sure the build command includes `cd ../..` to run from root
- Or use turbo: `pnpm turbo build --filter=@laporin/web`

### Expected Result

- **URL:** `https://laporin.vercel.app` (or custom domain)
- **Build Time:** ~2-3 minutes
- **Status:** ✅ Ready

---

## API Deployment (Railway)

The API (`apps/api`) should be deployed to Railway, not Vercel.

See `RAILWAY_DEPLOYMENT.md` for API deployment instructions.

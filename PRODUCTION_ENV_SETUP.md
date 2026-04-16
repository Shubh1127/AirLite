# Production Environment Setup for AirLite

## Overview
When deploying to production (Vercel), you need to set environment variables in the Vercel dashboard. This file documents all required variables and how to set them up.

## Frontend Environment Variables (Vercel Dashboard)

### Step 1: Generate NEXTAUTH_SECRET
Run this command in your terminal to generate a secure secret:
```bash
openssl rand -base64 32
```
Copy the output and use it as `NEXTAUTH_SECRET`

### Step 2: Set Environment Variables in Vercel Dashboard

Go to: **Project Settings → Environment Variables**

Add the following variables:

#### 1. API Configuration
```
NEXT_PUBLIC_API_URL = https://your-backend-domain.com
```
(Replace with your actual backend URL when deployed. For now, use the backend URL)

#### 2. Authentication
```
NEXTAUTH_SECRET = <paste-the-generated-secret-from-step-1>
NEXTAUTH_URL = https://air-lite.vercel.app
```

#### 3. OAuth (Google)
```
GOOGLE_CLIENT_ID = 771773962008-6mt2v3aeab9q26i1cq3648eiee6jdnm6.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = <your-google-client-secret>
```

#### 4. Third-Party Services
```
NEXT_PUBLIC_RAZORPAY_KEY_ID = <your-razorpay-key-id>
NEXT_PUBLIC_MAPBOX_TOKEN = <your-mapbox-public-token>
```

## Important Notes

### NEXTAUTH_SECRET
- ⚠️ **MUST be set** - Without it, NextAuth will fail with "Configuration" error
- Must be different for each environment (local vs production)
- Keep it secret - never commit to git

### NEXTAUTH_URL
- Must match your production domain
- For Vercel: `https://your-vercel-app.vercel.app`
- Current: `https://air-lite.vercel.app`

### NEXT_PUBLIC_API_URL
- Defines where the frontend sends API requests
- In production, this should point to your backend deployment
- Must be HTTPS in production

### Environment Variable Prefixes
- `NEXT_PUBLIC_*` - Exposed to browser (public variables)
- No prefix - Only available on server-side (secret variables)

## Deployment Checklist

- [ ] Generate and set `NEXTAUTH_SECRET`
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Update `NEXT_PUBLIC_API_URL` if backend is deployed
- [ ] Verify all environment variables are set in Vercel
- [ ] Redeploy the application after setting variables
- [ ] Test login/OAuth flow in production

## Troubleshooting

### Error: "Configuration" or "CLIENT_FETCH_ERROR"
1. Check if `NEXTAUTH_SECRET` is set in Vercel
2. Verify `NEXTAUTH_URL` matches your production domain
3. Check browser console for specific error messages

### Error: API calls fail
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check CORS settings on backend
3. Ensure backend is running and accessible

### OAuth not working
1. Verify Google credentials are correct
2. Check Google Cloud Console for authorized redirect URIs
3. Add your production URL to authorized URIs: `https://air-lite.vercel.app/api/auth/callback/google`

## Local Development

For local development, use `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXTAUTH_SECRET=<your-local-nextauth-secret>
NEXTAUTH_URL=http://localhost:3000
```

## Additional Resources
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

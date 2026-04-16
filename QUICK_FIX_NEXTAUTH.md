# Quick Fix: NextAuth Configuration Error in Production

## Problem
You're seeing this error in production:
```
[next-auth][error][CLIENT_FETCH_ERROR] 
There is a problem with the server configuration.
```

## Root Causes
1. ❌ `NEXTAUTH_SECRET` is not set or is a placeholder
2. ❌ `NEXTAUTH_URL` points to localhost instead of production domain
3. ❌ Missing or incorrect environment variables

## Solution (Do This Now)

### Step 1: Generate Secret
```bash
openssl rand -base64 32
```
Copy the output (it looks like: `AbCdEfGhIjKlMnOpQrStUvWxYz1234567890==`)

### Step 2: Add to Vercel
1. Go to: https://vercel.com/dashboard
2. Select your "air-lite" project
3. Click **Settings → Environment Variables**
4. Add these variables:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | Paste the secret from Step 1 |
| `NEXTAUTH_URL` | `https://air-lite.vercel.app` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` (or your backend URL) |
| `GOOGLE_CLIENT_ID` | `771773962008-6mt2v3aeab9q26i1cq3648eiee6jdnm6.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `<your-google-client-secret>` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `<your-razorpay-key-id>` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `<your-mapbox-public-token>` |

### Step 3: Redeploy
1. Go to **Deployments**
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

### Step 4: Test
1. Go to https://air-lite.vercel.app/auth/login
2. Try logging in
3. The error should be gone

## Why This Happens
NextAuth.js requires `NEXTAUTH_SECRET` to be set in production for security. It encrypts session tokens with this secret. Without it, the server can't start the auth session properly.

## Verification Checklist
- [ ] `NEXTAUTH_SECRET` is set to a real secret (not placeholder)
- [ ] `NEXTAUTH_URL` is set to production domain
- [ ] All environment variables are saved in Vercel
- [ ] Application has been redeployed
- [ ] Login page loads without errors

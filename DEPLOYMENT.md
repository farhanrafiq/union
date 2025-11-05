# Deployment Guide: Render + Neon PostgreSQL

This guide walks you through deploying the Union Registry app with a Neon PostgreSQL database and Render hosting.

## Prerequisites

- GitHub account with the repository pushed
- Neon account (free tier available at [neon.tech](https://neon.tech))
- Render account (free tier available at [render.com](https://render.com))

---

## Step 1: Create Neon PostgreSQL Database

1. Go to [console.neon.tech](https://console.neon.tech)
2. Click **"New Project"**
3. Configure:
   - **Project name**: union-registry
   - **Region**: Choose closest to your users
   - **Postgres version**: 16 (recommended)
4. Click **"Create Project"**
5. Copy the connection string shown (starts with `postgres://`)
   - Format: `postgres://user:password@host/dbname?sslmode=require`
   - Save this for Step 2

---

## Step 2: Deploy Backend API to Render

### 2.1 Create Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `farhanrafiq/union`
4. Configure the service:
   - **Name**: `union-api`
   - **Region**: Same as Neon DB region
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm ci && npm run generate && npm run migrate && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

### 2.2 Add Environment Variables

Click **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string from Step 1 |
| `JWT_SECRET` | Generate a random string (e.g., `openssl rand -base64 32` in terminal) |
| `PORT` | `8080` |

### 2.3 Deploy

1. Click **"Create Web Service"**
2. Wait for build to complete (~3-5 minutes)
3. Once deployed, copy the service URL (e.g., `https://union-api.onrender.com`)

### 2.4 Seed Database (Optional)

Open the Render Shell (Web Service → Shell tab) and run:
```bash
npm run seed
```

This creates a demo dealer: `dealer1` / `Union@2025`

---

## Step 3: Deploy Frontend to Render

### 3.1 Create Static Site

1. In Render dashboard, click **"New +"** → **"Static Site"**
2. Connect the same GitHub repository: `farhanrafiq/union`
3. Configure:
   - **Name**: `union-registry`
   - **Root Directory**: ` ` (leave blank - root of repo)
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`

### 3.2 Add Environment Variable

Click **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | Your API URL from Step 2.3 (e.g., `https://union-api.onrender.com`) |

### 3.3 Deploy

1. Click **"Create Static Site"**
2. Wait for build (~2-3 minutes)
3. Your app is now live at the provided URL!

---

## Step 4: Test Deployment

1. Visit your Static Site URL
2. Click **"Dealer Login"**
3. Try **"Forgot Password?"**:
   - Enter `dealer1`
   - Check Render Web Service logs for the temp password email mock
4. Login with the seeded dealer: `dealer1` / `Union@2025`
5. Create an employee or customer
6. Open the app in another browser/device
7. Login again → data persists across devices! ✅

---

## Troubleshooting

### Build fails on Render

**Server build error**: Check Render logs. Common issues:
- `DATABASE_URL` not set
- Prisma migration failed (check DB connection)

**Frontend build error**:
- Ensure `VITE_API_URL` is set correctly
- Check build logs for TypeScript errors

### Database connection issues

**Error: "password authentication failed"**
- Verify Neon connection string is copied correctly
- Ensure it includes `?sslmode=require`

**Error: "too many connections"**
- Neon free tier: 10 concurrent connections
- Restart Render Web Service to clear stale connections

### API not responding

- Check Web Service logs in Render dashboard
- Verify service is "Running" (not "Suspended")
- Free tier services may sleep after 15 min inactivity (first request wakes it)

---

## Environment Variables Reference

### Backend (Render Web Service)

```bash
DATABASE_URL=postgres://user:pass@host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-random-secret-here
PORT=8080
```

### Frontend (Render Static Site)

```bash
VITE_API_URL=https://union-api.onrender.com
```

---

## Local Development with Neon

Want to use Neon for local dev too?

1. Create a separate Neon branch (free tier: 1 branch)
2. Copy its connection string to `server/.env`:
   ```bash
   DATABASE_URL=postgres://...neon.tech/dbname?sslmode=require
   JWT_SECRET=local-dev-secret
   ```
3. Run migrations:
   ```bash
   cd server
   npm run generate
   npm run migrate
   npm run seed
   npm run dev
   ```

---

## Next Steps

- **Custom domain**: Add your domain in Render Static Site settings
- **Auto-deploy**: Render automatically deploys on `git push` to main
- **Monitoring**: Check Render logs and Neon console for metrics
- **Scaling**: Upgrade Render plan for always-on, faster instances

---

## Cost Estimate (Free Tier)

- **Neon PostgreSQL**: Free (up to 3 GB storage, 10 concurrent connections)
- **Render Web Service**: Free (sleeps after 15 min inactivity, 750 hrs/month)
- **Render Static Site**: Free (100 GB bandwidth/month)

**Total**: $0/month for moderate usage! 🎉

---

## Support

- Neon Docs: https://neon.tech/docs
- Render Docs: https://render.com/docs
- Issues: https://github.com/farhanrafiq/union/issues

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11fGBCY5TvCYgSimd4g6-LNbc-4RrgIFG

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Render

This project is configured to deploy automatically to Render as a static site.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/farhanrafiq/union)

### Option 1: Automatic Deployment (Recommended)
1. Connect your GitHub repository to Render at https://dashboard.render.com/new/static-site or click the "Deploy to Render" button above
2. Render will automatically detect the `render.yaml` configuration file
3. Your app will be deployed with these settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - SPA rewrite to `index.html` is already configured in `render.yaml`

### Option 2: Manual Configuration
If you prefer to configure manually in the Render dashboard:
1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Set the following build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - (Optional) Add environment variable `GEMINI_API_KEY` if your app uses it

### Environment variables
- Local development: create a `.env.local` file with `GEMINI_API_KEY=...` if needed.
- Render: the `render.yaml` includes an env var placeholder for `GEMINI_API_KEY` with `sync: false`. Set its value in the Render dashboard (Static Site -> Environment -> Add Environment Variable) so it's available at build time.

### Build Verification
To verify your build works locally before deploying:
```bash
npm run build
npm run preview
```

The build will create a `dist` folder containing the optimized static files ready for deployment.

## Optional: Shared data across devices (Backend API)

By default, data is stored in the browser (localStorage), which is per-device. To share data across devices, use the included backend API (Express + Prisma + PostgreSQL) in the `server/` folder.

### Run the API locally
1. Create a Postgres database (Docker or any local instance)
2. Create `server/.env` with:
   - `DATABASE_URL=postgres://user:pass@host:5432/dbname`
   - `JWT_SECRET=a-long-random-string`
3. From `server/` folder:
   - `npm install`
   - `npm run generate`
   - `npm run migrate`
   - `npm run seed` (creates a demo dealer: dealer1 / Union@2025)
   - `npm run dev`

### Point the frontend at the API
1. Create `.env.local` in the project root with:
   - `VITE_API_URL=http://localhost:8080`
2. Restart `npm run dev` for the frontend.

When `VITE_API_URL` is set, the app will:
- Log in via the API (dealers)
- Load and create customers via the API (shared across devices)
- Fall back to localStorage if the API is not configured

### Deploy API to Render
1. Create a new Web Service on Render using the `/server` folder
2. Add a Render PostgreSQL instance and set `DATABASE_URL`
3. Set `JWT_SECRET`
4. Build Command: `npm ci && npm run generate && npm run migrate && npm run build`
5. Start Command: `npm start`
6. In the Static Site (frontend) set `VITE_API_URL` to the API URL

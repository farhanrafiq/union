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

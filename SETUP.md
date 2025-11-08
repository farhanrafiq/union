# Union Registry - Quick Setup Guide

## ✅ What Changed

**localStorage is REMOVED** - All data now persists in Neon PostgreSQL via API only. Cookie-based authentication replaces token storage in localStorage.

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- A Neon PostgreSQL database ([free tier](https://neon.tech))

### 1. Clone & Install

```bash
git clone https://github.com/farhanrafiq/union.git
cd union

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Setup Backend Database

1. Create a Neon PostgreSQL database at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string (starts with `postgresql://`)
3. Create `server/.env`:

```bash
cd server
cp .env.example .env
```

4. Edit `server/.env` and add your Neon connection string:

```env
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-random-secret-key
PORT=8080
FRONTEND_ORIGIN=http://localhost:5173
NODE_ENV=development
```

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

5. Run database migrations and seed:

```bash
npm run generate
npm run migrate
npm run seed
```

This creates a demo dealer account: `dealer1` / `Union@2025`

### 3. Setup Frontend

Create `.env` in the project root:

```bash
cd ..  # back to project root
```

The `.env` file should already exist with:
```env
VITE_API_URL=http://localhost:8080
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
# from project root
npm run dev
```

Open http://localhost:5173 and login with `dealer1` / `Union@2025`

---

## Deployment to Render

### Option 1: Using render.yaml (Recommended)

1. Push code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click **"New +"** → **"Blueprint"**
4. Connect your GitHub repo
5. Render will automatically detect `render.yaml` and deploy:
   - Backend API (with Neon DB)
   - Frontend static site
6. Set environment variables in Render dashboard:
   - **Backend service:**
     - `DATABASE_URL` = Your Neon connection string
     - `JWT_SECRET` = Random secret (Render can auto-generate)
     - `FRONTEND_ORIGIN` = Your frontend URL from Render (e.g., `https://union.onrender.com`)
   - **Frontend service:**
     - `VITE_API_URL` = Your backend URL from Render (e.g., `https://union-api.onrender.com`)

### Option 2: Manual Deployment

Follow the detailed steps in [DEPLOYMENT.md](./DEPLOYMENT.md)

**Important:** After deployment, ensure:
- Backend has `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_ORIGIN` set
- Frontend has `VITE_API_URL` pointing to your backend URL
- CORS is configured properly with the frontend origin

---

## Key Features

✅ **Cookie-based Authentication** - Secure HttpOnly cookies, no localStorage  
✅ **Neon PostgreSQL** - All data persists in cloud database  
✅ **Session Restoration** - Auto-login on page refresh via `/api/auth/me`  
✅ **Admin Panel** - Manage dealers, view audit logs  
✅ **Dealer Dashboard** - Manage employees & customers  
✅ **Universal Search** - Search across all entities  
✅ **Password Reset** - Forgot password with temp password generation  

---

## Testing the App

### Test Authentication
1. **Login:** Use `dealer1` / `Union@2025`
2. **Refresh:** Page should stay logged in (cookie auth)
3. **Logout:** Should clear session completely
4. **Forgot Password:** Enter `dealer1`, check server logs for temp password

### Test Data Persistence
1. Create an employee or customer
2. Close browser completely
3. Reopen and login → data should still be there (Neon DB)

### Test Admin
1. Go to `/admin`
2. Login with admin password (set in server config, default: check seed file)
3. View dealers, suspend/activate, view audit logs

---

## API Endpoints

### Auth
- `POST /api/auth/login` - Dealer login (sets cookie)
- `POST /api/auth/admin/login` - Admin login (sets cookie)
- `GET /api/auth/me` - Get current user (from cookie)
- `POST /api/auth/logout` - Logout (clears cookie)
- `POST /api/auth/forgot` - Password reset
- `POST /api/auth/change-password` - Change password

### Dealers (Admin only)
- `GET /api/admin/dealers` - List all dealers
- `POST /api/admin/dealers` - Create dealer
- `PATCH /api/admin/dealers/:id` - Update dealer
- `POST /api/admin/dealers/:id/suspend` - Suspend dealer
- `POST /api/admin/dealers/:id/activate` - Activate dealer
- `POST /api/admin/dealers/:id/delete` - Delete dealer
- `POST /api/admin/dealers/:id/reset-password` - Reset password

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PATCH /api/employees/:id` - Update employee
- `POST /api/employees/:id/terminate` - Terminate employee

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer
- `POST /api/customers/:id/terminate` - Terminate customer

### Search
- `GET /api/search?q=query` - Universal search

---

## Troubleshooting

### "API not configured" error
- Ensure `.env` has `VITE_API_URL=http://localhost:8080`
- Restart the frontend dev server after changing `.env`

### CORS errors in browser
- Backend must have `FRONTEND_ORIGIN` set correctly in `.env`
- For local dev: `FRONTEND_ORIGIN=http://localhost:5173`
- For production: Set to your deployed frontend URL

### Database connection errors
- Verify Neon connection string is correct
- Ensure `?sslmode=require` is at the end of the connection string
- Check Neon dashboard for connection limits (free tier: 10 concurrent)

### Session not persisting
- Check browser cookies are enabled
- Verify backend is setting cookies (check Network tab → Response Headers → Set-Cookie)
- Ensure `credentials: 'include'` is in frontend fetch requests (already implemented)

### Server won't start
- Run `npm install` in `server/` directory
- Check `.env` file exists and has all required variables
- Run `npm run generate` to generate Prisma client

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express + TypeScript + Prisma
- **Database:** PostgreSQL (Neon)
- **Auth:** JWT with HttpOnly cookies
- **Deployment:** Render (frontend + backend)

---

## License

MIT

## Support

Issues: https://github.com/farhanrafiq/union/issues

# Quick Start Guide - Local Development with Cross-Device Sync

## 1. Start Backend API

```bash
cd server
npm install
```

Create `server/.env`:
```
DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-random-secret-here
NODE_ENV=development
```

Initialize database:
```bash
npm run generate
npm run migrate
npm run seed
npm run dev
```

Backend running on http://localhost:8080

## 2. Start Frontend

```bash
cd ..  # Back to project root
npm install
```

The `.env.local` file is already created with:
```
VITE_API_URL=http://localhost:8080
```

Start frontend:
```bash
npm run dev
```

Frontend running on http://localhost:5173

## 3. Test Cross-Device Sync

1. Open browser 1: http://localhost:5173
2. Login as dealer: `dealer1` / `Union@2025`
3. Add a new employee
4. Open browser 2 (or incognito): http://localhost:5173
5. Login with same dealer credentials
6. Employee appears! ✅ Data synced via API

## Deploying to Production

See [README.md](./README.md) for Render deployment instructions or [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide.

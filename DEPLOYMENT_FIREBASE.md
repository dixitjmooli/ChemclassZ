# Deployment Guide - Firebase + Vercel

## Quick Deployment (10 minutes total)

### 1. Set up Firebase (5 min)
Follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### 2. Add Firebase config to .env.local
Copy all 6 Firebase config values from Firebase console

### 3. Deploy to Vercel (5 min)
```bash
git add .
git commit -m "Ready to deploy"
git push origin main
```
Then import repo in Vercel and add environment variables.

### 4. Seed production database
```bash
curl -X POST https://your-app.vercel.app/api/firebase/seed
```

Done! 🎉 Your app is live at `https://your-app.vercel.app`

## Login Credentials
- Admin: `admin` / `admin123`
- Students: `student1` / `student123`, `student2` / `student123`

## Benefits of This Setup
✅ No database server to manage
✅ Real-time updates built-in
✅ Free tiers are generous
✅ Auto deployments from GitHub
✅ Global CDN via Vercel
✅ Automatic HTTPS

## Total Cost: FREE! ☺️

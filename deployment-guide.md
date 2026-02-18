# Deployment Guide for ChemClass Pro

## Quick Deployment Options

### Option 1: Vercel + PostgreSQL (Recommended)
1. Get a free PostgreSQL database from [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app)
2. Update your `.env` file with the database URL
3. Push code to GitHub
4. Connect Vercel to your GitHub repo
5. Deploy!

### Option 2: Render.com (All-in-one)
Render provides both hosting and database.

## Step-by-Step: Deploy to Vercel

### 1. Set up PostgreSQL Database (Free Tier)

**Option A: Supabase (Recommended)**
1. Go to https://supabase.com
2. Sign up and create a new project
3. Wait for project to be ready (1-2 minutes)
4. Go to Settings → Database
5. Copy the "Connection string" (use the one that starts with `postgresql://`)

**Option B: Neon (Easier)**
1. Go to https://neon.tech
2. Sign up and create a new project
3. Copy the connection string

### 2. Update Environment Variables

Create `.env.local`:
```
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### 3. Update Prisma for PostgreSQL

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite" to "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4. Run Database Migration

```bash
bun prisma db push
```

### 5. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 6. Deploy on Vercel

1. Go to https://vercel.com and sign up
2. Click "Add New Project"
3. Import your GitHub repository
4. Add environment variable:
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string
5. Click "Deploy"

## Important: Add .gitignore

Make sure your `.gitignore` includes:
```
node_modules/
.next/
.env
.env.local
.env.production
db/
*.db
```

## Alternative: Railway (Easier for Full Stack)

1. Go to https://railway.app
2. Create a new project
3. Add a PostgreSQL service
4. Add your GitHub repository
5. Railway will auto-detect Next.js
6. Set DATABASE_URL environment variable
7. Deploy!

## Testing Before Production

Test locally with PostgreSQL:
```bash
# Set your PostgreSQL URL
export DATABASE_URL="postgresql://..."

# Push schema
bun prisma db push

# Run dev server
bun run dev
```

## Post-Deployment Checklist

- [ ] Database is PostgreSQL/MySQL (not SQLite)
- [ ] Environment variables are set
- [ ] `.gitignore` excludes sensitive files
- [ ] Test the deployed app
- [ ] Test login functionality
- [ ] Test test marks entry
- [ ] Verify data persistence

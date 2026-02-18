# 🚀 Quick Start Guide - Firebase Setup

You've made the right choice! Firebase will make your app amazing with real-time updates. Here's exactly what to do:

## Step 1: Create Firebase Project (5 minutes)

1. Go to: https://console.firebase.google.com/
2. Click **"Create a project"**
3. Name it: `ChemClass-Pro`
4. **UNCHECK** "Enable Google Analytics"
5. Click **"Create project"**
6. Wait 1-2 minutes, then click **"Continue"**

## Step 2: Enable Firestore (2 minutes)

1. In Firebase console, go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Choose a location (pick one closest to you)
4. Click **"Create"**
5. Select **"Start in Test Mode"**
6. Click **"Enable"**

## Step 3: Enable Authentication (1 minute)

1. Go to **Build** → **Authentication**
2. Click **"Get Started"**
3. Go to **"Sign-in method"** tab
4. Click **"Email/Password"**
5. Enable the toggle
6. Click **"Save"**

## Step 4: Get Configuration (1 minute)

1. Click **⚙️ Settings** gear icon (top left)
2. Scroll to "Your apps" section
3. Click **"</>"** (Web icon)
4. Name: `ChemClass-Pro-Web`
5. **Don't** check Firebase Hosting
6. Click **"Register app"**
7. Copy the `firebaseConfig` object (you'll see 6 values)

## Step 5: Add to Your Project

Create `.env.local` file and paste your config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

Replace the values with what you copied from Firebase!

## Step 6: Set Firestore Rules

Go to **Firestore** → **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /progress/{progressId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /pdfs/{pdfId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **"Publish"**.

## Step 7: Seed Users

The dev server should automatically restart. Then in another terminal:

```bash
curl -X POST http://localhost:3000/api/firebase/seed
```

## Step 8: Test!

Open http://localhost:3000 and login:

**Admin:**
- Username: `admin`
- Password: `admin123`

**Students:**
- Username: `student1`, Password: `student123`
- Username: `student2`, Password: `student123`

## Step 9: Deploy to Vercel (5 minutes)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Firebase setup complete"
   git push origin main
   ```

2. Go to https://vercel.com → **Add New Project** → Import your GitHub repo

3. Add all 6 Firebase environment variables (from `.env.local`)

4. Click **"Deploy"**

5. After deployment, seed production:
   ```bash
   curl -X POST https://your-app.vercel.app/api/firebase/seed
   ```

Done! 🎉

## Total Time: ~15 minutes

## Need Help?

- Firebase setup details: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- Full deployment guide: See [DEPLOYMENT_FIREBASE.md](./DEPLOYMENT_FIREBASE.md)
- Complete README: See [README.md](./README.md)

## What You Get

✅ Real-time updates (students see marks instantly)
✅ Built-in authentication
✅ No database to manage
✅ Free hosting (Vercel)
✅ Free database (Firebase)
✅ Global CDN
✅ Automatic HTTPS

**Total Cost: $0** ☺️

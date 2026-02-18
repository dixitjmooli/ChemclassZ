# Firebase Setup Guide for ChemClass Pro

## Step 1: Create Firebase Project (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Create a project" (or "Add project")
3. Enter project name: `ChemClass-Pro` (or your choice)
4. **Important:** UNCHECK "Enable Google Analytics for this project" (keeps it simple)
5. Click "Create project"
6. Wait for project to be created (1-2 minutes)
7. Click "Continue" when done

## Step 2: Set up Firestore Database (3 minutes)

1. In your Firebase console, go to **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose a location (pick closest to your users):
   - US, Europe, Asia, etc.
4. Click **"Create"** 
5. Choose **"Start in Test Mode"** (allows read/write for testing)
6. Click **"Enable"**

## Step 3: Enable Authentication (2 minutes)

1. Go to **"Build"** → **"Authentication"**
2. Click **"Get Started"**
3. Go to **"Sign-in method"** tab
4. Click on **"Email/Password"**
5. Enable the toggle
6. Click **"Save"**

## Step 4: Get Firebase Configuration (1 minute)

1. Click the **⚙️ Settings** gear icon (Project Settings)
2. Scroll down to "Your apps" section
3. Click **"</>"** icon (Web icon)
4. Register app: Name it `ChemClass-Pro-Web`
5. **Don't** check "Firebase Hosting"
6. Click **"Register app"**
7. You'll see a code block like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```
8. Copy this configuration - you'll need it!

## Step 5: Add Configuration to Your Project

Create or update `.env.local` file in your project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

Replace the values with what you got from Firebase console.

## Step 6: Firestore Security Rules

Go to Firestore → **"Rules"** tab and replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Progress collection
    match /progress/{progressId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // PDFs collection
    match /pdfs/{pdfId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Click **"Publish"** to save the rules.

## Next Steps

Once you have the Firebase configuration:
1. Tell me you have the config
2. I'll update the code to use Firebase
3. We'll create initial users
4. Test everything

## Why Firebase is Great for This App

✅ Real-time updates - Admin changes marks, students see instantly
✅ Built-in authentication
✅ No database server to manage
✅ Works perfectly with Vercel
✅ Generous free tier
✅ Offline support

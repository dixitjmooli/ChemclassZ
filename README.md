# ChemClass Pro - CBSE Class 12 Chemistry

A comprehensive progress tracking application for CBSE Class 12 Chemistry with 10 chapters, detailed topics, and milestone-based learning.

**✅ Now using Firebase for real-time database and easy deployment!**

## Features

### For Students
- Track progress across 10 CBSE Chemistry chapters
- Mark completion of lectures, NCERT reading, Level 1 & 2 questions
- Track HOTS questions and short notes
- View test marks and performance
- **Real-time progress updates** (see changes instantly!)

### For Admins
- Manage student accounts
- Enter test marks by chapter (batch entry)
- Manage PDF study materials
- View overall class statistics
- Track individual student progress
- **Real-time sync** - changes reflect immediately for students

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Database:** Firebase Firestore (Real-time NoSQL)
- **Authentication:** Firebase Auth (Email/Password)
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Icons:** Lucide React

## Quick Start with Firebase

### Step 1: Set up Firebase (5 minutes)

Follow the detailed guide in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md):

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Get your Firebase configuration
5. Set Firestore security rules

### Step 2: Configure Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### Step 3: Install and Run

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

### Step 4: Seed Initial Users

Once the server is running, seed the database:

```bash
# This creates admin and student users
curl -X POST http://localhost:3000/api/firebase/seed
```

Or use a tool like Postman to POST to `http://localhost:3000/api/firebase/seed`

### Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Student Accounts:**
- Username: `student1` / Password: `student123` (Rahul Sharma)
- Username: `student2` / Password: `student123` (Priya Singh)

## Deployment

### Deploy to Vercel (Easiest - Free!)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/chemclass-pro.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com and sign up
   - Click "Add New Project"
   - Import your GitHub repository
   - Add all Firebase environment variables (from `.env.local`)
   - Click "Deploy"

3. **After Deployment:**
   - Seed the production database:
     ```
     POST https://your-app.vercel.app/api/firebase/seed
     ```

That's it! Your app is now live! 🎉

## Why Firebase?

✅ **Real-time Updates** - Admin enters marks, students see them instantly
✅ **Built-in Authentication** - No need to build login system
✅ **No Database Management** - Firebase handles everything
✅ **Works Great with Vercel** - Serverless-friendly
✅ **Generous Free Tier** - 50K reads/day, 20K writes/day free
✅ **Offline Support** - Works offline, syncs when back online
✅ **Easy Setup** - Just add config and go!

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/login/          # Login API
│   │   │   ├── admin/students/      # Students API
│   │   │   └── firebase/seed/       # Seed initial users
│   │   ├── page.tsx                # Main application
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   └── ui/                     # shadcn/ui components
│   ├── data/
│   │   └── chapters.ts             # CBSE chapter data
│   ├── lib/
│   │   └── firebase.ts             # Firebase configuration
│   └── types/
│       └── chemistry.ts            # TypeScript types
├── prisma/                         # Legacy (not used anymore)
└── public/                         # Static assets
```

## API Endpoints

- `POST /api/auth/login` - User login
- `GET /api/admin/students` - Get all students
- `POST /api/firebase/seed` - Seed initial users

## Development Commands

```bash
# Development server
bun run dev

# Build for production
bun run build

# Start production server
bun start

# Lint code
bun run lint
```

## Environment Variables

Create `.env.local` with Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

## Firebase Console Setup

### Security Rules

In Firestore → Rules tab:

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

## Troubleshooting

### Firebase not initialized error
- Make sure you've added Firebase config to `.env.local`
- Restart the dev server after adding env vars
- Check that all 6 Firebase config values are present

### Login not working
- Check that you've seeded the database with `/api/firebase/seed`
- Verify username and password match the seeded users
- Check browser console for errors

### Can't see real-time updates
- Firebase Firestore real-time updates work automatically
- No polling needed - Firebase handles the sync

## License

MIT

## Support

For Firebase setup help, see [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

For other issues, please open an issue on GitHub.

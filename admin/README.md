# Grants Platform Admin UI

Next.js application for managing grants in Firestore.

## Setup

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Firebase configuration keys in `.env.local`.
   - You can find these in the Firebase Console -> Project Settings.

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Features

- **Google Sign-In**: Secure access via Firebase Auth.
- **Grants Dashboard**: Real-time view of grants from Firestore.
- **Live Updates**: Changes in Firestore appear instantly.

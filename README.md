# MindBeat 🧠⚡

Quiz. Compete. Beat your friends. — a mobile-first quiz competition app built for [your school name].

This README assumes you have **zero prior experience with Firebase**. Follow the steps in order.

---

## 1. Install dependencies

Open this folder in VS Code, open a terminal (`` Ctrl+` ``), and run:

```bash
npm install
```

---

## 2. Create your free Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with any Google account.
2. Click **"Add project"** → name it `mindbeat` (or anything) → you can disable Google Analytics for this project, it's not needed → click **Create**.
3. Once created, click the **web icon (`</>`)** on the project overview page to register a web app. Name it `MindBeat` and click **Register app**.
4. Firebase will show you a `firebaseConfig` object with keys like `apiKey`, `authDomain`, etc. **Keep this tab open**, you'll need these values in Step 4.

### Turn on Authentication
1. In the left sidebar, click **Build → Authentication → Get started**.
2. Under "Sign-in method", enable **Email/Password**. Save.

### Turn on Firestore Database
1. In the left sidebar, click **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** → pick a location close to Pakistan (e.g. `asia-south1` or `europe-west`) → Enable.

---

## 3. Add your Firestore security rules

1. In Firestore Database, click the **Rules** tab.
2. Delete everything there and paste the entire contents of the `firestore.rules` file from this project.
3. **Important:** replace `"your-email@example.com"` in that file with the email you're going to use as your admin account (the account that will add quiz questions).
4. Click **Publish**.

---

## 4. Connect your app to Firebase

1. In this project, copy `.env.example` and rename the copy to `.env`
2. Open `.env` and fill in the values from the `firebaseConfig` object you saw in Step 2:

```
VITE_FIREBASE_API_KEY=paste_here
VITE_FIREBASE_AUTH_DOMAIN=paste_here
VITE_FIREBASE_PROJECT_ID=paste_here
VITE_FIREBASE_STORAGE_BUCKET=paste_here
VITE_FIREBASE_MESSAGING_SENDER_ID=paste_here
VITE_FIREBASE_APP_ID=paste_here
```

3. Open `src/firebase.js` and change `ADMIN_EMAIL` to the **same email** you put in `firestore.rules`. This is the only account that can open the `/admin` page to add questions.

---

## 5. Run it locally

```bash
npm run dev
```

Open the URL it shows (usually `http://localhost:5173`) in your browser. To test the mobile view, open Chrome DevTools (`F12`) → click the phone/tablet icon → refresh.

**To test on your actual phone** while developing: make sure your phone and laptop are on the same WiFi, then run `npm run dev -- --host` and open the "Network" URL it prints on your phone's browser.

---

## 6. Create your admin account and add questions

1. Open the app, sign up as a normal student **using the same email you set as `ADMIN_EMAIL`**.
2. Go to `yourapp.com/admin` (or `localhost:5173/admin` while testing).
3. Click **"Seed starter question bank (one-time)"** — this loads the sample questions from `src/data/questions.json` into Firestore so the app isn't empty.
4. Use the form to add your own questions — especially **School Trivia** ones (fun facts specific to your school), and **Class Revision** ones matching your actual syllabus. Aim for at least 15-20 per category before launch so quizzes don't repeat too fast.

---

## 7. Deploy it online (so anyone can open it via a link)

1. Install the Firebase CLI (one-time, needs Node.js which you already have for VS Code):
   ```bash
   npm install -g firebase-tools
   ```
2. Log in:
   ```bash
   firebase login
   ```
3. Connect this folder to your Firebase project:
   ```bash
   firebase init hosting
   ```
   - Choose **"Use an existing project"** → select your `mindbeat` project
   - Public directory: type `dist`
   - Configure as single-page app: **Yes**
   - Don't overwrite `index.html` if asked
4. Build and deploy:
   ```bash
   npm run build
   firebase deploy
   ```
5. Firebase will give you a live URL like `https://mindbeat-xxxxx.web.app` — **this is the link you share with your school** (QR code it for assembly!).

Whenever you make changes later, just run `npm run build && firebase deploy` again to update the live site.

---

## Project Structure

```
mindbeat/
  src/
    main.jsx           → app entry point
    App.jsx             → routing + bottom nav shell
    firebase.js         → Firebase connection (uses .env values)
    index.css           → design system (colors, buttons, cards)
    context/
      AuthContext.jsx    → login state, signup/login/logout logic
    utils/
      gamification.js    → scoring, streaks, badges logic
    data/
      questions.json      → starter question bank
    components/
      BottomNav.jsx        → Home/Play/Ranks/Profile tab bar
      Loader.jsx            → loading spinner
    pages/
      Login.jsx              → signup/login screen
      Home.jsx                → dashboard (streak, points, Play button)
      Play.jsx                  → category picker
      Quiz.jsx                   → question-answering + results screen
      Leaderboard.jsx              → class + school-wide rankings
      Challenge.jsx                 → search classmate + send challenge
      ChallengePlay.jsx              → play a specific challenge
      Profile.jsx                     → stats, badges, history, logout
      Admin.jsx                        → add new questions (admin only)
```

## Making changes / adding features later
- **Add more questions:** just use the `/admin` page — no code needed.
- **Change colors/branding:** edit `tailwind.config.js` (the `violet`, `sun`, `mint`, `coral` values) and `index.css`.
- **Change app name/icon:** edit `vite.config.js` (PWA manifest section) and replace `public/icon-192.png` / `public/icon-512.png` with your own logo (same file names, same sizes).
- **Weekly leaderboard reset, push notifications, ads, subscriptions:** intentionally left out of this V1 to keep things simple and free to run. These are natural "Version 2" additions once the core app is tested with real students.

## Costs
Everything here runs on Firebase's **free Spark plan**, which comfortably covers a single school (50k reads/20k writes per day free). You will not need to pay anything to launch and run this for your school.

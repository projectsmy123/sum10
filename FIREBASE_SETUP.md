# Firebase Setup for the Real-Time Leaderboard

This version already includes your Firebase web app config in `game.js`.

## Firebase Project

```text
projectId: addition-of-10-game
collection: scores
```

## What you still need to do in Firebase Console

### 1. Create Firestore Database

1. Open Firebase Console.
2. Open your project: `addition-of-10-game`.
3. Go to **Build → Firestore Database**.
4. Click **Create database**.
5. Choose **Production mode**.
6. Choose your preferred location.
7. Click **Enable**.

### 2. Add Firestore Rules

Go to **Firestore Database → Rules** and paste this:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /scores/{scoreId} {
      allow read: if true;

      allow create: if
        request.resource.data.keys().hasOnly([
          'name',
          'school',
          'grade',
          'avatarKey',
          'score',
          'bestCombo',
          'level',
          'mistakes',
          'misses',
          'createdAt',
          'createdAtLocal'
        ]) &&
        request.resource.data.name is string &&
        request.resource.data.name.size() >= 1 &&
        request.resource.data.name.size() <= 18 &&
        request.resource.data.school is string &&
        request.resource.data.school.size() >= 1 &&
        request.resource.data.school.size() <= 36 &&
        request.resource.data.grade is string &&
        request.resource.data.grade.matches('^Grade [1-5]$') &&
        request.resource.data.avatarKey is string &&
        request.resource.data.score is number &&
        request.resource.data.score >= 0 &&
        request.resource.data.score <= 10000000 &&
        request.resource.data.bestCombo is number &&
        request.resource.data.bestCombo >= 0 &&
        request.resource.data.bestCombo <= 100000 &&
        request.resource.data.level is number &&
        request.resource.data.level >= 1 &&
        request.resource.data.level <= 1000 &&
        request.resource.data.mistakes is number &&
        request.resource.data.mistakes >= 0 &&
        request.resource.data.mistakes <= 5 &&
        request.resource.data.misses is number &&
        request.resource.data.misses >= 0 &&
        request.resource.data.misses <= 5;

      allow update, delete: if false;
    }
  }
}
```

Then click **Publish**.

## GitHub Upload

Upload these to your repository root:

```text
index.html
style.css
game.js
README.md
FIREBASE_SETUP.md
assets/
```

Do not skip `assets/`.

## Test

1. Open the GitHub Pages game on two devices.
2. Play and finish a game on one device.
3. The score should appear in the top 10 leaderboard on the other device.

If Firebase is not ready, the game will temporarily use the browser's local leaderboard.


## V13 Fix

This package fixes the missing `FIREBASE_CONFIG` constant inside `game.js`.

Expected success message on the game leaderboard screen:

```text
Online leaderboard is live. Game starts soon...
```

If it still says local leaderboard, check:

1. Firestore Database is created.
2. Rules are published.
3. GitHub Pages has the latest `index.html`, `style.css`, `game.js`, and `assets/`.
4. Browser cache is cleared with Ctrl + F5.

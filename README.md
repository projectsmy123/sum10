# Addition of 10 Balloon Game - DOM v5

This version keeps the working DOM-based tap system and adds:

- A visible How to Play screen.
- All addition bonds that make 10.
- Chaotic Brownian-style balloon movement.
- Cute cartoon dinosaurs at the bottom.
- Funny dinosaur chewing animation when a correct balloon is missed.
- Dinosaur says “Yum yum yummy!” with extra funny sound effects.
- Six generated image avatars in `assets/avatars/`.
- Selected avatar appears in the picker, leaderboard, final screen, and as the in-game pointer.
- Player name overlay appears on the avatar outfit.

Upload the full contents of this folder to the GitHub repository root:

```text
index.html
style.css
game.js
README.md
assets/
```

Do not upload only the HTML/CSS/JS files, because v5 needs the avatar images inside `assets/avatars/`.


V7 updates:
- Replaced avatars with superhero flying avatars.
- Player name stays visible on the avatar clothing during gameplay.
- Added nitro-style fire trail from the avatar legs while moving.
- Added finger-prick pop effect on balloon taps.

V8 updates:
- Finger-prick impact made much more visible with impact ring, spark burst, and PRICK label.
- Nitro fire is now larger, more colorful, and more dramatic with extra glow and more particles.

V9 updates:
- Added 3 text lines on each dinosaur body: English, Tamil, and Sinhala message about loving to eat 10s.

V10 updates:
- Swapped avatar art to transparent-background superhero cutouts, so no white box appears during play.
- Removed the extra hand/finger overlay.
- Balloon prick is now performed by the avatar image's own pointed finger.


Stage 2 updates:
- Added Firebase Firestore support for a real shared leaderboard.
- Added localStorage fallback when Firebase config is not inserted yet.
- Added `FIREBASE_SETUP.md` with setup instructions and Firestore security rules.


V12 Firebase-configured update:
- Firebase web app config has been inserted into `game.js`.
- Firestore collection name is `scores`.
- The game listens to Firestore in real time for the top 10 leaderboard.
- The game saves each completed score to Firestore.
- If Firestore is not enabled or rules are missing, it falls back to the local browser leaderboard.

# Total Is 10 — Balloon Game

This is a mobile-friendly educational game for children.

## Current version: v19 full rewrite

Features included:

- Overall real-time Firebase leaderboard
- No daily leaderboard reset
- No leaderboard filtering
- Name, school, grade, and avatar selection
- Avatar labels:
  - Boys: Newton, Pythagoras, Euclid
  - Girls: Sophie, Emmy, Maria
- Short trilingual How to Play screen
- Fixed trilingual title:
  - TOTAL IS 10
  - එකතුව 10
  - மொத்தம் 10
- Chaotic balloon movement
- Correct balloons are addition bonds of 10
- Correct tap: avatar pricks balloon, hearts appear, +1000 points
- Wrong tap: thumbs-down
- Correct balloon reaching bottom: dinosaur eats it and says “Yum yum yummy!”
- Game over after 5 dinosaur eats or 5 wrong taps
- Difficulty increases every 30 seconds
- Superhero avatar follows the touch/mouse pointer
- Nitro fire appears from avatar movement
- Overall top 10 leaderboard appears before and after gameplay

## Firebase

The game uses Cloud Firestore collection:

```text
scores
```

The Firebase config is already inside `game.js`.

Upload to GitHub root:

```text
index.html
style.css
game.js
README.md
FIREBASE_SETUP.md
assets/
```

Do not skip `assets/`.


V20 Stage 3 polish:
- Keeps the overall Firebase leaderboard unchanged.
- Adds combo display in the HUD.
- Adds stronger correct-tap effects: hearts, candy burst, sparkles, praise badge, score badge.
- Adds stronger wrong-tap feedback: thumbs-down, Find 10 text, red flash, small shake.
- Adds level-up confetti and screen flash.
- Adds clearer dinosaur-eating feedback.
- Improves game background and balloon gloss for a more polished kids-game feel.


V21 shareable polish:
- Adds personal best tracking on the current device.
- Adds next-target message on the final screen.
- Adds Share Score button using the Web Share API where available.
- Adds Copy Challenge fallback.
- Adds Download Score Card as PNG.
- Adds stronger replay-loop messaging.

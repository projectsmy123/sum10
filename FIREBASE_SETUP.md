# Firebase Setup — Overall Real-Time Leaderboard

This game uses Cloud Firestore for the overall leaderboard.

## Firestore path

```text
scores/{scoreId}
```

## Firestore rules

Go to:

```text
Firebase Console → Firestore Database → Rules
```

Paste this and click **Publish**:

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

## Manual leaderboard reset

No automatic reset is included.

To reset scores manually:

1. Go to **Firestore Database → Data**.
2. Open the `scores` collection.
3. Delete score documents.

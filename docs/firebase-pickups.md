# Firebase Pickups Setup

This site reads public-safe pickup notifications from Firestore and shows them as subtle social-proof toasts. It never writes to Firestore from the public website.

## Collection

Create a Firestore collection named `pickups`.

Each document can contain:

- `action` string, e.g. `Ready for pickup`
- `itemDescription` string, e.g. `Spiral bound project file`
- `customerLabel` string, e.g. `Engineering student`
- `icon` string, optional Font Awesome class, e.g. `fa-solid fa-book`
- `timestamp` Firestore timestamp

Do not store customer names, phone numbers, addresses, file names, or other private data in this collection.

## Temporary Manual Workflow

Until the separate WhatsApp print-agent writes pickup data automatically:

1. Open Firebase Console.
2. Go to Firestore Database.
3. Open the `pickups` collection.
4. Add a document with generic public-safe fields.
5. Set `timestamp` to the current server timestamp.

The website reads the newest entries. If there are no entries, the notification component stays hidden.

## Security Rules

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /pickups/{pickupId} {
      allow read: if true;
      allow create, update, delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Plain language: public visitors can read the generic pickup notifications only. They cannot create, edit, or delete anything from the website. All other Firestore collections are blocked.

## Future Integration TODO

When the WhatsApp print-agent project is ready, connect that backend to write sanitized pickup documents to this collection using trusted server credentials. Do not expose write access in the browser.

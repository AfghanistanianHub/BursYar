# Firebase integration plan for BursYar

Existing Firebase project: `afghanistanian-scholarships` (reported/observed in Firebase Console). **Do not deploy any rules from this file without reviewing existing production collections**, because the default deny may interrupt unrelated functionality.

## Data access boundary

Public clients read only reviewed records from `scholarships` where `status == "published"`. Writes are denied through client SDKs. A trusted server using Firebase Admin SDK will need separate administrative authentication and a human approval workflow before publishing.

Suggested minimum fields for a reviewed scholarship:
- `title`: string
- `provider`: string
- `country`: string
- `degree_level`: string
- `official_url`: HTTPS URL to authoritative source
- `deadline`: nullable timestamp
- `status`: "published"
- `verified_at`: timestamp
- `translations`: object with `en`, `fa`, `ps`, each approved
- `source_excerpt`: string

Never publish unreviewed model-generated text. Keep draft generations and internal reviewer logs server-only. Admin SDK bypasses Firestore Security Rules, so backend authorization must be independently enforced.

## Client setup (not yet executed)

1. Review existing Firebase project database and its rules before any changes.
2. Add Firebase web config in Vite variables prefixed with `VITE_FIREBASE_`. These client configuration values are public identifiers, **not secrets**.
3. Keep Meta API keys and service-account credentials exclusively in secure server environments.
4. Query `scholarships` with `where("status", "==", "published")`; Firestore rules are not filters.
5. Test rules with Firebase Emulator Suite for anonymous reads and denied writes before deployment.
6. Add pagination and caches for low-bandwidth devices.

## Release checklist

- [ ] Verify actual Firestore database state and backups
- [ ] Test anonymous list/get of published records
- [ ] Test denial of unpublished drafts and all client mutations
- [ ] Verify administrative approval before publish
- [ ] Verify source link authenticity and translation quality
- [ ] Connect live FlutterFlow client only after rules are tested

This document and `firestore.rules` are proposed code, not applied production configuration.

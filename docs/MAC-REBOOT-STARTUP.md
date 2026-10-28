# BursYar after a Mac restart

Start with `~/Documents/BursYar/start-bursyar.command`, or run `npm run start:mac` in that checkout. Finder can open the command file in Terminal. Both services bind only to loopback and share one terminal; Ctrl+C stops them. This is post-login startup, not a public deployment or an automatically installed login service.

## One-time secure entry

`npm run setup:mac` opens a native macOS dialog. Enter the existing Meta API key in its masked field and the exact account-enabled model ID. Enter the hard account spending limit in USD and check confirmation only after verifying it in Meta. The $150 promotional-credit balance is not a spending limit. Saving without confirmation is permitted: the UI can start but authenticated analysis remains disabled. No paid inference is performed during setup, startup, or model-catalog checks. Completing this dialog requires the owner; never paste secrets into chat or a shell command.

The configuration is a generic-password item in the default macOS login Keychain, service `ai.bursyar.demo`, account equal to the current macOS username. No broad trusted-app ACL, iCloud synchronization, credential file export or plaintext fallback is configured. The helper uses Apple's Security framework; secret entry is through NSSecureTextField. The Node launcher captures the helper's result through a private pipe and supplies the Meta credential to the backend through its child environment. The helper refuses credential output to terminals or regular files. Raw subprocess errors are suppressed because they may contain captured output. Changing the compiled helper may cause macOS to request Keychain authorization again. Normal Keychain lock/unlock policy still applies; no security protection is disabled.

If the dialog is unavailable from an agent process, run `npm run setup:mac` in your ordinary logged-in Terminal. This is the same one-time setup and does not require reconfiguring Firebase. Cancel leaves the existing Keychain entry untouched. To change the key/model or spending confirmation, rerun setup. Never use a command containing the key.

## Existing state retained

- Firebase project: `afghanistanian-scholarships`.
- Existing ADC: `~/.bursyar-private/firebase-admin.json`, still outside Git, owned by the user and mode 600. It is not copied into Keychain or elsewhere by this change. The Admin SDK uses this existing file without printing its contents.
- Existing quota: `~/.bursyar-private/quota.sqlite`; must already exist, be a real file owned by the user with mode 600. Startup refuses missing files and symlinks instead of creating a replacement quota database. WAL state is preserved. A consistent SQLite backup was made before recovery.
- Public Firebase web config is recovered through read-only Firebase Management API using that existing ADC; no OAuth provider, IAM, Firebase claims or rules are changed. Recovery verified the ADC can list exactly one existing web app.
- Lost quota-limit environment values cannot be reconstructed from SQLite, which stores usage, not limits. Startup restores the documented baseline limits: 2/user/minute, 5/user/day, 20/global/day and 200000 lifetime reservation units. The existing 11762 lifetime units are retained, not reset. These units are not dollars; the externally configured Meta hard cap remains separate. Do not raise caps to make a demo request pass.

## Spending protection

The executable gateway requires `BURSYAR_SPENDING_CONFIRMED=1`, a positive finite `BURSYAR_SPEND_LIMIT_USD`, and a valid `BURSYAR_SPENDING_CONFIRMED_AT`. The Keychain launcher constructs these from the owner's saved confirmation; stale shell values cannot override them. Without confirmation, authenticated requests return generic HTTP 503 before provider calls or quota reservations. This records the owner's attestation of an external account cap; it does not verify or configure Meta billing and does not translate quota units into dollars. There are no automatic paid retries or startup inference calls. An actual successful authenticated provider request is still required before claiming live Meta verification.

## Checks and recovery

`npm run check:mac` checks the existing private files and reads the Keychain item without printing its content. `node verification/macos-start.mjs status` checks metadata without opening a credential-entry dialog. Missing/locked/denied Keychain access fails closed; the launcher never falls back to secrets in Git, .env, history or plaintext configuration. Compiled helper and its source digest live in `~/.bursyar-private/bin`; Swift compiler cache lives in ignored verification/artifacts. Rebuild happens only when the checked-in helper source changes.

After a reboot, no previous shell variables are needed. Node >=24.12, installed dependencies and the existing private directory remain prerequisites. The launcher will not kill occupied processes or reset quota state. Human translation review remains pending, and no public merge/deployment is implied.

Apple references: https://developer.apple.com/documentation/security/using-the-keychain-to-manage-user-secrets ; https://developer.apple.com/documentation/security/ksecclassgenericpassword .


If the launcher reports OSStatus -67674 (Module Directory Service), the calling process cannot use Keychain services. This does not mean the saved item is missing. Run start-bursyar.command from your normal logged-in Terminal; do not re-enter credentials or reset Keychain. Only an actual missing-item result requests setup. The agent may be unable to verify a credential saved successfully in the desktop session. Locked or denied access is reported separately, without exposing captured subprocess data.

## Correcting a saved spending attestation without changing the key

Meta's external account limit and the local Keychain confirmation are separate. The disabled message indicates the backend did not receive a valid explicit local confirmation. A stored amount alone is insufficient. `setup:mac` now preserves existing model, dollar amount and checkbox state when reopened; leaving the key field blank retains the saved key. It commits the active Cocoa field editor before reading values, accepts `$5` as well as `5`, and cancels without writing.

After explicitly confirming the actual external cap, use `start-bursyar.command --confirm-spending-usd 5`. This non-secret option updates only spendLimitUSD, spendingConfirmed and confirmedAt in the existing Keychain record, reads those fields back for verification, and starts the app. It does not request/reveal/replace the key or model, touch Firebase configuration, reset quota, or run paid inference. If the same cap is already confirmed, it leaves the record unchanged. It prints only allowlisted before/after diagnostics: schema version, credential/model field presence, saved USD amount, confirmation boolean and timestamp validity. No raw record, model ID or key value is printed. Future starts need only start-bursyar.command.

`npm run diagnose:mac` prints the same redacted stored format without changing anything. `check:mac` shows saved spending values and their effective backend mapping. The startup message and executable backend now share the exact same spending-policy predicate so they cannot disagree about confirmation validity. Actual saved-record inspection/update may require the owner's desktop session because the agent process has consistently received Keychain service OSStatus -67674. This is not evidence of a missing credential.

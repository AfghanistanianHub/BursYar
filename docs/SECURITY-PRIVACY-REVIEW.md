# Security and privacy review (engineering record)

Scope: what BursYar sends where, what it stores, and which gates enforce it.
This is an engineering record, not a security certification or legal privacy
assessment. Unverified items are labeled **UNVERIFIED**.

## Provider data boundary

The provider sees **only pasted public source text**. Per `engine/evidence.js`
(`evidencePrompt`), the model message is `{untrustedSource: text}`:

| Datum | Sent to provider? | Evidence |
|---|---|---|
| Pasted/fetched public source text | Yes | `engine/evidence.js` |
| Source URL | No (attribution only) | `engine/evidence.js:15-17` |
| Student UID / tokens | No | `engine/evidence.js`, [HACKATHON-READINESS](HACKATHON-READINESS-2026-10-28.md) |
| Profile / documents / quota state | No | `engine/evidence.js` |
| Credentials / raw errors | No (allowlisted diagnostics only) | `engine/capabilities.js` |

## Enforcement gates (in request order)

1. **Auth** — `engine/auth.js`: Firebase Admin verification; emulator hosts
   throw; `bursyarDemo` claim + aud/iss + non-anonymous enforced.
2. **Trusted policy** — `engine/trusted-policy.js` + `engine/provider-policy.js`:
   24h verified window, adult caller+subject, active consent (matching
   version/provider/subject), allowlisted country, jurisdiction allowed,
   Standard models only. Evaluated **before** prompts, quota, or provider call
   (`engine/http.js`).
3. **Spending + quota** — `engine/spending.js` triple-gate;
   `engine/remote-quota.js` (Supabase CAS RPC, SHA-256 UID) or `engine/quota.js`
   (SQLite WAL, owner-only). No retries or refunds; failures consume the
   reservation.
4. **Adapter** — `engine/meta.js`: pinned endpoint, `stream:false`, low
   reasoning, strict `bursyar_evidence_v1` schema, 128 KiB cap, single deadline.
   `finish_reason=length` is a hard failure.
5. **Evidence validation** — `engine/evidence.js`: exact-substring excerpts,
   Dari/Pashto script checks, verbatim deadline/funding; output carries
   `requiresHumanReview=true`, `selection.complete=false`.
6. **No fallback** — no provider/model fallback exists; the only fallback is the
   offline deterministic path (`engine/deterministic.js` on reviewed catalog).

## Storage

- Documents: Supabase (service-role RPC, RLS, SHA-256 owner hash) XOR local
  SQLite (0600); 10-doc cap; labels parsed, authenticity never asserted
  (`engine/documents.js`, `database/durable-documents.sql`).
- Firestore rules (`firestore.rules`, **UNVERIFIED whether applied to
  production**): published-only scholarship reads; drafts/review logs denied;
  default deny including user data.
- No Firebase token is forwarded to Supabase; Supabase keys are server-only;
  no `VITE_*` secrets (`.env.example` taxonomy; `engine/private-config.js`
  enforces owner-only 600 files or env JSON, mutually exclusive).
- Auth persistence is in-memory only (`src/auth.js`).

## Known limits and UNVERIFIED items

- **UNVERIFIED**: production applied-state of Firestore rules and Supabase SQL;
  backups unconfirmed.
- **UNVERIFIED**: currently-serving Render/Vercel SHAs (no hosting API access).
- Human semantic + Dari/Pashto fluency review pending
  (`docs/TRANSLATION-REVIEW.json`: `PENDING_HUMAN_REVIEW`).
- Live document file-upload UI check unfinished.
- Meta geo-policy flag: serving Afghan-located end users via Meta is
  restricted; deterministic/self-hosted path required unless authorized
  ([HACKATHON-RELEASE-HANDOFF.md](HACKATHON-RELEASE-HANDOFF.md)).
- All six [release gates](MISSION-01-RELEASE-GATES.md) remain **BLOCKED**.

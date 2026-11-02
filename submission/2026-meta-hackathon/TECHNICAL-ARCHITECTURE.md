# BursYar — technical architecture (submission)

Release `b60444b` (code `0960b24`). All claims verified in-repo; see
`docs/HACKATHON-SUBMISSION.md` for the full inventory.

```
Browser (vanilla JS, Vite) — en/fa/ps + RTL
  → Firebase ID token (approved demo accounts)
  → Loopback/hosted gateway: revocation, project, demo-claim checks
  → Policy gate (adult caller/subject, consent, jurisdiction, Standard-only)
  → Atomic quota reservation (SQLite local / Supabase remote)
  → Meta chat-completions adapter (text-only, strict JSON schema,
     timeout + size caps, no retry, no fallback model)
  → Exact-substring excerpt validation + source SHA-256 digest
  → Conservative requirements compiler (MET / NOT MET / UNKNOWN)
  → Consented profile comparison → barrier guidance → PathFinder
  → Isolated counterfactual scenarios (real facts immutable)
```

## Source paths (one analysis implementation)

URL fetch (server-side, robots-respecting) or supplied HTML/TXT →
bounded preview with provenance → explicit user approval → analysis.
Blocked pages keep the original URL and offer labeled paste/import;
supplied material is never presented as fetched.

## Evidence-first validation

The model returns candidate criteria with exact quotations. Local
code re-checks: substring presence in the approved source, source
digest match, supported rule syntax, contradictions, and provenance
before anything can influence an assessment. Compact output (≤4
criteria, ≤2 funding excerpts) never implies complete coverage
(`coverageComplete=false` always).

## Privacy boundary

Private documents and profiles live in owner-scoped storage behind
the authenticated gateway, with export and deletion. Meta receives
only pasted public source text — never the URL, identity, profile,
documents, or quota state. TXT-only educational ingestion (12 KB);
no PDF/OCR, no issuer integration, no admission prediction.

## Failure behavior

Policy, quota, network, or validation failures fail closed to the
deterministic offline path (reviewed rules, local assessment). No
automatic retries on inference; no provider fallback.

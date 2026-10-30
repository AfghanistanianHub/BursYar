# Mission 01 — architecture reconciliation (Draft / NOT release approved)

## Baseline and observed ancestry
- Preserved release candidate PR #21 head `84ea455`. GitHub compare reports PR #26 head `646e494` is **12 commits ahead / 0 behind** that head. This integration branch starts at the exact PR #26 head, without changing #21/#25/#26/#27.
- Selected **one** provider stack from #26: `trusted-policy.js` (server-only expiring evidence), `provider-policy.js` (pure deny-by-default routing), `providers.js` (exact adapters), and `http.js` (single authenticated route and actual adapter binding). PR #25's competing `provider-router.js`, family database and HTTP route implementation are **not imported**.
- Guardian grants are resolved from server-owned records on every request; `resolveFamilyScope` returns a derived, guardian-scoped storage identity. Family routes expose deterministic operations only. Revocation and expiration deny subsequent accesses.
- Deterministic catalog/evaluation from #26 remains functional independent of all external providers. Incomplete source coverage cannot become a complete eligibility decision.
- New hardening: the analysis gateway requires `user_content` classification. Client-submitted text can include student identifiers even if an accompanying URL looks official, so no `public_source` downgrade is permitted on this endpoint.

## Rejected implementations and data preservation
- **Critical rejection — PR #25**: `FamilyStore.transferAtMajority()` deletes the minor row and reports success without persistently creating an adult-owned profile. **Never cherry-pick or run that transfer.** This branch does not expose a transfer-at-majority endpoint. Existing guardian-scoped profile remains intact until a separately designed and reviewed migration is implemented.
- A future transfer must independently verify the adult recipient and legal majority, fresh owner consent and authority, make the destination write and old-owner authorization revocation a **single durable database transaction**, verify committed ownership before reporting success, support idempotent retries, and deny if the source or destination state is ambiguous. If databases differ, use a durable staged handoff with no source deletion before the destination is verified and an explicit acknowledgement is persisted. Test crash/retry/rollback and cross-user access.
- PR #27's candidate `assessBarriers()` trusts arbitrary caller-provided alternative text/URLs. Integrated only a fail-closed deterministic assessment mapping: `src/pathfinder.js` ignores alternatives and asks the institution instead of claiming documentation. A cited-alternative action remains blocked until evidence is verified by a trusted server-reviewed catalog. No fabricated eligibility, deadline or accepted test.

## Trust boundaries
1. Firebase token verification establishes a UID, not legal adulthood, residence, guardian authority or verified student age.
2. Server provisioned, short-lived, revocable records establish geography, age and consent for a named provider/model and subject; unknown is a denial.
3. `/api/analyze` accepts user-controlled text; assume it can carry personal information. Contributor Mode and public-only processing paths **must not** receive it.
4. Do not infer provider eligibility from guardian consent: Meta/Gemini underage subjects remain denied. Self-hosted local models require reviewed legal/security clearance and local-only endpoints.
5. Do not accept provider/model, guardian grants, age, country, provenance or funding terms from browser-supplied authoritative claims.
6. Source quotation matching is traceability, not authenticity, exhaustive coverage or semantic entailment.

## Security verification and release blockers
- Tests introduced: `engine/analysis-boundary.test.js` checks private classification, minor-targeted/guardian proxies, Contributor IDs, unknown policies, denied geography, consent; `tests/pathfinder-provenance.test.js` rejects fabricated source links and preserves tri-state fallbacks.
- Pending combined-head GitHub Actions verification: Node tests, offline evaluation, Firebase Emulator, browser/RTL and macOS helper. Prior green PR #21 and #27 checks **do not establish** this integration commit is green.
- **Blocking**: verified guardian authority/revocation and cross-user adversarial review; independent legal/terms verification for supported providers and countries; PR #27 proven-source alternative validation; selective GPA/TOEFL/glossary port and multilingual human approval; atomic transfer protocol and recovery tests if transfer is added; provider privacy/cost approval; final end-to-end combined CI and security review.
- No paid inference, live model requests, production changes, secrets changes or deployment in this mission. Never merge this Draft into a protected branch until blockers are resolved.

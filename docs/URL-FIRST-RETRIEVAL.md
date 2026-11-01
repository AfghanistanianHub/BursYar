# URL-first source preview

Stack: #8 → #9 → #10 → #11 → #12 → this change. No ancestry was rewritten.

The primary action opens the assistant. Sign in with an approved demo account, paste an HTTPS scholarship URL, and select Fetch scholarship page. This authenticated endpoint does **not** call Meta or reserve paid inference quota. Review extracted text, URL, retrieval time, digest and same-site links. Approve sending that text, then explicitly request analysis. Private documents are never included. Existing spending gates, Firebase authentication and transactional inference quotas remain intact.

## Retrieval and trust boundary

- HTTPS on its standard port, no credentials, bounded URL length, no trailing-dot hosts. No authentication cookies or proxy environment are used.
- Resolve all returned addresses and reject the entire answer if any is nonpublic. Connect to a pinned address, validate the connected peer, use normal TLS hostname/certificate verification and disable connection reuse and automatic family selection.
- Revalidate every redirect (maximum three); reject loops, private targets and protocol downgrades. Never execute scripts or solve challenges.
- Twelve-second total deadline including DNS; 512 KiB uncompressed wire body; accept only UTF-8 HTML/plain text and identity encoding. Reject text over 12,000 characters instead of silently truncating decisive conditions.
- Two concurrent retrievals, five requests per authenticated user per minute, bounded in-memory rate map. Single-process limits reset on restart; this remains a loopback demo gateway, not a distributed production crawler.
- Parse HTML without a browser. Prefer main/article landmarks, omit scripts/navigation/forms/footer/hidden content, otherwise clearly identify body extraction. Normalized whitespace is the quotation boundary: excerpts are exact against extracted text, not literal HTML bytes.
- Preserve original/final URL, redirect path, retrieval timestamp, extraction method, raw UTF-8 body SHA-256, extracted-text SHA-256, full extracted text, and same-origin links (at most 20). Links are review suggestions, never automatically fetched or asserted to be authoritative. Course-specific pages remain unresolved until separately reviewed.
- A server-HMAC receipt binds provenance to the exact extracted text and final URL for 30 minutes. Editing text switches to manual provenance and requires renewed approval. Restart invalidates receipts. Receipt signatures are integrity checks, not institutional verification.
- Fetched content remains untrusted in the existing evidence prompt. No raw webpage text, UID or private documents are logged. No source text is persisted outside the existing explicit analysis/profile workflow.

## Oxford acceptance evidence and limitation

On 28 October 2026 a real unpaid HTTPS attempt to the exact Oxford Clarendon applicants URL returned HTTP 403 with `cf-mitigated: challenge` from this environment. The retrieval path safely rejected it. No challenge was solved or bypassed. This is **not** successful live Oxford URL retrieval and the mission's live URL-only Oxford acceptance criterion remains open.

Offline browser rehearsal exercises URL-only preview → approval → analysis with a synthetic source transport and mocked identity/Meta. Gateway tests separately verify receipt validation and the real analysis path using an offline provider. Neither is live inference or institutional validation. If Oxford permits retrieval from the owner's normal network, repeat the unpaid fetch first; do not initiate inference without a separate spending authorization.

## Remaining limits

Arbitrary HTML structure may omit material, select unrelated body content or include deceptive text. Extraction does not prove completeness, source authenticity, or semantic accuracy. Scripts, PDF/image extraction, linked-page crawling, OCR and issuer verification are intentionally unsupported. Dari/Pashto additions await fluent human review. No program-specific language-test acceptance, admission probability, partnership or guarantee is asserted.

## Four-minute demonstration

0:00–0:35: Show the synthetic-data/offline banner. Paste the official Oxford URL and explain the actual result: permitted retrieval yields a preview; a website challenge yields the translated failure and manual fallback. A prerecorded fixture must be labeled offline.

0:35–1:05: Inspect the source text, timestamp, digests and course-specific uncertainty. Approval is required before AI submission; fetching alone spends nothing.

1:05–1:40: Show source excerpts and the full retained condition inventory. Use an offline mocked response unless a separately authorized real Meta request has both correlated `meta_response` with completion stop and `analysis_validated` evidence. No successful live Meta call is claimed in this change.

1:40–2:20: Review synthetic TXT education claims, consent and private profile persistence; explain declarations, inspected documents and issuer verification are distinct.

2:20–2:55: Show MET/NOT MET/UNKNOWN, the deferred-offer or continuing-degree exclusions, and course admission remaining separate. A missing accepted English credential does not establish poor English ability.

2:55–3:25: Explore an explicitly hypothetical change; show which rule changes and that actual profile values remain unchanged. Other unknowns stay unknown.

3:25–4:00: Switch English/Dari/Pashto, inspect RTL and original quotations, show deletion and consent safeguards. Close with the current live Oxford/Meta and human-translation limits.

Architecture: browser → authenticated loopback gateway → pinned public HTTPS fetch → untrusted source preview/approval → existing spending/quota gates → compact Meta schema → exact-evidence validation → conservative deterministic compiler → private profile comparison and isolated scenarios. SQLite ownership always derives from Firebase identity.

Submission description: BursYar connects scholarship source evidence, consent-based educational profiles and conservative three-valued eligibility checks in English, Dari and Pashto. It retains provenance and unresolved conditions, supports reviewed local TXT documents and separates hypothetical plans from actual facts. The current demonstration is an offline rehearsal; live Oxford retrieval and successful source-validated Meta inference remain unverified.

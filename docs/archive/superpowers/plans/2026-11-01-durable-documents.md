# Durable Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable durable hosted private document/profile storage without a paid Render disk.
**Architecture:** Async owner-state adapter, existing SQLite rules in memory, Postgres revision CAS.
**Tech Stack:** Node 24, native SQLite, fetch, Supabase PostgreSQL REST RPC.
**Spec:** docs/superpowers/specs/2026-11-01-durable-documents-design.md

## Global Constraints
- No new paid services or inference calls.
- Private data only in memory and the durable private Postgres schema.
- Firebase gateway authentication and origin checks remain required.
- Only service_role can execute the two storage RPCs; no SECURITY DEFINER.
- Local SQLite/family behavior stays compatible; remote family startup rejects.

## Review Focus
- Concurrent writes and first-insert races must not lose updates.
- Cross-user access and invalid consent must never persist changes.
- Network/body timeouts must not return stale success or leak upstream errors.
- Profile erasure/export must preserve document provenance/deletion semantics.
- Startup must not silently prefer one conflicting storage configuration.

### Task 1: Async private document adapter and gateway integration
**Files:** engine/documents.js, engine/remote-documents.js, engine/document-storage.js,
engine/http.js, engine/server.js, engine/capabilities.js, tests/remote-documents.test.js
**Interfaces:** RemoteDocumentStore exposes async equivalents of the existing
DocumentStore methods and atomic export(uid). Factory selects exactly one configured store.
- [x] Write tests for persistence across adapter instances, isolation, consent,
  review/correction/deletion, concurrent mutation, bounded conflict retries,
  transport/body failure, configuration and async gateway behavior.
- [x] Run new tests; expect missing-module/implementation failure.
- [x] Implement memory snapshot helpers, bounded REST transport and CAS adapter;
  await storage calls in gateway and add atomic export for both adapters.
- [x] Run targeted tests then npm test and npm run build; expect all pass.

### Task 2: Durable schema and provisioning validation
**Files:** database/durable-documents.sql, docs/DURABLE-DOCUMENTS.md, .env.example
**Interfaces:** bursyar_document_read(p_owner) -> {revision,state};
bursyar_document_compare(p_owner,p_revision,p_state) -> boolean.
- [x] Create private table with RLS, no anon/authenticated privileges, size checks,
  primary-key CAS, and invoker RPCs executable only by service_role.
- [x] Validate synthetic first insert/stale revision/update/read, privileges and
  rollback cleanup against the intended project. Inspect advisors for new issues.
- [x] Document provisioning and explicit activation gates; no fake live claims.
- [x] Obtain independent whole-change review; fix material findings, rerun checks.
- [ ] Commit and publish tested PR under existing merge authorization. Activate
  only when the server key is securely provisioned and live synthetic test passes.

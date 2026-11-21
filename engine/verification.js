import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {isAbsolute,dirname} from 'node:path';
import {lstatSync,openSync,closeSync,constants} from 'node:fs';
import {
  VERIFICATION_STATUSES,getVerificationProvider,isIssuerEvidenceAllowed,listVerificationProviders
} from './verification-providers.js';

// Credential-verification workflow. This module records a student's
// consent-gated request and the issuer's decision; it never decides authenticity
// itself. Uploading or reading a document is not evidence, and the HTTP API has
// no route that can set a verified status.
export class VerificationError extends Error {
  constructor(status) { super('Verification request unavailable'); this.status = status; }
}

const ACTIVE_STATUSES = new Set(['PENDING', 'MANUAL_REVIEW_REQUIRED', 'VERIFIED_BY_ISSUER', 'REJECTED_BY_ISSUER', 'UNAVAILABLE']);
const DECISION_STATUSES = new Set(['VERIFIED_BY_ISSUER', 'REJECTED_BY_ISSUER', 'MANUAL_REVIEW_REQUIRED', 'UNAVAILABLE']);
const MAX_REQUESTS = 25;
const SCHEMA = `PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON;
CREATE TABLE IF NOT EXISTS verification_requests(
 id TEXT PRIMARY KEY, owner TEXT NOT NULL, document_id TEXT NOT NULL, provider_id TEXT NOT NULL,
 reference TEXT, status TEXT NOT NULL, consent_version INTEGER NOT NULL, consent_at TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, evidence TEXT);
CREATE INDEX IF NOT EXISTS verification_owner ON verification_requests(owner);
CREATE TABLE IF NOT EXISTS verification_events(
 id INTEGER PRIMARY KEY AUTOINCREMENT, owner TEXT NOT NULL, request_id TEXT NOT NULL,
 status TEXT NOT NULL, at TEXT NOT NULL, detail TEXT);`;

function openPrivateDatabase(path) {
  if (typeof path !== 'string' || !isAbsolute(path)) throw Error('Absolute verification database path required');
  const parent = lstatSync(dirname(path));
  if (parent.uid !== process.getuid() || !parent.isDirectory() || parent.isSymbolicLink() || (parent.mode & 0o077)) throw Error('Private verification directory required');
  const fd = openSync(path, constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW, 0o600);
  closeSync(fd);
  const file = lstatSync(path);
  if (file.uid !== process.getuid() || !file.isFile() || (file.mode & 0o077)) throw Error('Private verification file required');
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}

export class VerificationStore {
  constructor(path) { this.db = openPrivateDatabase(path); }
  // Request-scoped store for tests and for a deployment without a durable path.
  static memory() {
    const store = Object.create(VerificationStore.prototype);
    store.db = new DatabaseSync(':memory:');
    store.db.exec(SCHEMA);
    return store;
  }
  owner(uid) {
    if (typeof uid !== 'string' || !uid || uid.length > 128) throw new VerificationError(400);
    return createHash('sha256').update(uid).digest('hex');
  }
  rows(uid) { return this.db.prepare('SELECT * FROM verification_requests WHERE owner=? ORDER BY created_at DESC').all(this.owner(uid)).map(row => ({...row})); }
  row(uid, id) {
    if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/.test(id)) throw new VerificationError(404);
    const row = this.db.prepare('SELECT * FROM verification_requests WHERE id=? AND owner=?').get(id, this.owner(uid));
    if (!row) throw new VerificationError(404);
    return {...row};
  }
  insert(row) {
    this.db.prepare('INSERT INTO verification_requests VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(
      row.id, row.owner, row.document_id, row.provider_id, row.reference, row.status,
      row.consent_version, row.consent_at, row.created_at, row.updated_at, row.evidence);
  }
  update(row) {
    this.db.prepare('UPDATE verification_requests SET status=?, updated_at=?, evidence=? WHERE id=? AND owner=?').run(
      row.status, row.updated_at, row.evidence, row.id, row.owner);
  }
  remove(uid, id) {
    const owner = this.owner(uid);
    this.db.prepare('DELETE FROM verification_requests WHERE id=? AND owner=?').run(id, owner);
  }
  event(owner, requestId, status, at, detail) {
    this.db.prepare('INSERT INTO verification_events(owner,request_id,status,at,detail) VALUES(?,?,?,?,?)').run(
      owner, requestId, status, at, JSON.stringify(detail ?? {}));
  }
  transaction(action) {
    // SQLite serializes writers across connections and processes sharing this database.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  erase(uid) {
    const owner = this.owner(uid);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('DELETE FROM verification_requests WHERE owner=?').run(owner);
      this.db.prepare('DELETE FROM verification_events WHERE owner=?').run(owner);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  close() { this.db.close(); }
}

const isoNow = clock => clock().toISOString();
function normalizeReference(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new VerificationError(400);
  const text = value.trim();
  if (!text || text.length > 120 || /[\u0000-\u001f\u007f]/u.test(text)) throw new VerificationError(400);
  return text;
}

export function createVerificationService({ store, documents = null, clock = () => new Date() } = {}) {
  // Document storage is required to *create* a request (ownership is checked
  // there) but not to record an issuer decision. The operator tool loads this
  // service without document storage so it can never read a document.
  if (!store) throw Error('Verification service requires a verification store');
  const known = new Set(listVerificationProviders().map(p => p.id));
  if (known.size !== listVerificationProviders().length) throw Error('Duplicate verification provider');

  function publicRecord(row) {
    const provider = getVerificationProvider(row.provider_id);
    if (!provider) throw new VerificationError(503);
    const evidence = row.evidence ? JSON.parse(row.evidence) : null;
    return {
      id: row.id,
      documentId: row.document_id,
      provider: {
        id: provider.id, name: provider.name, issuer: provider.issuer,
        access: provider.verification.access,
        officialUrl: provider.verification.officialUrl,
        requiresIssuerAuthorization: provider.verification.requiresIssuerAuthorization,
        autoVerificationAvailable: false
      },
      status: row.status,
      reference: row.reference,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      consentAt: row.consent_at,
      consentVersion: row.consent_version,
      // Only an issuer decision can populate this record.
      issuerEvidence: evidence ? {
        kind: evidence.kind,
        issuer: evidence.issuer,
        decidedAt: evidence.authenticatedAt,
        statement: evidence.issuerStatement
      } : null
    };
  }

  function create(uid, input) {
    if (!documents) throw new VerificationError(503);
    if (input?.consent !== true) throw new VerificationError(400);
    const providerId = typeof input.providerId === 'string' ? input.providerId : '';
    const provider = getVerificationProvider(providerId);
    if (!provider) throw new VerificationError(422);
    if (typeof input.documentId !== 'string' || !/^[a-f0-9-]{36}$/.test(input.documentId)) throw new VerificationError(400);
    // Ownership is checked against the caller's own document store, never a
    // client-supplied owner.
    try { documents.get(uid, input.documentId); }
    catch (error) { throw new VerificationError(error?.status === 404 ? 404 : 400); }
    const reference = normalizeReference(input.reference);
    return store.transaction(() => {
    const owner = store.owner(uid);
    const rows = store.rows(uid);
    // A repeated request for the same document and issuer is the same request;
    // do not create duplicates after a lost response.
    const active = rows.find(row => row.document_id === input.documentId && row.provider_id === providerId && ACTIVE_STATUSES.has(row.status));
    if (active) return publicRecord(active);
    if (rows.length >= MAX_REQUESTS) throw new VerificationError(429);
    const at = isoNow(clock), id = randomUUID();
    const row = {
      id, owner, document_id: input.documentId, provider_id: providerId, reference,
      status: 'PENDING', consent_version: 1, consent_at: at, created_at: at, updated_at: at, evidence: null
    };
    store.insert(row);
    store.event(owner, id, 'PENDING', at, { consentVersion: 1, requiresIssuerAuthorization: provider.verification.requiresIssuerAuthorization });
    return publicRecord(store.row(uid, id));
    });
  }

  function list(uid) {
    return { requests: store.rows(uid).map(publicRecord), autoVerificationAvailable: false };
  }

  // Owner-scoped single read so a reloaded or shared request URL shows the
  // current status instead of the generic "method unavailable" fallback.
  // A missing or foreign id is a 404, never a 403 that would reveal existence.
  function get(uid, id) {
    return publicRecord(store.row(uid, id));
  }

  function withdraw(uid, id) {
    return store.transaction(() => {
      const row = store.row(uid, id);
      if (row.status === 'VERIFIED_BY_ISSUER') throw new VerificationError(409);
      const at = isoNow(clock);
      store.remove(uid, id);
      store.event(store.owner(uid), id, 'NOT_REQUESTED', at, { withdrawn: true });
      return { id, status: 'NOT_REQUESTED', withdrawn: true };
    });
  }

  // Server-internal only: called by an operator after the issuer itself
  // confirmed or rejected a credential. There is deliberately no HTTP route.
  function recordIssuerOutcome(uid, id, decision) {
    if (!decision || decision.authorized !== true) throw new VerificationError(403);
    if (!DECISION_STATUSES.has(decision.status)) throw new VerificationError(400);
    const row = store.row(uid, id);
    const evidence = decision.evidence;
    if (decision.status === 'VERIFIED_BY_ISSUER' || decision.status === 'REJECTED_BY_ISSUER') {
      if (!isIssuerEvidenceAllowed(row.provider_id, evidence)) throw new VerificationError(400);
      if (evidence.reference !== undefined && evidence.reference !== null && evidence.reference !== row.reference) throw new VerificationError(400);
    }
    const at = isoNow(clock);
    if (evidence !== undefined && !isIssuerEvidenceAllowed(row.provider_id, evidence)) throw new VerificationError(400);
    return store.transaction(() => {
      // Re-read inside the write transaction so a concurrent withdrawal cannot
      // leave an issuer event without a matching request.
      const current = store.row(uid, id);
      if (current.status === 'VERIFIED_BY_ISSUER') throw new VerificationError(409);
      if (evidence?.reference !== undefined && evidence.reference !== null && evidence.reference !== current.reference) throw new VerificationError(400);
      current.status = decision.status;
      current.updated_at = at;
      current.evidence = evidence ? JSON.stringify({
        kind: evidence.kind, issuer: evidence.issuer, authenticatedAt: evidence.authenticatedAt,
        issuerStatement: evidence.issuerStatement, reference: current.reference
      }) : null;
      store.update(current);
      store.event(current.owner, id, decision.status, at, { source: 'issuer_authorized' });
      return publicRecord(current);
    });
  }

  return {
    create,
    get,
    list,
    withdraw,
    recordIssuerOutcome,
    providers() {
      return {
        autoVerificationAvailable: false,
        statuses: [...VERIFICATION_STATUSES],
        providers: listVerificationProviders()
      };
    },
    eraseOwner(uid) { store.erase(uid); },
    close() { store.close(); }
  };
}

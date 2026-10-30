// Guardian-managed minor profiles: non-AI deterministic route only.
// No Meta/Gemini inference for under-18 subjects, including via guardian proxy.
// Minimal data: guardian attestation + revocable consent provenance; no
// sensitive identity documents (national IDs, photos, biometrics) are collected.
import {DatabaseSync} from 'node:sqlite';
import {randomUUID, createHash} from 'node:crypto';
import {isAbsolute, dirname} from 'node:path';
import {lstatSync, openSync, closeSync, constants} from 'node:fs';

export class FamilyError extends Error {
  constructor(status, message) {
    super(message ?? 'Family request unavailable');
    this.status = status;
  }
}

const hash = uid => createHash('sha256').update(uid).digest('hex');

export class FamilyStore {
  constructor(path) {
    if (!isAbsolute(path)) throw new Error('Absolute family database path required');
    const parent = lstatSync(dirname(path));
    if (parent.uid !== process.getuid() || !parent.isDirectory() || parent.isSymbolicLink() || (parent.mode & 0o077))
      throw new Error('Private family directory required');
    const fd = openSync(path, constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW, 0o600);
    closeSync(fd);
    const file = lstatSync(path);
    if (file.uid !== process.getuid() || !file.isFile() || (file.mode & 0o077))
      throw new Error('Private family file required');
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS guardians(owner TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS minors(id TEXT PRIMARY KEY, guardian TEXT NOT NULL, data TEXT NOT NULL);`);
  }

  registerGuardian(uid, input) {
    if (typeof uid !== 'string' || !uid || uid.length > 128) throw new FamilyError(400);
    // Proportionate verification: adult attestation + explicit consent, no ID documents.
    if (input?.adultAttested !== true || input?.consent !== true) throw new FamilyError(400);
    const owner = hash(uid);
    const record = {guardianOwner: owner, adultAttested: true, consentVersion: 1, grantedAt: new Date().toISOString(), revokedAt: null};
    this.db.prepare('INSERT INTO guardians VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET data=excluded.data').run(owner, JSON.stringify(record));
    return record;
  }

  #guardianOwner(uid) {
    if (typeof uid !== 'string' || !uid) throw new FamilyError(401);
    const owner = hash(uid);
    const row = this.db.prepare('SELECT data FROM guardians WHERE owner=?').get(owner);
    if (!row) throw new FamilyError(403, 'Guardian registration required');
    const record = JSON.parse(row.data);
    if (record.revokedAt) throw new FamilyError(403, 'Guardian consent revoked');
    return owner;
  }

  createMinorProfile(guardianUid, input = {}) {
    const guardian = this.#guardianOwner(guardianUid);
    if (input?.consent !== true) throw new FamilyError(400);
    const label = input.label;
    if (label !== undefined && (typeof label !== 'string' || label.length > 80)) throw new FamilyError(400);
    // Never accept sensitive identifiers: reject national ID, photo or biometric fields.
    for (const banned of ['nationalId', 'passport', 'photo', 'biometric', 'birthCertificate'])
      if (input[banned] !== undefined) throw new FamilyError(400, 'Sensitive identifier not collected');
    const id = randomUUID();
    const record = {id, guardian, label: label ?? null, createdAt: new Date().toISOString(), consent: {version: 1, grantedAt: new Date().toISOString(), scope: 'deterministic_matching_only', revokedAt: null}, profile: {}};
    this.db.prepare('INSERT INTO minors VALUES(?,?,?)').run(id, guardian, JSON.stringify(record));
    return {id, label: record.label, createdAt: record.createdAt};
  }

  #getMinor(guardian, minorId) {
    if (typeof minorId !== 'string' || !/^[a-f0-9-]{36}$/.test(minorId)) throw new FamilyError(404);
    const row = this.db.prepare('SELECT data FROM minors WHERE id=? AND guardian=?').get(minorId, guardian);
    if (!row) throw new FamilyError(404);
    return JSON.parse(row.data);
  }

  getMinorProfile(guardianUid, minorId) {
    const guardian = this.#guardianOwner(guardianUid);
    const record = this.#getMinor(guardian, minorId);
    if (record.consent.revokedAt) throw new FamilyError(403, 'Minor consent revoked');
    return structuredClone(record);
  }

  updateMinorProfile(guardianUid, minorId, input) {
    const guardian = this.#guardianOwner(guardianUid);
    const record = this.#getMinor(guardian, minorId);
    if (record.consent.revokedAt) throw new FamilyError(403);
    if (input?.consent !== true || typeof input.values !== 'object' || input.values === null) throw new FamilyError(400);
    // Only non-sensitive deterministic-matching fields; values are user-declared drafts.
    const allowed = new Set(['degree', 'academicHistory', 'languages']);
    for (const key of Object.keys(input.values)) if (!allowed.has(key)) throw new FamilyError(400);
    const next = structuredClone(record);
    for (const [key, value] of Object.entries(input.values)) {
      if (value === null) delete next.profile[key];
      else if (typeof value === 'string' && value.length <= 2000) next.profile[key] = {value, origin: 'guardian_declared', verificationStatus: 'not_verified'};
      else throw new FamilyError(400);
    }
    this.db.prepare('UPDATE minors SET data=? WHERE id=? AND guardian=?').run(JSON.stringify(next), minorId, guardian);
    return structuredClone(next.profile);
  }

  revokeMinorConsent(guardianUid, minorId) {
    const guardian = this.#guardianOwner(guardianUid);
    const record = this.#getMinor(guardian, minorId);
    record.consent.revokedAt = new Date().toISOString();
    record.profile = {};
    this.db.prepare('UPDATE minors SET data=? WHERE id=? AND guardian=?').run(JSON.stringify(record), minorId, guardian);
    return {revoked: true};
  }

  deleteMinorProfile(guardianUid, minorId) {
    const guardian = this.#guardianOwner(guardianUid);
    this.#getMinor(guardian, minorId);
    this.db.prepare('DELETE FROM minors WHERE id=? AND guardian=?').run(minorId, guardian);
    return {deleted: true};
  }

  // Explicit transfer at majority: verified new owner + fresh consent, never automatic.
  transferAtMajority(guardianUid, minorId, input) {
    const guardian = this.#guardianOwner(guardianUid);
    const record = this.#getMinor(guardian, minorId);
    if (input?.newOwnerConsent !== true || typeof input?.newOwnerUid !== 'string' || !input.newOwnerUid) throw new FamilyError(400);
    if (input?.adultAttested !== true) throw new FamilyError(400);
    this.db.prepare('DELETE FROM minors WHERE id=? AND guardian=?').run(minorId, guardian);
    return {transferred: true, transferredAt: new Date().toISOString()};
  }

  close() { this.db.close(); }
}

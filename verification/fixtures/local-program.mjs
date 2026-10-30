import {createHash} from 'node:crypto';
const sourceText='Applicants must hold a bachelor degree.';
// Test-only complete synthetic scholarship. Never imported by production server.
export const localProgram={id:'synthetic-local-test',coverageComplete:true,sourceUrl:'https://example.edu/award',sourceText,sourceDigest:createHash('sha256').update(sourceText).digest('hex'),review:{status:'approved',sourceVerification:'official_source_reviewed',reviewedAt:'2026-10-29',expiresAt:'2030-01-01T00:00:00Z'},rules:[{id:'degree',type:'minimum_degree',minimum:'bachelor',sourceExcerpt:sourceText}]};

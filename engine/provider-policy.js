// Server-side policy primitive; not wired to HTTP yet.
const standard = new Set(['muse-spark-1.1','muse-spark-1.2','muse-spark-1.3','muse-wonder-1.0']);
export function decideProviderRoute(context) {
 const denied = reason => Object.freeze({allowed:false,reason,route:null});
 if (!context || typeof context !== 'object' || Array.isArray(context)) return denied('invalid_context');
 if (context.model === 'deterministic') return Object.freeze({allowed:true,reason:'allowed',route:'deterministic'});
 if (!standard.has(context.model)) return denied('unsupported_model'); // Contributor intentionally blocked.
 if (context.audience === 'minor_targeted') return denied('minor_audience');
 if (context.subjectAgeBand === 'under_18') return denied('minor_subject');
 if (context.subjectAgeBand !== 'adult_18_plus' || context.audience !== 'adult_only') return denied('unknown_age_or_audience');
 if (context.locationDecision !== 'allowed') return denied('location_not_cleared');
 if (context.consentVerified !== true) return denied('consent_missing');
 if (!['user_content','public_source'].includes(context.dataClass)) return denied('data_class_not_cleared');
 return Object.freeze({allowed:true,reason:'allowed',route:'meta_standard'});
}

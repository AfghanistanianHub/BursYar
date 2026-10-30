// Pure policy primitive. Only the gateway's trusted server resolver supplies facts.
const metaStandard = new Set(['muse-spark-1.1','muse-spark-1.2','muse-spark-1.3','muse-wonder-1.0']);
const denied = reason => Object.freeze({allowed:false,reason,route:null});
const allowed = route => Object.freeze({allowed:true,reason:'allowed',route});
export function decideProviderRoute(context) {
 if (!context || typeof context !== 'object' || Array.isArray(context)) return denied('invalid_context');
 // The deterministic engine does not call a third-party model API.
 if (context.provider === 'deterministic' && context.model === 'deterministic') return allowed('deterministic');
 // Backward compatibility for the initial provider-policy test contract.
 if (context.model === 'deterministic' && context.provider === undefined) return allowed('deterministic');
 const provider = context.provider ?? 'meta';
 if (!['meta','gemini','self_hosted'].includes(provider)) return denied('unsupported_provider');
 if (!['adult_18_plus','under_18'].includes(context.subjectAgeBand) || !['adult_only','minor_targeted'].includes(context.audience)) return denied('unknown_subject_or_audience');
 if (context.userAgeBand !== 'adult_18_plus') return denied('caller_age_not_cleared');
 if (context.audience === 'minor_targeted' && provider !== 'self_hosted') return denied('minor_audience');
 if (context.subjectAgeBand === 'under_18' && provider !== 'self_hosted') return denied('minor_subject');
 if (provider !== 'self_hosted' && (context.subjectAgeBand !== 'adult_18_plus' || context.audience !== 'adult_only')) return denied('unknown_age_or_audience');
 // Must originate from a validated server policy check, never client country strings.
 if (context.locationDecision !== 'allowed') return denied('location_not_cleared');
 if (context.consentVerified !== true) return denied('consent_missing');
 if (!['user_content','public_source'].includes(context.dataClass)) return denied('data_class_not_cleared');
 if (provider === 'meta') {
  // Contributor IDs deliberately not accepted for application traffic.
  if (!metaStandard.has(context.model)) return denied('unsupported_model');
  return allowed('meta_standard');
 }
 if (provider === 'gemini') {
  // Google free tier may use content for product improvement; user-origin data
  // requires a verified no-training contract, not a free-tier assumption.
  if (!['gemini-2.5-flash','gemini-3.8-flash'].includes(context.model)) return denied('unsupported_model');
  if (context.dataClass !== 'public_source' && context.noTrainingContract !== true) return denied('privacy_terms_not_cleared');
  return allowed('gemini_eligible');
 }
 // Hosting your own model does not itself establish lawful delivery.
 if (context.model !== 'qwen3-local' || context.selfHostedLegalReview !== true || context.selfHostedSecurityReview !== true)
  return denied('self_hosted_not_cleared');
 return allowed('self_hosted');
}

// Centralized server-enforced provider dispatch.
// Policy decides the route; this module invokes exactly one adapter and
// never falls back to another provider. Denials and unconfigured adapters
// must produce zero outbound provider calls.
import {decideProviderRoute} from './provider-policy.js';

export class ProviderDenied extends Error {
  constructor(reason) {
    super('Analysis unavailable for this request');
    this.reason = reason;
    this.status = 403;
  }
}

export class ProviderUnavailable extends Error {
  constructor(reason) {
    super('Analysis unavailable');
    this.reason = reason;
    this.status = 503;
  }
}

// context: backend-verified policy facts (never browser assertions).
// adapters: { meta, gemini, selfHosted, deterministic } — each an async fn or null.
// Only the selected adapter is ever invoked.
export async function dispatchProviderRequest(context, adapters = {}, payload) {
  const decision = decideProviderRoute(context);
  if (!decision.allowed) throw new ProviderDenied(decision.reason);
  switch (decision.route) {
    case 'deterministic': {
      if (typeof adapters.deterministic !== 'function') throw new ProviderUnavailable('deterministic_not_configured');
      return {route: 'deterministic', result: await adapters.deterministic(payload)};
    }
    case 'meta_standard': {
      if (typeof adapters.meta !== 'function') throw new ProviderUnavailable('meta_not_configured');
      return {route: 'meta_standard', result: await adapters.meta(payload)};
    }
    case 'gemini_eligible': {
      if (typeof adapters.gemini !== 'function') throw new ProviderUnavailable('gemini_not_configured');
      return {route: 'gemini_eligible', result: await adapters.gemini(payload)};
    }
    case 'self_hosted': {
      if (typeof adapters.selfHosted !== 'function') throw new ProviderUnavailable('self_hosted_not_configured');
      return {route: 'self_hosted', result: await adapters.selfHosted(payload)};
    }
    default:
      throw new ProviderDenied(decision.reason ?? 'unknown_route');
  }
}

// Minor-targeted or under-18 subjects may only use the deterministic route.
// Used by family mode; Meta/Gemini remain denied even via guardian proxy.
export function minorRouteAllowed(route) {
  return route === 'deterministic';
}

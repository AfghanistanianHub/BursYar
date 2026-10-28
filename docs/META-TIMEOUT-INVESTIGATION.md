# Meta timeout investigation — October 28, 2026

## What the reported failure establishes

Owner supplied the first manually authorized Oxford Clarendon attempt: stage provider, code provider_timeout, providerStatus null, elapsed 20005 ms; local spending confirmation enabled with the existing USD 5 cap. No paid request was repeated during this investigation.

The deployed code's own AbortSignal.timeout(20000) covered both fetch and response-body reading. The Mac environment explicitly supplied 20000, even though the old adapter accepted a server environment override up to 60000. On any signal abort the old catch block constructed a new failure with providerStatus null, discarding a status that might already have arrived. Consequently the record establishes expiry of the local 20-second budget; it does not establish whether DNS, TCP, TLS, request upload, server queuing/reasoning/generation, response headers or body transfer consumed it. It is not evidence of a received Meta HTTP 504, and no retrospective packet-level attribution is possible from that log.

Slow server reasoning/generation is a plausible explanation, not a confirmed root cause. The selected model and exact request bytes were not recorded in the failure. The source URL is not fetched by the model adapter; scholarship text is already included in its JSON user message, so the Oxford page retrieval timeout is a different stage.

## Official provider requirements checked

- https://dev.meta.ai/docs/protocols/chat-completions confirms POST https://api.meta.ai/v1/chat/completions, bearer authentication, developer/user messages, max_completion_tokens and stream:false. The adapter's endpoint and output-limit parameter are correct. max_output_tokens would be wrong on this endpoint; it was not used.
- https://dev.meta.ai/docs/models lists muse-spark-1.3 Standard and its model context/capabilities. The actual saved model is preserved, never replaced or guessed. In this agent session the native redacted Keychain helper still returns OSStatus -67674; current account selection cannot be independently inspected. New startup/failure records identify a recognized documented model ID safely, or other_configured_model without printing an arbitrary configuration string.
- https://dev.meta.ai/docs/reasoning states omitted reasoning_effort uses a model-selected level. More reasoning can increase latency and billed output tokens; none is not supported by Muse Spark. This fix does not disable reasoning or select another model. The 4000 output-token budget is unchanged; reasoning consumes output budget too.
- The chat documentation describes a separate server-side time limit for non-streaming requests and recommends streaming for long generations. It does not establish that the reported request reached that limit. This patch retains non-streaming JSON validation rather than introducing an untested SSE parser. An actual upstream 504 is now classified distinctly.
- Meta recommends leaving temperature unset for Muse Spark. The prior 0.1 is within the documented valid range, so it is not evidence of a bad-request cause. The request now leaves it unset as documented; this is not claimed to solve latency.

The engineering-selected timeout defaults/bounds below are not a provider latency guarantee or a claim about its undocumented numerical server limit.

## Safe observations made now

No-auth curl GET /v1/status returned HTTP 200. Observed cumulative times: DNS 16.075 ms, TCP 25.258 ms, TLS 44.763 ms, first byte 205.406 ms, total 205.556 ms.

A separate Node TLS/status probe returned: DNS 107 ms, TCP 124 ms, TLS 137 ms; separate status fetch headers 358 ms; total 497 ms, HTTP 200. TLS certificate verification stayed enabled. It logs no resolved addresses, headers or response body. This proves current reachability from this agent, not historical conditions, the owner's process route, authentication, model access, generation performance or successful inference. The TLS handshake and HTTP status fetch use separate connections.

Fresh direct official Oxford retrieval was unavailable to the existing safe parser. The exact failed payload was not retained, so its exact bytes/tokens cannot be reconstructed. No raw scholarship content or secrets were collected for diagnosis.

Offline synthetic sizing with the current prompt and an explicitly assumed muse-spark-1.3 ID:

| Synthetic input | Source code units | Message JSON bytes | Complete request JSON bytes |
|---|---:|---:|---:|
| ASCII placeholder at historical Oxford length | 5098 | 6214 | 6296 |
| Maximum accepted source length, ASCII | 12000 | 13116 | 13198 |
| Maximum length, three-byte Unicode | 12000 | 37116 | 37198 |
| Maximum length, backslash-heavy | 12000 | 49116 | 49198 |

These are reproducible examples, not measured bytes or token counts of the paid attempt, and not exhaustive JSON-escape upper bounds. The gateway accepts at most 12000 source code units and 56 KiB incoming JSON. It constructs two messages, not a growing conversation, requests three language explanations, caps completion at 4000 and rejects provider responses over 128 KiB. There is no evidence that the failed input was excessively large or exceeded the documented Muse Spark context. Multilingual output and model-default reasoning may nevertheless take longer than 20 seconds. Actual usage/latency require a genuine provider response.

## Changes

1. Shared public timeout policy: default 60000 ms, integer range 1..120000. The Mac launcher accepts only the new numeric META_TIMEOUT_MS override; it does not import stale provider/model/credential/cap/quota settings or edit Keychain records. The gateway socket ceiling is 130000, frontend/live-runner deadline 135000. No deployment configuration changed.
2. The adapter enforces one total deadline across headers and body, even when a stalled reader ignores its signal. Reader cancellation and timer/listener cleanup are bounded. Caller cancellation before dispatch sends no request.
3. Gateway response disconnection propagates an AbortSignal to provider work. Failed/timed-out/cancelled requests retain their reservation; there is no automatic retry, refund, cap increase or claim that cancellation guarantees Meta stopped work/billing.
4. Failures retain observed HTTP status and allowlisted diagnostics: current phase, configured timeout, recognized model, input/request byte and message counts, header/first-body-byte milestone times, received byte count and known low-level transport codes. Local deadline, caller cancellation and upstream HTTP 504 are distinct. A pre-header stall still cannot separately identify network and generation delays; the separate network probe is only corroborating current evidence.
5. Arbitrary diagnostic fields are filtered again by the gateway. Keys, ID tokens, raw errors/stacks/abort reasons, request/response text, arbitrary model names, provider headers and personal identifiers are excluded. Success metrics retain only validated provider token counts and numeric timing. Currency cost remains unavailable.
6. Request budget stays 4000 completion tokens. Authentication, spending confirmation, existing USD 5 cap, persisted workload quotas, evidence validation, TLS verification and pinned Meta endpoint remain in force. No other provider fallback exists.

## Offline verification and release gate

Regression cases cover delayed headers, no body bytes, partial stalled body, a slow successful mocked response, malformed slow JSON, oversize/truncated/bad-schema replies, cancellation before and after dispatch, upstream 504 vs local deadline, safe transport-code classification, redaction, retained SQLite reservations and no retries. Pure Mac configuration tests prove timeout overrides leave every credential/model/spending/quota field and the input record unchanged.

Commands: npm test; npm run build; npm run test:emulator; npm run test:browser; npm run diagnose:meta-size. The network diagnostic is npm run diagnose:meta-network and is explicitly not an inference. Test evidence/CI counts are recorded in the PR and final handoff; unexecuted checks must not be described as passed.

Before a new paid verification, the owner must run the updated branch in the logged-in desktop session, retain the existing cap and approved Google identity, and inspect the safe configuration record. Choose one explicit request with public official scholarship evidence only after confirming its spending/security gates. Do not automatically resubmit the failed request. If it fails, retain only the redacted phase/timing/size record; do not expose keys, tokens or source content. Actual model access, response latency/usage, semantic validity and the underlying historical stall remain unverified until genuine evidence exists. No successful Meta inference is claimed by this patch.

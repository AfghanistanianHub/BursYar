# Meta completion truncation — October 28, 2026

## Confirmed evidence and limits

The owner reports the second authorized Oxford Clarendon request reached muse-spark-1.3 and returned HTTP 200 after 18,238 ms. The 426-byte response had finish_reason=length. The request used max_completion_tokens=4000 and timeout 60000 ms. The adapter correctly rejected it as provider_truncated during validating_response. This is a provider budget-exhaustion response, not the previous client timeout. Provider reachability and selected model are confirmed by the supplied live diagnostics; a validated scholarship analysis is NOT yet confirmed.

Meta's current documentation explains that max_completion_tokens covers hidden reasoning plus visible output. Default reasoning effort is model-selected. The tiny response envelope is consistent with reasoning consuming most of the budget, but response byte size does not measure token usage. The old adapter inspected usage only after its length guard, so the actual reasoning/visible split was lost. Do not claim all 4000 tokens were reasoning without the counters. We did not collect raw output or rerun a paid request to investigate.

## Official documentation verified

- https://dev.meta.ai/docs/models lists muse-spark-1.3 Standard mode and its supported reasoning/structured-output capabilities. The existing selected model is retained.
- https://dev.meta.ai/docs/api-reference/chat-completions/schemas defines max_completion_tokens as a shared reasoning/visible cap, finish_reason=length as reaching the output-token limit, usage.prompt_tokens/completion_tokens/total_tokens, and usage.completion_tokens_details.reasoning_tokens.
- https://dev.meta.ai/docs/reasoning recommends low effort for extraction, formatting and translation. none is unsupported by Muse Spark. Low is a request for less reasoning, not a guaranteed separate numeric reasoning allowance.
- https://dev.meta.ai/docs/structured-output documents response_format.type=json_schema and response_format.json_schema.strict=true. Strict objects must disallow additional properties and require all declared fields; nullable required fields represent unknowns. Our schema is shallow and small. Constrained shape does not prove source truth, semantic accuracy or successful completion under a token budget.
- https://dev.meta.ai/docs/protocols/chat-completions confirms the endpoint, developer/user roles and max_completion_tokens parameter. We do not use unsupported chat reasoning summaries, stop sequences, max_output_tokens, another model/provider, or an automatic plain-JSON fallback.

## Implemented output strategy, before any budget increase

The 4000-token cap is unchanged. The default timeout stays 60000 ms, with the existing bounded configuration. No account cap, billing, permissions, production Firebase or deployment settings changed.

The old request left reasoning at model-default, asked for three-language interpretations, and allowed a broad response of 30 criteria, 20 funding excerpts and long explanations. It used prompt-only JSON instructions. The corrected request uses:

- reasoning_effort: low;
- response_format: json_schema, named bursyar_evidence_v1, strict: true;
- at most four selected eligibility restrictions/exceptions and two funding excerpts;
- exact, complete source-sentence quotes up to 600 code units, never clipped to fit;
- one short explanation per English/Dari/Pashto field, capped at 120 code units;
- an exact deadline sentence or null when absent/conflicting;
- no overview, reasoning narrative, eligibility verdict, provider advice or extra fields.

The complete original source is still sent unchanged as untrusted data. The prompt prioritizes restrictions/exceptions and retaining both sides of a selected contradiction. This is explicitly a partial selection, never a complete eligibility certificate. The server returns selection.complete=false, selected-requirements-only compiler coverage, provenance and human-review warnings. Some conditions can be omitted by design; source authenticity and translations still require review.

Schema enforcement adds input overhead while reducing visible-output scope. In offline ASCII placeholders at the historical 5098-character source length, the request grew from about 6296 to 7034 bytes while the instruction text became shorter. This is synthetic sizing, not the failed request's actual bytes/tokens or a guarantee of success. Quota accounting now reserves the FULL serialized request, including schema and parameters, plus the unchanged 4000-token allowance. Existing limits and stored usage are never reset or increased; this prevents schema overhead from bypassing the workload guard.

## Safe diagnostics and validation

Before rejecting a parsed provider reply, the adapter captures allowlisted finishReason, promptTokens, completionTokens, totalTokens and available reasoningTokens. Missing, invalid, negative, non-integer or oversized counts become null rather than guessed zero. Only documented finish reasons or unrecognized are logged. Raw model output, reasoning text, prompts, tokens/keys, arbitrary provider fields and personal data are excluded. Currency cost remains null when unavailable.

Startup and failure metadata identify low effort, json_schema, schema version, four-criterion scope and the 4000 cap. A server-generated, UUID-only requestId correlates meta_response and gateway events. That ID is not sent to the model and is not derived from the user identity.

finish_reason=length remains a HARD FAILURE even if visible text happens to be parseable, schema-shaped JSON. No repair, partial acceptance or retry occurs. Refusals, unexpected choice counts, malformed envelopes and non-stop completions fail closed. A stop response must still pass the independent local compact schema/bounds, required translation scripts, exact source-excerpt/deadline/funding checks, digest/provenance construction and conservative compiler.

The gateway emits analysis_validated only after those downstream checks. meta_response alone means a provider response was received; it is NOT evidence that the analysis passed. analysis_validated still carries requiresHumanReview=true and coverageComplete=false. It does not certify scholarship eligibility, translations or issuer authenticity. Failed, truncated and cancelled requests keep their reservation. No automatic paid retries or quota refunds were added.

## Offline verification

Tests cover the strict schema contract and bounds; truncated all-reasoning/null-content responses; parseable truncated content; valid stop responses; missing/malformed usage; metadata redaction; refusal/multiple-choice failures; full request/schema quota accounting; end-to-end fake-provider truncation; and stop responses that fail downstream JSON, schema or fabricated-evidence checks. Existing timeout, cancellation, auth, spending, quota, provenance, multilingual and isolation tests remain in the suite. All provider test responses are mocked; no hidden evaluation answers are sent to a live model.

Actual local results: 98 Node tests passed, zero failed/skipped; production build passed; 47 isolated Auth/Firestore emulator checks passed; nine offline official-excerpt checks passed. Current CI results and code revision are recorded on the PR and final handoff. Do not describe an unexecuted live test as passed.

## Exact procedure for ONE owner-authorized live Oxford test

This procedure is provided for a new explicit owner authorization. Neither the earlier authorizations nor starting the application authorize another inference. Do NOT perform both the UI procedure and npm run test:live for this single test.

1. Use a clean checkout containing the new fix/meta-truncated-completions branch. Preserve any existing local work. Fetch and switch to the remote-tracking branch; if the local branch already exists, switch to it and fast-forward it from the explicit remote branch:

   ```sh
   git fetch origin
   git switch --track origin/fix/meta-truncated-completions
   ```

   For an already existing local branch instead:

   ```sh
   git switch fix/meta-truncated-completions
   git merge --ff-only origin/fix/meta-truncated-completions
   ```

   Stop if a checkout/fast-forward cannot be performed safely; do not force reset files or quota records.

2. Close only the previous BursYar launcher with Ctrl+C in its Terminal. In the owner's logged-in desktop Terminal, from the corrected checkout:

   ```sh
   META_TIMEOUT_MS=60000 ./start-bursyar.command
   ```

   Reuse the saved Keychain key/model, Firebase identity and existing USD 5 gate. Do not rerun setup, change billing, increase quotas or rewrite the attestation. Startup preflight makes no inference.

3. Before authorizing a request, verify meta_configuration shows model muse-spark-1.3, timeoutMs 60000, maxCompletionTokens 4000, reasoningEffort low, responseFormat json_schema, responseSchema bursyar_evidence_v1 and maxCriteria 4. If these fields are absent/wrong, stop: the corrected backend is not the process being tested.

4. Open the local UI and sign in with the existing approved Google demo account. Use ONLY public Oxford Clarendon applicant text from https://www.ox.ac.uk/admissions/graduate/fees-and-funding/funding/clarendon/applicants, preferably the same source text as the failed attempt. Enter that exact official URL. Keep within the existing 30..12000 source-code-unit input bound. Do not add personal documents, expected answers, reference scores or artificial threshold sentences to obtain a positive result.

5. Once you explicitly authorize this ONE paid test under the unchanged spending gate, press Prepare analysis exactly once. Do not submit again if it fails, times out or reaches a quota limit. Do not run a second smoke runner or fallback provider.

6. Passing evidence requires a real meta_response with finishReason stop, then analysis_validated with the SAME requestId, and a successful UI response containing the source digest, exact original excerpts and nonempty selected criteria. Verify Oxford fee evidence quotes the supplied official text; the deadline must remain source-grounded/course-specific or null. The server has independently checked schema, provenance and excerpts before emitting analysis_validated. Inspect all three language views without another submit. Results must stay unreviewed and explicitly partial; unknown eligibility is acceptable and must not be relabeled as an award decision.

7. Record only the redacted requestId, finish/status, timing, prompt/completion/reasoning counts, evidence-check result and source digest. Do not export HARs, tokens, credentials, raw output or private documents. Actual cost must not be invented from workload units. If length occurs again, retain its safe counters and stop; any larger completion budget requires a separate evidence-based review and explicit authorization, never an automatic retry.

Until this test supplies a genuine provider response that passes all downstream checks, end-to-end live success remains unverified. Provider-reported usage will establish whether the new request's budget was consumed by reasoning, visible output or both; it cannot reconstruct the missing usage of the previous attempt.

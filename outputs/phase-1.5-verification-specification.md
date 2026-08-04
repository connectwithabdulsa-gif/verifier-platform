# Phase 1.5 — Email Verification Specification

**Version:** 1.0.0  
**Status:** Approved for architecture  
**Governing specification:** RFC 000 v1.0.0  
**Evidence baseline:** Phase 1 Research Corpus v1.0.0

## 1. Purpose

This specification defines how the platform converts permitted observations into reproducible properties, deliverability assessments, risk assessments, and customer-policy recommendations. It is the engineering contract for later architecture and implementation. It intentionally does not select services, databases, languages, clouds, or deployment topology.

## 2. Verification request

A request contains:

- tenant and authorized purpose;
- original address exactly as supplied;
- verification profile: `fast`, `balanced`, or `deep`;
- optional customer policy identifier;
- optional permitted context such as signup IP or source type;
- idempotency key;
- request time, region, and API contract version.

The engine MUST reject unauthorized purposes before network work. It MUST preserve original input and produce a separately normalized candidate. It MUST NOT silently repair and verify a typo as though it were the supplied address.

### 2.1 Profiles

| Profile | Product objective | Synchronous budget | Refinement |
|---|---|---:|---|
| `fast` | signup/API latency | target ≤1.5 s, hard ceiling 3 s | optional asynchronous continuation |
| `balanced` | default accuracy/latency | target ≤5 s, hard ceiling 12 s | bounded transient retry |
| `deep` | maximum decisive coverage | initial response ≤12 s | asynchronous bounded passes, never beyond RFC ceilings |

Budgets are initial product defaults, not RFC commitments. Remote defensive signals and safety ceilings always override them.

## 3. Canonical result model

```text
observations → properties → deliverability → risk → customer policy
```

### 3.1 Deliverability

`valid | invalid | catch_all | unknown`

### 3.2 Independent properties

- `role`: boolean probability
- `disposable`: boolean probability
- `free_consumer`: boolean probability
- `organization_type`: commercial, education, government, nonprofit, unknown
- `mailbox_offering`: free_consumer, managed_organization, custom_hosted, unknown
- `mx_operator`: versioned provider identity with confidence
- `downstream_mailbox_operator`: optional inference with confidence
- `accept_all_probability`: 0–1
- `smtp_utf8_required` and `smtp_utf8_supported`
- `syntax_supported`, `domain_routable`, and `smtp_reachable`

### 3.3 Risk

Every score names a target. Version 1 defines `hard_bounce_within_7_days` as the default target for permitted send scenarios. Other targets require separate models. Score range is `[0,1]`; levels are customer-policy thresholds and are not embedded in the model.

### 3.4 Policy

`send | caution | do_not_send | restricted`

`restricted` covers platform safety, privacy suppression, or purpose restrictions and overrides customer configuration.

## 4. Evidence schema

Every observation MUST contain:

```text
evidence_id, verification_id, observed_at, ingested_at,
subject_type, subject_ref, source_class, source_identity,
method, method_version, network_context_ref,
normalized_result, raw_result_ref, command_stage,
quality, scope, ttl_or_expiry, retention_class, schema_version
```

Raw SMTP text is protected operational data. Customer output uses sanitized reason codes. Network context includes worker region, egress identity class, destination endpoint, TLS state where applicable, and connection correlation—not secrets.

### 4.1 Evidence quality

Quality is computed from authenticity, directness, scope match, recency, reproducibility, source health, and ambiguity. Tier is not a substitute for quality. Material contradictions are retained and lower assessment confidence unless a versioned rule resolves them.

## 5. Verification state machine

```text
RECEIVED
  → AUTHORIZED | RESTRICTED
  → PARSED | SYNTAX_INVALID | UNSUPPORTED
  → DNS_PENDING
  → DOMAIN_INVALID | DOMAIN_NO_MAIL | DNS_TRANSIENT | ROUTABLE
  → INTELLIGENCE_EVALUATED
  → SMTP_REQUIRED | SMTP_SKIPPED
  → SMTP_CONNECTING
  → GREETING | CONNECT_TRANSIENT | CONNECT_PERMANENT
  → CAPABILITIES
  → MAIL_FROM_RESULT
  → RCPT_RESULT
  → CATCH_ALL_EVALUATION
  → ASSESSMENT_READY
  → COMPLETE | PENDING_REFINEMENT
  → REFINED_COMPLETE | EXPIRED
```

Every transition emits evidence or a reason. Failures are typed; exceptions do not become invalid results.

## 6. Syntax and normalization

The parser MUST:

- reject missing or multiple unquoted separators, empty required parts, invalid domain structure, control characters, and length violations;
- support quoted/local syntax only to the declared product compatibility level;
- support internationalized domains through IDNA processing with original form retained;
- identify SMTPUTF8-required local parts;
- lowercase the domain for comparison and cache keys;
- preserve local-part case and octets;
- trim only UI transport whitespace, recording that action;
- return typo suggestions separately with confidence and never auto-substitute.

Syntax-invalid is strong `invalid` evidence. “Operationally unsupported but standards-permitted” is `unknown`/unsupported, not invalid.

## 7. DNS resolution strategy

The DNS resolver produces a typed outcome:

```text
NXDOMAIN | NULL_MX | MX | IMPLICIT_MX | NODATA_NO_ROUTE |
SERVFAIL | TIMEOUT | REFUSED | MALFORMED | DNSSEC_BOGUS | OTHER_TRANSIENT
```

Rules:

1. Validated NXDOMAIN → `invalid` with high confidence.
2. Validated Null MX → `invalid` with high confidence.
3. MX → sort by preference; randomize equal-preference targets; resolve A/AAAA within bounded limits.
4. No MX → evaluate RFC-defined implicit fallback.
5. SERVFAIL, timeout, refusal, and contradictory resolver outcomes → transient, never invalid.
6. Cache positive and negative evidence by TTL with a maximum product freshness cap.
7. Re-query through an independent resolver path before high-impact negative classification when the first result is suspicious, uncached, or DNSSEC-conflicting.
8. Private, loopback, documentation, link-local, or otherwise unroutable targets are policy/error evidence and MUST NOT be connected to.

## 8. Intelligence gate

Before SMTP, the engine evaluates fresh intelligence:

- domain and MX behavior;
- provider/gateway identity;
- catch-all probability and expiry;
- transient and blocking profile;
- recent authoritative invalid evidence where permitted;
- disposable/free/role datasets;
- source-specific response reliability;
- privacy or abuse restriction.

SMTP may be skipped when strong fresh evidence already decides the result, when probing would violate a limit, or when the provider profile says live probing is non-informative. Every skip carries a reason and evidence cutoff.

## 9. SMTP observation

The maximum sequence is fixed by RFC 000:

```text
connect → greeting → EHLO/HELO → MAIL FROM → RCPT TO → observe → QUIT/disconnect
```

`DATA`, `VRFY`, `EXPN`, message content, and attempts to evade remote controls are prohibited.

### 9.1 Session rules

- Use a stable, legitimate, resolvable greeting identity.
- Use an approved envelope-sender strategy with bounce-safe domain management.
- Enforce connection, read, command, and total deadlines separately.
- Record every reply and latency by stage.
- Prefer TLS when offered according to the security profile; TLS failure is not automatically mailbox failure.
- Stop immediately on defensive blocking, explicit rate limiting, or policy restriction.
- Do not retry a permanent recipient-specific rejection unless contradictory evidence or provider guidance justifies one controlled confirmation.
- Never rotate identities to evade a block.

### 9.2 Response normalization

Normalized SMTP reasons include:

```text
recipient_accepted, recipient_not_found, recipient_policy_reject,
sender_rejected, authentication_or_reputation_reject,
domain_not_accepted, relay_denied, mailbox_full,
greylisted, rate_limited, provider_busy, temporary_system,
connection_blocked, protocol_error, ambiguous_permanent,
ambiguous_transient, timeout, disconnect
```

Mapping uses provider adapter version, numeric reply, enhanced status, text fingerprint, command stage, and domain behavior. Unknown text never defaults to mailbox-not-found.

## 10. Catch-all methodology

Catch-all is inferred at domain/path level. The engine first uses fresh historical evidence. If live evaluation is permitted and useful, it compares target behavior with a minimal number of high-entropy control recipients that are syntactically plausible and not derived from personal data.

Initial method:

- one control when historical prior is strong and stable;
- at most two controls for ambiguous domains under `balanced`/`deep` profiles;
- zero controls when budgets, gateway profile, or defensive signals prohibit them;
- never enumerate dictionary names;
- cache domain/path inference with provider-specific expiry.

Outcomes:

- target accepted + controls rejected → evidence toward `valid`;
- target and controls accepted → `catch_all` with probability/confidence;
- target rejected recipient-specifically + controls accepted → evidence toward `invalid`, provider rules permitting;
- inconsistent, transient, or blocked controls → `unknown` catch-all property.

## 11. Retry policy

Retries are evidence-driven and budgeted.

| Cause | Default action |
|---|---|
| DNS timeout/SERVFAIL | jittered retry through alternate resolver, max 2 |
| connection timeout | alternate equal-priority MX then bounded retry |
| greylisting | asynchronous retry using provider-informed window |
| rate limit/defensive block | stop; cooldown; no identity rotation |
| provider busy/4.3.x | bounded delayed retry |
| mailbox full | no immediate retry; classify deliverability separately from short-term risk |
| permanent recipient-not-found | no retry unless one confirmation rule applies |
| ambiguous 5xx | provider adapter or abstain; at most one controlled confirmation |

No verification may exceed global/provider/MX/domain/tenant/source budgets. Retry exhaustion yields `unknown` with explicit cause.

## 12. Classification precedence

Precedence controls deliverability only; independent properties remain present.

1. Platform restriction/privacy suppression → policy `restricted`; deliverability may remain uncomputed.
2. Syntax invalid → `invalid`.
3. authoritative NXDOMAIN or Null MX → `invalid`.
4. recipient-specific authoritative permanent rejection → `invalid`.
5. target-specific acceptance with rejected controls and reliable path → `valid`.
6. target and controls accepted → `catch_all`.
7. transient, blocked, contradictory, unsupported, stale, or insufficient evidence → `unknown`.

A cached result cannot outrank fresher contradictory authoritative evidence without an explicit reconciliation rule. Heuristics cannot override protocol evidence on the same subject and scope.

## 13. Confidence

Confidence measures support for the chosen assessment, not probability of delivery. Version 1 confidence is a calibrated model output using evidence quality, independence, recency, provider reliability, contradiction, and sample support. Until calibration data exists, the engine MUST label scores `provisional` and use conservative bands rather than false precision.

Minimum release requirements:

- reliability diagrams and expected calibration error by provider group;
- confidence intervals for benchmark slices;
- no high-confidence label from a single ambiguous signal;
- monotonic confidence reduction for material unresolved contradiction;
- calibration version included in every result.

## 14. Risk score

Default risk predicts hard bounce within seven days for a defined send context. Inputs may include deliverability assessment, confidence, catch-all probability, mailbox-full evidence, result age, domain/MX stability, provider class, and permitted historical outcomes. Role, free, and disposable attributes may affect customer policy but MUST NOT be silently treated as bounce probability without empirical evidence.

The model output contains score, target, horizon, model version, calibration state, top reason codes, and uncertainty. Customer thresholds map score to levels.

## 15. Policy defaults

Initial default mapping:

| Condition | Recommendation |
|---|---|
| valid, calibrated low bounce risk | send |
| catch-all or medium/high uncertainty | caution |
| invalid | do_not_send |
| disposable/role/free | customer-configurable independent rules |
| privacy suppression, abuse restriction, unauthorized purpose | restricted |
| stale result | reverify before policy evaluation |

The API never returns “legally safe to send.”

## 16. Cache strategy

Caches store evidence and assessments separately. Keys include normalized subject, evidence type, method/provider version, relevant network scope, and tenant/global eligibility. Assessment caches include ruleset/model versions. Suggested initial maximum ages:

- syntax: until parser version changes;
- DNS: protocol TTL, capped at 24 hours for verification decisions;
- provider mapping: 7 days with active invalidation;
- SMTP target result: 24 hours valid, shorter for transient outcomes;
- catch-all domain behavior: 7 days stable, shorter when contradictory;
- disposable intelligence: feed-specific, normally 24 hours to 7 days;
- final assessment: 24 hours unless evidence expires sooner.

These are defaults subject to measurement. Privacy deletion and restriction invalidate applicable entries.

## 17. API contract

The API returns:

```json
{
  "verification_id": "...",
  "state": "complete|pending_refinement|restricted",
  "input": {"address": "...", "normalized": "..."},
  "deliverability": {"status": "unknown", "confidence": 0.72},
  "properties": {},
  "risk": {"target": "hard_bounce_within_7_days", "score": 0.31, "level": "medium"},
  "policy": {"recommendation": "caution", "policy_version": "..."},
  "reasons": ["smtp_greylisted"],
  "metadata": {
    "computed_at": "...", "evidence_cutoff_at": "...",
    "recommended_reverify_at": "...", "expires_at": "...",
    "specification_version": "1.0.0", "ruleset_version": "...",
    "model_version": "...", "provider_map_version": "..."
  }
}
```

Raw transcripts are not returned. Pending refinement is idempotently retrievable and optionally delivered by signed webhook.

## 18. Benchmark and QA contract

The benchmark corpus MUST be time-labeled, provider-stratified, provenance-controlled, and separated into development, calibration, and blind test sets. It includes controlled valid/invalid mailboxes, retired addresses, catch-all domains, gateways, disposable churn, role addresses, internationalized syntax, DNS failure cases, greylisting, mailbox-full cases, and consented delivery outcomes.

Required metrics:

- false-valid and false-invalid rates;
- decisive coverage and unknown rate;
- catch-all precision/recall and calibration;
- risk Brier score and calibration error;
- p50/p95/p99 latency by profile and provider;
- DNS/SMTP request cost per verification;
- cache hit and avoided-probe rate;
- result freshness;
- provider/source block rate;
- performance by provider, region, address age, and domain class.

No accuracy claim may omit coverage and evaluation horizon.

## 19. Initial product targets

Targets guide implementation but are not claims:

- false-valid rate under 0.5% on decisive non-catch-all results;
- false-invalid rate under 1.0%;
- decisive coverage above 85% overall, reported by provider;
- fast-profile p95 under 1.5 s when cache/DNS decide, under 3 s overall;
- balanced p95 under 8 s excluding asynchronous refinement;
- zero `DATA`, `VRFY`, or `EXPN` interactions;
- 100% evidence lineage and version completeness;
- zero cross-tenant identifiable leakage in conformance tests.

Targets are revised only from benchmark evidence.

## 20. Exit criteria

This specification is complete because it defines the result ontology, evidence contract, state machine, syntax/DNS/SMTP behavior, catch-all method, retries, precedence, confidence, risk, policy, cache, API semantics, benchmark, and initial targets. Provider-specific mappings and numeric calibration remain versioned research/implementation artifacts rather than gaps in the semantic contract.

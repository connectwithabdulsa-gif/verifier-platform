# Phase 2 — Classification and Scoring Design

**Version:** 1.0.0  
**Status:** Complete  
**Depends on:** RFC 000 v1.0.0; Verification Specification v1.0.0

## 1. Design objective

Produce calibrated, explainable assessments from versioned evidence without conflating technical deliverability, attributes, risk, or customer policy.

## 2. Engine stages

```text
Evidence eligibility
→ evidence normalization
→ property inference
→ deliverability rules
→ confidence calibration
→ bounce-risk model
→ customer policy evaluation
→ explanation generation
```

Each stage is pure with respect to its declared inputs and version. Recalculation appends a new result.

## 3. Evidence eligibility

Evidence enters a computation only when purpose, tenant/global scope, retention, freshness, method version, and quality gates pass. Ineligible evidence remains auditable but cannot influence the result. Global intelligence contributes aggregates/priors, never another tenant's identifiable event.

## 4. Property inference

Property evaluators are independent modules returning value/distribution, confidence, supporting and contradicting evidence IDs, expiry, and method version.

- Role: curated exact tokens, locale-aware patterns, and learned evidence; avoid substring overreach.
- Disposable: curated provider/domain records plus MX/domain clusters and expiry.
- Free consumer: provider offering registry.
- Organization type: domain registry and curated organizational evidence; unknown by default.
- MX/downstream provider: DNS topology plus fingerprints and historical behavior.
- Catch-all: Bayesian-style probability or calibrated classifier over control/history evidence; implementation method may change without API semantic change.

## 5. Deliverability rule graph

Rules are declarative, prioritized, versioned, and side-effect free. A rule outputs candidate status, support strength, reason, and required confidence ceiling.

Hard rules:

1. syntax-invalid → invalid;
2. authoritative NXDOMAIN → invalid;
3. Null MX → invalid;
4. authoritative recipient-not-found → invalid;
5. reliable target acceptance plus rejected controls → valid;
6. accepted controls → catch_all;
7. otherwise → unknown.

Guard rules can demote but not improperly promote: stale evidence, ambiguous gateway, provider block, contradiction, transient response, source reputation anomaly, unsupported SMTPUTF8, and privacy restriction.

## 6. Confidence design

Before sufficient labels, use conservative ordinal bands (`low`, `medium`, `high`) and expose numeric values as provisional. After calibration, fit provider-stratified calibration using held-out data. Confidence features:

- evidence directness and quality;
- provider adapter reliability;
- time decay;
- number of independent corroborating observations;
- scope match;
- contradiction magnitude;
- path authority probability;
- catch-all uncertainty;
- source-health state.

Do not increase confidence by counting correlated retries as independent evidence.

## 7. Bounce-risk model

Initial model is an interpretable monotonic gradient-boosted or generalized additive model, selected by blind benchmark. It predicts `hard_bounce_within_7_days`. Required monotonic relationships: greater result age, catch-all probability, unresolved contradiction, and transient severity cannot reduce modeled risk absent an explicit interaction justified by data.

Training labels are weighted by provenance. Sender-policy, content, authentication, and reputation bounces are excluded from mailbox-hard-bounce labels but retained for separate analysis. Tenant groups are split across train/test to prevent leakage. Calibration occurs after model fitting.

## 8. Policy engine

Policy is a deterministic ruleset over assessments and properties. Precedence:

```text
platform restriction
> regulatory/privacy suppression
> tenant hard prohibition
> tenant risk thresholds
> tenant attribute preferences
> default recommendation
```

Policies are immutable by version, simulatable before activation, and replayable against historical assessments without changing those assessments.

## 9. Explainability

Return stable reason codes grouped as decisive, risk-increasing, risk-reducing, and informational. Customer explanations omit raw SMTP text, protected intelligence membership, and other tenants' contributions. Internal explanations retain exact lineage.

## 10. Model lifecycle

```text
candidate → offline evaluation → shadow → limited rollout
→ calibrated production → monitored → deprecated/rolled back
```

Promotion gates include calibration, slice regressions, unknown/coverage movement, latency/cost impact, privacy approval, and abuse impact. Automatic rollback triggers on false-valid, provider block, calibration, or availability thresholds.

## 11. Experiment backlog

Highest-value experiments:

1. Provider RCPT response reliability matrix.
2. Catch-all controls versus historical priors.
3. Retry marginal value by provider and failure reason.
4. Result-age decay curves.
5. Gateway-authority inference.
6. Disposable feed ensemble precision/recall.
7. Confidence calibration by provider.
8. Cross-vendor blinded benchmark.

## 12. Acceptance gates

- All outputs trace to eligible evidence.
- Rule conflict tests cover every precedence branch.
- Replays are deterministic for fixed versions.
- Confidence is calibrated or clearly provisional.
- Risk target/horizon are explicit.
- No flat taxonomy leakage into the canonical model.
- Policy changes do not mutate evidence or assessments.
- Benchmark reports accuracy and coverage together.

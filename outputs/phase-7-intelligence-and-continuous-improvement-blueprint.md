# Phase 7 / 7.5 — Continuous Improvement and Verification Intelligence

**Version:** 1.0.0  
**Status:** Complete blueprint

## Objective

Create a controlled learning loop that improves decisive coverage and calibration while reducing live probes, without turning customer campaign data into an ungoverned shared asset.

## Learning loop

```text
verification evidence
→ assessment and policy
→ permitted real-world outcomes
→ provenance/quality normalization
→ eligible aggregate intelligence
→ offline model/rule evaluation
→ shadow/canary release
→ improved future assessment
```

No feedback event directly changes production classification.

## Feedback sources

- SMTP/DSN hard and soft bounce events;
- provider delivery/blocked events from authorized integrations;
- customer corrections and disputes;
- signup confirmation outcome where permitted;
- domain/MX topology changes;
- provider response drift;
- disposable-domain discoveries;
- privacy/abuse suppression events for policy only.

Each event records provenance, authentication, tenant, permitted purpose, event stage, diagnostic, provider, source/campaign context where allowed, observation time, ingestion time, and trust.

## Label taxonomy

Labels are target-specific:

- `mailbox_hard_bounce`: recipient nonexistent/disabled under supported diagnostic;
- `temporary_delivery_failure`: quota, greylist, provider busy, transient routing;
- `sender_or_policy_reject`: reputation, authentication, content, authorization;
- `accepted_by_receiver`: not inbox placement;
- `complaint`: policy/reputation target, not mailbox deliverability;
- `customer_assertion`: unverified until corroborated;
- `unknown_cause`.

Ambiguous events remain ambiguous. Label quality is more valuable than label volume.

## Intelligence products

1. **Domain behavior profile:** routability, stability, accept-all posterior, transient rate.
2. **MX/provider profile:** operator, gateway type, response reliability, retry windows.
3. **Response semantics map:** fingerprint → cause probabilities by stage/provider.
4. **Disposable graph:** domains, MX clusters, provider families, activation/expiry.
5. **Role/free/organization registries:** versioned property evidence.
6. **Outcome calibration cubes:** provider/domain class/result age/assessment versus outcomes.
7. **Source-health profile:** egress identity response shifts and blocking.
8. **Model/rule performance registry:** slice metrics and drift.

## Statistical controls

- time decay and effective sample size;
- tenant/source contribution caps;
- correlated-event deduplication;
- hierarchical shrinkage toward provider/global priors for sparse domains;
- confidence intervals for all published rates;
- holdout tenants and future-time test sets;
- calibration before thresholding;
- selection-bias features and explicit limitations;
- no causal claim from observational correlation.

## Catch-all intelligence

Maintain posterior probability by domain + MX path + time window. Inputs include live controls, target/control differential, historical bounce evidence with confounders, gateway mode inference, and contradictions. Store sample size and source diversity. High uncertainty stays catch-all/unknown; do not convert a risky domain to valid solely because aggregate bounce is low.

## Model program

### Generation 0

Versioned deterministic rules and conservative confidence bands.

### Generation 1

Calibrated confidence and interpretable bounce-risk model using governed labels.

### Generation 2

Provider-specific response and retry models; hierarchical catch-all model.

### Generation 3

Online monitoring and frequent offline retraining, still requiring gated publication. No unconstrained online learning.

## Evaluation

Every candidate compares against production on:

- false-valid/false-invalid;
- decisive coverage/unknown;
- calibration/Brier score;
- provider and gateway slices;
- result-age slices;
- latency, retry, and probe cost;
- remote block rate;
- privacy/tenant concentration;
- customer policy changes and commercial impact.

A gain in coverage cannot compensate for a material false-valid regression without explicit product review.

## Drift response

Detect changes in MX topology, response fingerprints, status distribution, calibration, provider blocks, disposable churn, and model features. Response ladder:

1. flag and increase uncertainty;
2. shorten cache/profile expiry;
3. disable affected adapter/rule;
4. fall back to generic conservative handling;
5. research and release versioned replacement.

## Human operations

An intelligence operations queue handles provider changes, disputed classifications, new disposable clusters, response-map conflicts, and model regressions. Operators can annotate/quarantine evidence but cannot edit accepted evidence or force customer-visible validity without a versioned rule and audit.

## Privacy and security

Training datasets are immutable governed snapshots. Cross-tenant data passes DR-0003/DR-0004 gates. Mailbox tokens are used only when necessary, access-restricted, and excluded from customer output. Models are tested for membership leakage. Poisoning defenses include delayed promotion, contribution caps, anomaly detection, and source holdouts.

## Commercial moat metrics

- percentage of verifications decided without live SMTP;
- accuracy/coverage lift from intelligence versus protocol-only baseline;
- catch-all risk calibration;
- provider adapter coverage and reliability;
- avoided connection and retry cost;
- intelligence freshness and source diversity;
- time to detect/recover provider drift;
- percentage of customer outcomes eligible and useful after governance.

## Exit gates

- feedback contracts and label taxonomy operationally testable;
- reproducible training snapshots;
- shadow/canary/rollback lifecycle defined;
- cross-tenant privacy release tests defined;
- drift and poisoning controls defined;
- intelligence benefit measurable against protocol-only baseline;
- no direct feedback-to-production mutation path.

# Phase 2.5 — Data Governance and Intelligence Design

**Version:** 1.0.0  
**Status:** Complete  
**Depends on:** RFC 000 v1.0.0; Decision Register; Verification Specification v1.0.0

## 1. Objective

Create a commercially useful intelligence asset without retaining customer lists as hidden shared data. Governance is enforced through data contracts, lineage, purpose, tenancy, retention, contribution eligibility, privacy release gates, and deletion propagation.

## 2. Data planes

### 2.1 Operational plane

Tenant-scoped, short-lived, personally identifiable, request-serving data:

- original and normalized address;
- request, tenant, purpose, policy, and idempotency metadata;
- raw/normalized DNS and SMTP observations;
- retry/session history;
- assessments and webhook state;
- security and audit events.

Default retention is 30 days; justified configurations may extend to 90. Every field has purpose, sensitivity, retention class, deletion behavior, and access role.

### 2.2 Intelligence plane

Long-lived, aggregated or governed pseudonymized data:

- domain/MX/provider/network behavior;
- response fingerprints and reliability;
- catch-all posterior/history;
- transient and greylisting profiles;
- disposable/free/provider registries;
- time-decayed outcome aggregates;
- rule/model calibration statistics;
- observation sample size, source diversity, and timestamps.

It excludes recoverable campaign lists, raw customer exports, unreviewed mailbox histories, and direct customer identifiers.

### 2.3 Control plane

- tenant contracts and contribution permissions;
- data inventory and purpose registry;
- retention schedules;
- access policy;
- legal holds and deletion exceptions;
- suppression and restriction records;
- model/rule/provider-map registry;
- audit lineage and release approvals.

## 3. Canonical data entities

| Entity | Key properties | Plane |
|---|---|---|
| VerificationRequest | tenant, purpose, address ref, profile, timestamps | operational |
| EvidenceEvent | immutable observation contract | operational; eligible projection only |
| Assessment | evidence set, versions, output, expiry | operational |
| FeedbackEvent | outcome, provenance, context, trust | operational |
| DomainProfile | domain token, DNS/MX behavior, expiry | intelligence |
| MXProfile | hostname/operator, endpoints, fingerprints | intelligence |
| ProviderProfile | behavior priors, adapter version | intelligence |
| NetworkProfile | ASN/egress/destination aggregate | intelligence |
| CatchAllProfile | probability, sample, time decay, scope | intelligence |
| ResponseFingerprint | sanitized normalized pattern and meaning reliability | intelligence |
| DisposableEntity | domain/MX cluster, source confidence, expiry | intelligence |
| AggregateOutcome | cohort statistics, target, provenance mix | intelligence |
| SuppressionRecord | protected keyed identifier, purpose, jurisdiction, expiry | control |
| LineageManifest | transformation graph and versions | control |

## 4. Identity and pseudonymization

Raw addresses exist only in the operational plane. Where mailbox-level deduplication is permitted, use keyed, rotating, environment-separated tokens; keep keys outside analytical stores. Tokens remain personal data for governance purposes. Domain-level data is not automatically non-personal when combined with sparse tenant or mailbox context.

Key rotation supports forward privacy and cryptographic erasure. Cross-tenant aggregates must not expose tokens or allow equality queries against arbitrary inputs.

## 5. Contribution pipeline

```text
operational evidence
→ purpose/contract eligibility
→ schema and quality validation
→ identifier minimization
→ cohort assignment
→ contribution bounding
→ aggregation/time decay
→ re-identification and membership-risk tests
→ intelligence publication
```

Every projection records source class, transformation version, permitted purpose, contribution timestamp, and deletion lineage. Contractual permission without privacy review is insufficient.

## 6. Cross-tenant release gate

Initial conservative defaults:

- at least five independent eligible tenant/source groups for customer-derived global outcomes;
- no source group contributes more than 20% effective weight;
- minimum effective sample of 100 for released numeric outcome rates unless the data is public protocol/provider observation;
- suppress or coarsen sparse cohorts;
- no mailbox-level global statistic exposed to customers;
- differential privacy or equivalent disclosure controls evaluated for externally released analytics;
- red-team membership inference before new explanation types.

These thresholds are policy defaults and must be empirically reviewed. Failing a gate keeps data tenant-local.

## 7. Time and decay

Every profile has `observed_from`, `observed_to`, `computed_at`, `effective_sample_size`, `decay_function`, and `expires_at`. Suggested half-lives:

- DNS/MX topology: 1–7 days, bounded by TTL and change detection;
- SMTP/provider behavior: 7–30 days;
- catch-all behavior: 14 days, shortened on contradiction;
- disposable status: source-specific, often 1–7 days;
- bounce calibration: 30–90 days with provider-specific drift monitoring.

No aggregate is timeless. Fresh protocol evidence can supersede stale intelligence.

## 8. Feedback governance

Feedback is labeled by event stage and cause. Mailbox-hard-bounce training eligibility excludes authentication, content, sender reputation, policy, and ambiguous gateway failures. Delivered/accepted signals are not inbox-placement labels. Complaint data informs separate policy/risk targets and receives restricted access.

Source trust is learned from consistency and provenance, but a customer cannot improve its trust by flooding correlated events. Contribution caps apply before model training.

## 9. Retention and deletion

Deletion workflow:

```text
request authenticated
→ identity and scope resolved
→ primary rows tombstoned/removed
→ caches and indexes invalidated
→ replicas/exports queued
→ pseudonymous links erased or detached
→ aggregates assessed for continued non-identifiability
→ backups expire or keys are destroyed
→ completion manifest recorded
```

Aggregates may remain only when no longer personal/identifying under the applicable analysis and contract. Otherwise they are recomputed or removed. Suppression records remain in minimum protected form solely for objection, restriction, or abuse prevention.

## 10. Access controls

- tenant data: tenant-scoped service identities only;
- raw evidence: verification operations and restricted incident support;
- intelligence: approved pipelines; analysts use minimized views;
- suppression: dedicated service with no general browsing;
- production break-glass: time-bound approval, reason, recording, and review;
- model datasets: immutable snapshots, purpose approval, and lineage.

General logs and metrics exclude raw addresses and transcripts.

## 11. Data quality

Each dataset has an owner, schema SLO, freshness SLO, completeness checks, contradiction rate, drift checks, quarantine path, and rollback. Poisoning controls include source caps, anomaly detection, delayed promotion, shadow aggregates, and reproducible rebuilds.

## 12. Governance acceptance criteria

- Every stored field maps to purpose and retention.
- Operational and intelligence planes have separate access paths.
- Cross-tenant learning passes contract and privacy gates.
- Deletion tests cover primary, cache, index, replica, export, and backup strategy.
- Suppression cannot be queried as intelligence.
- Training snapshots reproduce from lineage manifests.
- Tenant concentration and source quality are measurable.
- No global address list can be reconstructed from intelligence artifacts.

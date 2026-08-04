# Phase 6 — Production Infrastructure Blueprint

**Version:** 1.0.0  
**Status:** Complete blueprint

## Objective

Turn the validated MVP into a reliable, abuse-resistant, cost-efficient production service without changing verification semantics.

## Availability model

- API control plane target: 99.95% monthly after stabilization.
- Verification completion target: 99.9%, excluding remote-provider impossibility represented as valid unknown outcomes.
- No promise that every provider is probed; safe abstention is correct behavior.
- RPO: ≤5 minutes for control/operational state; evidence append designed for no acknowledged loss.
- RTO: ≤60 minutes initial, reduced to 15 minutes for mature enterprise tier.

## Production topology

- primary control/data region with warm recovery region;
- multiple isolated verification worker pools and egress identities;
- managed relational HA with point-in-time recovery;
- durable multi-AZ queues and delay scheduling;
- replicated cache used only as reconstructable optimization;
- immutable encrypted object storage for evidence/audit;
- separate analytical/intelligence compute and credentials;
- CDN/WAF/API gateway at edge.

SMTP egress failover is not automatic across regions because source identity changes evidence and remote reputation. Recovery uses approved pools with cold-start limits.

## Scaling

Autoscaling inputs combine queue age, permitted work, provider/MX distribution, connection occupancy, and CPU—not queue depth alone. Scheduler budgets remain authoritative; scaling cannot create more destination pressure. Real-time has reserved capacity, balanced against tenant fairness. Deep/bulk work consumes surplus within safety limits.

## Egress and reputation operations

- dedicated, inventoried IP pools by region/profile;
- correct forward/reverse DNS and stable greeting identities;
- continuous block/reputation and SMTP-error monitoring;
- staged warm introduction through legitimate verification traffic, never mail warming;
- no rapid IP rotation to escape blocks;
- per-pool health score and automatic drain;
- documented provider escalation and incident process.

## Reliability patterns

- transactional outbox for state/event consistency;
- idempotent consumers and dedupe windows;
- bounded exponential backoff with reason-specific schedules;
- circuit breakers at provider/MX/domain/source;
- bulkhead worker pools for slow/tarpit providers;
- poison-event quarantine;
- schema compatibility gates;
- model/rule/provider-map rollback independent of application deploy;
- progressive delivery and feature kill switches.

## Observability and SRE

Service-level indicators:

- accepted API availability/latency;
- workflow age and terminal completion;
- evidence durability lag;
- assessment lag;
- webhook success latency;
- deletion completion;
- classification distribution/drift;
- remote block/cooldown rate;
- cost per decisive result.

Error budgets exclude correctly returned unknowns but include internal errors mislabeled as unknown. Alerts are symptom-based and privacy-safe. Runbooks cover provider block, resolver failure, queue backlog, model regression, tenant abuse, data leak, deletion failure, and regional loss.

## Security

- infrastructure as code and policy as code;
- separate prod/non-prod accounts and data;
- workload identity instead of static credentials;
- secrets rotation and hardware-backed key management;
- dependency/container signing and provenance;
- network segmentation and explicit egress;
- WAF, DDoS, bot, credential-abuse controls;
- SAST/DAST/dependency scanning and annual penetration testing;
- JIT privileged access and tamper-evident audit;
- incident response, breach assessment, and customer notification process;
- regular restore and cryptographic-erasure tests.

## Privacy operations

Automated retention jobs, data-subject request workflow, export/delete evidence, subprocessor inventory, regional routing, DPIA/LIA support, and deletion propagation dashboards. Backups have documented expiry; restores replay deletion tombstones before service exposure.

## Abuse operations

Risk-tier onboarding, verified business identity for high volume, purpose declarations, progressive quotas, invalid-recipient ratio monitoring, destination concentration limits, API-key anomaly detection, rapid suspension, appeal/review, and preserved investigation evidence under scoped retention.

## Disaster recovery

Quarterly restore tests and semiannual region-loss exercises. Recovery order: identity/control, request/result access, queues/workflows, evidence, verification workers, bulk/export, intelligence pipelines. During partial recovery, the platform returns pending/unknown rather than unsafe probing or stale certainty.

## Cost controls

- budgets and unit economics per tenant/profile/provider;
- intelligent cache and deduplication;
- storage tiering and lifecycle;
- slow-provider work isolated and priced appropriately;
- bulk scheduling to economical capacity;
- sampling for high-cardinality telemetry without sampling audit/security events;
- anomaly alerts for retry storms and cache collapse.

## Production release gates

- 30-day beta SLO and calibration stability;
- load/chaos tests at 2× expected peak;
- DR restore proven;
- penetration/privacy/abuse reviews closed;
- provider block recovery exercised;
- capacity and cost model validated;
- on-call/runbooks/incident command ready;
- customer-facing status and support processes ready;
- no unresolved high-severity findings.

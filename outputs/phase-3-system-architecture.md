# Phase 3 — System Architecture

**Version:** 1.0.0  
**Status:** Complete  
**Scope:** Logical and deployment architecture; no implementation code

## 1. Architecture drivers

Ordered priorities:

1. classification correctness and evidence integrity;
2. remote-system safety and abuse resistance;
3. tenant/privacy isolation;
4. low-latency cached decisions;
5. bounded asynchronous refinement;
6. cost-efficient high throughput;
7. reproducibility and operational simplicity;
8. regional scale and enterprise controls.

## 2. Architectural style

Start as a modular platform with three independently scalable runtime units, not a microservice per check:

1. **API/Control Plane** — authentication, tenancy, requests, policies, results, webhooks, billing events.
2. **Verification Worker Plane** — orchestration, DNS, SMTP, enrichment, provider adapters, evidence capture.
3. **Intelligence/Data Plane** — eligible projection, aggregates, model/rule registry, calibration, analytics.

Modules split into services only when scaling, security, failure isolation, regulatory residency, or deployment cadence justifies it.

## 3. Logical architecture

```text
Clients / Bulk Upload / Integrations
                ↓
Edge, WAF, Auth, Quota, Abuse Admission
                ↓
Verification API ───── Result/Policy API
        ↓                     ↑
Request Store → Orchestrator → Assessment Engine
                   ↓                 ↑
          Evidence/Intelligence Gate │
          ↓        ↓        ↓        │
      Syntax     DNS     SMTP/Provider Adapters
          └──────── Evidence Ledger ─┘
                         ↓
                Eligible Projection Pipeline
                         ↓
       Domain/MX/Provider Intelligence + Models

Asynchronous path:
Orchestrator → Delay/Work Queues → Retry Workers → New Assessment
                                      ↓
                             Webhook/Result Update
```

## 4. Request flow

### 4.1 Real-time

1. Edge authenticates tenant, enforces request size/rate, and blocks obvious abuse.
2. API validates purpose, idempotency, and contract.
3. Orchestrator runs cheap syntax and intelligence gates.
4. DNS work executes if no fresh decisive evidence exists.
5. SMTP work is admitted only after global/provider/MX/domain/tenant/source budgets.
6. Evidence is appended before assessment.
7. Assessment engine evaluates fixed evidence cutoff and versions.
8. Policy engine generates recommendation.
9. API returns complete or pending-refinement response.
10. Refinement appends new evidence/assessment and sends signed webhook.

### 4.2 Bulk

Uploads are malware-scanned, schema-validated, encrypted, and transformed into deduplicated tenant jobs. Domain/MX grouping maximizes DNS/intelligence reuse but scheduling deliberately interleaves destinations to avoid bursts. Progress is aggregate; per-record results use the same engine and contract as real time.

## 5. Storage model

| Need | Logical store | Consistency |
|---|---|---|
| tenants, auth, policy, jobs, billing | relational control store | strong |
| request/result operational state | partitioned relational/document store | strong per verification |
| immutable evidence | append object/event store + indexed metadata | append-consistent |
| queues/retries | durable message/delay system | at-least-once |
| hot DNS/provider/result cache | distributed key-value | eventual with explicit versions |
| domain/MX/provider intelligence | analytical/key-value profiles | versioned eventual |
| model/rule artifacts | immutable artifact registry | strong publication |
| audit/security events | append security log | tamper-evident |
| bulk files/exports | encrypted object storage | lifecycle-managed |

Vendor selection is deferred. The architecture requires idempotency because queue delivery is at-least-once.

## 6. Partitioning

- Operational state: tenant + verification ID, with address-domain secondary routing.
- Work queues: region and destination provider/MX class, never unbounded per-domain partitions.
- Intelligence: registrable domain, MX operator/hostname, provider, and time bucket.
- Evidence: verification ID plus time; protected raw blobs separated from normalized metadata.
- Bulk: tenant/job with row-level verification identifiers.

Hot-domain protection uses admission budgets, not unlimited horizontal workers.

## 7. Scheduler and rate control

A hierarchical token-budget scheduler enforces:

```text
global → region/egress → provider → MX → domain → tenant → source identity
```

Each layer has concurrency, connection-rate, recipient-attempt, invalid-control, retry, and cooldown budgets. Provider adapters can reduce limits; none can exceed global safety ceilings. Remote 4xx/block signals create circuit state shared across workers. Half-open recovery uses minimal probes and never identity rotation.

Fair scheduling prevents one tenant or domain from consuming the fleet. Bulk traffic yields to latency-sensitive real-time traffic within safety limits.

## 8. Reliability model

- API is multi-instance and stateless apart from stores.
- Orchestration is resumable from durable state.
- Each network attempt has a unique idempotency/attempt ID.
- Evidence append precedes assessment publication.
- Duplicate events are deduplicated by stable IDs.
- Retry messages carry reason, not just attempt count.
- Poison jobs quarantine after bounded failures.
- Provider circuit breakers fail to unknown/pending, never invalid.
- Regional failure routes API/control traffic, but SMTP egress movement is deliberate because source region changes evidence.

## 9. Security boundaries

- Public edge terminates untrusted traffic and performs admission.
- Customer identity and tenant authorization are rechecked at every data boundary.
- Worker egress is isolated from control/data stores through narrow service identities.
- DNS and SMTP parsers run with memory/CPU/response-size limits.
- Destination addresses are validated to prevent SSRF into private/reserved networks.
- Secrets live in managed secret storage and rotate.
- Raw addresses/transcripts never enter ordinary telemetry.
- Intelligence projection is one-way through eligibility/privacy gates.
- Administrative access is just-in-time, logged, and reviewed.

## 10. Regional strategy

Phase 1 deployment uses one primary region plus a warm secondary for control/data disaster recovery and separately managed SMTP egress pools. Later regions are added for latency, residency, and provider diversity. Evidence records worker/egress region because responses may differ. Data residency rules govern operational data; global intelligence accepts only eligible minimized projections.

## 11. Observability

Golden signals are extended with verification-specific measures:

- request and queue latency by profile/provider;
- status, confidence, and unknown distributions;
- DNS outcomes and cache performance;
- SMTP stage/reason distributions;
- circuit breaker and remote block events;
- attempts and controls per verification;
- evidence append/assessment lag;
- calibration and outcome drift;
- tenant/provider concentration;
- deletion propagation lag;
- cost per decisive result.

Telemetry uses opaque verification IDs and coarse domain/provider dimensions where safe.

## 12. Capacity and cost model

Primary cost drivers are SMTP connection time, retries/tarpits, DNS volume, queue retention, and bulk storage. Optimize in this order:

1. cache/intelligence decision;
2. request deduplication;
3. shared DNS/MX resolution;
4. provider-aware early stop;
5. asynchronous slow work;
6. connection reuse only where protocol/provider safety and evidence isolation permit;
7. tiered evidence storage lifecycle.

Measure cost per decisive, correctly calibrated result—not cost per request.

## 13. Deployment evolution

### MVP

API/control application, verification workers, intelligence pipeline, relational control/operational store, durable queue, cache, object evidence store.

### Scale split triggers

- DNS workers: QPS or resolver isolation.
- SMTP workers: egress/security/regional scaling.
- assessment engine: independent release/calibration needs.
- bulk coordinator: workload/failure isolation.
- intelligence pipeline: data access/security boundary.
- webhook delivery: retry and tenant-noise isolation.

No split occurs solely for conceptual purity.

## 14. Architecture acceptance criteria

- Every result has durable evidence and version lineage.
- No failure path converts infrastructure error to invalid.
- Hierarchical rate controls precede SMTP attempts.
- Operational and intelligence planes have enforced one-way eligibility boundary.
- Real-time and bulk use one semantic engine.
- Slow verification refines asynchronously.
- Architecture can start with three runtime units.
- All stateful operations are idempotent/replayable.
- RFC-prohibited SMTP commands are structurally unreachable.

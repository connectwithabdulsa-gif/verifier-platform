# Phase 5 — Instrumented MVP Blueprint

**Version:** 1.0.0  
**Status:** Complete blueprint; implementation not started

## MVP objective

Prove that the evidence pipeline produces reproducible, useful verification results safely. The MVP is not a dashboard-first SaaS and not a high-scale SMTP fleet.

## Scope

### Included

- authenticated single verification API;
- small asynchronous bulk jobs;
- fast and balanced profiles;
- syntax/normalization including IDN and SMTPUTF8 detection;
- typed DNS state machine;
- bounded SMTP through RCPT only;
- Google, Microsoft, Yahoo, Mimecast/Cisco/generic adapters;
- role, free-provider, and disposable properties;
- historical domain/MX cache and catch-all probability;
- evidence ledger and deterministic assessment replay;
- deliverability/confidence/provisional bounce risk;
- customer policy rules;
- pending refinement, polling, and signed webhooks;
- tenant isolation, quotas, abuse controls, deletion;
- internal benchmark harness and operations console.

### Excluded

- CRM integrations, Clay/Smartlead/Instantly;
- sophisticated ML or automated retraining;
- multi-region active-active;
- customer-facing analytics suite;
- enterprise SSO/SCIM/custom roles;
- marketplace/reseller features;
- inbox placement, sending, warming, finding, or outreach.

## MVP runtime

Three deployables: API/control, verification worker, assessment/data worker. Use managed relational storage, durable queue/delay mechanism, key-value cache, encrypted object evidence storage, and managed observability. Technology selection occurs during implementation kickoff using team expertise and total operating cost; it does not change contracts.

## Build order

1. Repository, CI, schema/version conventions, threat controls.
2. Tenant/auth/purpose/idempotent request path.
3. Evidence ledger and deterministic replay skeleton.
4. Syntax and DNS capabilities with fixture suite.
5. Hierarchical scheduler and network-safety enforcement.
6. SMTP worker and generic adapter.
7. Assessment rule graph and API response.
8. Provider adapters and catch-all evaluator.
9. Retry/refinement and webhooks.
10. Bulk coordinator.
11. Feedback ingestion and eligible intelligence projection.
12. Benchmark, shadow evaluation, limited beta.

## Test strategy

- parser/DNS/SMTP transcript fixtures;
- state-machine and rule property tests;
- prohibited-command structural tests;
- local fake DNS/SMTP servers for every failure stage;
- deterministic assessment golden tests;
- tenant isolation and authorization tests;
- deletion propagation tests;
- queue duplicate/out-of-order chaos tests;
- malicious response fuzzing;
- load tests with destination safety simulation;
- blind benchmark against labeled controls and vendors.

No production test sends message content.

## Beta gates

- false-valid <0.5% and false-invalid <1% on decisive controlled non-catch-all slice;
- coverage/unknown reported by provider, with no hidden denominator;
- 100% result lineage and reproducible replay;
- zero prohibited SMTP commands in packet/fixture audit;
- no high-severity tenant/privacy/security finding;
- scheduler/circuit breaker verified under load;
- deletion completes within defined SLO;
- p95 latency within verification profile targets;
- remote block rate below approved threshold;
- operations can disable a provider/source/tenant instantly.

## MVP team

Lean team: technical lead, two backend/distributed engineers, one network/email engineer, one data/ML engineer, one product/full-stack engineer, shared security/privacy/SRE support. Roles may overlap; email/network and data calibration expertise are not optional.

## MVP milestone plan

- M1 Foundation and evidence: weeks 1–3.
- M2 DNS/SMTP safe engine: weeks 4–7.
- M3 classification/API/refinement: weeks 8–10.
- M4 intelligence/bulk/benchmark: weeks 11–13.
- M5 closed beta hardening: weeks 14–16.

Dates are planning assumptions. Evidence quality and safety gates, not calendar pressure, control release.

## MVP commercial validation

Closed beta targets signup validation, CRM hygiene, and authorized small bulk verification. Measure accuracy/coverage, latency, avoided probes, cost per decisive result, result-age effects, customer policy utility, and willingness to pay. Do not optimize vanity volume.

## Exit

MVP is complete when a closed beta can verify and explain results reproducibly, safely refine ambiguous cases, ingest permitted outcomes, and demonstrate competitive benchmark value. It need not yet meet enterprise availability or integration breadth.

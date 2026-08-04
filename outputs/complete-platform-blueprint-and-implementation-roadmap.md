# Commercial Email Verification Platform — Complete Blueprint and Implementation Roadmap

**Blueprint version:** 1.0.0  
**Status:** Complete; ready for implementation planning  
**Governing baseline:** RFC 000 v1.0.0 (frozen)

## 1. Product thesis

Build the fastest verifier that is honest about uncertainty and improves with governed evidence. Competitive advantage comes from provider-aware interpretation, calibrated abstention, and a privacy-safe domain/MX/provider intelligence graph—not brute-force SMTP volume or a black-box accuracy claim.

## 2. Artifact map

| Layer | Authoritative artifact |
|---|---|
| Governance | `phase-0-email-ecosystem-rfc.md` |
| Decisions | `phase-0-decision-register.md` |
| Research source | `phase-1-research-corpus.md` |
| Research synthesis | `phase-1-technical-whitepaper.md` |
| Verification contract | `phase-1.5-verification-specification.md` |
| Classification/scoring | `phase-2-classification-and-scoring-design.md` |
| Data/intelligence governance | `phase-2.5-data-governance-and-intelligence-design.md` |
| Architecture | `phase-3-system-architecture.md` |
| Capability contracts | `phase-4-logical-service-contracts.md` |
| MVP | `phase-5-mvp-blueprint.md` |
| Production | `phase-6-production-infrastructure-blueprint.md` |
| Learning moat | `phase-7-intelligence-and-continuous-improvement-blueprint.md` |
| Enterprise SaaS | `phase-8-enterprise-saas-blueprint.md` |

Later artifacts depend on earlier semantics and cannot redefine them.

## 3. Product architecture in one view

```text
Customers / Bulk / Integrations
          ↓
Auth + Purpose + Abuse Admission
          ↓
Verification Orchestrator
  ├─ Syntax/Normalization
  ├─ Intelligence Gate
  ├─ Typed DNS
  ├─ Hierarchical Scheduler
  ├─ SMTP + Provider Adapters
  └─ Catch-all Evaluator
          ↓
Immutable Evidence Ledger
          ↓
Property + Deliverability + Confidence + Risk
          ↓
Customer Policy
          ↓
API Result / Async Refinement / Webhook
          ↓
Governed Feedback Projection
          ↓
Domain/MX/Provider Intelligence and Calibration
```

## 4. Implementation program

### Stage A — Foundation (weeks 1–3)

Deliver repository/CI, schema registry, tenant/auth/purpose, idempotency, operational store, evidence ledger, audit conventions, fixture harness, and local fake DNS/SMTP systems.

**Gate:** an input can create a tenant-scoped verification, append/replay evidence, and produce no network work without authorization.

### Stage B — Safe protocol engine (weeks 4–7)

Deliver syntax/IDN/SMTPUTF8, typed DNS, endpoint safety, hierarchical scheduler, generic SMTP observer through RCPT, transcript normalization, circuits, and packet-level prohibited-command tests.

**Gate:** deterministic fixture coverage for every state; zero `DATA/VRFY/EXPN`; remote limits and private-network protection proven.

### Stage C — Verification product (weeks 8–10)

Deliver provider adapters, catch-all evaluation, rule graph, confidence bands, provisional risk, customer policy, synchronous API, pending refinement, polling, webhooks, and cache/version semantics.

**Gate:** end-to-end reproducible result with evidence lineage and correct unknown handling.

### Stage D — Intelligence and bulk (weeks 11–13)

Deliver bulk coordinator/export, feedback contracts, eligibility/privacy projection, domain/MX profiles, disposable/free/role registries, benchmark harness, operations console, and deletion propagation.

**Gate:** tenant-isolated bulk, governed aggregate rebuild, deletion test, blinded benchmark report.

### Stage E — Closed beta (weeks 14–16)

Run authorized customers at controlled volume. Measure accuracy/coverage, latency, cost, block rate, result age, policy utility, and calibration. Fix provider adapters and operational failure modes.

**Gate:** MVP acceptance criteria and no high-severity findings.

### Stage F — Production hardening (months 5–7)

HA stores/queues, DR, multi-pool egress, SRE/on-call, observability, abuse operations, security hardening, privacy automation, billing ledger, customer status/support.

**Gate:** production release gates and 30-day stability.

### Stage G — Intelligence engine (months 7–10)

Governed feedback integrations, calibrated models, catch-all posterior, drift/poisoning controls, shadow/canary lifecycle, intelligence operations.

**Gate:** measurable lift over protocol-only baseline without safety/privacy regression.

### Stage H — Enterprise SaaS (months 9–15)

Dashboard, teams, policy simulation, SSO/SCIM/RBAC, CRM/workflow integrations, billing packages, residency/private networking, security portal, SOC 2 program.

**Gate:** enterprise launch criteria and sustainable unit economics.

Timeline assumes a focused 6–8 person core team and managed infrastructure. Staffing or compliance scope can change calendar but not semantic gates.

## 5. Team evolution

### MVP core

- founder/technical product lead;
- email/network engineer;
- two backend/distributed engineers;
- data/ML engineer;
- product/full-stack engineer;
- fractional SRE/security/privacy.

### Production additions

- dedicated SRE/platform;
- security/compliance owner;
- data platform/analytics;
- customer integration engineer;
- support/provider operations.

### Enterprise additions

- enterprise product/solutions;
- compliance program manager;
- support/on-call coverage;
- sales engineering and customer success.

## 6. Build-versus-buy

Build the verification state machine, evidence model, provider adapters, classification, calibration, scheduler semantics, intelligence profiles, and policy engine. Buy managed commodity capabilities: identity/SSO initially, payments/tax, WAF/DDoS, relational/object/queue infrastructure, observability, customer support, and compliance evidence tooling. Avoid outsourcing the evidence/intelligence core.

## 7. Initial unit economics model

Track per million requests:

- cache/intelligence decision percentage;
- DNS queries and cost;
- SMTP attempts, seconds, retries, and egress cost;
- evidence/storage/queue cost;
- model/analytics cost;
- support/abuse cost;
- gross margin by profile and tenant.

Pricing must cover slow/deep verification and enterprise isolation. Optimize cost per decisive calibrated result, not raw request.

## 8. Highest product risks

| Risk | Mitigation |
|---|---|
| Providers block or obscure SMTP | conservative unknown, adapters, intelligence, low probing, circuits |
| Catch-all false certainty | probability/expiry, outcomes, policy caution |
| Customer abuse | purpose, onboarding, quotas, concentration detection, suspension |
| Evidence poisoning | provenance, caps, quarantine, shadow promotion |
| Privacy leakage | plane separation, release gates, deletion, membership tests |
| Vendor accuracy marketing pressure | publish accuracy with coverage/methodology |
| Retry/tarpit cost explosion | profiles, async work, budgets, isolation |
| Architecture over-splitting | three runtime units first, measured split triggers |
| Model drift | provider/time slices, rollback, generic fallback |
| Enterprise distraction | prove engine and unit economics before integration breadth |

## 9. Critical pre-implementation decisions delegated to engineering

Engineering selects language, cloud, managed stores, queue, observability, and CI based on team capability, security, latency, and total cost. These are reversible architecture decisions recorded as ADRs. Business input is needed only for budget envelope, hiring constraints, target beta customers, pricing, and contractual market commitments.

## 10. Definition of implementation-ready

Implementation may start when:

- RFC and Decision Register remain frozen;
- verification and service contracts are accepted by the implementation team;
- benchmark seed corpus and safe test infrastructure exist;
- cloud/vendor threat and cost evaluation is recorded;
- security/privacy owners are assigned;
- beta customer purposes and volume ceilings are defined;
- no proposed component requires prohibited SMTP behavior.

## 11. First implementation backlog

1. Establish ADR/repository/schema conventions.
2. Build local protocol fixture lab.
3. Define evidence/event schemas from Phase 1.5.
4. Implement tenant/purpose/idempotency skeleton.
5. Implement append/replay evidence ledger.
6. Implement syntax and DNS modules.
7. Implement scheduler permits and endpoint safety.
8. Implement generic SMTP observation through RCPT.
9. Implement deterministic assessment rules.
10. Expose single verification API.

This ordering tests the hardest semantic and safety assumptions before UI, integrations, or enterprise features.

## 12. Blueprint completion statement

The blueprint covers research, formal verification semantics, classification and scoring, data governance, logical/system architecture, capability contracts, MVP, production infrastructure, continuous intelligence, enterprise SaaS, and an ordered implementation program. It writes no production code and makes no undocumented claim that provider behavior is known where experiments remain required.

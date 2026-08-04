# MVP Engineering Decisions

## Stack

TypeScript on Node.js 24, native HTTP/DNS/net/TLS, node:test, and node:sqlite for the local MVP. PostgreSQL is the production system of record; Redis-compatible cache and a managed durable queue are production adapters. The initial dependency-light implementation reduces supply-chain and environment friction while preserving typed module contracts.

## Deployment

Begin with three runtime roles from Phase 3: API/control, verification worker, and assessment/data worker. They share a repository and domain package. Split only at measured scale/security boundaries.

## Experiment safety

Experiments require an explicit manifest, authorization attestation, known test addresses, destination budgets, and a dry-run default. Live mode is opt-in via environment flag and still cannot transmit message data.

## Assumptions

- Initial beta scale fits PostgreSQL plus a managed queue.
- Provider experiments use domains/accounts owned by the company or explicitly authorized partners.
- Real-world outbound network experiments may be restricted in development environments; fixture lab remains mandatory and live observations append later.
- SMTP port 25 availability is an infrastructure prerequisite, not assumed.

## Sprint plan

1. Foundation/evidence/schema/test lab.
2. Syntax/DNS and safety controls.
3. SMTP observer/provider adapters/scheduler.
4. Orchestration/classification/API.
5. Experiments, persistence, bulk/refinement.
6. Benchmark, security, closed-beta hardening.

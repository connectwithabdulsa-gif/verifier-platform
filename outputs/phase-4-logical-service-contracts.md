# Phase 4 — Logical Service Contracts

**Version:** 1.0.0  
**Status:** Complete  
**Depends on:** System Architecture v1.0.0

Logical capabilities are contracts, not mandatory deployment units. MVP modules may share a process; boundaries remain enforceable in code ownership, schemas, and tests.

## 1. Edge and admission

**Owns:** request authenticity, coarse WAF controls, payload limits, tenant lookup, global/tenant quotas, abuse admission.  
**Input:** HTTP/API request.  
**Output:** authenticated principal, tenant, request class, admission decision, trace ID.  
**Must not:** parse SMTP, classify addresses, access raw intelligence.  
**Failure:** fail closed for auth; return typed rate/abuse response.  
**SLO:** p99 overhead <100 ms excluding external identity provider.

## 2. Verification API

**Owns:** public contract, idempotency, request/result retrieval, API version negotiation.  
**Commands:** `CreateVerification`, `GetVerification`, `CreateBulkJob`, `GetBulkJob`, `CancelBulkJob`, `CreateExport`.  
**Events:** `VerificationRequested`, `BulkJobRequested`.  
**Invariants:** same idempotency key + canonical request returns same verification; never exposes raw transcripts; result versions are append-only.  
**Failure:** typed 4xx for contract/purpose; typed 429; 202 for pending refinement; 5xx never fabricates result.

## 3. Purpose and policy authorization

**Owns:** permitted purpose, tenant restrictions, privacy suppression check, product profile eligibility.  
**Input:** tenant, address token, purpose, context.  
**Output:** `allowed | restricted`, policy IDs, contribution eligibility.  
**Must not:** reveal suppression membership beyond actionable restriction.  
**Availability:** fail closed for network probing; cached signed policy snapshots allowed.

## 4. Verification orchestrator

**Owns:** state machine, deadlines, attempt planning, evidence cutoff, synchronous/asynchronous transition.  
**Input:** authorized verification command.  
**Output:** attempt commands, assessment command, durable state transitions.  
**Invariants:** never schedules prohibited commands; all transitions idempotent; budgets are checked immediately before network work; infrastructure failures map to unknown/pending.  
**Persistence:** durable workflow state with optimistic version.  
**Failure:** resume from last committed transition.

## 5. Syntax and normalization capability

**Owns:** parsing, supported syntax, IDNA domain form, SMTPUTF8 requirement, typo suggestions.  
**Input:** original address + parser version.  
**Output:** normalized candidate, typed syntax evidence, suggestions.  
**Must not:** mutate original, auto-accept suggestion, perform network I/O.  
**Determinism:** identical input/version produces identical output.

## 6. DNS capability

**Owns:** typed resolution, MX ordering, implicit fallback, Null MX, address resolution, TTL, resolver provenance, DNS safety.  
**Input:** normalized domain, deadline, resolver profile.  
**Output:** immutable DNS evidence set.  
**Must not:** connect to resolved endpoints or follow targets into prohibited networks.  
**Limits:** query count, response bytes, recursion/alias depth, total deadline.  
**Failure:** typed transient/permanent DNS outcome; no Boolean `mx_found` as canonical result.

## 7. Intelligence lookup

**Owns:** fresh eligible domain/MX/provider profiles, disposable/free registries, catch-all prior, provider adapter selection.  
**Input:** minimized keys, time, tenant/global eligibility.  
**Output:** versioned profile snapshot and evidence references.  
**Must not:** expose contributing tenants or raw mailbox lists.  
**Consistency:** snapshot version fixed for one assessment; stale data explicitly marked.

## 8. Hierarchical scheduler

**Owns:** global/region/egress/provider/MX/domain/tenant/source budgets, fair queueing, cooldowns, circuit breakers.  
**Input:** proposed network attempt with dimensions and cost.  
**Output:** permit with expiry, delay, or deny/cooldown reason.  
**Invariants:** adapters may reduce but not raise ceilings; permits are single-use; defensive signals propagate quickly.  
**Failure:** unavailable scheduler means no new SMTP attempt.

## 9. SMTP observation capability

**Owns:** bounded connection and approved SMTP sequence, provider fingerprint capture, sanitized normalization.  
**Input:** permit, endpoint plan, envelope profile, target recipient, deadline, adapter version.  
**Output:** greeting/EHLO/MAIL/RCPT evidence, timing, connection outcome, defensive-signal event.  
**Prohibited:** `DATA`, `VRFY`, `EXPN`, content, identity rotation to evade controls.  
**Isolation:** restricted egress, no broad datastore credentials, response-size/CPU/memory limits.  
**Failure:** append partial evidence and typed outcome; always consume/close permit.

## 10. Provider adapter registry

**Owns:** provider fingerprint rules, response normalization, retry hints, conservative capability profile.  
**Input:** DNS/MX/greeting/reply evidence.  
**Output:** provider inference, normalized reasons, adapter confidence/version.  
**Invariants:** unknown text never becomes mailbox-not-found; adapters cannot schedule work or exceed safety policy.  
**Release:** shadow evaluation, replay tests, canary, rollback.

## 11. Catch-all evaluator

**Owns:** decide whether controls are necessary, generate privacy-safe controls, combine live/history evidence, produce probability.  
**Input:** target evidence, domain profile, profile budget, scheduler state.  
**Output:** control attempt requests or catch-all property inference.  
**Limits:** default one, absolute maximum two live controls per evaluation; cache reuse preferred.  
**Must not:** use dictionary enumeration or persist controls as customer contact data.

## 12. Evidence ledger

**Owns:** immutable evidence IDs, normalized metadata, protected raw references, append ordering, retention class.  
**Commands:** `AppendEvidence`, `AppendCorrection`, `ApplyLifecycleAction`.  
**Queries:** by verification/evidence set under scoped authorization.  
**Invariants:** no in-place semantic edits; append acknowledgement required before assessment publication; raw and normalized access separated.  
**Failure:** verification remains pending; never assess evidence that is not durably referenced.

## 13. Assessment engine

**Owns:** eligible evidence selection, property inference, deliverability, confidence, risk, explanations.  
**Input:** verification ID, evidence cutoff, immutable version bundle.  
**Output:** immutable assessment with lineage.  
**Determinism:** fixed evidence/version bundle gives identical output.  
**Must not:** perform network I/O, mutate evidence, apply customer action policy.  
**Failure:** typed computation failure; previous assessment remains.

## 14. Policy engine

**Owns:** platform restrictions and tenant recommendation mapping.  
**Input:** immutable assessment, policy version, purpose.  
**Output:** recommendation, reasons, restriction state.  
**Precedence:** platform/privacy restriction > tenant rules > defaults.  
**Simulation:** evaluate candidate policy against historical assessments before activation.

## 15. Retry and refinement coordinator

**Owns:** delayed attempts, retry reason/windows, max attempts, result supersession.  
**Input:** pending outcome and provider hints.  
**Output:** scheduled attempt or terminal exhaustion evidence.  
**Invariants:** retry is reason-driven; cooldown overrides deadlines; no duplicate charge for same logical verification refinement unless contract says otherwise.

## 16. Bulk coordinator

**Owns:** upload validation, row mapping, deduplication, grouping, fair scheduling, progress, export.  
**Input:** encrypted uploaded object and schema.  
**Output:** individual verification requests and result manifest.  
**Isolation:** malware scanning, tenant key scope, lifecycle deletion.  
**Fairness:** bulk cannot starve real-time or burst a destination.

## 17. Webhook delivery

**Owns:** signed event delivery, retries, endpoint health, replay.  
**Events:** verification completed/refined, bulk progress/completed, export ready.  
**Contract:** stable event ID, ordered per verification where practical, at-least-once, signature timestamp/replay protection.  
**Failure:** dead-letter and customer-visible diagnostics; does not roll back results.

## 18. Feedback ingestion

**Owns:** permitted bounce/delivery/complaint/correction ingestion, provenance, normalization, quarantine.  
**Input:** signed webhook, file, or integration event.  
**Output:** immutable feedback evidence; never direct model mutation.  
**Controls:** schema/authenticity, duplicate detection, source trust, tenant contribution caps, purpose checks.

## 19. Intelligence projection

**Owns:** eligibility, minimization, aggregation, time decay, privacy release gate, profile publication.  
**Input:** eligible evidence/feedback events.  
**Output:** immutable profile versions.  
**Invariants:** one-way gate, no recoverable lists, concentration caps, reproducible lineage, deletion impact processing.

## 20. Model/rule registry

**Owns:** immutable artifacts, signatures, compatibility, stage, rollout, rollback.  
**Input:** evaluated candidate package and approval evidence.  
**Output:** version bundle resolvable by assessment workers.  
**Stages:** candidate, shadow, canary, production, deprecated, revoked.

## 21. Billing and metering

**Owns:** immutable usage events and credit policy, not payment processing internals.  
**Metering point:** contract-defined successful result or completed eligible attempt; unknown/refinement charging transparent.  
**Invariants:** idempotent event IDs; classification cannot be changed for billing advantage; raw address excluded.

## 22. Audit and administration

**Owns:** append-only security/admin actions, JIT access, export/delete requests, configuration history.  
**Must not:** provide unrestricted address search.  
**Requirement:** every privileged access has actor, purpose, scope, time, approval, and outcome.

## 23. Contract-wide standards

All commands/events carry schema version, event ID, correlation/causation IDs, tenant scope where applicable, occurred/received times, and producer version. Consumers are idempotent. Backward-incompatible schema changes require versioned migration. PII is excluded from message headers, queue names, logs, and metrics.

## 24. Deployment mapping

MVP mapping:

- API/control runtime: capabilities 1–4, 14, 17, 21, 22.
- Verification runtime: 5–11, local evidence client.
- Assessment/data runtime: 12–13, 18–20.
- Bulk coordinator may initially live with API but has separate queues.

Split triggers from Phase 3 remain authoritative.

## 25. Contract acceptance

- Every capability has single semantic ownership.
- Network capabilities cannot classify or apply policy.
- Classifier cannot perform network work.
- Scheduler failure prevents probing.
- Evidence durability precedes assessment.
- Tenant and intelligence boundaries are explicit.
- All asynchronous contracts are idempotent.
- Prohibited SMTP actions are absent from every contract.

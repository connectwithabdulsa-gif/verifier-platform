# RFC 000 — Email Verification Semantic Foundation and Operating Boundaries

**Status:** Approved  
**State:** Feature Freeze  
**Version:** 1.0.0  
**Date:** 2026-08-03  
**Audience:** Product, research, security, privacy, data, platform, and verification-engineering teams  
**Scope:** Phase 0 only; this RFC defines semantics and constraints, not system architecture or implementation

## Abstract

This RFC establishes the conceptual and operating foundation for an evidence-based email-verification platform. It defines the platform’s terminology, semantic layers, evidence model, temporal model, privacy boundaries, acceptable-use rules, threat model, lifecycle requirements, and invariants.

The platform does not treat an email address as permanently “valid” or “invalid.” It observes time-bound technical facts, derives uncertain properties from those facts, assesses deliverability and risk, and applies a customer-specific policy. Each layer is independently versioned, explainable, and reproducible.

This RFC deliberately does not select programming languages, databases, queues, cloud providers, microservices, scoring algorithms, or SMTP probing procedures. Those decisions belong to later phases and MUST conform to the semantics and boundaries defined here.

This document is an engineering governance artifact, not legal advice. Applicable obligations depend on jurisdiction, contractual role, data source, customer purpose, and actual processing. Qualified counsel and privacy professionals MUST review the eventual product and its deployments.

## 1. Status and normative language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** are normative requirements when capitalized, following the convention standardized by BCP 14.

This RFC is accepted only when product, engineering, security, privacy, and data-governance owners approve it. Later specifications MAY extend it but MUST NOT silently redefine its terms or weaken its invariants. A conflicting later design requires an explicit amendment to this RFC.

### 1.1 Freeze policy

Version 1.0.0 is the frozen Phase 0 governing specification.

Changes permitted during the freeze are limited to:

- resolution or documentation of an already identified approval decision;
- editorial corrections that do not change meaning;
- source and citation updates;
- regulatory updates and jurisdiction-specific clarifications;
- formally reviewed RFC amendments made under the versioning policy.

The freeze prohibits:

- new semantic concepts without a major-version amendment;
- new architectural scope;
- implementation decisions;
- product-feature expansion;
- changes that silently alter an invariant, approved decision, or defined term.

Phase 1 and later work MUST treat this RFC as an upstream dependency. Discovery of contrary evidence does not authorize silent deviation; it triggers an issue, decision review, or RFC amendment.

## 2. Goals

This RFC has eight goals:

1. Establish one vocabulary for observations, inferences, assessments, and policy decisions.
2. Prevent facts and predictions from being represented as the same kind of value.
3. Make every result temporal, versioned, explainable, and reproducible.
4. Separate tenant operational data from durable verification intelligence.
5. Define privacy, deletion, retention, and purpose boundaries before data collection begins.
6. Bound SMTP and DNS activity so the platform cannot become an abuse tool.
7. Define the minimum threat model and control objectives.
8. Provide non-negotiable invariants for all later research, architecture, and implementation.

## 3. Non-goals

This RFC does not:

- claim that an SMTP response proves inbox placement, human ownership, consent, or future deliverability;
- define the final classification algorithm or choose Bayesian, frequentist, deterministic, or machine-learning techniques;
- specify service boundaries or require microservices;
- authorize sending email, enumerating accounts, bypassing provider controls, or evading rate limits;
- determine whether a customer may lawfully contact a person;
- define a universal send/no-send policy for all customers;
- describe competitor internals;
- promise a particular bounce rate, latency, throughput, or service level;
- replace a data-protection impact assessment, legitimate-interests assessment, security assessment, or legal review.

### 3.1 Out of scope

The platform defined by this RFC is an email-verification and decision-support platform. The following product categories are explicitly outside its scope:

- mail composition, transmission, relaying, or campaign delivery;
- inbox-placement prediction or monitoring;
- content-based spam-score prediction;
- domain, IP, or mailbox warming;
- general-purpose email-marketing compliance software;
- consent acquisition or consent-management software;
- customer-relationship management;
- sales engagement, sequencing, prospecting, enrichment, or lead generation;
- mailbox access, authentication, or account recovery;
- human identity, employment, or ownership verification.

The platform MAY integrate with systems in these categories only to receive authorized verification requests, provide verification results, enforce suppression or acceptable-use controls, or ingest permitted outcome evidence. An integration does not expand the platform's purpose. Adding any excluded product category requires a major RFC amendment, privacy and security review, and explicit product approval.

## 4. Source and claim discipline

All research and design claims feeding the platform MUST be labeled as one of:

- **Documented fact:** directly supported by a normative standard, authoritative documentation, applicable law or regulatory guidance, or a primary technical source.
- **Observed behavior:** produced by a reproducible, authorized observation whose method, time, scope, and limitations are recorded.
- **Architectural inference:** a reasoned hypothesis that is not publicly confirmed and is clearly presented as such.

An observed behavior MUST NOT be generalized beyond its recorded scope. An architectural inference MUST NOT be promoted to documented fact through repetition. Conflicting evidence MUST be retained and represented, not discarded merely because it challenges a prior conclusion.

Legal propositions require a jurisdiction and effective date. Provider-behavior propositions require an observation window because provider behavior changes.

### 4.1 Evidence hierarchy

Evidence quality is contextual. The following tiers establish a default ordering for reliability assessment; they do not create an automatic rule that one event in a higher tier always defeats a large, recent, and well-controlled body of lower-tier evidence.

| Tier | Evidence class | Examples | Principal limitations |
|---|---|---|---|
| 1 | Protocol and authoritative infrastructure evidence | DNS answers, SMTP replies, RFC-defined states, Null MX | Session-scoped; affected by caching, policy, source reputation, intermediaries, and temporary conditions |
| 2 | Provider-specific observations | Reproducible behavior observed for Google, Microsoft, Yahoo, Proofpoint, Mimecast, or another operator | May change without notice; may differ by region, tenant, endpoint, source, or traffic pattern |
| 3 | Historical platform intelligence | Versioned longitudinal aggregates, repeated domain/MX behavior, calibrated prior outcomes | Subject to drift, correlation, sampling bias, and aggregation error |
| 4 | Authenticated outcome and customer feedback | Delivery-status events, hard/soft bounces, complaints, customer corrections | May reflect sender reputation, content, campaign selection, reporting error, or adversarial input |
| 5 | Heuristic inference | Role-pattern rules, provider mappings, lexical or statistical indicators | Indirect, model-dependent, and vulnerable to false generalization |

Every evidence type MUST define its own quality criteria. Conflict resolution MUST consider directness, authenticity, recency, reproducibility, independence, scope match, sample size, and known ambiguity. Classification logic MUST NOT rely on tier number alone. Contradictory material evidence MUST remain traceable and SHOULD reduce confidence unless a documented rule explains why it does not.

RFC-defined semantics describe how a conforming implementation should behave; they do not prove that a particular Internet system conforms. Accordingly, an observed nonconforming response remains an observed fact, while the claim that it violates or departs from a standard is a separate interpretation.

## 5. Email ecosystem model

### 5.1 Address and message semantics

An email address is an identifier used in an email transport and message ecosystem. Syntax acceptance, DNS configuration, SMTP envelope acceptance, message acceptance, delivery, inbox placement, and human engagement are distinct events.

The platform MUST distinguish at least:

- **Address syntax:** whether an input conforms to the platform’s supported address grammar and normalization rules.
- **Domain routability:** whether DNS supplies an applicable mail-routing outcome.
- **SMTP reachability:** whether an applicable SMTP endpoint can be reached under a bounded observation.
- **Envelope acceptance:** whether an SMTP server accepts or rejects a recipient command in a particular session.
- **Message acceptance:** whether a receiving system accepts responsibility for a transmitted message.
- **Delivery outcome:** whether a later delivery-status signal reports success, delay, or failure.
- **Inbox placement:** whether a message reached an inbox rather than spam, quarantine, or another folder.
- **Engagement:** whether a person interacted with a message.
- **Consent or lawful contactability:** whether the sender has an applicable legal and policy basis to contact the person.

No earlier event proves a later event. In particular, envelope acceptance does not prove mailbox existence, inbox placement, human ownership, engagement, or permission to send.

### 5.2 SMTP

SMTP is a store-and-forward transport protocol. [RFC 5321](https://www.rfc-editor.org/info/rfc5321/) defines SMTP commands, replies, mail transactions, DNS-based routing behavior, and retry semantics. Message structure is separately defined by [RFC 5322](https://www.rfc-editor.org/info/rfc5322/). Internationalized SMTP introduces additional considerations under [RFC 6531](https://www.rfc-editor.org/info/rfc6531/).

SMTP replies are observations within a session, not universal statements about a mailbox. A reply can be affected by recipient policy, source IP, reverse DNS, greeting identity, sender domain, TLS posture, connection history, load, reputation, throttling, anti-abuse systems, or intentional ambiguity.

The platform MUST preserve the distinction between basic three-digit SMTP replies and enhanced status information when supplied. Raw replies MAY contain sensitive or provider-specific details and MUST be protected and sanitized before customer exposure.

### 5.3 DNS and mail routing

DNS is a distributed, cached naming system. [RFC 1034](https://www.rfc-editor.org/info/rfc1034/) and [RFC 1035](https://www.rfc-editor.org/info/rfc1035/) establish its core concepts. SMTP routing ordinarily consults MX records and, under defined circumstances, may fall back to address records. A domain can explicitly state that it accepts no email by publishing a Null MX as defined by [RFC 7505](https://www.rfc-editor.org/info/rfc7505/).

Every DNS observation MUST record sufficient context to interpret caching and change, including observation time, queried name, type, resolver context or class, returned data, response status, TTL when available, and relevant DNSSEC state when evaluated.

The platform MUST distinguish at least:

- positive answers;
- authoritative nonexistence;
- no applicable record;
- Null MX;
- temporary resolution failure;
- timeout or transport failure;
- malformed or policy-rejected response;
- indeterminate DNSSEC validation state and validated success/failure when DNSSEC is used.

A transient DNS failure MUST NOT be classified as permanent domain invalidity.

### 5.4 Providers and intermediaries

Mail for an organization can be processed by multiple parties. The organization associated with a domain, the mailbox commercial offering, the visible MX operator, a filtering gateway, and the ultimate mailbox host are different concepts.

The ontology MUST therefore keep these dimensions separate:

- **Organization type:** `commercial`, `education`, `government`, `nonprofit`, `unknown`.
- **Mailbox offering:** `free_consumer`, `managed_organization`, `custom_hosted`, `unknown`.
- **Observed MX operator:** a versioned entity identifier such as Google, Microsoft, Proofpoint, Mimecast, Cisco, self-hosted, or unknown.
- **Downstream mailbox host:** an inferred entity, separately scored, when evidence supports it.

An MX hostname pattern is evidence about routing, not definitive proof of the downstream mailbox platform. Provider mappings MUST be versioned and time-bound.

## 6. Core semantic model

The platform SHALL implement five logically distinct layers:

```text
Layer 1 — Observed Facts (Evidence)
                ↓
Layer 2 — Inferred Properties (with uncertainty)
                ↓
Layer 3 — Deliverability Assessment
                ↓
Layer 4 — Risk Assessment
                ↓
Layer 5 — Customer Policy Recommendation
```

Each transition MUST be explicit. A value generated in one layer MUST NOT masquerade as a value from another layer.

### 6.1 Layer 1: observed facts

An observation records what a named method observed about a defined subject at a defined time and scope. It contains no deliverability conclusion, risk score, or policy recommendation.

An evidence object MUST include, directly or by durable reference:

```json
{
  "id": "evidence identifier",
  "observed_at": "timestamp",
  "ingested_at": "timestamp",
  "source": "source identity and class",
  "subject": "typed subject reference",
  "method": "versioned observation method",
  "result": "typed normalized result",
  "raw_result_ref": "protected reference or null",
  "quality": "quality assessment and rationale",
  "scope": "conditions under which the fact was observed",
  "provenance": "tenant, system, or authorized external provenance",
  "schema_version": "version",
  "retention_class": "lifecycle policy identifier"
}
```

Logical immutability means the meaning and recorded content of an accepted evidence event are never edited in place. Corrections are appended as new events that reference the superseded or disputed event. Logical immutability does not override lawful deletion, security erasure, or retention limits.

### 6.2 Layer 2: inferred properties

An inferred property is a versioned computation over a declared evidence set. Examples include role likelihood, disposable-domain likelihood, catch-all probability, organization type, mailbox offering, MX operator, and likely provider behavior.

An inference MUST include:

- property name and typed value;
- confidence or uncertainty representation with defined semantics;
- evidence identifiers or an immutable evidence-set reference;
- inference method and version;
- computation time and evidence cutoff time;
- validity window or recommended refresh time;
- scope and known limitations.

Boolean-looking properties MUST retain uncertainty. `role: true` without provenance, method, and confidence is not a conforming inference.

Properties that are not mutually exclusive MUST NOT be forced into a single enum. `role`, `disposable`, and other mailbox attributes are independent unless a later specification formally proves an exclusivity rule.

### 6.3 Layer 3: deliverability assessment

Deliverability is a prediction about the address’s technical deliverability within a defined time horizon and context. The initial status vocabulary is:

- `valid`
- `invalid`
- `catch_all`
- `unknown`

These names are API terms, not claims of metaphysical truth. Each assessment MUST include confidence, time horizon, evidence cutoff, assessment method/version, and stable reason codes. A later specification MUST define precedence, minimum evidence, and abstention rules.

`unknown` is a legitimate outcome, not an operational error. The engine SHOULD prefer a calibrated unknown over an unsupported confident classification.

### 6.4 Layer 4: risk assessment

Risk estimates the chance or expected cost of an adverse outcome under a defined risk model. It is independent of deliverability. A technically deliverable address can be high risk; an unknown address can be low or high risk depending on evidence and use case.

A risk result MUST declare:

- numeric score and range;
- categorical level and thresholds;
- modeled adverse outcome;
- evaluation horizon;
- model/ruleset version;
- uncertainty or calibration information;
- major contributing reason codes.

“Risk” without a declared target outcome is undefined and MUST NOT be exposed.

### 6.5 Layer 5: customer policy recommendation

Policy converts assessments and customer rules into an action recommendation such as `send`, `caution`, or `do_not_send`. It is a business decision, not evidence and not a universal property of an address.

Every recommendation MUST name the customer policy version. The same evidence MAY yield different recommendations for different customers or use cases. Mandatory platform safety rules and legal restrictions take precedence over customer policy.

## 7. Time and reproducibility

Every result is a snapshot. A conforming verification result MUST include:

- `requested_at`;
- `computed_at`;
- `evidence_cutoff_at`;
- `recommended_reverify_at`;
- `expires_at`;
- specification, ruleset, model, provider-map, and evidence-schema versions as applicable.

Reproduction means that the system can explain how a historical result was produced from the then-permitted evidence and versioned logic. It does not require indefinite retention of personal data. When underlying data has been erased, the system MAY retain a non-identifying audit statement that a computation occurred and later became non-reproducible because of a lifecycle action.

No cache entry or historical aggregate creates permanent truth. Staleness rules MUST be property-specific.

## 8. Persistence and privacy boundaries

### 8.1 Operational store

The operational store is tenant-scoped and purpose-bound. It MAY contain an input address, customer identity, request data, DNS observations, SMTP observations, retry history, classifications, and audit events necessary to provide and secure the service.

It MUST support:

- tenant isolation;
- encryption in transit and at rest;
- least-privilege access;
- field or record-level deletion where required;
- configurable and documented retention;
- export, correction, restriction, and suppression workflows where applicable;
- security and privacy audit logging;
- separation of production access from routine analytics.

The provisional retention target is 30–90 days, but no period is automatically lawful or appropriate. Each data class MUST have a documented purpose, lawful/contractual basis where required, minimum necessary retention, deletion trigger, and exception procedure.

### 8.2 Verification intelligence store

The intelligence store contains durable, permitted learning artifacts such as domain-, MX-, provider-, and network-level behavior; normalized SMTP fingerprints; time-decayed aggregates; sample sizes; calibration history; and model versions.

It MUST NOT become a hidden copy of customer lists or campaign histories. Long-lived intelligence MUST be aggregated, anonymized where genuinely possible, or pseudonymized with explicit residual-risk treatment. Pseudonymization is not the same as anonymization.

The intelligence store MUST NOT expose one tenant’s identifiable data or confidential campaign outcomes to another tenant. Every aggregate MUST have minimum cohort, provenance, contribution, and deletion-impact rules. The platform SHOULD prevent a single tenant or low-quality source from dominating a global estimate.

### 8.3 Separation and erasure

Direct identifiers and re-identification keys MUST be separated from durable aggregates. Cryptographic erasure MAY support deletion but MUST be validated for backups, replicas, logs, exports, and derived data.

Suppression records necessary to honor objections or prevent prohibited contact MAY need separate retention from ordinary operational data. They MUST be access-restricted and used only for suppression and compliance purposes.

## 9. Regulatory and contractual assumptions

### 9.1 General rule

Email verification does not establish permission to send. A customer remains responsible for its data source, lawful basis, notices, consent where required, suppression, message content, and sending behavior. The platform MUST not market a `valid` result as legal authorization, consent, or guaranteed delivery.

### 9.2 European Union and related regimes

Where GDPR applies, [Article 5](https://eur-lex.europa.eu/eli/reg/2016/679/art_5/oj) establishes principles including lawfulness, fairness, transparency, purpose limitation, data minimization, accuracy, storage limitation, security, and accountability. [Article 6](https://eur-lex.europa.eu/eli/reg/2016/679/art_6/oj) requires a lawful basis. Rights and obligations can include access, rectification, erasure, objection, privacy by design/default, processor controls, security, breach handling, and impact assessment depending on the processing.

The product MUST be capable of operating under documented controller/processor roles rather than assuming one universal role. Cross-border transfer and subprocessor choices are deployment and contractual matters that MUST be resolved before applicable processing begins.

### 9.3 California

Where the CCPA/CPRA applies, collection and use require appropriate notice and purpose discipline; California Civil Code [§1798.100](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.100.) addresses duties at collection, and [§1798.105](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.105.) provides deletion rights subject to exceptions. Applicability, business/service-provider/contractor roles, sale/sharing questions, and consumer-request handling MUST be reviewed for the actual business model.

### 9.4 Commercial email rules

The United States CAN-SPAM framework regulates commercial messages and does not make verification a substitute for sender compliance. The [FTC compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business) identifies requirements including accurate routing information, non-deceptive subjects, identification, postal address, opt-out mechanisms, and honoring opt-outs. Other jurisdictions may require consent or impose stricter electronic-marketing rules.

### 9.5 Product boundary

The platform MAY provide configurable policy tools, suppression support, audit evidence, and jurisdiction metadata. It MUST NOT issue an unqualified “legally safe to send” result. Legal rules and provider terms change; the compliance register MUST record owner, jurisdiction, source, effective date, last review, and next review.

### 9.6 Approved governance baseline

The platform's initial jurisdictional scope is the United States and EU/EEA. GDPR-style privacy engineering—including purpose limitation, minimization, lifecycle control, data-subject workflow capability, security, and accountability—is the minimum engineering baseline. This baseline does not assert that one jurisdiction's law applies universally or eliminate jurisdiction-specific review.

The approved primary use cases are signup validation, CRM hygiene, authorized bulk verification, and internal enterprise verification. Cold outbound is restricted: customers retain responsibility for legality and permission, and the platform MUST apply enhanced onboarding, monitoring, rate, and abuse controls. A verification result never authorizes contact.

Cross-tenant aggregated learning is permitted only for contractually authorized, privacy-reviewed contributions. Identifiable campaign data and recoverable customer lists are ineligible for cross-tenant intelligence.

Operational personal data has a default retention of 30 days and MAY be configured up to 90 days only for a documented, permitted purpose. Intelligence MAY be long-lived only after qualifying aggregation or governed pseudonymization. Deletion workflows MUST address primary storage, replicas, search indexes, exports, scheduled backup expiry, and validated cryptographic erasure where supported.

The maximum SMTP interaction boundary is DNS resolution, TCP connection, server greeting, EHLO or necessary HELO fallback, envelope sender command, recipient command, observation, and disconnect. The platform MUST NOT transmit `DATA` or message content during verification. Expanding this ceiling requires a new major RFC version.

Rate control MUST operate at global, provider, MX, domain, tenant, and source dimensions. Remote throttling, blocking, and other defensive signals MUST be honored immediately under the applicable policy.

### 9.7 Policy defaults versus product commitments

A **policy default** is an approved initial configuration that MAY be changed within the limits of this RFC after documented product, privacy, security, and legal review. Defaults include the 30-day operational retention value, customer-specific risk thresholds, retry counts below the approved ceiling, and rate allocations below safety ceilings.

A **product commitment** is a binding property of the platform. It MUST NOT be changed by tenant configuration or ordinary product policy. Commitments include semantic-layer separation, evidence provenance and versioning, tenant isolation, the prohibition on representing verification as consent, the prohibition on SMTP `DATA`, respect for remote defensive signals, deletion coverage, and the cross-tenant intelligence restriction.

Documentation, APIs, contracts, and user interfaces MUST label configurable defaults separately from non-configurable commitments. A default MUST NOT be marketed as a permanent guarantee, and a commitment MUST NOT be weakened through configuration.

## 10. Acceptable use and abuse prevention

The service is intended for authorized list hygiene, account-entry validation, fraud reduction, customer-data quality, and other legitimate purposes.

The following are prohibited unless a separately approved use case and legal/security review explicitly permits them:

- harvesting or generating addresses for unsolicited contact;
- mailbox enumeration or directory discovery;
- credential attacks, phishing, stalking, surveillance, or discrimination;
- bypassing provider controls, CAPTCHAs, throttles, blocks, or access restrictions;
- deceptive SMTP identities or unauthorized infrastructure impersonation;
- selling or exporting reconstructed customer lists;
- using results as proof of consent, identity, employment, or human ownership;
- probing that creates material load or resembles an attack;
- re-identifying anonymized or aggregated intelligence.

Controls MUST include customer identity and risk review appropriate to volume, contractual acceptable-use terms, quotas, concurrency limits, destination/provider rate limits, anomaly detection, suspension and investigation procedures, and auditable administrative actions. Higher-risk bulk use MUST receive stronger controls than low-volume interactive validation.

The system MUST honor remote throttling and defensive signals. Repeated attempts MUST be bounded. Provider-specific behavior logic MUST improve correctness and reduce harm, not facilitate evasion.

## 11. Trust boundaries and threat actors

Trust is not inherited across system boundaries. Authentication establishes a claimed principal; it does not establish benign intent, evidence correctness, legal authority, or safe downstream use.

### 11.1 Trust boundaries

The conceptual trust flow is:

```text
Untrusted public Internet and remote DNS/SMTP systems
                         ↓
Public platform edge and abuse controls
                         ↓
Authenticated customer tenant boundary
                         ↓
Tenant-scoped operational processing and storage
                         ↓
Restricted internal evidence and intelligence processing
                         ↓
Privacy-reviewed aggregated intelligence
                         ↓
Sanitized customer-visible results
```

Each arrow is a validation, authorization, minimization, and audit boundary. Data MUST NOT cross it merely because the source is authenticated. In particular:

- Internet responses are untrusted input and MUST be parsed defensively.
- An API credential authorizes only its scoped tenant and operations.
- Tenant data MUST remain isolated during computation, caching, support, export, and deletion.
- Admission into internal intelligence requires a separate purpose, quality, provenance, and privacy decision.
- Admission into aggregated intelligence requires cohort and re-identification controls.
- Customer-visible output MUST be sanitized and MUST NOT reveal another tenant's data, raw protected evidence, platform secrets, or membership in an intelligence dataset.

Administrative interfaces, observability systems, data exports, backups, model-training pipelines, and third-party subprocessors are additional trust boundaries even when they are not shown in the simplified flow. Later architecture specifications MUST enumerate them explicitly.

### 11.2 Threat actors

Security analysis MUST consider at least these actors:

- **Legitimate customer:** authorized and generally benign, but capable of mistakes, excessive volume, insecure integration, unlawful downstream use, or misunderstood results.
- **Malicious customer:** obtains legitimate access and intentionally performs enumeration, abusive list cleaning, intelligence extraction, poisoning, or denial of service.
- **Unauthenticated automated abuser:** attacks public endpoints, account creation, authentication, quotas, or infrastructure at machine speed.
- **Compromised API principal:** uses a stolen key, token, user session, integration credential, or service account with the victim tenant's apparent authority.
- **Malicious or deceptive DNS/SMTP operator:** returns crafted, inconsistent, oversized, delayed, or targeted responses intended to misclassify addresses, exploit parsers, identify probing infrastructure, or consume resources.
- **Network adversary:** observes, blocks, redirects, replays, or modifies traffic where protocol protections and validation do not prevent it.
- **Malicious or compromised customer feedback source:** submits fabricated or biased outcomes to influence tenant or shared intelligence.
- **Internal operator:** misuses legitimate administrative, support, debugging, or data access.
- **Compromised dependency or subprocessor:** changes code or behavior, steals data, or weakens integrity outside the platform's direct control.

Threat-actor categories describe capability and position, not identity. One incident MAY involve several categories, and a formerly legitimate principal MAY become compromised.

## 12. Threat model

The minimum threat model includes:

### 12.1 Malicious customer

A customer attempts enumeration, spam-list cleaning for abusive sending, data extraction, provider evasion, or denial of service. Required controls include onboarding, authorization, quotas, behavioral monitoring, velocity and distribution analysis, and rapid suspension.

### 12.2 Cross-tenant exposure

An error, query, cache key, support action, or aggregate leaks one tenant’s addresses or outcomes to another. Required controls include tenant-bound authorization, isolation tests, non-identifying aggregate thresholds, scoped support access, and audit logs.

### 12.3 Insider misuse

An employee or contractor accesses raw addresses, transcripts, or customer results without need. Required controls include least privilege, just-in-time access, approval, monitoring, separation of duties, and sanctions.

### 12.4 Evidence poisoning

A tenant or external actor submits manipulated feedback to alter global intelligence. Required controls include provenance, source reliability, contribution caps, anomaly detection, holdouts, rollback, and model/rule versioning.

### 12.5 Infrastructure and supply-chain compromise

Attackers obtain secrets, modify verification rules, tamper with evidence, or exfiltrate data through dependencies. Required controls include secure development, signed artifacts, secret management, dependency governance, environment separation, integrity checks, and incident response.

### 12.6 DNS and network manipulation

Responses are spoofed, poisoned, redirected, or observed through a compromised resolver or network. The system MUST preserve resolver/network provenance and SHOULD support independent corroboration for high-impact conclusions.

### 12.7 Model extraction and inference

Repeated queries reveal proprietary intelligence or enable reconstruction of whether a mailbox was previously observed. Responses, rate limits, confidence precision, and explanations MUST be designed to limit membership inference and intelligence extraction.

### 12.8 Sensitive logs and diagnostics

Addresses or SMTP transcripts leak through logs, traces, metrics, exceptions, or support tools. Direct identifiers MUST NOT appear in general telemetry by default. Diagnostic access MUST be purpose-bound and retained briefly.

## 13. Evidence quality and feedback

Feedback is evidence, not ground truth. Hard bounce, soft bounce, accepted, blocked, complaint, and customer correction events require provenance and context.

A feedback evidence object SHOULD include campaign/source context where permitted, reporting system, standardized and raw outcome, event and ingestion times, authentication or trust level, selection mechanism, and known ambiguity.

The inference layer MUST account for:

- recency and temporal drift;
- sample size and confidence intervals or equivalent uncertainty;
- correlated observations;
- provider and source reliability;
- selection and survivorship bias;
- tenant concentration;
- observation quality;
- delayed or contradictory outcomes.

No single tenant’s 18% bounce rate may automatically become the domain’s universal bounce probability. Aggregation methods MUST distinguish domain behavior from sender reputation, list provenance, campaign composition, and receiving-provider policy.

“Bayesian update” is not a semantic requirement. Later designs MAY use Bayesian estimation, calibrated machine learning, deterministic rules, or other methods, provided their output conforms to this RFC and is tested for calibration.

## 14. API semantic envelope

The eventual customer API SHOULD follow this semantic shape:

```json
{
  "observations": [],
  "properties": {},
  "deliverability": {
    "status": "catch_all",
    "confidence": 0.86,
    "reason_codes": []
  },
  "risk": {
    "score": 0.78,
    "level": "high",
    "target_outcome": "declared adverse outcome",
    "reason_codes": []
  },
  "policy": {
    "recommendation": "caution",
    "policy_version": "customer_policy_v4"
  },
  "metadata": {
    "requested_at": "...",
    "computed_at": "...",
    "evidence_cutoff_at": "...",
    "recommended_reverify_at": "...",
    "expires_at": "...",
    "specification_version": "1.0",
    "ruleset_version": "2026.08",
    "model_version": "1.2.0"
  }
}
```

This is a semantic envelope, not a frozen wire contract. Customer-visible observations MUST be sanitized summaries and stable reason codes, not necessarily raw evidence or transcripts. Absence, not-applicable, unknown, unsupported, and redacted MUST have distinct representations.

## 15. Lifecycle rules

Each data class, evidence type, inference, assessment, and aggregate MUST have:

- a documented purpose;
- an owner;
- a schema and version;
- a sensitivity classification;
- a retention and deletion policy;
- a permitted-use policy;
- a provenance requirement;
- an expiry or review rule;
- quality and monitoring criteria.

Rules and models MUST be versioned and deployable with rollback. Historical outputs MUST retain the version identifiers that produced them. Recalculation creates a new assessment; it MUST NOT overwrite the historical assessment.

Schema migrations MUST preserve meaning or explicitly document semantic changes. Silent reinterpretation of historical fields is prohibited.

## 16. Specification versioning policy

This RFC uses semantic versioning in the form `MAJOR.MINOR.PATCH`. The document version describes the normative specification, not software releases, rulesets, models, provider maps, or evidence schemas; those artifacts require independent version identifiers.

### 16.1 Major version

Increment `MAJOR` when a change breaks semantic compatibility or materially changes platform purpose or obligations. Examples include:

- adding a product category currently declared out of scope;
- merging or reordering the five semantic layers;
- changing the meaning of evidence, deliverability, risk, or policy;
- removing or weakening a platform invariant;
- changing privacy boundaries so tenant-identifiable data becomes eligible for shared intelligence;
- making a previously optional data use mandatory;
- changing a public status or field in a way that reverses its interpretation.

A major change requires full cross-functional approval and a migration and compatibility plan.

### 16.2 Minor version

Increment `MINOR` for backward-compatible normative additions or material clarifications. Examples include:

- adding a new evidence class, threat actor, trust boundary, or lifecycle requirement;
- adding an optional semantic field without changing existing meanings;
- strengthening a control while preserving valid existing interpretations;
- resolving an open question in a way that does not invalidate conforming consumers.

A minor change requires review by owners affected by the new requirement.

### 16.3 Patch version

Increment `PATCH` for non-normative corrections that do not change obligations or semantics. Examples include typographical corrections, repaired links, clearer examples, and editorial rewording.

If reasonable reviewers could implement different behavior because of a change, it is not a patch. Deprecation MUST be explicit, time-bound, and recorded in the changelog. Published versions MUST be immutable; amendments create a new version.

## 17. Platform invariants

The following are non-negotiable:

1. Evidence, inference, deliverability, risk, and policy are separate layers.
2. No SMTP result alone proves mailbox existence, future delivery, inbox placement, identity, or consent.
3. Every inference and assessment is temporal, scoped, versioned, and uncertain.
4. `unknown` is valid; unsupported certainty is a defect.
5. Policy is customer/use-case specific and cannot rewrite evidence.
6. Personal operational data and durable intelligence are separated by purpose, access, and lifecycle.
7. Logical immutability never cancels deletion and retention obligations.
8. Pseudonymized data is treated as potentially identifiable unless a documented analysis establishes otherwise.
9. Feedback is weighted evidence, not automatic truth.
10. Cross-tenant aggregated learning is permitted only from contractually authorized, privacy-reviewed contributions; customer data MUST NOT leak through shared intelligence, caches, explanations, or support tooling.
11. Verification MUST NOT be represented as permission to send.
12. Provider controls and rate limits MUST NOT be evaded.
13. Every externally meaningful result MUST be reproducible or explicitly marked non-reproducible with a reason.
14. Every score MUST define what it measures.
15. Architecture and deployment decisions MUST conform to this model rather than redefine it.

## 18. Specification success metrics

Phase 0 success is measured by conformance and traceability, not infrastructure performance. Every later artifact and implementation MUST be testable against these metrics:

1. **Layer separation:** every externally meaningful field is owned by exactly one semantic layer.
2. **Evidence traceability:** every inference references a permitted, versioned evidence set.
3. **Inference explainability:** every inference identifies its method, uncertainty, scope, and material evidence.
4. **Assessment explainability:** every deliverability and risk assessment provides stable reason codes and version identifiers.
5. **Reproducibility:** every decision can be recomputed from retained inputs and versions, or is explicitly marked non-reproducible with a lifecycle reason.
6. **Policy separability:** the same factual and inferred record can be evaluated under a different customer policy without rewriting prior layers.
7. **Temporal correctness:** every result declares observation/computation time, evidence cutoff, and freshness boundary.
8. **Version completeness:** every evidence object, inference method, ruleset, model, provider mapping, and policy used by a result carries a version.
9. **Unknown preservation:** insufficient or conflicting evidence produces calibrated uncertainty rather than fabricated certainty.
10. **Tenant isolation:** no result, explanation, aggregate, cache, export, or support view discloses another tenant's identifiable or confidential contribution.
11. **Lifecycle enforcement:** deletion, retention, restriction, and suppression actions propagate to every applicable store and derivative according to documented policy.
12. **Purpose conformance:** every collected field and derived artifact maps to an approved purpose and retention class.
13. **Abuse resistance:** prohibited use can be detected, investigated, limited, and suspended through defined controls.
14. **Implementation neutrality:** later architecture choices can change without altering the semantic contract.

A future conformance suite SHOULD turn these metrics into review checklists, schema tests, lineage tests, policy-separation tests, deletion tests, and adversarial security tests.

## 19. Phase 0 exit criteria

Phase 0 is complete only when:

- the terminology and layer boundaries are approved;
- each invariant has an accountable owner;
- the acceptable-use policy and enforcement model are approved;
- initial data inventory and retention classes exist;
- controller/processor and customer contractual assumptions are documented;
- threat-model controls have been assigned to future work;
- a compliance-source register and review cadence exist;
- approval-question resolutions are recorded in Section 20 and the companion [Phase 0 Decision Register](phase-0-decision-register.md);
- Phase 1 researchers adopt the required claim labels;
- Phase 1.5 is prohibited from contradicting this RFC without amendment.

## 20. Approval-question resolutions

The blocking Phase 0 questions are resolved as follows. Rationale and alternatives are recorded in the companion Decision Register.

1. Initial jurisdictional scope is the United States and EU/EEA, with GDPR-style privacy engineering as the minimum engineering baseline.
2. Primary uses are signup validation, CRM hygiene, authorized bulk verification, and internal enterprise verification. Cold outbound is restricted and subject to enhanced controls. Prohibited uses remain governed by Section 10.
3. Cross-tenant intelligence accepts only contractually authorized, privacy-reviewed contributions and never identifiable campaign data or recoverable customer lists.
4. Exact cohort thresholds and privacy tests are delegated to Phase 1.5 and later privacy specifications, but release is prohibited until membership-inference and re-identification review passes.
5. Operational retention defaults to 30 days and may extend to 90 days only for a documented permitted purpose. Field-level schedules remain subject to the approved ceiling and data inventory.
6. Suppression data MAY persist only in the minimum protected form and for the duration necessary to honor objections, contractual restrictions, or abuse controls. It MUST NOT be repurposed for marketing or intelligence enrichment.
7. After personal evidence is erased, reproducibility means retaining a non-identifying computation manifest and lifecycle record. The historical result MUST be marked non-reproducible where erased evidence is required to recompute it.
8. SMTP interaction is capped at DNS, TCP, greeting, EHLO/HELO, `MAIL FROM`, `RCPT TO`, observation, and disconnect. `DATA` is prohibited. Exact retry and rate values are configurable defaults below mandatory safety ceilings.
9. Every risk model must declare its target adverse outcome; Phase 0 intentionally does not prescribe a single universal risk target.
10. Customer-visible explanations are limited to sanitized observations, stable reason codes, uncertainty, and version metadata. Raw protected transcripts, cross-tenant contributions, infrastructure secrets, and intelligence-membership signals are prohibited.

## 21. Initial authoritative references

- [RFC 5321 — Simple Mail Transfer Protocol](https://www.rfc-editor.org/info/rfc5321/)
- [RFC 5322 — Internet Message Format](https://www.rfc-editor.org/info/rfc5322/)
- [RFC 1034 — Domain Names: Concepts and Facilities](https://www.rfc-editor.org/info/rfc1034/)
- [RFC 1035 — Domain Names: Implementation and Specification](https://www.rfc-editor.org/info/rfc1035/)
- [RFC 3463 — Enhanced Mail System Status Codes](https://www.rfc-editor.org/info/rfc3463/)
- [RFC 6531 — SMTP Extension for Internationalized Email](https://www.rfc-editor.org/info/rfc6531/)
- [RFC 7505 — Null MX](https://www.rfc-editor.org/info/rfc7505/)
- [EU General Data Protection Regulation](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [California Civil Code §1798.100](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.100.)
- [California Civil Code §1798.105](https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.105.)
- [FTC CAN-SPAM compliance guide](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business)

## 22. Decision record

This approved specification adopts the following foundational decision:

> The platform is an evidence and decision-support system. It observes technical events, derives explicitly uncertain properties, assesses deliverability and risk, and applies versioned customer policy. It does not manufacture certainty, consent, identity, or legal authorization from SMTP behavior.

The rationale and alternatives for approved blocking decisions are preserved in the [Phase 0 Decision Register](phase-0-decision-register.md).

## Appendix A — Version history

| Version | Date | Status | Summary |
|---|---|---|---|
| 0.1.0 | 2026-08-03 | Draft | Initial semantic foundation, governance boundaries, threat model, invariants, and exit criteria |
| 0.2.0 | 2026-08-03 | Candidate for approval | Added explicit scope exclusions, contextual evidence hierarchy, trust boundaries, threat actors, conformance metrics, and specification versioning policy |
| 1.0.0 | 2026-08-03 | Approved / Feature Freeze | Approved governance baseline; resolved blocking questions, separated defaults from commitments, and established the companion Decision Register |

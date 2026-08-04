# Phase 0 Decision Register

**Status:** Active  
**Effective specification:** RFC 000 v1.0.0  
**Established:** 2026-08-03

## Register policy

This register records why binding Phase 0 choices were made. RFC 000 defines what the platform is; this register records the decisions, alternatives, rationale, approval, and effective version behind that definition.

Accepted entries are logically immutable. An entry MUST NOT be edited to change its historical meaning. A later reversal or refinement requires a new decision that references the superseded decision and a corresponding RFC amendment when semantics or commitments change. Editorial corrections MUST be recorded in the change log.

Decision identifiers are permanent. Gaps MUST NOT be reused. Supporting materials MAY be attached by durable reference.

---

## DR-0001 — Launch jurisdictions and engineering baseline

**Decision:** Initial jurisdictional scope is the United States and EU/EEA. GDPR-style privacy engineering is the minimum engineering baseline across the platform, while jurisdiction-specific applicability and legal review remain required.

**Alternatives considered:** US-only launch; unrestricted global launch; jurisdiction-specific engineering baselines.

**Rationale:** A common high-protection engineering baseline reduces divergent data handling, establishes privacy-by-design constraints early, and supports the intended initial markets without claiming universal legal equivalence.

**Classification:** Product commitment for engineering controls; launch-market policy may expand only after review.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0002 — Supported and restricted use cases

**Decision:** Primary supported uses are signup validation, CRM hygiene, authorized bulk verification, and internal enterprise verification. Cold outbound is restricted, remains the customer's legal responsibility, and requires enhanced onboarding, monitoring, rate, and abuse controls.

**Alternatives considered:** prohibit cold outbound entirely; support unrestricted cold outbound; limit the product to signup validation.

**Rationale:** The approved uses reflect legitimate verification needs while recognizing that cold outbound carries materially higher privacy, provider, and abuse risks. Verification does not establish consent or permission to contact.

**Classification:** Product commitment for use boundaries; control thresholds are policy defaults below mandatory ceilings.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0003 — Cross-tenant intelligence

**Decision:** Cross-tenant aggregated learning is allowed only from contractually authorized, privacy-reviewed contributions. Identifiable campaign data and recoverable customer lists are excluded.

**Alternatives considered:** tenant-isolated learning only; opt-in identifiable pooling; unrestricted cross-tenant learning.

**Rationale:** Carefully governed aggregation enables platform improvement while preserving tenant isolation, customer confidentiality, purpose limitation, and trust. Contractual permission alone is insufficient without privacy review.

**Classification:** Non-negotiable product commitment and platform invariant.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0004 — Aggregation release gate

**Decision:** Exact cohort thresholds and statistical privacy tests will be specified in Phase 1.5 or a subordinate privacy specification. No aggregate may enter shared intelligence or customer-visible output until membership-inference and re-identification review passes.

**Alternatives considered:** prescribe arbitrary Phase 0 thresholds; permit release based only on de-identification labels; prohibit aggregates entirely.

**Rationale:** Thresholds require empirical research and context, but the release prohibition is a governing safety commitment that can be fixed before implementation.

**Classification:** Product commitment for the release gate; thresholds are versioned policy/specification values.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0005 — Operational and intelligence retention

**Decision:** Operational personal data is retained for 30 days by default and may be configured up to 90 days only for a documented, permitted purpose. Intelligence may be long-lived only after qualifying aggregation or governed pseudonymization.

**Alternatives considered:** fixed 30-day retention; fixed 90-day retention; indefinite operational retention; tenant-defined retention without a ceiling.

**Rationale:** A short default implements minimization while a controlled ceiling supports legitimate operational and contractual cases. Durable learning must not become indefinite retention of customer lists.

**Classification:** Thirty days is a policy default; the 90-day ceiling and intelligence eligibility rules are product commitments.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0006 — Erasure and suppression lifecycle

**Decision:** Applicable deletion covers primary storage, replicas, search indexes, exports, scheduled backup expiry, and validated cryptographic erasure where supported. Minimal suppression records may persist only to honor objections, contractual restrictions, or abuse controls and may not be repurposed.

**Alternatives considered:** delete only primary records; immediate physical removal from every backup; retain ordinary addresses indefinitely as suppression records.

**Rationale:** Deletion must cover the real data lifecycle while acknowledging that backup expiry and validated cryptographic erasure may be the technically appropriate mechanisms. Purpose-locked suppression can be necessary to prevent prohibited reuse.

**Classification:** Product commitment; implementation mechanisms require later validation.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0007 — Reproducibility after erasure

**Decision:** After personal evidence is erased, the platform may retain a non-identifying computation manifest and lifecycle event. A historical result is marked non-reproducible when erased evidence is necessary to recompute it.

**Alternatives considered:** retain all evidence to preserve reproducibility; delete the entire audit history; claim reproducibility from version metadata alone.

**Rationale:** Reproducibility cannot override deletion. Explicitly recording the loss of reproducibility is more accurate than preserving prohibited data or pretending a result remains reproducible.

**Classification:** Product commitment.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0008 — SMTP interaction ceiling

**Decision:** Verification may perform DNS resolution, TCP connection, greeting observation, EHLO or necessary HELO fallback, `MAIL FROM`, `RCPT TO`, observation, and disconnect. It must never transmit `DATA` or message content. Expansion requires a new major RFC version.

**Alternatives considered:** DNS-only verification; VRFY/EXPN use; message transmission; provider-specific interaction beyond recipient observation.

**Rationale:** Recipient-stage observation supplies bounded protocol evidence without transmitting a message. Prohibiting `DATA` creates a clear technical, ethical, and product boundary.

**Classification:** Non-negotiable product commitment.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0009 — Retry and rate-control governance

**Decision:** Rate controls operate at global, provider, MX, domain, tenant, and source dimensions. Remote defensive signals are honored immediately. Exact retry counts and rate values are configurable defaults below mandatory safety ceilings defined by later specifications.

**Alternatives considered:** one global limit; tenant-only limits; adaptive limits allowed to override remote defensive signals; fixed values in Phase 0.

**Rationale:** Layered controls reflect the different systems that can be harmed or abused. Exact values require evidence and operational learning, while respect for remote defenses is not negotiable.

**Classification:** Control hierarchy and defensive-signal behavior are product commitments; numeric values are policy defaults.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

---

## DR-0010 — Risk targets and customer explanations

**Decision:** Every risk model declares its target adverse outcome; the platform has no undefined universal risk score. Customer explanations expose sanitized observations, stable reason codes, uncertainty, and version metadata, but not protected transcripts, cross-tenant contributions, infrastructure secrets, or intelligence-membership signals.

**Alternatives considered:** one universal opaque risk score; unrestricted raw-evidence exposure; no explanations.

**Rationale:** A score is meaningful only relative to a modeled outcome. Bounded explanations support accountability without compromising other tenants, security, provider relationships, or proprietary intelligence.

**Classification:** Product commitment; individual model targets and presentation details are versioned later-phase decisions.  
**Approved by:** Product Owner  
**Approved on:** 2026-08-03  
**Effective version:** RFC 000 v1.0.0  
**Status:** Accepted

## Change log

| Date | Change |
|---|---|
| 2026-08-03 | Created DR-0001 through DR-0010 and activated register for RFC 000 v1.0.0 |
| 2026-08-04 | Added DR-0011 to freeze the controlled-beta architecture and define permitted changes |

---

## DR-0011 — Controlled-beta architecture freeze

**Decision:** Version `1.0.0-beta.1` is the final controlled-beta engineering baseline. Permitted changes are provider calibration, confidence calibration, correctness fixes, security fixes, reliability and performance improvements, beta onboarding, and launch-gate measurement. New product features, semantic changes, or expansion of the SMTP interaction boundary require an approved RFC amendment.

**Rationale:** The platform is feature-complete for controlled beta. Freezing scope protects calibration validity, reduces operational risk, and keeps engineering focused on measured production eligibility.

**Launch condition:** Production eligibility requires every configured provider to meet the minimum sample size and maximum false-positive, false-negative, and observed bounce-rate thresholds. Missing or stale evidence keeps the release in controlled beta.

**Approved by:** Product Owner  
**Approved on:** 2026-08-04  
**Effective version:** `1.0.0-beta.1`  
**Status:** Accepted

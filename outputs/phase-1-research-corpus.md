# Phase 1 Research Corpus

**Version:** 1.0.0  
**Status:** Complete  
**Governing specification:** RFC 000 v1.0.0  
**Research cutoff:** 2026-08-03

## Record contract

Each `RES` identifier is permanent and never reused. Records are append-only in meaning; corrections supersede prior records. Evidence classes are `documented_fact`, `observed_behavior`, `architectural_inference`, and `unknown_requires_experiment`. Confidence is epistemic confidence in the statement, not deliverability probability.

Required fields: identifier, statement, evidence class, confidence, sources, applicability, RFC 000 linkage, review date, status, and downstream relevance. Optional fields: limitations, corroborates, contradicts, supersedes, superseded-by, and experiment reference.

## Protocol foundations

### RES-000001 — SMTP acceptance is session-scoped

- **Statement:** An SMTP reply records the receiving system's decision at a particular command and session. It does not prove future delivery, inbox placement, human ownership, or consent.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 5321](https://www.rfc-editor.org/info/rfc5321/), especially command/reply and mail-transaction semantics
- **Applicability:** All SMTP providers
- **RFC 000:** §§5.1–5.2, invariant 2
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** The classifier must represent an accepted `RCPT TO` as evidence, never as conclusive validity.

### RES-000002 — MX lookup and implicit fallback are distinct states

- **Statement:** SMTP routing normally uses MX records; in the absence of MX records, SMTP defines fallback behavior involving address records. “No MX” is therefore not automatically “domain cannot receive mail.”
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 5321 §5](https://www.rfc-editor.org/rfc/rfc5321.html), [RFC 7505](https://www.rfc-editor.org/info/rfc7505/)
- **Applicability:** DNS and SMTP routing
- **RFC 000:** §5.3
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** DNS classification must distinguish NXDOMAIN, NODATA, implicit-MX fallback, Null MX, timeout, and SERVFAIL.

### RES-000003 — Null MX is explicit no-mail evidence

- **Statement:** A single MX record with preference 0 and target `.` explicitly declares that the domain accepts no email.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 7505](https://www.rfc-editor.org/info/rfc7505/)
- **Applicability:** Domains publishing Null MX
- **RFC 000:** §5.3
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** A correctly validated Null MX is strong domain-level invalid evidence and avoids SMTP probing.

### RES-000004 — DNS negative answers are cacheable and temporal

- **Statement:** DNS negative answers can be cached; an observed negative result has a defined cache lifetime and must not be treated as permanent truth.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 2308](https://www.rfc-editor.org/info/rfc2308/), [RFC 1034](https://www.rfc-editor.org/info/rfc1034/), [RFC 1035](https://www.rfc-editor.org/info/rfc1035/)
- **Applicability:** DNS resolution
- **RFC 000:** §§5.3, 7
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Cache TTL and negative-response provenance must be retained; transient resolver failures require retry or abstention.

### RES-000005 — SMTP reply class separates transient and permanent outcomes

- **Statement:** SMTP 4xx replies indicate transient negative completion and 5xx replies indicate permanent negative completion at the protocol layer, but enhanced codes and text are required to interpret the affected subject and cause.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 5321](https://www.rfc-editor.org/info/rfc5321/), [RFC 3463](https://www.rfc-editor.org/info/rfc3463/), [RFC 5248](https://www.rfc-editor.org/info/rfc5248/)
- **Applicability:** SMTP
- **RFC 000:** §§5.2, 6.1
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Never collapse all 4xx to unknown forever or all 5xx to nonexistent mailbox; parse command stage and enhanced status.

### RES-000006 — Greylisting intentionally creates temporary failure

- **Statement:** Greylisting can reject a connection or a command temporarily and expects a conforming sender to retry; it can occur at connection, greeting, sender, recipient, or data stages.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [RFC 6647](https://www.rfc-editor.org/info/rfc6647/)
- **Applicability:** Greylisting receivers
- **RFC 000:** §§5.2, 12
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** A first 4xx cannot decide mailbox validity. Retry scheduling must preserve tuple, timing, provider policy, and safety ceilings.

### RES-000007 — SMTPUTF8 changes valid address space

- **Statement:** Internationalized local parts require SMTPUTF8 support; ASCII-only syntax validation will incorrectly reject some standardized addresses, while a destination without SMTPUTF8 may not accept them.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 6530](https://www.rfc-editor.org/info/rfc6530/), [RFC 6531](https://www.rfc-editor.org/info/rfc6531/), [RFC 6532](https://www.rfc-editor.org/info/rfc6532/)
- **Applicability:** Internationalized email
- **RFC 000:** §5.2
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Syntax support and transport capability must be separate outputs; normalization must not destroy local-part identity.

### RES-000008 — SPF does not verify a recipient mailbox

- **Statement:** SPF authorizes sending hosts for a MAIL FROM or HELO identity; it does not state whether a recipient mailbox exists.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 7208](https://www.rfc-editor.org/info/rfc7208/)
- **Applicability:** Domains publishing SPF
- **RFC 000:** §§5.1, 6
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** SPF may contribute domain/provider/reputation context but must not directly drive mailbox-valid classification.

### RES-000009 — DKIM and DMARC are message-authentication signals

- **Statement:** DKIM signs message content and selected headers; DMARC evaluates alignment of the RFC5322.From domain with SPF/DKIM results and publishes receiver-policy requests. Neither directly verifies recipient existence.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [RFC 6376](https://www.rfc-editor.org/info/rfc6376/), [RFC 7489](https://www.rfc-editor.org/info/rfc7489/)
- **Applicability:** Authenticated message flows
- **RFC 000:** §5.1
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Authentication posture is domain risk context, not mailbox evidence; DKIM cannot be evaluated without a message and is outside the verification probe ceiling.

## Provider and gateway behavior

### RES-000010 — Google failures include reputation and policy effects

- **Statement:** Gmail documents temporary and permanent failures caused by authentication, reverse DNS, TLS, format, volume, reputation, and policy conditions. Therefore a rejection observed from Google is not necessarily evidence that a recipient is nonexistent.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [Gmail sender guidelines](https://support.google.com/mail/answer/81126), [Gmail SMTP errors](https://support.google.com/mail/answer/3726730)
- **Applicability:** Gmail and some Google-hosted flows; Workspace custom policy varies
- **RFC 000:** §§5.2, 6, 12
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Google responses require provider-specific parsing, source-reputation awareness, and aggressive abstention where policy and mailbox causes cannot be separated.

### RES-000011 — Google custom-domain policy is identifiable

- **Statement:** Gmail documents `gcdp` as an identifier for errors resulting from Google Workspace administrator custom rules, while `gsmtp` appears on Google SMTP errors.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [Gmail SMTP errors](https://support.google.com/mail/answer/3726730)
- **Applicability:** Google Workspace SMTP responses
- **RFC 000:** §§5.4, 6.1
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Response fingerprints should retain provider markers; custom-policy rejection must not become mailbox-invalid evidence.

### RES-000012 — Exchange 5.1.1/5.1.10 strongly indicates lookup failure but has context

- **Statement:** Microsoft documents 5.1.1 as bad destination mailbox address and 5.1.10 as recipient not found by SMTP address lookup, while noting causes such as removed or moved recipients and addressing state.
- **Evidence:** `documented_fact`
- **Confidence:** 0.97
- **Sources:** [Exchange Online NDR and SMTP errors](https://learn.microsoft.com/en-us/troubleshoot/exchange/email-delivery/ndr/non-delivery-reports-in-exchange-online)
- **Applicability:** Exchange Online and related Microsoft flows
- **RFC 000:** §§5.2, 6
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** These are strong invalid signals when received at RCPT stage from an authoritative path, but evidence still needs command stage, domain routing, and gateway context.

### RES-000013 — Exchange recipient filtering can reject unknown users during SMTP

- **Statement:** Microsoft Edge Transport recipient filtering can issue `550 5.1.1 User unknown` when recipient lookup does not match a recipient.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [Microsoft recipient filtering](https://learn.microsoft.com/en-us/exchange/antispam-and-antimalware/antispam-protection/recipient-filtering)
- **Applicability:** Configured Exchange Edge Transport
- **RFC 000:** §§5.2, 6.1
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Gateway configuration determines whether RCPT verification is informative; absence of rejection does not imply that recipient lookup is enabled.

### RES-000014 — Security gateways may mediate recipient verification

- **Statement:** Proofpoint training material publicly identifies recipient verification, SMTP rate control, and bounce management as protection-system capabilities.
- **Evidence:** `documented_fact`
- **Confidence:** 0.90
- **Sources:** [Proofpoint Protection Server course sheet](https://www.proofpoint.com/sites/default/files/technical-training/pfpt-us-cds-protection-server-level-2.pdf)
- **Applicability:** Proofpoint deployments; configuration varies
- **RFC 000:** §§5.4, 6.2
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Visible MX can be a gateway rather than mailbox authority. Gateway identity and recipient-verification configuration need separate inference and confidence.

## Verification science

### RES-000015 — Catch-all is a probabilistic domain property

- **Statement:** Accepting a randomized recipient demonstrates that the tested SMTP path accepted that recipient in that session; it does not prove all recipients will be delivered or that a real target mailbox exists.
- **Evidence:** `architectural_inference`
- **Confidence:** 0.96
- **Sources:** Derived from RES-000001, provider policy variability, and SMTP transaction semantics
- **Applicability:** Domains that accept arbitrary tested recipients
- **RFC 000:** §§6.2–6.3
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Return catch-all probability and risk, not `valid`; use multiple privacy-safe randomized controls only within rate policy.

### RES-000016 — Catch-all tests need stable controls and contamination defenses

- **Statement:** Random-recipient tests can be contaminated by real aliases, pattern rules, tarpits, per-source behavior, or gateways that accept then bounce. Multiple syntactically plausible high-entropy controls and historical domain behavior reduce—but do not eliminate—uncertainty.
- **Evidence:** `architectural_inference`
- **Confidence:** 0.91
- **Sources:** RES-000001, RES-000014, catch-all semantics
- **Applicability:** Catch-all detection
- **RFC 000:** §§10, 12, DR-0008/0009
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Probe count must be minimized and capped; historical intelligence should often replace repeated live controls.

### RES-000017 — Disposable, role, and free-provider labels are independent

- **Statement:** Disposable status, role-like local part, and free-consumer offering describe separate properties and can co-occur; none alone determines deliverability.
- **Evidence:** `architectural_inference`
- **Confidence:** 0.98
- **Sources:** RFC 000 semantic model and ordinary provider/domain structures
- **Applicability:** Enrichment/classification
- **RFC 000:** §§5.4, 6.2
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Implement independent scored attributes and customer policy mapping rather than a flat enum.

### RES-000018 — Historical outcomes require source decomposition

- **Statement:** Bounce and delivery outcomes mix mailbox state with sender reputation, message content, authentication, campaign selection, and receiver policy. Raw domain bounce rate is not a mailbox-validity probability.
- **Evidence:** `architectural_inference`
- **Confidence:** 0.97
- **Sources:** Google sender-policy documentation, Microsoft NDR taxonomy, RFC 000 §13
- **Applicability:** Feedback intelligence
- **RFC 000:** §13, DR-0010
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Calibration features must include provenance, sender/campaign context, provider, event stage, recency, and tenant concentration.

### RES-000019 — The safest high-accuracy engine abstains

- **Statement:** Because SMTP paths intentionally conflate mailbox, policy, reputation, and transient state, calibrated `unknown` outcomes are necessary for lower false-positive rates.
- **Evidence:** `architectural_inference`
- **Confidence:** 0.97
- **Sources:** RES-000001, RES-000005, RES-000006, RES-000010–014
- **Applicability:** Classification engine
- **RFC 000:** invariant 4
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Commercial accuracy should be reported with coverage; forcing every address into valid/invalid produces misleading headline accuracy.

### RES-000020 — Intelligence can reduce live-probe cost and harm

- **Statement:** Fresh, high-quality domain/MX/provider intelligence can avoid redundant DNS and SMTP work, lower latency and cost, and reduce remote load, provided staleness and selection bias are controlled.
- **Evidence:** `architectural_inference`
- **Confidence:** 0.95
- **Sources:** DNS caching standards, RFC 000 intelligence model, RES-000004/016/018
- **Applicability:** Orchestration and intelligence
- **RFC 000:** §§7–8, DR-0003–0005
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** The moat is a versioned evidence/intelligence layer with freshness-aware reuse, not maximum SMTP volume.

## Commercial platform evidence

### RES-000025 — MillionVerifier exposes a coarse primary taxonomy

- **Statement:** MillionVerifier's public API exposes test outcomes for `ok`, `catch_all`, `invalid`, `unknown`, and `disposable`, and separates single real-time from bulk verification.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [MillionVerifier API 3.1.0](https://developer.millionverifier.com/)
- **Applicability:** MillionVerifier public API
- **RFC 000:** §§6, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Its commercial API favors simple actionable results; our API should preserve equivalent usability while exposing orthogonal attributes and evidence reasons.

### RES-000026 — MillionVerifier internals are not established by its API

- **Statement:** Public MillionVerifier API categories and speed claims do not document its internal SMTP topology, datasets, retry logic, classification precedence, or calibration methodology.
- **Evidence:** `unknown_requires_experiment`
- **Confidence:** 0.99
- **Sources:** [MillionVerifier API](https://developer.millionverifier.com/), public product material
- **Applicability:** Competitive analysis
- **RFC 000:** §4 source discipline
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Do not reverse-engineer architecture from marketing taxonomy; benchmark outputs and latency instead.

### RES-000027 — ZeroBounce separates primary status and detailed substatus

- **Statement:** ZeroBounce documents primary statuses including valid, invalid, catch-all, unknown, spamtrap, abuse, and do-not-mail, with substates for syntax, DNS, SMTP, greylisting, disposable, role, suppression, timeout, and related conditions.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [ZeroBounce API documentation](https://www.zerobounce.net/docs/email-validation-api-quickstart)
- **Applicability:** ZeroBounce public API
- **RFC 000:** §§6, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Detailed reason codes are commercially useful, but ZeroBounce's flat primary states mix deliverability, attributes, and policy—the exact semantic coupling RFC 000 prohibits.

### RES-000028 — ZeroBounce retries greylisted results asynchronously

- **Statement:** ZeroBounce documents optional greylist processing with later pickup or webhook delivery after reprocessing.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [ZeroBounce API documentation](https://www.zerobounce.net/docs/email-validation-api-quickstart)
- **Applicability:** ZeroBounce greylist processing
- **RFC 000:** §§7, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** A fast synchronous response plus asynchronous refinement is a proven product pattern for transient SMTP states.

### RES-000029 — ZeroBounce applies historical intelligence to accept-all

- **Statement:** ZeroBounce documents a distinction between `accept_all`, described as a historically vetted domain returned valid, and `catch-all`, where actual deliverability is unconfirmed.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [ZeroBounce API status documentation](https://www.zerobounce.net/docs/email-validation-api-quickstart)
- **Applicability:** ZeroBounce accept-all handling
- **RFC 000:** §§8, 13
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** This publicly confirms the commercial importance of historical intelligence, while its exact methodology and error rate remain unknown.

### RES-000030 — NeverBounce timeout controls coverage versus latency

- **Statement:** NeverBounce documents a caller-supplied timeout that limits verification effort and yields `unknown` when the check cannot complete, plus separate disposable and catch-all flags/results.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [NeverBounce single-check API](https://developers.neverbounce.com/reference/single-check)
- **Applicability:** NeverBounce public API
- **RFC 000:** §§6.3, 7, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Latency budget must be an explicit product input; synchronous speed and classification coverage are a controlled tradeoff.

### RES-000031 — Bouncer exposes uncertainty for accept-all detection

- **Statement:** Bouncer documents `unknown` when it cannot determine whether a domain is configured to accept all email.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [Bouncer terminology](https://docs.usebouncer.com/terminology)
- **Applicability:** Bouncer public outputs
- **RFC 000:** invariant 4
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Catch-all detection itself needs an unknown state; mailbox deliverability and catch-all-domain confidence must not be collapsed.

### RES-000032 — Vendor accuracy claims are not comparable evidence

- **Statement:** Public accuracy claims lack a shared labeled dataset, observation horizon, coverage denominator, catch-all policy, and unknown handling; they cannot support a defensible competitive ranking.
- **Evidence:** `architectural_inference`
- **Confidence:** 0.99
- **Sources:** Public vendor documentation reviewed through 2026-08-03; RES-000023
- **Applicability:** All commercial verifiers
- **RFC 000:** §4
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Our benchmark must publish accuracy-versus-coverage, provider mix, label provenance, aging, latency, and cost.

## Research gaps

### RES-000043 — Emailable makes verification depth caller-configurable

- **Statement:** Emailable documents optional SMTP and accept-all checks, a 2–10 second timeout, retry reuse, and batch retries, explicitly trading response time against verification accuracy and unknown rate.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Emailable email API](https://emailable.com/docs/api/emails/)
- **Applicability:** Emailable
- **RFC 000:** §§6–7, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Confirms product profiles should control bounded depth while preserving one semantic engine and transparent uncertainty.

### RES-000044 — Kickbox public contract uses deliverability plus accept-all attribute

- **Statement:** Public Kickbox client/reference material exposes `deliverable`, `undeliverable`, `risky`, and `unknown` results and an independent `accept_all` Boolean.
- **Evidence:** `documented_fact`
- **Confidence:** 0.94
- **Sources:** [Kickbox official reference index](https://docs.kickbox.com/reference/single-verification), [official Kickbox client package listing](https://packagist.org/packages/kickbox/kickbox)
- **Applicability:** Kickbox public API
- **RFC 000:** §§6, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Market evidence supports separating a broad assessment from catch-all attributes, though our canonical deliverability remains more precise.

### RES-000045 — Findymail public verifier contract is coarse

- **Statement:** Findymail's public API documents a verification endpoint returning email, a Boolean `verified`, and provider, without public evidence lineage or nuanced uncertainty in the shown contract.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Findymail API documentation](https://app.findymail.com/docs/)
- **Applicability:** Findymail public API as of research cutoff
- **RFC 000:** §§6, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Simple output is commercially convenient but insufficient as our canonical model; provide simple policy recommendation alongside detailed semantics.

### RES-000038 — Yahoo permanent failures are not mailbox-specific by class alone

- **Statement:** Yahoo documents 5xx failures for invalid recipients, authentication, content, reputation, and policy causes; 4xx failures likewise include traffic, reputation, resource, and DNS/authentication conditions.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Yahoo Sender Hub SMTP errors](https://senders.yahooinc.com/smtp-error-codes/)
- **Applicability:** Yahoo/AOL receiving infrastructure
- **RFC 000:** §§5.2, 6.1
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Reply class is insufficient; parse diagnostic, command stage, and source context. Only recipient-specific diagnostics are strong mailbox evidence.

### RES-000039 — Mimecast recipient semantics are tenant-configurable

- **Statement:** Mimecast supports accept-any, known-recipient, directory-only, SMTP call-forward, null-sender call-forward, and backup-MX recipient-validation modes.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Mimecast recipient validation](https://mimecastsupport.zendesk.com/hc/en-us/articles/34000546468371-Exchange-Recipient-Validation)
- **Applicability:** Mimecast-protected domains
- **RFC 000:** §§5.4, 6
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** MX operator identity cannot determine mailbox-verification capability. Learn behavior per protected domain and time window.

### RES-000040 — Mimecast can relay downstream recipient truth

- **Statement:** In SMTP call-forward modes, Mimecast queries the customer's Exchange environment and accepts only addresses verified downstream.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [Mimecast SMTP call forward](https://mimecastsupport.zendesk.com/hc/en-us/articles/34000799709331-Email-Security-Cloud-Gateway-Enabling-Recipient-Filtering-SMTP-Forward)
- **Applicability:** Configured Mimecast/Exchange deployments
- **RFC 000:** §5.4
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** A gateway rejection can be strong evidence only after behavior inference establishes authoritative call-forward/directory validation.

### RES-000041 — Cisco ESA also supports SMTP call-ahead

- **Statement:** Cisco Secure Email Gateway can suspend the inbound SMTP conversation, query an external SMTP server for the recipient, and map the downstream response into accept or reject behavior.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Cisco SMTP call-ahead recipient validation](https://www.cisco.com/c/en/us/td/docs/security/esa/esa16-0/user_guide/b_ESA_Admin_Guide_16-0/b_ESA_Admin_Guide_12_1_chapter_011000.pdf)
- **Applicability:** Configured Cisco ESA deployments
- **RFC 000:** §§5.4, 6
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Gateway topology and configuration are latent variables; provider fingerprints require per-domain historical behavior.

### RES-000042 — Directory-harvest defenses make probing stateful

- **Statement:** Cisco documents directory-harvest attack prevention counters involving invalid-recipient rejections, while Mimecast documents greylisting keyed by sender IP/address and recipient.
- **Evidence:** `documented_fact`
- **Confidence:** 0.97
- **Sources:** [Cisco call-ahead guide](https://www.cisco.com/c/en/us/td/docs/security/ces/user_guide/esa_user_guide-13-7-0/b_ESA_Admin_Guide_ces_13-7/b_ESA_Admin_Guide_12_1_chapter_011000.pdf), [Mimecast ARMed SMTP](https://mimecastsupport.zendesk.com/hc/en-us/articles/34000788732435-Email-Security-Cloud-Gateway-Armed-SMTP)
- **Applicability:** Protected enterprise domains
- **RFC 000:** §§10–12, DR-0009
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Invalid controls consume reputation and defensive budgets. Orchestration must cap domain/source probes and prefer cached intelligence.

### RES-000033 — Hunter exposes checks separately but retains a flat status

- **Statement:** Hunter documents syntax, gibberish, disposable, webmail, MX, SMTP-connect, SMTP mailbox, accept-all, and blocked checks, while its primary status still mixes deliverability and provider attributes.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Hunter verifier FAQ](https://help.hunter.io/en/articles/15899247-email-verification-faqs), [Hunter API](https://hunter.io/api-documentation)
- **Applicability:** Hunter public verifier
- **RFC 000:** §§6, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Preserve granular signals internally and expose orthogonal properties; avoid arbitrary composite scores such as documented fixed scores for some classes.

### RES-000034 — Hunter uses asynchronous completion after latency budget

- **Statement:** Hunter documents a 20-second request window followed by HTTP 202 and polling when verification remains incomplete.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Hunter API](https://hunter.io/api-documentation)
- **Applicability:** Hunter real-time API
- **RFC 000:** §§7, 14
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Confirms two-speed product design: low-latency preliminary result plus idempotent asynchronous refinement.

### RES-000035 — Verifalia separates status from customer-configurable classification

- **Statement:** Verifalia documents detailed validation statuses mapped into deliverable, risky, undeliverable, or unknown classifications, with customer-configurable schemes and overrides.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Verifalia status codes](https://verifalia.com/help/email-validations/status-codes-of-the-validation-result-field)
- **Applicability:** Verifalia
- **RFC 000:** §§6.1–6.5
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Strong market validation for RFC 000's evidence/assessment/policy separation, though our model should keep risk separate from deliverability.

### RES-000036 — Verification depth is a commercial latency/coverage control

- **Statement:** Verifalia documents quality levels that vary validation passes and anti-tarpit/greylisting time: a fast single pass versus multiple passes and longer waits.
- **Evidence:** `documented_fact`
- **Confidence:** 0.99
- **Sources:** [Verifalia quality levels](https://verifalia.com/help/email-validations/result-quality-levels)
- **Applicability:** Verifalia; general product design
- **RFC 000:** §§7, 14, DR-0009
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Offer explicit latency/coverage profiles backed by one engine, not opaque “accuracy” tiers; safety ceilings remain fixed.

### RES-000037 — Privacy objections can require verification suppression

- **Statement:** Hunter documents a `claimed_email` response when an owner has requested processing stop, indicating a verifier may need a purpose-locked suppression mechanism independent of deliverability.
- **Evidence:** `documented_fact`
- **Confidence:** 0.98
- **Sources:** [Hunter API](https://hunter.io/api-documentation)
- **Applicability:** Privacy and API policy
- **RFC 000:** §§8–9, DR-0006
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Add a non-deliverability policy result for data-subject restriction; never expose suppression membership more broadly than necessary.

### RES-000021 — Provider RCPT behavior matrix

- **Statement:** Current, source-controlled RCPT-stage behavior for Google, Microsoft, Yahoo, Zoho, Fastmail, Proton, Proofpoint, Mimecast, and Cisco cannot be established from public documentation alone.
- **Evidence:** `unknown_requires_experiment`
- **Confidence:** 0.99
- **Sources:** Public documentation reviewed through 2026-08-03
- **Applicability:** Provider-specific classification
- **RFC 000:** DR-0008/0009
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Requires authorized, rate-limited experiments with known-valid, known-invalid, catch-all, and transient controls across source reputations and regions.

### RES-000022 — Post-accept bounce behavior

- **Statement:** The frequency with which major providers and gateways accept unknown recipients at RCPT then reject later is not sufficiently quantified for classification calibration.
- **Evidence:** `unknown_requires_experiment`
- **Confidence:** 0.98
- **Sources:** RES-000001/014 and public documentation gaps
- **Applicability:** SMTP and feedback calibration
- **RFC 000:** §§6–7, DR-0010
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Needs consented outcome data; RFC 000 prohibits sending `DATA` merely to test this.

### RES-000023 — Commercial verifier comparative accuracy

- **Statement:** Vendor marketing claims do not provide a common, independently reproducible benchmark for false-positive rate, false-negative rate, catch-all coverage, latency, and unknown rate.
- **Evidence:** `unknown_requires_experiment`
- **Confidence:** 0.99
- **Sources:** Public vendor materials; benchmark methodology absent or non-comparable
- **Applicability:** MillionVerifier, ZeroBounce, Bouncer, NeverBounce, Emailable, Kickbox, Verifalia, Hunter, Findymail
- **RFC 000:** source discipline §4
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Build a blinded benchmark corpus and score coverage alongside accuracy; do not copy unverified marketing claims into architecture.

### RES-000024 — Disposable-domain freshness

- **Statement:** Optimal discovery, confirmation, and expiry methods for rapidly changing disposable providers require empirical evaluation.
- **Evidence:** `unknown_requires_experiment`
- **Confidence:** 0.95
- **Sources:** No stable authoritative registry exists
- **Applicability:** Disposable intelligence
- **RFC 000:** §§6.2, 7
- **Reviewed:** 2026-08-03
- **Status:** active
- **Product relevance:** Evaluate multiple feeds, passive observations, DNS/MX clustering, expiry rules, and false-positive review.

## Phase 1 product conclusions

1. The product must be an evidence fusion engine, not an SMTP boolean checker.
2. Provider/gateway identification and response parsing are first-order accuracy features.
3. `unknown` rate and coverage must accompany accuracy metrics.
4. Catch-all must be probabilistic and time-bound.
5. DNS states and caching semantics provide cheap, high-value early decisions.
6. Feedback improves the engine only when provenance and confounding factors are modeled.
7. Historical intelligence should reduce repeated probing and become the commercial moat.
8. The next specification should prioritize evidence schemas, precedence, retry/abstention rules, provider adapters, calibration, and benchmark design.

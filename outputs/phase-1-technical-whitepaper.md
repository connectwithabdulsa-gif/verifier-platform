# Phase 1 Technical Whitepaper: Product Evidence for Commercial Email Verification

**Version:** 1.0.0  
**Status:** Complete  
**Governing specification:** RFC 000 v1.0.0  
**Authoritative source:** Phase 1 Research Corpus  
**Evidence cutoff:** 2026-08-03

## Executive conclusion

A production verifier cannot prove that an address will receive a future message. It can estimate deliverability by combining time-bound protocol observations, provider and gateway behavior, curated intelligence, historical outcomes, and explicit uncertainty. The best commercial product is therefore not the one that performs the most SMTP probes; it is the one that extracts the most reliable evidence at the lowest latency and remote cost, abstains when evidence is ambiguous, and learns safely from later outcomes.

The highest-value product decisions supported by current evidence are:

1. Preserve evidence independently from classification.
2. Model deliverability, mailbox attributes, provider topology, risk, and customer policy as separate dimensions.
3. Treat DNS as a typed state machine, not a Boolean MX check.
4. Treat SMTP replies as command-, session-, source-, provider-, and time-scoped observations.
5. Build provider/gateway adapters and per-domain behavioral intelligence.
6. Make catch-all a probability with expiry, not a valid/invalid label.
7. Offer a fast synchronous path and an idempotent asynchronous refinement path.
8. Measure accuracy together with coverage, unknown rate, latency, cost, and age.
9. Use feedback only after separating mailbox evidence from sender, content, policy, and selection effects.
10. Minimize probing. Fresh intelligence is simultaneously a cost advantage, latency advantage, accuracy feature, and abuse-control mechanism.

## 1. What the protocols prove

SMTP defines a conversation for transferring mail. The receiving side replies to commands, and those replies carry protocol semantics. A `2xx` response to `RCPT TO` means the server accepted that command in that session. It does not establish inbox placement, delivery after `DATA`, continued mailbox existence, a human reader, or permission to contact. A verifier must therefore store the exact command stage, reply, enhanced status, text fingerprint, endpoint, source identity, and timestamp.

Reply classes matter but are insufficient. A `4xx` is transient at the protocol layer and normally invites retry. Greylisting deliberately produces temporary failure and may act at connection, greeting, sender, recipient, or later stages. A `5xx` is permanent for the attempted transaction, yet large providers document 5xx policy, reputation, authentication, content, and recipient causes. The engine must parse recipient-specific diagnostics rather than interpreting every 5xx as nonexistent mailbox.

DNS provides several commercially decisive states. NXDOMAIN, NODATA, SERVFAIL, timeout, ordinary MX, implicit-MX fallback, and Null MX have different meanings. Null MX is explicit no-mail evidence. Missing MX alone is not, because SMTP defines fallback behavior. Negative DNS responses are cacheable and temporal, so evidence must include TTL and resolver provenance. This lets the engine stop cheaply on strong domain-invalid evidence while retrying or abstaining on transient resolver failures.

SMTPUTF8 expands valid address syntax beyond ASCII local parts. Syntax support and destination transport capability are separate facts. The engine must avoid destructive normalization of local parts, preserve original input, normalize domains carefully, and expose unsupported transport capability rather than calling every non-ASCII address invalid.

SPF authorizes hosts for sender identities. DKIM authenticates message content and selected headers. DMARC evaluates alignment and publishes receiver-policy requests. These protocols provide domain and risk context but do not verify recipient existence. Because RFC 000 prohibits sending `DATA`, DKIM and DMARC cannot be evaluated as live message results during verification.

## 2. Provider behavior that changes classification

Google documents failures driven by authentication, reverse DNS, TLS, format, volume, custom tenant policy, reputation, and resource conditions. Its diagnostics include provider markers such as `gsmtp` and custom-domain-policy markers such as `gcdp`. A Google rejection without a mailbox-specific diagnostic is not enough to classify the mailbox invalid. Google results need a provider adapter, response fingerprinting, reputation-aware uncertainty, and conservative abstention.

Microsoft documents `5.1.1` bad destination mailbox and `5.1.10` recipient-not-found conditions. These are strong invalid signals when observed at recipient stage through an authoritative path, but Microsoft also documents policy, authorization, movement, legacy-addressing, and generic error conditions. Exchange recipient filtering is configurable; whether a particular edge performs directory lookup must be inferred from domain behavior.

Yahoo documents both temporary and permanent failures caused by reputation, traffic, authentication, content, policy, infrastructure, and invalid recipients. Yahoo explicitly distinguishes recipient-does-not-exist diagnostics, but the numeric reply class alone cannot do so. The operational conclusion matches Google: parse the full response and retain source and command context.

Enterprise security gateways make MX identity especially deceptive. Mimecast can accept any address, rely on synchronized directories, accept known recipients, call forward to Exchange, or behave as backup MX. Cisco ESA similarly supports SMTP call-ahead to a downstream authority. Proofpoint publicly documents recipient verification as a configurable protection capability. The visible gateway may therefore reveal mailbox truth, hide it, or relay a downstream decision depending on tenant configuration.

This makes per-domain behavioral intelligence more valuable than a static provider table. The intelligence record should capture MX topology, provider fingerprint, observed invalid-control behavior, catch-all probability, transient profile, response stability, source sensitivity, confidence, sample size, and expiry. Provider identity supplies a prior; domain observations update it.

Directory-harvest defenses also make probing stateful. Invalid-recipient controls can consume defensive counters and damage source reputation. Greylisting can key on sender, IP, and recipient. A verifier that probes aggressively will make its own future evidence worse. Domain-, MX-, provider-, source-, and global budgets are therefore accuracy mechanisms, not merely politeness controls.

## 3. Verification science

### Syntax

Syntax validation should identify clearly malformed input without pretending that every obscure standards-permitted form is operationally usable. The product should preserve the submitted address, emit normalization suggestions separately, and never silently replace a typo. Domain comparison is case-insensitive; local-part case sensitivity is discouraged operationally but cannot be assumed away universally.

### DNS

DNS is the cheapest high-value layer. The engine should query and classify domain existence, MX, Null MX, fallback address records, resolution failures, TTL, and optionally DNSSEC state. Results should be cached by their protocol lifetimes with jitter and stale-if-error rules defined later. Resolver diversity is warranted for contradictory or high-impact negative outcomes, not every request.

### SMTP

The approved ceiling ends after `RCPT TO`; no message data is sent. A session yields multiple evidence items: connectivity, banner, EHLO capabilities, TLS behavior if used, sender-stage acceptance, recipient-stage response, latency, disconnect, and fingerprints. These signals must be interpreted jointly. The envelope sender strategy must be stable, legitimate, rate-controlled, and provider-aware because sender identity affects responses.

### Catch-all

Accepting a randomized address demonstrates only that the tested path accepted that address then. Real aliases, wildcard rules, gateways, tarpits, per-source policy, and accept-then-bounce behavior can contaminate the result. Catch-all should be a domain-level probability inferred from minimal high-entropy controls and history. Multiple controls may improve confidence, but each adds abuse and reputation cost. Fresh historical intelligence should normally prevent repeated testing.

For a mailbox on a probable catch-all domain, the correct output is not “valid.” It is a deliverability assessment such as catch-all/unknown, a confidence value, independent role/disposable/provider attributes, and a customer-policy recommendation. Historical delivery evidence may adjust risk but cannot create certainty.

### Disposable, role, free, and organization attributes

These are independent properties. A role address may be deliverable. A disposable mailbox may be personal. A government domain may use Microsoft 365. The product should score attributes independently and allow customer policy to decide their consequences. Disposable intelligence requires multiple feeds, passive discovery, MX/domain clustering, expiry, and false-positive review because no authoritative registry exists.

### Spamtraps and do-not-contact

No public protocol reliably identifies spamtraps. Vendor claims in this area imply proprietary intelligence, heuristics, suppression data, or historical observations. The platform must label such results as risk/policy inference with provenance and restricted explanation, never as protocol fact. Privacy objections require purpose-locked suppression independent of deliverability and must not leak membership.

### Feedback and calibration

Hard bounce, soft bounce, accepted, complaint, and customer correction events are evidence, not truth. Outcomes mix recipient state with sender reputation, authentication, content, campaign selection, and receiver policy. Calibration must retain event stage, diagnostic, provider, source trust, campaign context where permitted, recency, tenant contribution, and model version. Global learning needs concentration caps and privacy release gates.

## 4. Commercial product findings

MillionVerifier publicly exposes a deliberately simple taxonomy around OK, catch-all, invalid, unknown, and disposable, with real-time and bulk APIs. Its internal topology, evidence weighting, retry logic, intelligence sources, and calibration are not documented. The useful competitive lesson is product simplicity, not an inferred architecture.

ZeroBounce publishes a broad status/substatus vocabulary covering syntax, DNS, SMTP, greylisting, role, disposable, suppression, abuse, spamtrap, and policy categories. It also documents delayed greylist reprocessing and distinguishes historically vetted accept-all from unresolved catch-all. This is direct market evidence that detailed reasons, asynchronous refinement, and historical intelligence have commercial value. Its flat primary statuses mix deliverability, mailbox attributes, and policy, which our multidimensional contract avoids.

NeverBounce exposes timeout as a caller control and returns unknown when effort expires. Hunter uses a finite synchronous window followed by polling, exposes granular checks, and acknowledges that valid results can later bounce. Verifalia sells verification-depth levels varying passes and anti-tarpit time, and separates detailed statuses from configurable classifications. Bouncer exposes uncertainty in catch-all detection. Across vendors, the repeated product pattern is a latency/coverage tradeoff, asynchronous refinement, and policy-friendly detailed reasons.

Emailable similarly exposes caller controls for SMTP, accept-all checking, timeout, and retries, making the speed/coverage tradeoff explicit. Kickbox exposes broad deliverability results plus accept-all metadata. Findymail's shown public verifier response is intentionally coarse. These contracts reinforce a two-layer product strategy: keep the internal/canonical evidence model rigorous, while offering customers a simple recommendation and optional detail rather than forcing either extreme.

Vendor accuracy claims are not scientifically comparable. Public claims generally omit labeled-corpus construction, provider mix, address age, catch-all treatment, unknown denominator, confidence intervals, and outcome horizon. A credible competitor should avoid an unsupported headline number and instead publish benchmark slices: false-valid rate, false-invalid rate, decisive coverage, catch-all calibration, provider coverage, p50/p95 latency, result age, and cost.

## 5. Product blueprint implications

The verification engine should have three product modes built on the same evidence pipeline:

- **Fast:** cached intelligence plus syntax/DNS and bounded live work; strict latency budget; may return pending/unknown.
- **Balanced:** normal live observation and provider-aware transient handling.
- **Deep:** asynchronous bounded retries for greylisting, tarpits, and ambiguous providers; never exceeds RFC safety ceilings.

The public API should return a stable preliminary result quickly and a verification identifier. If refinement is justified, clients may poll or receive a webhook. Every later result supersedes rather than mutates the historical assessment and includes evidence cutoff and model versions.

The core moat is a privacy-governed intelligence graph keyed primarily by domain, MX, provider, network, response fingerprint, and time. Mailbox-level history should be used only where permitted and necessary. Intelligence must carry sample size, source diversity, confidence, time decay, and model/rule provenance.

The commercial benchmark must be designed before the classifier. It needs known-valid and known-invalid controlled addresses, expired/former addresses, provider and gateway strata, catch-all domains, disposable churn, internationalized addresses, transient scenarios, and consented delivery outcomes. Accuracy must never be reported without coverage.

## 6. Unknowns converted into experiments

The following gaps require controlled experiments rather than more desk research:

1. Current RCPT behavior by provider, gateway, region, source reputation, and domain configuration.
2. Accept-at-RCPT then bounce-later frequency, using consented outcome data rather than prohibited test messages.
3. Catch-all probability calibration and minimum safe control count.
4. Source-identity sensitivity and recovery after defensive throttling.
5. Disposable-feed precision, recall, churn, and optimal expiry.
6. Comparative vendor accuracy on one blinded corpus.
7. Provider-specific retry windows and the marginal coverage gained per retry.
8. Membership-inference risk from customer-visible explanations and aggregate intelligence.

Each experiment must have an owner, hypothesis, permitted method, safety budget, dataset provenance, stopping rule, and RES outputs. Observations must never be generalized beyond their scope.

## 7. Phase 1 exit decision

Desk research has reached diminishing returns for product design. The evidence is sufficient to write the Verification Specification without pretending unresolved provider behavior is known. Remaining uncertainty is explicitly captured as experiments and should feed later calibration.

Phase 1 is complete when paired with Research Corpus v1.0.0. The next phase must specify evidence schemas, state machines, precedence and abstention rules, latency profiles, retry ceilings, catch-all inference, risk semantics, and benchmark acceptance criteria. It must not select deployment architecture or write implementation code.

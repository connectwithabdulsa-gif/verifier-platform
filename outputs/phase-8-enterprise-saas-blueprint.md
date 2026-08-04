# Phase 8 — Enterprise SaaS Blueprint

**Version:** 1.0.0  
**Status:** Complete blueprint

## Product surfaces

### APIs

- single verification and asynchronous refinement;
- bulk upload/job/export;
- result lookup and re-verification;
- signed webhooks with replay;
- feedback ingestion;
- tenant policy and suppression management;
- usage, audit, and service-health endpoints;
- versioned SDKs and OpenAPI contract.

### Dashboard

- usage, latency, coverage, unknown, and result-age views;
- bulk jobs and exports;
- policy builder with simulation;
- webhook/integration health;
- API keys/service accounts;
- team, roles, audit, billing;
- privacy/export/delete workflows;
- provider incident transparency without exposing sensitive intelligence.

The dashboard never claims consent or guaranteed delivery.

## Enterprise identity and tenancy

- organizations, workspaces, environments, and projects;
- SAML/OIDC SSO, SCIM provisioning, MFA enforcement;
- service accounts and scoped API keys;
- predefined roles plus enterprise custom roles;
- IP/network restrictions and private connectivity options;
- tenant-managed retention within approved bounds;
- region/data-residency selection where supported;
- immutable audit export.

Authorization is resource/action/purpose scoped and centrally tested. Parent organizations do not automatically see child-workspace address data.

## Integrations

Priority order is driven by revenue and workflow fit:

1. generic REST, webhook, CSV/S3-compatible import/export;
2. Zapier/Make/n8n and data-warehouse destinations;
3. HubSpot, Salesforce, and major CRMs;
4. Clay, Smartlead, Instantly under restricted cold-outbound controls;
5. enterprise event buses and secure file transfer.

Every integration declares data flow, purpose, retention, permissions, retries, and deletion behavior. Integrations cannot bypass policy or abuse controls.

## Packaging

- **Developer:** real-time API, low volume, standard support.
- **Growth:** bulk, webhooks, policy configuration, integrations.
- **Business:** higher limits, teams, analytics, priority queues/support.
- **Enterprise:** SSO/SCIM, custom roles, residency, private networking, custom retention, security package, SLA.

Charge primarily per completed verification with transparent handling of unknown/refinement; do not incentivize unsafe probing. Deep profile and long-running catch-all refinement may consume differentiated units. Contracted minimums fund enterprise capacity.

## Billing controls

Idempotent usage ledger, prepaid/arrears support, limits and alerts, invoice reconciliation, credit adjustments, tax/payment provider integration, and anti-fraud. Billing events use verification IDs and result class, not raw addresses. Classification logic is isolated from billing.

## Enterprise reliability

- documented API and completion SLAs;
- maintenance and incident communication;
- enterprise status subscriptions;
- support severity and response targets;
- capacity reservations for contracted tenants;
- change notices for breaking API/policy behavior;
- customer-visible version and result-expiry semantics.

Remote provider behavior is excluded from guaranteed decisive classification; the SLA covers platform processing and correct uncertainty handling.

## Compliance and assurance

Roadmap:

1. security/privacy control baseline and evidence collection from MVP;
2. SOC 2 Type I readiness, then audit;
3. SOC 2 Type II operating period;
4. ISO 27001 based on enterprise demand;
5. GDPR DPA/SCC/subprocessor package, CCPA terms;
6. annual penetration tests, vulnerability disclosure, incident exercises;
7. customer security portal and standardized questionnaires.

Compliance certifications do not expand approved product purpose.

## Customer controls

- policy simulation and version rollback;
- verification profile and freshness requirements;
- role/disposable/free/catch-all handling;
- project quotas and destination limits below platform ceilings;
- webhook secrets and rotation;
- deletion and retention;
- suppression upload without disclosure;
- audit/event export;
- model/ruleset change visibility.

## Support and operations

Support tooling shows sanitized evidence, lineage, provider status, and replay controls under scoped access. It cannot browse arbitrary addresses or modify evidence. Escalation paths: API/tenant, verification semantics, provider operations, privacy/security, billing. Disputes create research/quality records rather than manual validity overrides.

## Enterprise go-to-market proof

Before broad launch demonstrate:

- blinded benchmark and methodology;
- customer-specific bounce/coverage lift with confounders disclosed;
- latency and scale under contracted profiles;
- privacy/security documentation;
- reliable integrations and webhooks;
- transparent unknown/catch-all semantics;
- unit economics and support capacity.

## Success metrics

- retained gross margin per million verifications;
- false-valid and decisive coverage by provider;
- p95 latency and asynchronous completion;
- avoided probes and cost per decisive result;
- expansion/retention by use case;
- policy adoption and prevented risky sends;
- integration reliability;
- enterprise security review cycle time;
- abuse incident and provider-block rate;
- customer outcome calibration, not vanity verification count.

## Enterprise launch gates

- production and intelligence gates passed for two quarters;
- SSO/SCIM/RBAC/audit tested;
- DPA/SLA/support/security packages ready;
- billing reconciliation proven;
- integration deletion and failure paths tested;
- tenant isolation penetration test passed;
- capacity and incident exercises passed;
- no feature violates RFC 000 out-of-scope boundaries.

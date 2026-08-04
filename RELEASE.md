# Verifier Platform 1.0.0-beta.1

Status: **Controlled Beta**  
Activated: **2026-08-04**  
Architecture: **Frozen under DR-0011**  
Production eligibility: **Not yet achieved; provider calibration gates remain open**

The release includes the evidence-first verification engine, durable bulk jobs, CSV import/export, signed webhooks, tenant isolation, scoped credentials, quotas, audit events, billing entitlements, calibration analysis, launch gates, dashboard, OpenAPI contract, container deployment, and safety controls.

Before each beta deployment run `npm test` and `npm run beta:check`. Deployment must use a truthful SMTP identity, stable reputable egress, durable storage, unique secrets, TLS termination, backups, monitoring, and an approved beta tenant list.

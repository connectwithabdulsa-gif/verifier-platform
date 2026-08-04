# Verifier Platform MVP

Evidence-first commercial email verification engine implementing RFC 000 v1.0.0.

Core safety invariant: SMTP observation ends after `RCPT TO`. The codebase has no `DATA`, `VRFY`, or `EXPN` command path.

## Runtime

Node.js 24+ with no third-party runtime dependencies for the initial engine. Native modules provide HTTP, DNS, TCP/TLS, tests, and SQLite. Production adapters can replace repositories and queues without changing domain contracts.

## Commands

```text
pnpm test
pnpm start
pnpm experiment -- --manifest experiments/major-providers.json
```

For the first complete local run, follow [First end-to-end beta run](docs/first-beta-run.md). `npm run beta:e2e` provides a deterministic no-Internet workflow; the real-network procedure separately validates SMTP egress and authorized mailboxes.

Set `VERIFIER_API_KEY=local-key`, a truthful `VERIFIER_GREETING_IDENTITY`, and `VERIFIER_ENVELOPE_SENDER` before starting. Set `VERIFIER_SQLITE_PATH=work/verifier.sqlite` for durable local storage; otherwise the runtime is ephemeral.

With durable storage enabled, the bootstrap key belongs to a controlled-beta tenant and is stored only as a SHA-256 digest. `VERIFIER_MONTHLY_QUOTA` controls its initial monthly allowance. Set `VERIFIER_WEBHOOK_SECRET` for result callbacks and `VERIFIER_BILLING_WEBHOOK_SECRET` for signed entitlement events.

The API exposes single verification, tenant-isolated result lookup, synchronous batches of 100, and durable asynchronous jobs of up to 100,000 unique addresses. Live provider experiments require company-owned or written-authorized fixtures supplied through manifest-named environment variables and the explicit `VERIFIER_EXPERIMENT_LIVE=I_ACKNOWLEDGE_AUTHORIZATION` acknowledgement. Dry-run remains the default.

Provider baselines cannot be fabricated locally: useful observations require owned valid/invalid mailboxes and a reputable static egress IP with correct forward/reverse DNS. Until collected, ambiguous and defensive SMTP behavior remains `unknown` or `pending_refinement`, never `invalid`.

## Commercial operations

- `POST /v1/bulk-jobs` accepts JSON or CSV, deduplicates up to 100,000 rows, persists progress, and retries transient failures asynchronously.
- `GET /v1/bulk-jobs/{id}` returns tenant-isolated progress; append `/export` for CSV.
- Optional HTTPS webhooks are HMAC-SHA256 signed and reject private destinations.
- `/dashboard` is the lightweight console, `/openapi.yaml` is the API contract, and authenticated `/metrics` exposes PII-free counters.
- Container deployment requires durable storage, secrets, a truthful SMTP identity, and reputable static egress with forward and reverse DNS.
- Tenant APIs expose plan and usage, scoped API-key rotation, revocation, and immutable audit history. Billing ingestion is provider-neutral, signed, and idempotent.
- Production eligibility is an explicit gate over per-provider sample size, false-positive rate, false-negative rate, and observed bounce rate; missing evidence always keeps the release in controlled beta.

## Layout

- `src/domain`: canonical evidence, properties, assessments, policy
- `src/verification`: parser, DNS, SMTP, orchestration, provider adapters
- `src/infrastructure`: repositories, scheduler, clock, telemetry
- `src/api`: HTTP contract
- `src/experiments`: reproducible authorized provider experiments
- `test`: fixture, unit, integration, and safety tests
- `db`: production-oriented SQL schema
- `experiments`: versioned manifests; no secrets or real addresses committed
- `outputs`: approved governing and blueprint artifacts

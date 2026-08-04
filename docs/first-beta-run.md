# First end-to-end beta run

Use two stages. The deterministic fixture proves the complete application workflow. The real-network run then proves DNS, outbound TCP/25, SMTP identity, and egress behavior. Fixture results are test evidence, not provider calibration.

## Deterministic workflow

Requires Node.js 24 or newer. From the repository root:

```powershell
npm run beta:init
npm test
npm run beta:e2e
```

`beta:e2e` starts the fixture, runs the smoke workflow, and stops it automatically. For interactive inspection instead run the fixture in one terminal and the smoke command in another:

```powershell
npm run beta:fixture
npm run beta:smoke
```

The final line must be `END-TO-END BETA SMOKE PASS`. This checks syntax, DNS, accepted and missing recipients, catch-all behavior, greylisting, Null MX, confidence output, authentication, quotas, durable bulk processing, progress polling, and CSV export.

| Fixture address | Expected result |
|---|---|
| `good@valid.test` | `valid` |
| `missing@valid.test` | `invalid` |
| `support@valid.test` | `valid`; role attribute true |
| `anything@catchall.test` | `catch_all` with deep profile |
| `later@temporary.test` | `unknown`; pending refinement |
| `any@nullmx.test` | `invalid` |
| `malformed-address` | `invalid` |

The fixture contacts no public mail server. Stop it with Ctrl+C. Delete `work/beta.sqlite` only when intentionally resetting local evidence.

## Real-network configuration

Create a separate protected environment from [.env.beta.example](../.env.beta.example). Generate fresh independent secrets, remove `BETA_FIXTURE_MODE`, and configure:

- `VERIFIER_API_KEY`: at least 32 random bytes.
- `VERIFIER_SQLITE_PATH`: durable, backed-up single-node beta volume.
- `VERIFIER_GREETING_IDENTITY`: public hostname whose A record resolves to the egress IP.
- `VERIFIER_ENVELOPE_SENDER`: monitored address on an operator-controlled domain.
- `VERIFIER_SOURCE_IDENTITY`: stable label for the egress source.
- `VERIFIER_WEBHOOK_SECRET` and `VERIFIER_BILLING_WEBHOOK_SECRET`: separate 32-byte secrets.
- `VERIFIER_MONTHLY_QUOTA`: conservative beta allowance.

SMTP egress requires a dedicated static public IP, matching PTR and forward A record, permitted outbound TCP/25 without transparent interception, and explicit hosting-provider permission. Respect all remote defensive signals. Never configure a relay and never transmit SMTP DATA.

Validate and launch:

```powershell
node --env-file=.env.beta.local scripts/beta-readiness.mjs
node --env-file=.env.beta.local src/api/server.ts
```

## Manual API request

Load the same environment into the client shell, then:

```powershell
$headers = @{ Authorization = "Bearer $env:VERIFIER_API_KEY"; "Content-Type" = "application/json" }
$body = @{ email = "owned-test@your-domain.example"; idempotency_key = "first-real-001"; profile = "deep" } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:8080/v1/verifications -Method Post -Headers $headers -Body $body
Invoke-RestMethod http://127.0.0.1:8080/v1/account -Headers $headers
```

## CSV workflow

Replace the fixture addresses in [beta-contacts.csv](../samples/beta-contacts.csv) with authorized mailboxes for a real-network run.

```powershell
$csv = Get-Content samples/beta-contacts.csv -Raw
$headers = @{ Authorization = "Bearer $env:VERIFIER_API_KEY"; "Content-Type" = "text/csv"; "Idempotency-Key" = "first-csv-001" }
$job = Invoke-RestMethod http://127.0.0.1:8080/v1/bulk-jobs -Method Post -Headers $headers -Body $csv
Invoke-RestMethod "http://127.0.0.1:8080/v1/bulk-jobs/$($job.id)" -Headers @{ Authorization = "Bearer $env:VERIFIER_API_KEY" }
```

Only test mailboxes and domains you own or have written authorization to use. A real response may remain `unknown`; that is correct until calibration supports a stronger conclusion.

Retain release, configuration checksum excluding secrets, egress IP, PTR/A results, verification IDs, provider/MX, timestamps, model versions, expected mailbox state, delivery outcome, and bounce class. Never place customer campaign data in the calibration corpus.

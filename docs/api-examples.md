# API examples

The authoritative contract is [`openapi.yaml`](../openapi.yaml). Never put API keys in URLs.

```bash
curl -X POST http://localhost:8080/v1/verifications -H "Authorization: Bearer $VERIFIER_API_KEY" -H "Content-Type: application/json" -d '{"email":"user@example.com","idempotency_key":"signup-123","profile":"balanced"}'
curl -X POST http://localhost:8080/v1/bulk-jobs -H "Authorization: Bearer $VERIFIER_API_KEY" -H "Content-Type: text/csv" --data-binary @contacts.csv
curl http://localhost:8080/v1/bulk-jobs/BULK_ID/export -H "Authorization: Bearer $VERIFIER_API_KEY" -o results.csv
```

```js
const response = await fetch(`${base}/v1/verifications`, { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ email, idempotency_key: crypto.randomUUID(), profile: "balanced" }) });
const result = await response.json();
```

```python
import requests, uuid
result = requests.post(f"{base}/v1/verifications", headers={"Authorization": f"Bearer {api_key}"}, json={"email": email, "idempotency_key": str(uuid.uuid4()), "profile": "balanced"}).json()
```

Verify `X-Verifier-Signature` by computing hex HMAC-SHA256 over the exact raw webhook body with `VERIFIER_WEBHOOK_SECRET` and comparing in constant time.

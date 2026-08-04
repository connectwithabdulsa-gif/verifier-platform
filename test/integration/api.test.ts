import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createApiServer } from "../../src/api/app.ts";
import { FixedClock } from "../../src/domain/clock.ts";
import { InMemoryVerificationRepository } from "../../src/domain/repositories.ts";

test("API enforces authentication and validates contract", async (context) => {
  const repository = new InMemoryVerificationRepository();
  const orchestrator = {
    async verify(request: import("../../src/domain/model.ts").VerificationRequest) {
      await repository.create(request);
      const result = {
        verificationId: request.id, state: "complete" as const, input: { address: request.originalAddress },
        policy: { recommendation: "do_not_send" as const, policyVersion: "test", reasons: ["fixture"] }
      };
      await repository.saveResult(result); return result;
    }
  };
  const server = createApiServer({
    orchestrator: orchestrator as never, repository,
    clock: new FixedClock(new Date("2026-08-03T00:00:00Z")),
    authenticate: (token) => token === "secret" ? { tenantId: "tenant" } : undefined
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  context.after(() => server.close());
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing test address");
  const base = `http://127.0.0.1:${address.port}`;

  assert.equal((await fetch(`${base}/v1/verifications`, { method: "POST" })).status, 401);
  const response = await fetch(`${base}/v1/verifications`, {
    method: "POST", headers: { authorization: "Bearer secret", "content-type": "application/json" },
    body: JSON.stringify({ email: "bad", idempotency_key: "one", purpose: "signup_validation" })
  });
  assert.equal(response.status, 200);
  const result = await response.json() as { verificationId: string };
  assert.match(result.verificationId, /^vrf_/);
  const get = await fetch(`${base}/v1/verifications/${result.verificationId}`, { headers: { authorization: "Bearer secret" } });
  assert.equal(get.status, 200);
});

import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryEvidenceLedger } from "../../src/domain/evidence-ledger.ts";
import type { EvidenceEvent } from "../../src/domain/model.ts";

const event: EvidenceEvent = {
  id: "ev_1", verificationId: "v_1", observedAt: "2026-08-03T00:00:00Z",
  sourceClass: "system", sourceIdentity: "test", method: "fixture", methodVersion: "1",
  subjectType: "verification", subjectRef: "v_1", normalizedResult: "ok", details: {},
  quality: 1, scope: {}, schemaVersion: "1.0"
};

test("append is idempotent but immutable", async () => {
  const ledger = new InMemoryEvidenceLedger();
  await ledger.append(event);
  await ledger.append(event);
  assert.equal((await ledger.list("v_1")).length, 1);
  await assert.rejects(() => ledger.append({ ...event, normalizedResult: "changed" }), /immutable evidence conflict/);
});

test("cutoff excludes later evidence", async () => {
  const ledger = new InMemoryEvidenceLedger();
  await ledger.append(event);
  await ledger.append({ ...event, id: "ev_2", observedAt: "2026-08-04T00:00:00Z" });
  assert.equal((await ledger.list("v_1", new Date("2026-08-03T12:00:00Z"))).length, 1);
});

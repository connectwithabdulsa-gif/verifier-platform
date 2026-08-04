import test from "node:test";
import assert from "node:assert/strict";
import { SqliteStore } from "../../src/infrastructure/sqlite-store.ts";
import type { Assessment, EvidenceEvent, VerificationRequest } from "../../src/domain/model.ts";

test("SQLite persists requests, immutable evidence, assessments and results", async () => {
  const store = new SqliteStore(":memory:");
  const request: VerificationRequest = { id:"vrf_1",tenantId:"t1",purpose:"signup_validation",originalAddress:"a@example.com",profile:"balanced",idempotencyKey:"k1",requestedAt:"2026-01-01T00:00:00.000Z" };
  assert.equal((await store.create(request)).created, true);
  assert.equal((await store.create({ ...request, id:"vrf_2" })).request.id, "vrf_1");
  const evidence: EvidenceEvent = { id:"evd_1",verificationId:"vrf_1",observedAt:request.requestedAt,sourceClass:"protocol",sourceIdentity:"test",method:"test",methodVersion:"1",subjectType:"address",subjectRef:"a@example.com",normalizedResult:"syntax_valid",details:{},quality:1,scope:{},schemaVersion:"1.0" };
  await store.append(evidence); await store.append(evidence);
  await assert.rejects(store.append({ ...evidence, quality:0.5 }), /immutable evidence conflict/);
  const assessment: Assessment = { id:"asm_1",verificationId:"vrf_1",deliverability:{status:"valid",confidence:.9},properties:{role:{value:false,confidence:.5,derivedFrom:[]},disposable:{value:false,confidence:.5,derivedFrom:[]},freeConsumer:{value:false,confidence:.5,derivedFrom:[]},acceptAll:{value:0,confidence:.5,derivedFrom:[]},mxOperator:{value:"generic",confidence:.5,derivedFrom:[]},smtpUtf8Required:false},risk:{target:"hard_bounce_within_7_days",score:.1,level:"low",modelVersion:"1",calibration:"provisional"},reasons:[],evidenceIds:["evd_1"],computedAt:request.requestedAt,evidenceCutoffAt:request.requestedAt,recommendedReverifyAt:"2026-01-02T00:00:00.000Z",expiresAt:"2026-01-03T00:00:00.000Z",specificationVersion:"1.0.0",rulesetVersion:"1",modelVersion:"1" };
  await store.append(assessment);
  assert.deepEqual((await store.latest("vrf_1"))?.evidenceIds, ["evd_1"]);
  store.close();
});

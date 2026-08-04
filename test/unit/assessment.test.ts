import test from "node:test";
import assert from "node:assert/strict";
import { AssessmentEngine, PolicyEngine } from "../../src/classification/assessment.ts";
import { FixedClock } from "../../src/domain/clock.ts";
import type { EvidenceEvent } from "../../src/domain/model.ts";

const clock = new FixedClock(new Date("2026-08-03T00:00:00Z"));
const event = (result: string): EvidenceEvent => ({
  id: `ev_${result}`, verificationId: "v", observedAt: clock.now().toISOString(),
  sourceClass: "protocol", sourceIdentity: "fixture", method: "test", methodVersion: "1",
  subjectType: "address", subjectRef: "user@example.com", normalizedResult: result,
  details: {}, quality: 1, scope: {}, schemaVersion: "1.0"
});

test("classifies recipient-specific absence invalid", () => {
  const result = new AssessmentEngine(clock).assess("v", "user@example.com", [event("recipient_not_found")], false);
  assert.equal(result.deliverability.status, "invalid");
  assert.equal(new PolicyEngine().evaluate(result).recommendation, "do_not_send");
});

test("ambiguous permanent failure remains unknown", () => {
  const result = new AssessmentEngine(clock).assess("v", "user@example.com", [event("ambiguous_permanent")], false);
  assert.equal(result.deliverability.status, "unknown");
});

test("role and deliverability are orthogonal", () => {
  const result = new AssessmentEngine(clock).assess("v", "support@example.com", [event("recipient_accepted")], false);
  assert.equal(result.deliverability.status, "valid");
  assert.equal(result.properties.role.value, true);
});

test("restriction overrides assessment policy", () => {
  const result = new AssessmentEngine(clock).assess("v", "user@example.com", [event("recipient_accepted")], false);
  assert.equal(new PolicyEngine().evaluate(result, { restricted: true }).recommendation, "restricted");
});

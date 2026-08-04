import test from "node:test";
import assert from "node:assert/strict";
import { CatchAllEvaluator } from "../../src/verification/catch-all.ts";
import { providerFromMx } from "../../src/verification/provider-adapters.ts";

test("catch-all uses a random non-dictionary control and compares both probes", () => {
  const evaluator = new CatchAllEvaluator();
  const a = evaluator.control("example.com"), b = evaluator.control("example.com");
  assert.match(a, /^vfy-[0-9a-f]{30}@example\.com$/); assert.notEqual(a, b);
  assert.equal(evaluator.evaluate("v1", {recipient:"real@example.com",normalizedResult:"recipient_accepted"},{recipient:a,normalizedResult:"recipient_accepted"}).normalizedResult,"catch_all_detected");
});

test("MX provider fingerprints are distinct", () => {
  assert.equal(providerFromMx("x.protection.outlook.com"), "microsoft");
  assert.equal(providerFromMx("mx1.messagingengine.com"), "fastmail");
  assert.equal(providerFromMx("mail.protonmail.ch"), "proton");
});

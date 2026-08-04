import test from "node:test";
import assert from "node:assert/strict";
import { validateManifest } from "../../src/experiments/manifest.ts";

const manifest = {
  schemaVersion: "1.0", id: "exp", title: "title", hypothesis: "hypothesis",
  authorization: { owner: "company", basis: "company_owned", expiresAt: "2027-01-01T00:00:00Z" },
  limits: { maxCases: 2, maxConcurrency: 1, maxPerDomain: 1 },
  cases: [{ id: "one", provider: "google", addressEnv: "EXPERIMENT_ADDRESS_ONE", tags: [] }]
};

test("accepts a bounded authorized manifest", () => {
  assert.equal(validateManifest(manifest, new Date("2026-08-03T00:00:00Z")).id, "exp");
});

test("rejects expired authorization", () => {
  assert.throws(() => validateManifest({ ...manifest, authorization: { ...manifest.authorization, expiresAt: "2025-01-01T00:00:00Z" } }, new Date("2026-08-03T00:00:00Z")), /expired/);
});

test("rejects unsafe concurrency", () => {
  assert.throws(() => validateManifest({ ...manifest, limits: { ...manifest.limits, maxConcurrency: 50 } }), /safe bounds/);
});

test("requires addresses through approved environment variables", () => {
  assert.throws(() => validateManifest({ ...manifest, cases: [{ ...manifest.cases[0], addressEnv: "RAW_EMAIL" }] }), /environment/);
});

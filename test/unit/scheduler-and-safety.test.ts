import test from "node:test";
import assert from "node:assert/strict";
import { HierarchicalScheduler } from "../../src/infrastructure/scheduler.ts";
import { isPublicAddress } from "../../src/verification/network-safety.ts";

const dimensions = { global: "global", provider: "p", mx: "mx", domain: "d", tenant: "t", source: "s" } as const;

test("scheduler enforces hierarchy and releases idempotently", () => {
  const scheduler = new HierarchicalScheduler({ domain: 1 });
  const first = scheduler.acquire(dimensions);
  assert.ok(first);
  assert.equal(scheduler.acquire(dimensions), undefined);
  first.release(); first.release();
  assert.ok(scheduler.acquire(dimensions));
});

test("scheduler honors explicit cooldown", () => {
  const scheduler = new HierarchicalScheduler();
  scheduler.cooldown("mx", "mx", Date.now() + 10_000);
  assert.equal(scheduler.acquire(dimensions), undefined);
});

test("network safety rejects private and reserved destinations", () => {
  for (const address of ["127.0.0.1", "10.0.0.1", "192.168.1.1", "169.254.1.1", "::1", "fc00::1", "2001:db8::1"]) {
    assert.equal(isPublicAddress(address), false, address);
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

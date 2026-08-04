import test from "node:test";
import assert from "node:assert/strict";
import { DnsVerifier, type DnsClient } from "../../src/verification/dns.ts";
import { FixedClock } from "../../src/domain/clock.ts";

const error = (code: string): Error & { code: string } => Object.assign(new Error(code), { code });
const client = (overrides: Partial<DnsClient>): DnsClient => ({
  resolveMx: async () => [], resolve4: async () => [], resolve6: async () => [], ...overrides
});
const clock = new FixedClock(new Date("2026-08-03T00:00:00Z"));

test("recognizes Null MX", async () => {
  const result = await new DnsVerifier(client({ resolveMx: async () => [{ exchange: ".", priority: 0 }] }), clock).resolve("v", "example.com");
  assert.equal(result.outcome, "null_mx");
  assert.equal(result.transient, false);
});

test("sorts MX by priority", async () => {
  const result = await new DnsVerifier(client({ resolveMx: async () => [
    { exchange: "b.example", priority: 20 }, { exchange: "a.example", priority: 10 }
  ] }), clock).resolve("v", "example.com");
  assert.equal(result.outcome, "mx");
  assert.deepEqual(result.mx.map((m) => m.exchange), ["a.example", "b.example"]);
});

test("uses implicit MX fallback when address records exist", async () => {
  const result = await new DnsVerifier(client({
    resolveMx: async () => { throw error("ENODATA"); },
    resolve4: async () => [{ address: "203.0.113.10", ttl: 300 }]
  }), clock).resolve("v", "example.com");
  assert.equal(result.outcome, "implicit_mx");
});

test("does not convert SERVFAIL into invalid", async () => {
  const result = await new DnsVerifier(client({ resolveMx: async () => { throw error("ESERVFAIL"); } }), clock).resolve("v", "example.com");
  assert.equal(result.outcome, "servfail");
  assert.equal(result.transient, true);
});

test("reports NXDOMAIN after failed MX and address lookup", async () => {
  const result = await new DnsVerifier(client({
    resolveMx: async () => { throw error("ENOTFOUND"); },
    resolve4: async () => { throw error("ENOTFOUND"); },
    resolve6: async () => { throw error("ENOTFOUND"); }
  }), clock).resolve("v", "missing.example");
  assert.equal(result.outcome, "nxdomain");
});

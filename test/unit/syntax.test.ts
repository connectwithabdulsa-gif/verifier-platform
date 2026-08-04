import test from "node:test";
import assert from "node:assert/strict";
import { AddressParser } from "../../src/verification/syntax.ts";
import { FixedClock } from "../../src/domain/clock.ts";

const parser = new AddressParser(new FixedClock(new Date("2026-08-03T00:00:00Z")));

test("normalizes only the domain", () => {
  const result = parser.parse("v1", "User.Name@EXAMPLE.COM");
  assert.equal(result.valid, true);
  assert.equal(result.normalized, "User.Name@example.com");
  assert.equal(result.evidence.normalizedResult, "syntax_valid");
});

test("rejects malformed and consecutive-dot local parts", () => {
  assert.equal(parser.parse("v1", "missing.example.com").valid, false);
  assert.equal(parser.parse("v2", "a..b@example.com").valid, false);
});

test("detects SMTPUTF8 requirement", () => {
  const result = parser.parse("v1", "δοκιμή@example.com");
  assert.equal(result.valid, true);
  assert.equal(result.smtpUtf8Required, true);
});

test("converts an internationalized domain to ASCII", () => {
  const result = parser.parse("v1", "user@bücher.example");
  assert.equal(result.valid, true);
  assert.equal(result.normalized, "user@xn--bcher-kva.example");
});

test("marks quoted local parts unsupported rather than invalid", () => {
  const result = parser.parse("v1", '"user name"@example.com');
  assert.equal(result.valid, true);
  assert.equal(result.supported, false);
});

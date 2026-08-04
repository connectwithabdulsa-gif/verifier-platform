import test from "node:test";
import assert from "node:assert/strict";
import { FixedClock } from "../../src/domain/clock.ts";
import { InMemoryEvidenceLedger } from "../../src/domain/evidence-ledger.ts";
import { InMemoryAssessmentRepository, InMemoryVerificationRepository } from "../../src/domain/repositories.ts";
import { AssessmentEngine, PolicyEngine } from "../../src/classification/assessment.ts";
import { HierarchicalScheduler } from "../../src/infrastructure/scheduler.ts";
import { DnsVerifier, type DnsClient } from "../../src/verification/dns.ts";
import { AddressParser } from "../../src/verification/syntax.ts";
import type { SmtpReply, SmtpSession } from "../../src/verification/smtp-session.ts";
import { SmtpObserver } from "../../src/verification/smtp.ts";
import { createVerificationRequest, VerificationOrchestrator } from "../../src/verification/orchestrator.ts";

class FakeSession implements SmtpSession {
  private readonly replies: SmtpReply[];
  constructor(replies: SmtpReply[]) { this.replies = replies; }
  async open(): Promise<SmtpReply> { return this.replies.shift() as SmtpReply; }
  async command(): Promise<SmtpReply> { return this.replies.shift() ?? { code: 221, lines: ["221 bye"] }; }
  close(): void {}
}

const clock = new FixedClock(new Date("2026-08-03T00:00:00Z"));
const dns: DnsClient = {
  resolveMx: async () => [{ exchange: "mx.example.net", priority: 10 }],
  resolve4: async () => [{ address: "8.8.8.8", ttl: 300 }], resolve6: async () => []
};

const build = (session: FakeSession) => {
  const repository = new InMemoryVerificationRepository();
  const ledger = new InMemoryEvidenceLedger();
  const orchestrator = new VerificationOrchestrator({
    greetingIdentity: "verify.example.net", envelopeSender: "probe@verify.example.net",
    sourceIdentity: "test", allowedPurposes: new Set(["signup_validation"])
  }, clock, repository, new InMemoryAssessmentRepository(), ledger, new AddressParser(clock),
  new DnsVerifier(dns, clock), dns, new HierarchicalScheduler(), new SmtpObserver(() => session, clock),
  new AssessmentEngine(clock), new PolicyEngine());
  return { orchestrator, repository, ledger };
};

test("runs end-to-end and returns valid with evidence", async () => {
  const session = new FakeSession([
    { code: 220, lines: ["220 ready"] }, { code: 250, lines: ["250 hello"] },
    { code: 250, lines: ["250 sender"] }, { code: 250, lines: ["250 2.1.5 recipient"] },
    { code: 221, lines: ["221 bye"] }
  ]);
  const { orchestrator, ledger } = build(session);
  const request = createVerificationRequest({ tenantId: "t", purpose: "signup_validation", originalAddress: "User@example.com", profile: "balanced", idempotencyKey: "k" }, clock);
  const result = await orchestrator.verify(request);
  assert.equal(result.assessment?.deliverability.status, "valid");
  assert.equal(result.policy.recommendation, "send");
  assert.ok((await ledger.list(request.id)).length >= 5);
});

test("idempotency returns the existing result", async () => {
  const { orchestrator } = build(new FakeSession([
    { code: 220, lines: ["220 ready"] }, { code: 250, lines: ["250 hello"] },
    { code: 250, lines: ["250 sender"] }, { code: 550, lines: ["550 5.1.1 user unknown"] },
    { code: 221, lines: ["221 bye"] }
  ]));
  const first = createVerificationRequest({ tenantId: "t", purpose: "signup_validation", originalAddress: "bad@example.com", profile: "balanced", idempotencyKey: "same" }, clock);
  const a = await orchestrator.verify(first);
  const second = { ...first, id: "different" };
  const b = await orchestrator.verify(second);
  assert.equal(b.verificationId, a.verificationId);
});

test("unauthorized purpose is restricted without network work", async () => {
  const { orchestrator } = build(new FakeSession([]));
  const request = createVerificationRequest({ tenantId: "t", purpose: "cold_outbound", originalAddress: "x@example.com", profile: "fast", idempotencyKey: "k2" }, clock);
  const result = await orchestrator.verify(request);
  assert.equal(result.state, "restricted");
});

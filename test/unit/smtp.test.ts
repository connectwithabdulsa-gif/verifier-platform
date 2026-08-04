import test from "node:test";
import assert from "node:assert/strict";
import { SmtpObserver, normalizeSmtpReply } from "../../src/verification/smtp.ts";
import type { SmtpReply, SmtpSession } from "../../src/verification/smtp-session.ts";
import { FixedClock } from "../../src/domain/clock.ts";
import { HierarchicalScheduler } from "../../src/infrastructure/scheduler.ts";

class FakeSession implements SmtpSession {
  readonly commands: string[] = [];
  private readonly replies: SmtpReply[];
  constructor(replies: SmtpReply[]) { this.replies = replies; }
  async open(): Promise<SmtpReply> { return this.replies.shift() as SmtpReply; }
  async command(verb: "EHLO" | "HELO" | "MAIL" | "RCPT" | "QUIT", argument?: string): Promise<SmtpReply> {
    this.commands.push(`${verb}${argument ? ` ${argument}` : ""}`);
    return this.replies.shift() ?? { code: 221, lines: ["221 bye"] };
  }
  close(): void {}
}

const dimensions = { global: "global", provider: "generic", mx: "mx.example", domain: "example.com", tenant: "t1", source: "s1" } as const;

test("observer stops after recipient observation", async () => {
  const fake = new FakeSession([
    { code: 220, lines: ["220 mx.example ESMTP"] },
    { code: 250, lines: ["250-mx.example", "250 SMTPUTF8"] },
    { code: 250, lines: ["250 2.1.0 sender ok"] },
    { code: 250, lines: ["250 2.1.5 recipient ok"] },
    { code: 221, lines: ["221 bye"] }
  ]);
  const permit = new HierarchicalScheduler().acquire(dimensions, Date.now());
  assert.ok(permit);
  const result = await new SmtpObserver(() => fake, new FixedClock(new Date("2026-08-03T00:00:00Z"))).observe({
    verificationId: "v", host: "mx.example", recipient: "user@example.com",
    greetingIdentity: "verify.example.net", envelopeSender: "probe@verify.example.net",
    permit, timeoutMs: 1000
  });
  assert.equal(result.reason, "recipient_accepted");
  assert.deepEqual(fake.commands.map((value) => value.split(" ")[0]), ["EHLO", "MAIL", "RCPT", "QUIT"]);
});

test("normalizer distinguishes mailbox absence from policy", () => {
  assert.equal(normalizeSmtpReply("rcpt_to", { code: 550, lines: ["550 5.1.1 User unknown"] }), "recipient_not_found");
  assert.equal(normalizeSmtpReply("rcpt_to", { code: 550, lines: ["550 5.7.1 Policy denied"] }), "recipient_policy_reject");
  assert.equal(normalizeSmtpReply("rcpt_to", { code: 550, lines: ["550 unavailable"] }), "ambiguous_permanent");
});

test("temporary responses remain transient", async () => {
  const fake = new FakeSession([
    { code: 220, lines: ["220 ready"] }, { code: 250, lines: ["250 hello"] },
    { code: 250, lines: ["250 sender"] }, { code: 451, lines: ["451 4.7.1 Greylisted, try again later"] },
    { code: 221, lines: ["221 bye"] }
  ]);
  const permit = new HierarchicalScheduler().acquire(dimensions);
  assert.ok(permit);
  const result = await new SmtpObserver(() => fake, new FixedClock(new Date())).observe({
    verificationId: "v", host: "mx.example", recipient: "user@example.com",
    greetingIdentity: "verify.example.net", envelopeSender: "probe@verify.example.net", permit, timeoutMs: 100
  });
  assert.equal(result.reason, "greylisted");
  assert.equal(result.transient, true);
});

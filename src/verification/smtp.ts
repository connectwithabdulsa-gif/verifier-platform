import type { Clock } from "../domain/clock.ts";
import { newId } from "../domain/ids.ts";
import type { EvidenceEvent } from "../domain/model.ts";
import type { Permit } from "../infrastructure/scheduler.ts";
import type { SmtpReply, SmtpSessionFactory } from "./smtp-session.ts";

export type SmtpReason =
  | "recipient_accepted" | "recipient_not_found" | "recipient_policy_reject"
  | "sender_rejected" | "greylisted" | "rate_limited" | "temporary_system"
  | "ambiguous_permanent" | "connection_failed" | "timeout" | "protocol_error";

export interface SmtpObservation {
  readonly reason: SmtpReason;
  readonly accepted: boolean;
  readonly transient: boolean;
  readonly evidence: readonly EvidenceEvent[];
  readonly defensiveSignal: boolean;
}

const enhanced = (reply: SmtpReply): string | undefined => {
  const text = reply.lines.join(" ");
  return /\b([245]\.\d{1,3}\.\d{1,3})\b/.exec(text)?.[1];
};

export const normalizeSmtpReply = (stage: string, reply: SmtpReply): SmtpReason => {
  const status = enhanced(reply);
  const text = reply.lines.join(" ").toLowerCase();
  if (reply.code >= 200 && reply.code < 300 && stage === "rcpt_to") return "recipient_accepted";
  if (reply.code >= 400 && reply.code < 500) {
    if (text.includes("greylist") || text.includes("try again later")) return "greylisted";
    if (status?.startsWith("4.7") || text.includes("rate") || text.includes("too many")) return "rate_limited";
    return "temporary_system";
  }
  if (stage === "mail_from" && reply.code >= 500) return "sender_rejected";
  if (stage === "rcpt_to" && reply.code >= 500) {
    if (["5.1.1", "5.1.10"].includes(status ?? "") || /user unknown|recipient not found|mailbox.*not found/.test(text)) return "recipient_not_found";
    if (status?.startsWith("5.7") || /policy|not authorized|access denied/.test(text)) return "recipient_policy_reject";
    return "ambiguous_permanent";
  }
  return "protocol_error";
};

export class SmtpObserver {
  private readonly sessions: SmtpSessionFactory;
  private readonly clock: Clock;
  constructor(sessions: SmtpSessionFactory, clock: Clock) { this.sessions = sessions; this.clock = clock; }

  async observe(input: {
    verificationId: string; host: string; port?: number; recipient: string;
    greetingIdentity: string; envelopeSender: string; permit: Permit; timeoutMs: number;
  }): Promise<SmtpObservation> {
    const session = this.sessions();
    const evidence: EvidenceEvent[] = [];
    const emit = (stage: "connect" | "greeting" | "ehlo" | "mail_from" | "rcpt_to" | "disconnect", reply: SmtpReply | undefined, result: string): void => {
      evidence.push({
        id: newId("ev"), verificationId: input.verificationId, observedAt: this.clock.now().toISOString(),
        sourceClass: "protocol", sourceIdentity: input.host, method: "smtp_observe", methodVersion: "1.0.0",
        subjectType: "smtp_endpoint", subjectRef: input.host, commandStage: stage,
        normalizedResult: result, details: reply ? { code: reply.code, enhanced: enhanced(reply), lines: reply.lines } : {},
        quality: 0.95, scope: { host: input.host }, schemaVersion: "1.0"
      });
    };
    let defensive = false;
    try {
      const greeting = await session.open(input.host, input.port ?? 25, input.timeoutMs);
      emit("greeting", greeting, "greeting_received");
      if (greeting.code < 200 || greeting.code >= 400) throw new Error("invalid greeting");
      let hello = await session.command("EHLO", input.greetingIdentity);
      if (hello.code >= 500) hello = await session.command("HELO", input.greetingIdentity);
      emit("ehlo", hello, "hello_result");
      const mail = await session.command("MAIL", `FROM:<${input.envelopeSender}>`);
      const mailReason = normalizeSmtpReply("mail_from", mail);
      emit("mail_from", mail, mailReason);
      if (mail.code < 200 || mail.code >= 300) {
        defensive = mailReason === "rate_limited" || mailReason === "recipient_policy_reject";
        return { reason: mailReason, accepted: false, transient: mail.code < 500, evidence, defensiveSignal: defensive };
      }
      const rcpt = await session.command("RCPT", `TO:<${input.recipient}>`);
      const reason = normalizeSmtpReply("rcpt_to", rcpt);
      emit("rcpt_to", rcpt, reason);
      defensive = reason === "rate_limited" || reason === "recipient_policy_reject";
      try { await session.command("QUIT"); } catch { /* disconnect is sufficient */ }
      emit("disconnect", undefined, "session_closed");
      return { reason, accepted: reason === "recipient_accepted", transient: rcpt.code >= 400 && rcpt.code < 500, evidence, defensiveSignal: defensive };
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
      const reason: SmtpReason = code === "ETIMEOUT" ? "timeout" : "connection_failed";
      emit("connect", undefined, reason);
      return { reason, accepted: false, transient: true, evidence, defensiveSignal: false };
    } finally {
      session.close();
      input.permit.release(defensive ? "defensive" : "ok");
    }
  }
}

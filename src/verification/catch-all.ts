import { randomBytes } from "node:crypto";
import type { EvidenceEvent } from "../domain/model.ts";
import { newId } from "../domain/ids.ts";

export interface CatchAllProbeResult { recipient: string; normalizedResult: string; }

/** Generates non-dictionary controls and never requires more than two probes. */
export class CatchAllEvaluator {
  control(domain: string): string {
    return `vfy-${randomBytes(15).toString("hex")}@${domain}`;
  }
  evaluate(verificationId: string, target: CatchAllProbeResult, control: CatchAllProbeResult, observedAt = new Date()): EvidenceEvent {
    const accepts = new Set(["recipient_accepted", "recipient_accepted_with_caveat"]);
    const detected = accepts.has(target.normalizedResult) && accepts.has(control.normalizedResult);
    return {
      id: newId("evd"), verificationId, observedAt: observedAt.toISOString(), sourceClass: "observed_behavior",
      sourceIdentity: "catch-all-evaluator", method: "random_control_comparison", methodVersion: "1.0.0",
      subjectType: "domain", subjectRef: target.recipient.split("@").at(-1) ?? "", normalizedResult: detected ? "catch_all_detected" : "catch_all_not_detected",
      details: { targetResult: target.normalizedResult, controlResult: control.normalizedResult, probes: 2 }, quality: 0.82,
      scope: { provider: "generic" }, schemaVersion: "1.0"
    };
  }
}

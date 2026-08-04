import type { Clock } from "../domain/clock.ts";
import { newId } from "../domain/ids.ts";
import type { AddressProperties, Assessment, Deliverability, EvidenceEvent, PolicyResult } from "../domain/model.ts";

const has = (events: readonly EvidenceEvent[], value: string): EvidenceEvent | undefined =>
  events.find((event) => event.normalizedResult === value);
const ids = (events: readonly EvidenceEvent[]): string[] => events.map((event) => event.id);

const roleTokens = new Set(["admin", "billing", "contact", "help", "info", "jobs", "legal", "marketing", "noreply", "no-reply", "sales", "security", "support"]);
const freeDomains = new Set(["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "aol.com", "proton.me", "protonmail.com", "fastmail.com"]);

export class AssessmentEngine {
  private readonly clock: Clock;
  constructor(clock: Clock) { this.clock = clock; }

  assess(verificationId: string, normalizedAddress: string, events: readonly EvidenceEvent[], smtpUtf8Required: boolean): Assessment {
    const local = normalizedAddress.slice(0, normalizedAddress.lastIndexOf("@")).toLowerCase();
    const domain = normalizedAddress.slice(normalizedAddress.lastIndexOf("@") + 1);
    const reasons: string[] = [];
    let status: Deliverability = "unknown";
    let confidence = 0.35;

    if (has(events, "malformed_address") || has(events, "length_or_domain_invalid") || has(events, "domain_structure_invalid") || has(events, "local_part_invalid")) {
      status = "invalid"; confidence = 0.99; reasons.push("syntax_invalid");
    } else if (has(events, "nxdomain") || has(events, "null_mx")) {
      status = "invalid"; confidence = 0.99; reasons.push(has(events, "null_mx") ? "domain_null_mx" : "domain_not_found");
    } else if (has(events, "recipient_not_found")) {
      status = "invalid"; confidence = 0.96; reasons.push("smtp_recipient_not_found");
    } else if (has(events, "catch_all_detected")) {
      status = "catch_all"; confidence = 0.88; reasons.push("domain_accepts_controls");
    } else if (has(events, "recipient_accepted")) {
      status = "valid"; confidence = 0.90; reasons.push("smtp_recipient_accepted");
    } else {
      const transient = events.find((event) => ["servfail", "timeout", "greylisted", "rate_limited", "temporary_system", "connection_failed", "other_transient"].includes(event.normalizedResult));
      reasons.push(transient ? `transient_${transient.normalizedResult}` : "insufficient_evidence");
    }

    if (events.some((event) => ["recipient_policy_reject", "ambiguous_permanent", "sender_rejected"].includes(event.normalizedResult))) {
      status = "unknown"; confidence = Math.min(confidence, 0.55); reasons.push("smtp_response_ambiguous");
    }

    const propertyEvidence = ids(events);
    const properties: AddressProperties = {
      role: { value: roleTokens.has(local.split("+")[0] as string), confidence: 0.93, derivedFrom: propertyEvidence },
      disposable: { value: false, confidence: 0.3, derivedFrom: [] },
      freeConsumer: { value: freeDomains.has(domain), confidence: 0.99, derivedFrom: propertyEvidence },
      acceptAll: { value: has(events, "catch_all_detected") ? 0.9 : 0.1, confidence: has(events, "catch_all_detected") ? 0.85 : 0.25, derivedFrom: propertyEvidence },
      mxOperator: { value: inferProvider(events), confidence: inferProvider(events) === "unknown" ? 0.2 : 0.85, derivedFrom: propertyEvidence },
      smtpUtf8Required
    };

    let riskScore = status === "invalid" ? 0.995 : status === "catch_all" ? 0.35 : status === "valid" ? 0.01 : 0.5;
    if (properties.disposable.value) riskScore = Math.max(riskScore, 0.2);
    const now = this.clock.now();
    const expiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return {
      id: newId("asmt"), verificationId, deliverability: { status, confidence }, properties,
      risk: { target: "hard_bounce_within_7_days", score: riskScore, level: riskScore < 0.05 ? "low" : riskScore < 0.3 ? "medium" : "high", modelVersion: "risk-rules-0.1.0", calibration: "provisional" },
      reasons: [...new Set(reasons)], evidenceIds: ids(events), computedAt: now.toISOString(),
      evidenceCutoffAt: now.toISOString(), recommendedReverifyAt: expiry.toISOString(), expiresAt: expiry.toISOString(),
      specificationVersion: "1.0.0", rulesetVersion: "deliverability-rules-0.1.0", modelVersion: "confidence-rules-0.1.0"
    };
  }
}

const inferProvider = (events: readonly EvidenceEvent[]): string => {
  const text = JSON.stringify(events).toLowerCase();
  if (text.includes("google") || text.includes("gsmtp")) return "google";
  if (text.includes("outlook") || text.includes("protection.outlook")) return "microsoft";
  if (text.includes("yahoodns") || text.includes("yahoo")) return "yahoo";
  if (text.includes("mimecast")) return "mimecast";
  if (text.includes("pphosted") || text.includes("proofpoint")) return "proofpoint";
  return "unknown";
};

export class PolicyEngine {
  evaluate(assessment: Assessment, options: { restricted?: boolean; policyVersion?: string } = {}): PolicyResult {
    if (options.restricted) return { recommendation: "restricted", policyVersion: options.policyVersion ?? "default-1", reasons: ["platform_restriction"] };
    if (assessment.deliverability.status === "invalid") return { recommendation: "do_not_send", policyVersion: options.policyVersion ?? "default-1", reasons: ["deliverability_invalid"] };
    if (assessment.deliverability.status === "valid" && assessment.risk.score < 0.05) return { recommendation: "send", policyVersion: options.policyVersion ?? "default-1", reasons: ["low_bounce_risk"] };
    return { recommendation: "caution", policyVersion: options.policyVersion ?? "default-1", reasons: ["uncertain_or_elevated_risk"] };
  }
}

import { domainToASCII } from "node:url";
import type { EvidenceEvent } from "../domain/model.ts";
import { newId } from "../domain/ids.ts";
import type { Clock } from "../domain/clock.ts";

export interface SyntaxResult {
  readonly valid: boolean;
  readonly supported: boolean;
  readonly original: string;
  readonly normalized?: string;
  readonly localPart?: string;
  readonly domain?: string;
  readonly smtpUtf8Required: boolean;
  readonly reason: string;
  readonly evidence: EvidenceEvent;
}

const CONTROL = /[\u0000-\u001f\u007f]/u;
const ASCII_ATOM = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~.]+$/u;

export class AddressParser {
  private readonly clock: Clock;
  constructor(clock: Clock) { this.clock = clock; }

  parse(verificationId: string, original: string): SyntaxResult {
    const trimmed = original.trim();
    const at = trimmed.lastIndexOf("@");
    let reason = "syntax_valid";
    let valid = true;
    let supported = true;
    let localPart: string | undefined;
    let domain: string | undefined;
    let normalized: string | undefined;
    let smtpUtf8Required = false;

    if (CONTROL.test(trimmed) || at <= 0 || at !== trimmed.indexOf("@") || at === trimmed.length - 1) {
      valid = false; reason = "malformed_address";
    } else {
      localPart = trimmed.slice(0, at);
      const inputDomain = trimmed.slice(at + 1).replace(/\.$/u, "");
      const asciiDomain = domainToASCII(inputDomain);
      smtpUtf8Required = /[^\x00-\x7f]/u.test(localPart);
      if (!asciiDomain || asciiDomain.length > 255 || localPart.length > 64 || trimmed.length > 320) {
        valid = false; reason = "length_or_domain_invalid";
      } else if (inputDomain.split(".").some((label) => !label || label.length > 63) || !inputDomain.includes(".")) {
        valid = false; reason = "domain_structure_invalid";
      } else if (!smtpUtf8Required && (!ASCII_ATOM.test(localPart) || localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes(".."))) {
        if (localPart.startsWith('"') && localPart.endsWith('"')) {
          supported = false; reason = "quoted_local_part_unsupported";
        } else {
          valid = false; reason = "local_part_invalid";
        }
      } else {
        domain = asciiDomain.toLowerCase();
        normalized = `${localPart}@${domain}`;
      }
    }

    const evidence: EvidenceEvent = {
      id: newId("ev"), verificationId, observedAt: this.clock.now().toISOString(),
      sourceClass: "protocol", sourceIdentity: "address-parser",
      method: "syntax_parse", methodVersion: "1.0.0", subjectType: "address",
      subjectRef: normalized ?? original, commandStage: "input", normalizedResult: reason,
      details: { valid, supported, smtpUtf8Required, trimmed: trimmed !== original },
      quality: 1, scope: { parser: "mvp" }, schemaVersion: "1.0"
    };
    return { valid, supported, original, normalized, localPart, domain, smtpUtf8Required, reason, evidence };
  }
}

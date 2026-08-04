import type { Clock } from "../domain/clock.ts";
import type { EvidenceLedger } from "../domain/evidence-ledger.ts";
import { newId } from "../domain/ids.ts";
import type { VerificationRepository, AssessmentRepository } from "../domain/repositories.ts";
import type { VerificationRequest, VerificationResult } from "../domain/model.ts";
import { AssessmentEngine, PolicyEngine } from "../classification/assessment.ts";
import type { DnsClient } from "./dns.ts";
import { DnsVerifier } from "./dns.ts";
import { AddressParser } from "./syntax.ts";
import { isPublicAddress } from "./network-safety.ts";
import type { Scheduler } from "../infrastructure/scheduler.ts";
import type { SmtpObserver } from "./smtp.ts";
import { providerFromMx } from "./provider-adapters.ts";
import { CatchAllEvaluator } from "./catch-all.ts";

export interface OrchestratorConfig {
  readonly greetingIdentity: string;
  readonly envelopeSender: string;
  readonly sourceIdentity: string;
  readonly allowedPurposes: ReadonlySet<VerificationRequest["purpose"]>;
}

export class VerificationOrchestrator {
  private readonly config: OrchestratorConfig;
  private readonly clock: Clock;
  private readonly repository: VerificationRepository;
  private readonly assessments: AssessmentRepository;
  private readonly ledger: EvidenceLedger;
  private readonly parser: AddressParser;
  private readonly dns: DnsVerifier;
  private readonly dnsClient: DnsClient;
  private readonly scheduler: Scheduler;
  private readonly smtp: SmtpObserver;
  private readonly assessmentEngine: AssessmentEngine;
  private readonly policyEngine: PolicyEngine;
  private readonly catchAll = new CatchAllEvaluator();
  constructor(
    config: OrchestratorConfig, clock: Clock, repository: VerificationRepository,
    assessments: AssessmentRepository, ledger: EvidenceLedger, parser: AddressParser,
    dns: DnsVerifier, dnsClient: DnsClient, scheduler: Scheduler, smtp: SmtpObserver,
    assessmentEngine: AssessmentEngine, policyEngine: PolicyEngine
  ) {
    this.config = config; this.clock = clock; this.repository = repository;
    this.assessments = assessments; this.ledger = ledger; this.parser = parser;
    this.dns = dns; this.dnsClient = dnsClient; this.scheduler = scheduler;
    this.smtp = smtp; this.assessmentEngine = assessmentEngine; this.policyEngine = policyEngine;
  }

  async verify(request: VerificationRequest): Promise<VerificationResult> {
    const persisted = await this.repository.create(request);
    if (!persisted.created) {
      const existing = await this.repository.getResult(persisted.request.id);
      if (existing) return existing;
    }
    if (!this.config.allowedPurposes.has(request.purpose)) {
      const result: VerificationResult = {
        verificationId: request.id, state: "restricted", input: { address: request.originalAddress },
        policy: { recommendation: "restricted", policyVersion: "platform-1", reasons: ["purpose_not_authorized"] }
      };
      await this.repository.saveResult(result); return result;
    }

    const syntax = this.parser.parse(request.id, request.originalAddress);
    await this.ledger.append(syntax.evidence);
    if (!syntax.valid || !syntax.supported || !syntax.normalized || !syntax.domain) {
      return this.finalize(request, syntax.normalized ?? request.originalAddress, syntax.smtpUtf8Required, !syntax.supported ? "pending_refinement" : "complete");
    }

    const dnsResult = await this.dns.resolve(request.id, syntax.domain);
    for (const event of dnsResult.evidence) await this.ledger.append(event);
    if (["nxdomain", "null_mx", "nodata_no_route", "malformed"].includes(dnsResult.outcome) || dnsResult.transient) {
      return this.finalize(request, syntax.normalized, syntax.smtpUtf8Required, dnsResult.transient ? "pending_refinement" : "complete");
    }

    const mxHost = dnsResult.outcome === "mx" ? dnsResult.mx[0]?.exchange : syntax.domain;
    if (!mxHost) return this.finalize(request, syntax.normalized, syntax.smtpUtf8Required, "pending_refinement");
    const addresses = await this.resolvePublicEndpoints(mxHost);
    if (!addresses.length) return this.finalize(request, syntax.normalized, syntax.smtpUtf8Required, "pending_refinement");
    const provider = providerFromMx(mxHost);
    const permit = this.scheduler.acquire({
      global: "global", provider, mx: mxHost, domain: syntax.domain,
      tenant: request.tenantId, source: this.config.sourceIdentity
    });
    if (!permit) return this.finalize(request, syntax.normalized, syntax.smtpUtf8Required, "pending_refinement");

    const observation = await this.smtp.observe({
      verificationId: request.id, host: addresses[0] as string, recipient: syntax.normalized,
      greetingIdentity: this.config.greetingIdentity, envelopeSender: this.config.envelopeSender,
      permit, timeoutMs: request.profile === "fast" ? 2_000 : request.profile === "balanced" ? 6_000 : 10_000
    });
    for (const event of observation.evidence) await this.ledger.append(event);
    if (request.profile === "deep" && observation.accepted && !observation.defensiveSignal) {
      const secondPermit = this.scheduler.acquire({ global:"global", provider, mx:mxHost, domain:syntax.domain, tenant:request.tenantId, source:this.config.sourceIdentity });
      if (secondPermit) {
        const control = this.catchAll.control(syntax.domain);
        const controlObservation = await this.smtp.observe({ verificationId:request.id,host:addresses[0] as string,recipient:control,
          greetingIdentity:this.config.greetingIdentity,envelopeSender:this.config.envelopeSender,permit:secondPermit,timeoutMs:10_000 });
        for (const event of controlObservation.evidence) await this.ledger.append({ ...event, normalizedResult: `control_${event.normalizedResult}`, details: { ...event.details, catchAllControl: true } });
        await this.ledger.append(this.catchAll.evaluate(request.id,{recipient:syntax.normalized,normalizedResult:observation.reason},{recipient:control,normalizedResult:controlObservation.reason},this.clock.now()));
      }
    }
    return this.finalize(request, syntax.normalized, syntax.smtpUtf8Required, observation.transient ? "pending_refinement" : "complete");
  }

  private async resolvePublicEndpoints(host: string): Promise<string[]> {
    const addresses: string[] = [];
    for (const resolver of [() => this.dnsClient.resolve4(host), () => this.dnsClient.resolve6(host)]) {
      try { for (const record of await resolver()) if (isPublicAddress(record.address)) addresses.push(record.address); } catch { /* typed DNS route evidence already retained */ }
    }
    return [...new Set(addresses)];
  }

  private async finalize(request: VerificationRequest, normalized: string, smtpUtf8Required: boolean, state: "complete" | "pending_refinement"): Promise<VerificationResult> {
    const events = await this.ledger.list(request.id, this.clock.now());
    const assessment = this.assessmentEngine.assess(request.id, normalized, events, smtpUtf8Required);
    await this.assessments.append(assessment);
    const result: VerificationResult = {
      verificationId: request.id, state, input: { address: request.originalAddress, normalized },
      assessment, policy: this.policyEngine.evaluate(assessment)
    };
    await this.repository.saveResult(result);
    return result;
  }
}

export const createVerificationRequest = (input: Omit<VerificationRequest, "id" | "requestedAt">, clock: Clock): VerificationRequest => ({
  ...input, id: newId("vrf"), requestedAt: clock.now().toISOString()
});

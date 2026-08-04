import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { ExperimentManifest } from "./manifest.ts";
import type { Clock } from "../domain/clock.ts";
import { createVerificationRequest, type VerificationOrchestrator } from "../verification/orchestrator.ts";

export interface ExperimentObservation {
  readonly experimentId: string;
  readonly caseId: string;
  readonly provider: string;
  readonly observedAt: string;
  readonly dryRun: boolean;
  readonly expected?: string;
  readonly result?: unknown;
}

export class ExperimentRunner {
  private readonly orchestrator: VerificationOrchestrator;
  private readonly clock: Clock;
  constructor(orchestrator: VerificationOrchestrator, clock: Clock) { this.orchestrator = orchestrator; this.clock = clock; }

  async run(manifest: ExperimentManifest, outputPath: string, live = false): Promise<readonly ExperimentObservation[]> {
    if (live && process.env.VERIFIER_EXPERIMENT_LIVE !== "I_ACKNOWLEDGE_AUTHORIZATION") throw new Error("live experiments require explicit runtime acknowledgement");
    const perDomain = new Map<string, number>();
    const observations: ExperimentObservation[] = [];
    for (const item of manifest.cases) {
      const address = process.env[item.addressEnv];
      if (!address) throw new Error(`missing environment value ${item.addressEnv}`);
      const domain = address.slice(address.lastIndexOf("@") + 1).toLowerCase();
      const count = (perDomain.get(domain) ?? 0) + 1;
      if (count > manifest.limits.maxPerDomain) throw new Error(`per-domain limit exceeded: ${domain}`);
      perDomain.set(domain, count);
      const base = { experimentId: manifest.id, caseId: item.id, provider: item.provider, observedAt: this.clock.now().toISOString(), dryRun: !live, expected: item.expected };
      const observation: ExperimentObservation = live ? {
        ...base, result: await this.orchestrator.verify(createVerificationRequest({
          tenantId: `experiment:${manifest.id}`, purpose: "internal_enterprise", originalAddress: address,
          profile: "deep", idempotencyKey: `${manifest.id}:${item.id}`
        }, this.clock))
      } : base;
      observations.push(observation);
    }
    await mkdir(dirname(outputPath), { recursive: true });
    await appendFile(outputPath, observations.map((item) => `${JSON.stringify(item)}\n`).join(""), "utf8");
    return observations;
  }
}

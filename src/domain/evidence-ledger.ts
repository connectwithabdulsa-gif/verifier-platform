import type { EvidenceEvent } from "./model.ts";

export interface EvidenceLedger {
  append(event: EvidenceEvent): Promise<void>;
  list(verificationId: string, cutoff?: Date): Promise<readonly EvidenceEvent[]>;
}

export class InMemoryEvidenceLedger implements EvidenceLedger {
  readonly #events = new Map<string, EvidenceEvent>();

  async append(event: EvidenceEvent): Promise<void> {
    const existing = this.#events.get(event.id);
    if (existing && JSON.stringify(existing) !== JSON.stringify(event)) {
      throw new Error(`immutable evidence conflict: ${event.id}`);
    }
    this.#events.set(event.id, structuredClone(event));
  }

  async list(verificationId: string, cutoff?: Date): Promise<readonly EvidenceEvent[]> {
    return [...this.#events.values()]
      .filter((event) => event.verificationId === verificationId)
      .filter((event) => !cutoff || new Date(event.observedAt) <= cutoff)
      .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
      .map((event) => structuredClone(event));
  }
}

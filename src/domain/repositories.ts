import type { Assessment, VerificationRequest, VerificationResult } from "./model.ts";

export interface VerificationRepository {
  create(request: VerificationRequest): Promise<{ request: VerificationRequest; created: boolean }>;
  get(id: string): Promise<VerificationRequest | undefined>;
  saveResult(result: VerificationResult): Promise<void>;
  getResult(id: string): Promise<VerificationResult | undefined>;
}

export class InMemoryVerificationRepository implements VerificationRepository {
  private readonly requests = new Map<string, VerificationRequest>();
  private readonly idempotency = new Map<string, string>();
  private readonly results = new Map<string, VerificationResult>();

  async create(request: VerificationRequest): Promise<{ request: VerificationRequest; created: boolean }> {
    const key = `${request.tenantId}:${request.idempotencyKey}`;
    const existingId = this.idempotency.get(key);
    if (existingId) return { request: structuredClone(this.requests.get(existingId) as VerificationRequest), created: false };
    this.requests.set(request.id, structuredClone(request));
    this.idempotency.set(key, request.id);
    return { request: structuredClone(request), created: true };
  }
  async get(id: string): Promise<VerificationRequest | undefined> {
    const value = this.requests.get(id); return value && structuredClone(value);
  }
  async saveResult(result: VerificationResult): Promise<void> { this.results.set(result.verificationId, structuredClone(result)); }
  async getResult(id: string): Promise<VerificationResult | undefined> {
    const value = this.results.get(id); return value && structuredClone(value);
  }
}

export interface AssessmentRepository {
  append(assessment: Assessment): Promise<void>;
  latest(verificationId: string): Promise<Assessment | undefined>;
}

export class InMemoryAssessmentRepository implements AssessmentRepository {
  private readonly items = new Map<string, Assessment[]>();
  async append(assessment: Assessment): Promise<void> {
    const list = this.items.get(assessment.verificationId) ?? [];
    if (!list.some((item) => item.id === assessment.id)) list.push(structuredClone(assessment));
    this.items.set(assessment.verificationId, list);
  }
  async latest(verificationId: string): Promise<Assessment | undefined> {
    return structuredClone(this.items.get(verificationId)?.at(-1));
  }
}

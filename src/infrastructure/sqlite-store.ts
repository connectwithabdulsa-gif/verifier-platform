import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Assessment, EvidenceEvent, VerificationRequest, VerificationResult } from "../domain/model.ts";
import type { EvidenceLedger } from "../domain/evidence-ledger.ts";
import type { AssessmentRepository, VerificationRepository } from "../domain/repositories.ts";

export class SqliteStore implements VerificationRepository, AssessmentRepository, EvidenceLedger {
  private readonly db: DatabaseSync;
  constructor(path: string, migrationPath = new URL("../../db/001_initial.sql", import.meta.url)) {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    this.db.exec(readFileSync(migrationPath, "utf8"));
  }

  async create(request: VerificationRequest): Promise<{ request: VerificationRequest; created: boolean }> {
    const existing = this.db.prepare("SELECT * FROM verification_requests WHERE tenant_id=? AND idempotency_key=?").get(request.tenantId, request.idempotencyKey) as Record<string, unknown> | undefined;
    if (existing) return { request: rowToRequest(existing), created: false };
    this.db.prepare(`INSERT INTO verification_requests
      (id,tenant_id,purpose,original_address,profile,state,idempotency_key,requested_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(request.id, request.tenantId, request.purpose, request.originalAddress, request.profile, "received", request.idempotencyKey, request.requestedAt, request.requestedAt);
    return { request, created: true };
  }

  async get(id: string): Promise<VerificationRequest | undefined> {
    const row = this.db.prepare("SELECT * FROM verification_requests WHERE id=?").get(id) as Record<string, unknown> | undefined;
    return row && rowToRequest(row);
  }

  async saveResult(result: VerificationResult): Promise<void> {
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO verification_results(verification_id,result_json,updated_at) VALUES(?,?,?)
      ON CONFLICT(verification_id) DO UPDATE SET result_json=excluded.result_json,updated_at=excluded.updated_at`).run(result.verificationId, JSON.stringify(result), now);
    this.db.prepare("UPDATE verification_requests SET state=?,normalized_address=?,updated_at=? WHERE id=?")
      .run(result.state, result.input.normalized ?? null, now, result.verificationId);
  }

  async getResult(id: string): Promise<VerificationResult | undefined> {
    const row = this.db.prepare("SELECT result_json FROM verification_results WHERE verification_id=?").get(id) as { result_json: string } | undefined;
    return row && JSON.parse(row.result_json) as VerificationResult;
  }

  async append(value: Assessment | EvidenceEvent): Promise<void> {
    if ("deliverability" in value) return this.appendAssessment(value);
    const existing = this.db.prepare("SELECT * FROM evidence_events WHERE id=?").get(value.id) as Record<string, unknown> | undefined;
    if (existing) {
      const reconstructed = rowToEvidence(existing);
      if (JSON.stringify(reconstructed) !== JSON.stringify(value)) throw new Error(`immutable evidence conflict: ${value.id}`);
      return;
    }
    this.db.prepare(`INSERT INTO evidence_events
      (id,verification_id,observed_at,source_class,source_identity,method,method_version,subject_type,subject_ref,command_stage,normalized_result,details_json,quality,scope_json,expires_at,schema_version)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      value.id,value.verificationId,value.observedAt,value.sourceClass,value.sourceIdentity,value.method,value.methodVersion,
      value.subjectType,value.subjectRef,value.commandStage ?? null,value.normalizedResult,JSON.stringify(value.details),value.quality,
      JSON.stringify(value.scope),value.expiresAt ?? null,value.schemaVersion
    );
  }

  async list(verificationId: string, cutoff?: Date): Promise<readonly EvidenceEvent[]> {
    const rows = cutoff
      ? this.db.prepare("SELECT * FROM evidence_events WHERE verification_id=? AND observed_at<=? ORDER BY observed_at,id").all(verificationId, cutoff.toISOString())
      : this.db.prepare("SELECT * FROM evidence_events WHERE verification_id=? ORDER BY observed_at,id").all(verificationId);
    return (rows as Record<string, unknown>[]).map(rowToEvidence);
  }

  private appendAssessment(value: Assessment): void {
    const existing = this.db.prepare("SELECT id FROM assessments WHERE id=?").get(value.id);
    if (existing) return;
    this.db.prepare(`INSERT INTO assessments
      (id,verification_id,evidence_cutoff_at,deliverability,confidence,properties_json,risk_json,reasons_json,evidence_ids_json,specification_version,ruleset_version,model_version,computed_at,recommended_reverify_at,expires_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      value.id,value.verificationId,value.evidenceCutoffAt,value.deliverability.status,value.deliverability.confidence,
      JSON.stringify(value.properties),JSON.stringify(value.risk),JSON.stringify(value.reasons),JSON.stringify(value.evidenceIds),value.specificationVersion,
      value.rulesetVersion,value.modelVersion,value.computedAt,value.recommendedReverifyAt,value.expiresAt
    );
  }

  async latest(verificationId: string): Promise<Assessment | undefined> {
    const row = this.db.prepare("SELECT * FROM assessments WHERE verification_id=? ORDER BY computed_at DESC LIMIT 1").get(verificationId) as Record<string, unknown> | undefined;
    if (!row) return undefined;
    return {
      id: String(row.id), verificationId, deliverability: { status: String(row.deliverability) as Assessment["deliverability"]["status"], confidence: Number(row.confidence) },
      properties: JSON.parse(String(row.properties_json)), risk: JSON.parse(String(row.risk_json)), reasons: JSON.parse(String(row.reasons_json)),
      evidenceIds: JSON.parse(String(row.evidence_ids_json)), computedAt: String(row.computed_at), evidenceCutoffAt: String(row.evidence_cutoff_at),
      recommendedReverifyAt: String(row.recommended_reverify_at), expiresAt: String(row.expires_at), specificationVersion: "1.0.0",
      rulesetVersion: String(row.ruleset_version), modelVersion: String(row.model_version)
    };
  }

  close(): void { this.db.close(); }
}

const rowToRequest = (row: Record<string, unknown>): VerificationRequest => ({
  id: String(row.id), tenantId: String(row.tenant_id), purpose: String(row.purpose) as VerificationRequest["purpose"],
  originalAddress: String(row.original_address), profile: String(row.profile) as VerificationRequest["profile"],
  idempotencyKey: String(row.idempotency_key), requestedAt: String(row.requested_at)
});

const rowToEvidence = (row: Record<string, unknown>): EvidenceEvent => ({
  id:String(row.id),verificationId:String(row.verification_id),observedAt:String(row.observed_at),
  sourceClass:String(row.source_class) as EvidenceEvent["sourceClass"],sourceIdentity:String(row.source_identity),
  method:String(row.method),methodVersion:String(row.method_version),subjectType:String(row.subject_type) as EvidenceEvent["subjectType"],
  subjectRef:String(row.subject_ref),commandStage:row.command_stage ? String(row.command_stage) as EvidenceEvent["commandStage"] : undefined,
  normalizedResult:String(row.normalized_result),details:JSON.parse(String(row.details_json)),quality:Number(row.quality),
  scope:JSON.parse(String(row.scope_json)),expiresAt:row.expires_at ? String(row.expires_at) : undefined,schemaVersion:"1.0"
});

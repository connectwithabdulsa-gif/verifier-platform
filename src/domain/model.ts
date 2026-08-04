export type VerificationProfile = "fast" | "balanced" | "deep";
export type WorkflowState =
  | "received" | "restricted" | "syntax_invalid" | "dns_pending"
  | "domain_invalid" | "routable" | "smtp_pending"
  | "assessment_ready" | "pending_refinement" | "complete";

export type Deliverability = "valid" | "invalid" | "catch_all" | "unknown";
export type PolicyRecommendation = "send" | "caution" | "do_not_send" | "restricted";

export type EvidenceSourceClass =
  | "protocol" | "provider_observation" | "historical_intelligence"
  | "customer_feedback" | "heuristic" | "system";

export type CommandStage =
  | "input" | "dns" | "connect" | "greeting" | "ehlo"
  | "mail_from" | "rcpt_to" | "disconnect" | "classification";

export interface EvidenceEvent {
  readonly id: string;
  readonly verificationId: string;
  readonly observedAt: string;
  readonly sourceClass: EvidenceSourceClass;
  readonly sourceIdentity: string;
  readonly method: string;
  readonly methodVersion: string;
  readonly subjectType: "address" | "domain" | "mx" | "smtp_endpoint" | "verification";
  readonly subjectRef: string;
  readonly commandStage?: CommandStage;
  readonly normalizedResult: string;
  readonly details: Readonly<Record<string, unknown>>;
  readonly quality: number;
  readonly scope: Readonly<Record<string, string>>;
  readonly expiresAt?: string;
  readonly schemaVersion: "1.0";
}

export interface VerificationRequest {
  readonly id: string;
  readonly tenantId: string;
  readonly purpose: "signup_validation" | "crm_hygiene" | "authorized_bulk" | "internal_enterprise" | "cold_outbound";
  readonly originalAddress: string;
  readonly profile: VerificationProfile;
  readonly idempotencyKey: string;
  readonly requestedAt: string;
}

export interface AddressProperties {
  readonly role: ProbabilityProperty<boolean>;
  readonly disposable: ProbabilityProperty<boolean>;
  readonly freeConsumer: ProbabilityProperty<boolean>;
  readonly acceptAll: ProbabilityProperty<number>;
  readonly mxOperator: ProbabilityProperty<string>;
  readonly smtpUtf8Required: boolean;
}

export interface ProbabilityProperty<T> {
  readonly value: T;
  readonly confidence: number;
  readonly derivedFrom: readonly string[];
}

export interface RiskAssessment {
  readonly target: "hard_bounce_within_7_days";
  readonly score: number;
  readonly level: "low" | "medium" | "high";
  readonly modelVersion: string;
  readonly calibration: "provisional" | "calibrated";
}

export interface Assessment {
  readonly id: string;
  readonly verificationId: string;
  readonly deliverability: { readonly status: Deliverability; readonly confidence: number };
  readonly properties: AddressProperties;
  readonly risk: RiskAssessment;
  readonly reasons: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly computedAt: string;
  readonly evidenceCutoffAt: string;
  readonly recommendedReverifyAt: string;
  readonly expiresAt: string;
  readonly specificationVersion: "1.0.0";
  readonly rulesetVersion: string;
  readonly modelVersion: string;
}

export interface PolicyResult {
  readonly recommendation: PolicyRecommendation;
  readonly policyVersion: string;
  readonly reasons: readonly string[];
}

export interface VerificationResult {
  readonly verificationId: string;
  readonly state: "complete" | "pending_refinement" | "restricted";
  readonly input: { readonly address: string; readonly normalized?: string };
  readonly assessment?: Assessment;
  readonly policy: PolicyResult;
}

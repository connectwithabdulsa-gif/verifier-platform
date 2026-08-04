export type ExpectedState = "valid" | "invalid" | "catch_all" | "unknown";

export interface ExperimentCase {
  readonly id: string;
  readonly provider: string;
  readonly addressEnv: string;
  readonly expected?: ExpectedState;
  readonly tags: readonly string[];
}

export interface ExperimentManifest {
  readonly schemaVersion: "1.0";
  readonly id: string;
  readonly title: string;
  readonly hypothesis: string;
  readonly authorization: {
    readonly owner: string;
    readonly basis: "company_owned" | "written_partner_authorization";
    readonly expiresAt: string;
  };
  readonly limits: {
    readonly maxCases: number;
    readonly maxConcurrency: number;
    readonly maxPerDomain: number;
  };
  readonly cases: readonly ExperimentCase[];
}

export const validateManifest = (value: unknown, now = new Date()): ExperimentManifest => {
  if (!value || typeof value !== "object") throw new Error("manifest must be an object");
  const m = value as Partial<ExperimentManifest>;
  if (m.schemaVersion !== "1.0" || !m.id || !m.title || !m.hypothesis) throw new Error("manifest identity fields are required");
  if (!m.authorization?.owner || !["company_owned", "written_partner_authorization"].includes(m.authorization.basis ?? "")) throw new Error("explicit authorization is required");
  if (new Date(m.authorization.expiresAt).getTime() <= now.getTime()) throw new Error("authorization is expired");
  if (!m.limits || m.limits.maxCases < 1 || m.limits.maxCases > 100 || m.limits.maxConcurrency < 1 || m.limits.maxConcurrency > 5 || m.limits.maxPerDomain < 1 || m.limits.maxPerDomain > 5) {
    throw new Error("experiment limits exceed safe bounds");
  }
  if (!Array.isArray(m.cases) || !m.cases.length || m.cases.length > m.limits.maxCases) throw new Error("cases violate maxCases");
  const ids = new Set<string>();
  for (const item of m.cases) {
    if (!item.id || !item.provider || !item.addressEnv || ids.has(item.id)) throw new Error("case identity fields must be unique");
    if (!/^EXPERIMENT_ADDRESS_[A-Z0-9_]+$/.test(item.addressEnv)) throw new Error("addresses must be supplied through approved environment variables");
    ids.add(item.id);
  }
  return m as ExperimentManifest;
};

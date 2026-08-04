export type ProviderId = "google" | "microsoft" | "yahoo" | "zoho" | "proton" | "fastmail" | "proofpoint" | "mimecast" | "generic";

const MX_PATTERNS: readonly [ProviderId, RegExp][] = [
  ["google", /(?:aspmx|googlemail|google)\./i], ["microsoft", /(?:protection\.outlook|outlook)\./i],
  ["yahoo", /yahoodns\./i], ["zoho", /zoho\./i], ["proton", /protonmail\./i],
  ["fastmail", /messagingengine\./i], ["proofpoint", /pphosted\./i], ["mimecast", /mimecast\./i]
];
export const providerFromMx = (mx: string): ProviderId => MX_PATTERNS.find(([, pattern]) => pattern.test(mx))?.[0] ?? "generic";

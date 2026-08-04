export interface RetryDecision { retry: boolean; delayMs?: number; reason: string; }
export class RetryPolicy {
  decide(attempt: number, normalizedResult: string): RetryDecision {
    if (!["smtp_temporary_failure","dns_temporary_failure","connection_failure","greylisted"].includes(normalizedResult)) return { retry:false, reason:"terminal_or_non_transient" };
    const schedule=[60_000,300_000,1_800_000];
    return attempt < schedule.length ? { retry:true,delayMs:schedule[attempt],reason:"transient_backoff" } : { retry:false,reason:"retry_budget_exhausted" };
  }
}

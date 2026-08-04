export interface AttemptDimensions {
  readonly global: "global";
  readonly provider: string;
  readonly mx: string;
  readonly domain: string;
  readonly tenant: string;
  readonly source: string;
}

export interface Permit { readonly id: string; readonly expiresAt: number; release(signal?: "ok" | "defensive"): void }

export interface Scheduler {
  acquire(dimensions: AttemptDimensions, now?: number): Permit | undefined;
  cooldown(scope: keyof AttemptDimensions, value: string, until: number): void;
}

export class HierarchicalScheduler implements Scheduler {
  private readonly active = new Map<string, number>();
  private readonly cooldowns = new Map<string, number>();
  private sequence = 0;
  private readonly limits: Readonly<Partial<Record<keyof AttemptDimensions, number>>>;
  constructor(limits: Readonly<Partial<Record<keyof AttemptDimensions, number>>> = {}) { this.limits = limits; }

  acquire(dimensions: AttemptDimensions, now = Date.now()): Permit | undefined {
    const keys = Object.entries(dimensions) as [keyof AttemptDimensions, string][];
    for (const [scope, value] of keys) {
      const key = `${scope}:${value}`;
      if ((this.cooldowns.get(key) ?? 0) > now) return undefined;
      const limit = this.limits[scope] ?? Infinity;
      if ((this.active.get(key) ?? 0) >= limit) return undefined;
    }
    for (const [scope, value] of keys) {
      const key = `${scope}:${value}`;
      this.active.set(key, (this.active.get(key) ?? 0) + 1);
    }
    let released = false;
    const id = `permit_${++this.sequence}`;
    return {
      id, expiresAt: now + 30_000,
      release: (signal = "ok") => {
        if (released) return;
        released = true;
        for (const [scope, value] of keys) {
          const key = `${scope}:${value}`;
          this.active.set(key, Math.max(0, (this.active.get(key) ?? 1) - 1));
          if (signal === "defensive" && ["provider", "mx", "domain", "source"].includes(scope)) {
            this.cooldowns.set(key, Date.now() + 60_000);
          }
        }
      }
    };
  }

  cooldown(scope: keyof AttemptDimensions, value: string, until: number): void {
    this.cooldowns.set(`${scope}:${value}`, until);
  }
}

import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";
import type { Clock } from "../domain/clock.ts";
import { newId } from "../domain/ids.ts";
import type { EvidenceEvent } from "../domain/model.ts";

export type DnsOutcome =
  | "nxdomain" | "null_mx" | "mx" | "implicit_mx"
  | "nodata_no_route" | "servfail" | "timeout" | "refused" | "malformed" | "other_transient";

export interface MxRecord { readonly exchange: string; readonly priority: number }
export interface AddressRecord { readonly address: string; readonly ttl?: number }

export interface DnsClient {
  resolveMx(domain: string): Promise<readonly MxRecord[]>;
  resolve4(domain: string): Promise<readonly AddressRecord[]>;
  resolve6(domain: string): Promise<readonly AddressRecord[]>;
}

export class NodeDnsClient implements DnsClient {
  private readonly resolver: Resolver;
  constructor(servers?: readonly string[]) {
    this.resolver = new Resolver({ timeout: 2_000, tries: 2 });
    if (servers?.length) this.resolver.setServers([...servers]);
  }
  resolveMx(domain: string): Promise<readonly MxRecord[]> { return this.resolver.resolveMx(domain); }
  async resolve4(domain: string): Promise<readonly AddressRecord[]> {
    return this.resolver.resolve4(domain, { ttl: true });
  }
  async resolve6(domain: string): Promise<readonly AddressRecord[]> {
    return this.resolver.resolve6(domain, { ttl: true });
  }
}

export interface DnsResult {
  readonly outcome: DnsOutcome;
  readonly domain: string;
  readonly mx: readonly MxRecord[];
  readonly endpoints: readonly AddressRecord[];
  readonly evidence: readonly EvidenceEvent[];
  readonly transient: boolean;
}

const TRANSIENT_CODES = new Map<string, DnsOutcome>([
  ["ETIMEOUT", "timeout"], ["ESERVFAIL", "servfail"],
  ["EREFUSED", "refused"], ["ECONNREFUSED", "refused"]
]);

const codeOf = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error ? String((error as { code: unknown }).code) : "";

const isNotFound = (error: unknown): boolean => ["ENOTFOUND", "ENODATA"].includes(codeOf(error));

export class DnsVerifier {
  private readonly client: DnsClient;
  private readonly clock: Clock;
  constructor(client: DnsClient, clock: Clock) { this.client = client; this.clock = clock; }

  async resolve(verificationId: string, domain: string): Promise<DnsResult> {
    const evidence: EvidenceEvent[] = [];
    const emit = (result: string, details: Record<string, unknown>, quality = 0.98): void => {
      evidence.push({
        id: newId("ev"), verificationId, observedAt: this.clock.now().toISOString(),
        sourceClass: "protocol", sourceIdentity: "dns-resolver", method: "dns_route",
        methodVersion: "1.0.0", subjectType: "domain", subjectRef: domain,
        commandStage: "dns", normalizedResult: result, details, quality,
        scope: { resolver: "configured" }, schemaVersion: "1.0"
      });
    };

    let mx: readonly MxRecord[];
    try {
      mx = await this.client.resolveMx(domain);
    } catch (error) {
      const code = codeOf(error);
      if (!isNotFound(error)) {
        const outcome = TRANSIENT_CODES.get(code) ?? "other_transient";
        emit(outcome, { code }, 0.85);
        return { outcome, domain, mx: [], endpoints: [], evidence, transient: true };
      }
      mx = [];
      emit(code === "ENOTFOUND" ? "mx_name_not_found" : "mx_nodata", { code });
    }

    if (mx.length === 1 && mx[0]?.priority === 0 && (mx[0].exchange === "." || mx[0].exchange === "")) {
      emit("null_mx", { mx });
      return { outcome: "null_mx", domain, mx, endpoints: [], evidence, transient: false };
    }
    if (mx.some((record) => !record.exchange || record.priority < 0 || record.priority > 65535)) {
      emit("malformed_mx", { mx }, 0.9);
      return { outcome: "malformed", domain, mx, endpoints: [], evidence, transient: false };
    }

    if (mx.length) {
      const ordered = [...mx].sort((a, b) => a.priority - b.priority || a.exchange.localeCompare(b.exchange));
      emit("mx_found", { mx: ordered });
      return { outcome: "mx", domain, mx: ordered, endpoints: [], evidence, transient: false };
    }

    const endpoints: AddressRecord[] = [];
    let sawNxdomain = false;
    let sawTransient: DnsOutcome | undefined;
    for (const family of [4, 6] as const) {
      try {
        const values = family === 4 ? await this.client.resolve4(domain) : await this.client.resolve6(domain);
        endpoints.push(...values.filter((value) => isIP(value.address) === family));
      } catch (error) {
        const code = codeOf(error);
        if (code === "ENOTFOUND") sawNxdomain = true;
        else if (!isNotFound(error)) sawTransient = TRANSIENT_CODES.get(code) ?? "other_transient";
      }
    }
    if (endpoints.length) {
      emit("implicit_mx", { endpoints });
      return { outcome: "implicit_mx", domain, mx: [], endpoints, evidence, transient: false };
    }
    if (sawTransient) {
      emit(sawTransient, {}, 0.8);
      return { outcome: sawTransient, domain, mx: [], endpoints: [], evidence, transient: true };
    }
    const outcome: DnsOutcome = sawNxdomain ? "nxdomain" : "nodata_no_route";
    emit(outcome, {});
    return { outcome, domain, mx: [], endpoints: [], evidence, transient: false };
  }
}

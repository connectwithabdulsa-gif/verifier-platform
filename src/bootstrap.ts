import { SystemClock } from "./domain/clock.ts";
import { InMemoryEvidenceLedger } from "./domain/evidence-ledger.ts";
import { InMemoryAssessmentRepository, InMemoryVerificationRepository } from "./domain/repositories.ts";
import { AssessmentEngine, PolicyEngine } from "./classification/assessment.ts";
import { HierarchicalScheduler } from "./infrastructure/scheduler.ts";
import { NodeDnsClient, DnsVerifier } from "./verification/dns.ts";
import { AddressParser } from "./verification/syntax.ts";
import { NodeSmtpSession } from "./verification/smtp-session.ts";
import { SmtpObserver } from "./verification/smtp.ts";
import { VerificationOrchestrator } from "./verification/orchestrator.ts";
import { SqliteStore } from "./infrastructure/sqlite-store.ts";
import { SqliteBulkRepository } from "./bulk/sqlite-bulk-repository.ts";
import { BulkService } from "./bulk/service.ts";
import { HttpWebhookDispatcher } from "./webhooks/dispatcher.ts";
import { ApiRateLimiter } from "./infrastructure/api-rate-limiter.ts";
import { InMemoryMetrics } from "./infrastructure/metrics.ts";
import { ProductStore } from "./product/store.ts";
import { BillingService } from "./billing/service.ts";

export const createRuntime = () => {
  const clock = new SystemClock();
  const durable = process.env.VERIFIER_SQLITE_PATH ? new SqliteStore(process.env.VERIFIER_SQLITE_PATH) : undefined;
  const repository = durable ?? new InMemoryVerificationRepository();
  const assessments = durable ?? new InMemoryAssessmentRepository();
  const ledger = durable ?? new InMemoryEvidenceLedger();
  const dnsClient = new NodeDnsClient();
  const scheduler = new HierarchicalScheduler({ global: 100, provider: 20, mx: 5, domain: 2, tenant: 20, source: 50 });
  const smtp = new SmtpObserver(() => new NodeSmtpSession(), clock);
  const orchestrator = new VerificationOrchestrator({
    greetingIdentity: process.env.VERIFIER_GREETING_IDENTITY ?? "verify.invalid",
    envelopeSender: process.env.VERIFIER_ENVELOPE_SENDER ?? "probe@verify.invalid",
    sourceIdentity: process.env.VERIFIER_SOURCE_IDENTITY ?? "local",
    allowedPurposes: new Set(["signup_validation", "crm_hygiene", "authorized_bulk", "internal_enterprise"])
  }, clock, repository, assessments, ledger, new AddressParser(clock), new DnsVerifier(dnsClient, clock), dnsClient,
  scheduler, smtp, new AssessmentEngine(clock), new PolicyEngine());
  const bulkRepository=process.env.VERIFIER_SQLITE_PATH?new SqliteBulkRepository(process.env.VERIFIER_SQLITE_PATH):undefined;
  const webhooks=process.env.VERIFIER_WEBHOOK_SECRET?new HttpWebhookDispatcher(process.env.VERIFIER_WEBHOOK_SECRET):undefined;
  const bulk=bulkRepository?new BulkService(bulkRepository,orchestrator,clock,webhooks):undefined;
  const product=process.env.VERIFIER_SQLITE_PATH?new ProductStore(process.env.VERIFIER_SQLITE_PATH):undefined;
  if(product){const tenantId=process.env.VERIFIER_BOOTSTRAP_TENANT_ID??"beta-default";product.ensureTenant({id:tenantId,name:process.env.VERIFIER_BOOTSTRAP_TENANT_NAME??"Beta Tenant",monthlyQuota:Number(process.env.VERIFIER_MONTHLY_QUOTA??10_000)});if(process.env.VERIFIER_API_KEY)product.importKey(tenantId,"bootstrap",process.env.VERIFIER_API_KEY,["verify:read","verify:write","bulk:read","bulk:write","account:read","keys:write"]);}
  const billing=product&&process.env.VERIFIER_BILLING_WEBHOOK_SECRET?new BillingService(product,process.env.VERIFIER_BILLING_WEBHOOK_SECRET):undefined;
  return { clock, repository, assessments, ledger, dnsClient, scheduler, smtp, orchestrator, durable, bulkRepository, bulk, product, billing, rateLimiter:new ApiRateLimiter(), metrics:new InMemoryMetrics() };
};

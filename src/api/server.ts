import { createApiServer } from "./app.ts";
import { createRuntime } from "../bootstrap.ts";

const { clock, repository, orchestrator, bulk, bulkRepository, product, billing, rateLimiter, metrics } = createRuntime();

const apiKey = process.env.VERIFIER_API_KEY;
if (!apiKey) throw new Error("VERIFIER_API_KEY is required");
const server = createApiServer({
  orchestrator, repository, clock, bulk, bulkRepository, product, billing, rateLimiter, metrics,
  authenticate: (token) => product?.authenticate(token) ?? (token === apiKey ? { tenantId: "development" } : undefined)
});
const port = Number(process.env.PORT ?? 8080);
const host=process.env.HOST??"127.0.0.1";
if(bulk){void bulk.drain();setInterval(()=>void bulk.drain(),30_000).unref();}
server.listen(port,host,()=>process.stdout.write(`verifier API listening on http://${host}:${port}\n`));

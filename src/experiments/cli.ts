import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createRuntime } from "../bootstrap.ts";
import { validateManifest } from "./manifest.ts";
import { ExperimentRunner } from "./runner.ts";

const args = process.argv.slice(2);
const manifestArg = args[args.indexOf("--manifest") + 1];
if (!manifestArg) throw new Error("--manifest is required");
const manifest = validateManifest(JSON.parse(await readFile(resolve(manifestArg), "utf8")));
const runtime = createRuntime();
const output = resolve("work", "experiments", `${manifest.id}.jsonl`);
const results = await new ExperimentRunner(runtime.orchestrator, runtime.clock).run(manifest, output, args.includes("--live"));
process.stdout.write(`${JSON.stringify({ experiment: manifest.id, cases: results.length, live: args.includes("--live"), output })}\n`);

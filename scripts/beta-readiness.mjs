import{access,readFile}from"node:fs/promises";import{constants}from"node:fs";import{dirname}from"node:path";
const failures=[],required=["VERIFIER_API_KEY","VERIFIER_SQLITE_PATH","VERIFIER_GREETING_IDENTITY","VERIFIER_ENVELOPE_SENDER","VERIFIER_WEBHOOK_SECRET"];
if(process.env.BETA_FIXTURE_MODE==="true")failures.push("BETA_FIXTURE_MODE: fixture mode cannot be deployed");
for(const name of required)if(!process.env[name])failures.push(`${name}: missing`);
for(const name of["VERIFIER_GREETING_IDENTITY","VERIFIER_ENVELOPE_SENDER"])if(/\.invalid(?:$|>)/i.test(process.env[name]??""))failures.push(`${name}: placeholder identity is forbidden`);
if((process.env.VERIFIER_API_KEY??"").length<24)failures.push("VERIFIER_API_KEY: must contain at least 24 characters");
if(process.env.VERIFIER_SQLITE_PATH)try{await access(dirname(process.env.VERIFIER_SQLITE_PATH),constants.W_OK);}catch{failures.push("VERIFIER_SQLITE_PATH: parent directory is not writable");}
const gates=JSON.parse(await readFile(new URL("../config/launch-gates.json",import.meta.url),"utf8"));if(gates.release!=="controlled_beta")failures.push("launch gates must remain controlled_beta until measured promotion");
if(failures.length){process.stderr.write(`Beta readiness: FAILED\n${failures.map(v=>`- ${v}`).join("\n")}\n`);process.exit(1);}process.stdout.write(`Beta readiness: PASS\nRelease: ${gates.release}\nRequired providers: ${gates.required_providers.join(", ")}\n`);

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("SMTP command type exposes only approved verbs", async () => {
  const source = await readFile(new URL("../../src/verification/smtp-session.ts", import.meta.url), "utf8");
  const match = /command\(verb:\s*([^,]+)/.exec(source);
  assert.ok(match);
  const commandType = match[1] as string;
  assert.match(commandType, /"EHLO"/);
  assert.match(commandType, /"RCPT"/);
  for (const forbidden of ["D" + "ATA", "V" + "RFY", "E" + "XPN"]) {
    assert.equal(commandType.includes(`"${forbidden}"`), false);
  }
});

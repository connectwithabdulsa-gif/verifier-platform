import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { once } from "node:events";
import { NodeSmtpSession } from "../../src/verification/smtp-session.ts";

test("real TCP session parses multiline replies and sends only the bounded sequence", async (context) => {
  const commands: string[] = [];
  const server = createServer((socket) => {
    socket.write("220 fixture ESMTP\r\n"); let buffer = "";
    socket.on("data", (chunk) => { buffer += chunk.toString(); let i;
      while ((i = buffer.indexOf("\r\n")) >= 0) { const line = buffer.slice(0,i); buffer=buffer.slice(i+2); commands.push(line);
        if (line.startsWith("EHLO")) socket.write("250-fixture\r\n250 SIZE 1000\r\n");
        else if (line.startsWith("MAIL")) socket.write("250 2.1.0 ok\r\n");
        else if (line.startsWith("RCPT")) socket.write("550 5.1.1 no such user\r\n");
        else if (line === "QUIT") socket.end("221 bye\r\n");
      }
    });
  });
  server.listen(0,"127.0.0.1"); await once(server,"listening"); context.after(()=>server.close());
  const address=server.address(); if (!address || typeof address === "string") throw new Error("no address");
  const session=new NodeSmtpSession(); assert.equal((await session.open("127.0.0.1",address.port,1000)).code,220);
  assert.equal((await session.command("EHLO","test.invalid")).lines.length,2);
  await session.command("MAIL","FROM:<probe@test.invalid>"); await session.command("RCPT","TO:<x@example.com>"); await session.command("QUIT"); session.close();
  assert.deepEqual(commands.map(c=>c.split(" ")[0]),["EHLO","MAIL","RCPT","QUIT"]);
});

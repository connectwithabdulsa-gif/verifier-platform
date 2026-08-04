import { createConnection, type Socket } from "node:net";

export interface SmtpReply { readonly code: number; readonly lines: readonly string[] }
export interface SmtpSession {
  open(host: string, port: number, timeoutMs: number): Promise<SmtpReply>;
  command(verb: "EHLO" | "HELO" | "MAIL" | "RCPT" | "QUIT", argument?: string): Promise<SmtpReply>;
  close(): void;
}

export type SmtpSessionFactory = () => SmtpSession;

export class NodeSmtpSession implements SmtpSession {
  private socket?: Socket;
  private buffer = "";
  private lines: string[] = [];
  private waiters: Array<() => void> = [];
  private timeoutMs = 5_000;
  private terminalError?: Error;

  async open(host: string, port: number, timeoutMs: number): Promise<SmtpReply> {
    this.timeoutMs = timeoutMs;
    this.socket = createConnection({ host, port });
    this.socket.setEncoding("utf8");
    this.socket.on("data", (chunk: string) => {
      this.buffer += chunk;
      let index: number;
      while ((index = this.buffer.indexOf("\r\n")) >= 0) {
        this.lines.push(this.buffer.slice(0, index));
        this.buffer = this.buffer.slice(index + 2);
      }
      for (const wake of this.waiters.splice(0)) wake();
    });
    this.socket.on("error", (error) => { this.terminalError = error; for (const wake of this.waiters.splice(0)) wake(); });
    this.socket.on("close", () => { this.terminalError ??= new Error("SMTP connection closed"); for (const wake of this.waiters.splice(0)) wake(); });
    await new Promise<void>((resolve, reject) => {
      this.socket?.once("connect", resolve);
      this.socket?.once("error", reject);
      this.socket?.setTimeout(timeoutMs, () => reject(Object.assign(new Error("SMTP timeout"), { code: "ETIMEOUT" })));
    });
    this.socket.setTimeout(0);
    return this.readReply();
  }

  async command(verb: "EHLO" | "HELO" | "MAIL" | "RCPT" | "QUIT", argument?: string): Promise<SmtpReply> {
    if (!this.socket) throw new Error("SMTP session not open");
    this.socket.write(`${verb}${argument ? ` ${argument}` : ""}\r\n`);
    return this.readReply();
  }

  close(): void { this.socket?.destroy(); this.socket = undefined; }

  private async readReply(): Promise<SmtpReply> {
    const collected: string[] = [];
    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      if (this.terminalError) throw this.terminalError;
      while (this.lines.length) {
        const line = this.lines.shift() as string;
        collected.push(line);
        const match = /^(\d{3})([ -])/.exec(line);
        if (match?.[2] === " ") return { code: Number(match[1]), lines: collected };
      }
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(Object.assign(new Error("SMTP reply timeout"), { code: "ETIMEOUT" })), Math.max(1, deadline - Date.now()));
        this.waiters.push(() => { clearTimeout(timer); resolve(); });
      });
    }
    throw Object.assign(new Error("SMTP reply timeout"), { code: "ETIMEOUT" });
  }
}

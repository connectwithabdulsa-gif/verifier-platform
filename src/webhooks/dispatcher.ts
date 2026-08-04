import { createHmac } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isPublicAddress } from "../verification/network-safety.ts";
export interface WebhookDispatcher { deliver(url:string,event:string,payload:unknown):Promise<void>; }
export class HttpWebhookDispatcher implements WebhookDispatcher {
  private readonly secret:string; constructor(secret:string){this.secret=secret;}
  async deliver(value:string,event:string,payload:unknown):Promise<void>{const url=new URL(value);if(url.protocol!=="https:")throw new Error("webhook URL must use HTTPS");const addresses=await lookup(url.hostname,{all:true});if(!addresses.length||addresses.some(a=>!isPublicAddress(a.address)))throw new Error("webhook resolves to a non-public address");const body=JSON.stringify({event,created_at:new Date().toISOString(),data:payload});const signature=createHmac("sha256",this.secret).update(body).digest("hex");let last:unknown;for(const delay of[0,1000,5000]){if(delay)await new Promise(r=>setTimeout(r,delay));try{const response=await fetch(url,{method:"POST",headers:{"content-type":"application/json","user-agent":"Verifier-Webhook/1.0","x-verifier-signature":`sha256=${signature}`},body,signal:AbortSignal.timeout(10000),redirect:"error"});if(response.ok)return;last=new Error(`webhook HTTP ${response.status}`);}catch(error){last=error;}}throw last;}
}

import type { VerificationProfile, VerificationResult } from "../domain/model.ts";
export type BulkState="queued"|"running"|"complete"|"partial_failure";
export interface BulkJob { id:string;tenantId:string;state:BulkState;profile:VerificationProfile;total:number;completed:number;failed:number;webhookUrl?:string;createdAt:string;updatedAt:string; }
export interface BulkItem { tenantId?:string;jobId:string;ordinal:number;email:string;state:"queued"|"running"|"complete"|"failed";verificationId?:string;result?:VerificationResult;error?:string;attempts:number;availableAt:string; }
export interface BulkRepository {
  create(job:BulkJob,emails:readonly string[]):Promise<BulkJob>; get(id:string,tenantId:string):Promise<BulkJob|undefined>;
  listItems(id:string,tenantId:string):Promise<readonly BulkItem[]>; claim(limit:number,now:string):Promise<readonly BulkItem[]>;
  complete(item:BulkItem,result:VerificationResult):Promise<void>; fail(item:BulkItem,error:string,retryAt?:string):Promise<void>; finalize(jobId:string):Promise<BulkJob>;
}

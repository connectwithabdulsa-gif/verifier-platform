import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
const walk=async(dir)=>{const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(path));else if(entry.name.endsWith(".test.ts"))out.push(path);}return out;};
const child=spawn(process.execPath,["--test",...(await walk("test"))],{stdio:"inherit"});
child.on("exit",code=>process.exit(code??1));

import { readFile } from 'node:fs/promises';
import { createManifest, submit, writeManifest, type Manifest } from '../src/emitter.js';
const path=process.argv[2];
if(!path)throw new Error('structured_input_path_required');
const input=JSON.parse(await readFile(path,'utf8')) as Manifest;
const m=createManifest(input);
await writeManifest('manifest.json',m);
const result=await submit(m,process.env.EVIDENCE_INGEST_URL ?? '',process.env.EVIDENCE_SIGNING_KEY ?? '',process.argv.includes('--dry-run'));
process.stdout.write(JSON.stringify(result)+'\n');

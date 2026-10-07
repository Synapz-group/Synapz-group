import {readFile,readdir} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');
const excluded=new Set(['node_modules','dist','.venv','.tools','test-results','playwright-report','__pycache__','.git']);
const rules=[
  ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['github-token',/\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['cloud-key',/\bAKIA[A-Z0-9]{16}\b/],
  ['api-token',/\bsk-[A-Za-z0-9]{24,}\b/],
  ['private-path',/[A-Z]:[\\/](?:Users|repos)[\\/][A-Za-z0-9_-]+|\/(?:home|Users)\/[A-Za-z0-9_-]+/],
  ['email',/\b[A-Za-z0-9._%+-]+@(?!example\.com\b|127\.0\.0\.1\b|localhost\b)[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/],
  ['literal-credential',/(?:secret|password|token|apiKey|signingKey)\s*[:=]\s*['"][A-Za-z0-9/+_=.-]{32,}['"]/i]
];
// Scanner self-check: adversarial examples are constructed, never embedded credential values.
for(const [name,rule] of rules){const samples={'private-key':['-----BEGIN ','PRIVATE KEY-----'].join(''),'github-token':'ghp_'+'a'.repeat(30),'cloud-key':'AKIA'+'A'.repeat(16),'api-token':'sk-'+'a'.repeat(30),'private-path':['C:',String.fromCharCode(92),'Users',String.fromCharCode(92),'private'].join(''),'email':['private','@','private.example'].join(''),'literal-credential':'secret="'+'a'.repeat(40)+'"'};assert(rule.test(samples[name]),`scanner_self_test_${name}`);}
const findings=[];let files=0;
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(excluded.has(item.name))continue;const path=join(dir,item.name);if(item.isDirectory())await walk(path);else if(item.isFile() && !item.name.endsWith('.png')){const text=await readFile(path,'utf8');files++;for(const [rule,pattern] of rules)if(pattern.test(text))findings.push({file:relative(root,path).replaceAll('\\','/'),rule});if(dir===join(root,'public') && /(?:process\.env|localStorage\.(?:setItem|\w+\s*=)|sessionStorage\.(?:setItem|\w+\s*=)|innerHTML\s*=|eval\(|new Function\(|node:|from ['"]\.\.\/src)/.test(text))findings.push({file:relative(root,path),rule:'client-boundary'});}}}
await walk(root);
process.stdout.write(JSON.stringify({scanner:'synapz-secret-privacy-v1',filesScanned:files,ruleSelfTests:rules.length,findings},null,2)+'\n');
if(findings.length)process.exitCode=1;

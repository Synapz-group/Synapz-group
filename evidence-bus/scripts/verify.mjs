import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
process.chdir(resolve(import.meta.dirname,'..'));
mkdirSync('reports',{recursive:true});
const python=process.env.EVIDENCE_TEST_PYTHON ?? (process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
const result={schemaVersion:'1',generatedAt:new Date().toISOString(),synthetic:true,gates:[],totalTests:0};
function run(name,command,args,inspect){
  const execution=spawnSync(command,args,{encoding:'utf8',timeout:120000,maxBuffer:16*1024*1024});
  let gate={name,status:execution.status===0?'PASS':'FAIL',exitCode:execution.status};
  if(execution.status===0 && inspect){try{gate={...gate,...inspect(execution.stdout,execution.stderr)};}catch{gate.status='FAIL';}}
  result.gates.push(gate);if(gate.tests)result.totalTests+=gate.tests;
  process.stdout.write(`${name}: ${gate.status}${gate.tests?` (${gate.tests} tests)`:''}\n`);
}
const node=(name,args,inspect)=>run(name,process.execPath,args,inspect);
const counts=stdout=>{const tests=Number(stdout.match(/# tests (\d+)/)?.[1]),pass=Number(stdout.match(/# pass (\d+)/)?.[1]),fail=Number(stdout.match(/# fail (\d+)/)?.[1]),skipped=Number(stdout.match(/# skipped (\d+)/)?.[1]);if(!tests || pass!==tests || fail!==0 || skipped!==0)throw new Error('test_summary_invalid');return {tests,passed:pass,failed:fail,skipped};};
node('typecheck',['node_modules/typescript/bin/tsc','--noEmit']);
node('lint',['node_modules/eslint/bin/eslint.js','src','test','scripts','public','examples','playwright.config.ts','eslint.config.js','--max-warnings','0']);
node('production_build',['node_modules/typescript/bin/tsc']);
for(const [name,file] of [['unit_schema_policy_emitter','test/unit.test.ts'],['adversarial_postgres','test/adversarial.test.ts'],['e2e_postgres_http_emitters','test/e2e.test.ts']])node(name,['node_modules/tsx/dist/cli.mjs','--test','--test-reporter=tap',file],counts);
node('browser_e2e_compiled',['node_modules/@playwright/test/cli.js','test','--reporter=json'],stdout=>{const json=JSON.parse(stdout);if(json.stats.unexpected || json.stats.skipped || json.stats.flaky || json.stats.expected!==4)throw new Error('browser_tests_failed');return {tests:json.stats.expected,passed:json.stats.expected,failed:0,skipped:0};});
run('python_emitter',python,['-m','unittest','discover','-s','python','-v'],(stdout,stderr)=>{const tests=Number(stderr.match(/Ran (\d+) tests/)?.[1]);if(!tests || !stderr.includes('OK'))throw new Error('python_tests_failed');return {tests,passed:tests,failed:0,skipped:0};});
node('signed_manifest_projection_reconciliation_proof',['node_modules/tsx/dist/cli.mjs','scripts/demo.ts'],()=>{const proof=JSON.parse(readFileSync('reports/demo-proof.json','utf8'));if(proof.steps.length<14 || !proof.steps.every(s=>s.status==='PASS'))throw new Error('demo_incomplete');return {proofSteps:proof.steps.length};});
const npm=process.env.npm_execpath;
if(npm)node('node_dependency_audit',[npm,'audit','--json'],stdout=>{const audit=JSON.parse(stdout);writeFileSync('reports/node-audit.json',JSON.stringify(audit,null,2)+'\n');if(audit.metadata.vulnerabilities.total!==0)throw new Error('node_vulnerabilities');return {vulnerabilities:0};});
else{result.gates.push({name:'node_dependency_audit',status:'FAIL',reason:'run_via_npm_verify'});}
run('python_dependency_audit',python,['-m','pip_audit','-r','python/requirements.lock','--no-deps','--disable-pip','--cache-dir','.tools/pip-audit-cache','--progress-spinner','off','--timeout','10','--format','json','--output','reports/python-audit.json'],()=>{const audit=JSON.parse(readFileSync('reports/python-audit.json','utf8'));if(audit.dependencies.length!==6 || audit.dependencies.some(d=>d.vulns.length))throw new Error('python_audit_incomplete');return {packages:6,vulnerabilities:0};});
node('secret_privacy_client_scan',['scripts/scan.mjs'],stdout=>{const scan=JSON.parse(stdout);writeFileSync('reports/privacy-scan.json',JSON.stringify(scan,null,2)+'\n');if(scan.findings.length)throw new Error('privacy_findings');return {filesScanned:scan.filesScanned,ruleSelfTests:scan.ruleSelfTests,findings:0};});
const gitleaks=process.platform==='win32' && existsSync('.tools/gitleaks/gitleaks.exe')?resolve('.tools/gitleaks/gitleaks.exe'):'gitleaks';
run('gitleaks_default_rules',gitleaks,['dir','.','--config','.gitleaks.toml','--redact','--no-banner','--report-format','json','--report-path','reports/gitleaks.json'],()=>{if(JSON.parse(readFileSync('reports/gitleaks.json','utf8')).length)throw new Error('secret_findings');return {findings:0};});
result.status=result.gates.every(g=>g.status==='PASS')?'PASS':'FAIL';
writeFileSync('reports/gates.json',JSON.stringify(result,null,2)+'\n');
process.stdout.write(`Verification: ${result.status}; ${result.totalTests} tests; reports/gates.json\n`);
if(result.status!=='PASS')process.exitCode=1;

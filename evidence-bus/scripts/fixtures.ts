import { createHash, randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import type { Manifest } from '../src/model.js';
import { validateManifest } from '../src/validation.js';
import { asset } from '../src/paths.js';
export function fixture(system='prime', when=new Date().toISOString()): Manifest {
  const m: Manifest={schemaVersion:'1.0',eventId:randomUUID(),sourceSystem:system,sourceRepoSafeKey:`${system}-demo`,sourceType:'ci',branch:'demo/evidence',commitSha:'1'.repeat(40),emittedAt:when,
    environment:'local',maturity:'QUALIFIED',result:'pass',title:`Synthetic ${system} engineering evidence`,summary:'Synthetic structured test evidence. No production claim.',
    evidence:[{type:'test_report',artifactKey:`${system}-report`,sha256:createHash('sha256').update(`synthetic-${system}`).digest('hex'),summary:'Synthetic machine-readable test report'}],
    tests:{passed:10,failed:0,skipped:0,subtests:0},build:{status:'pass',artifactKey:`${system}-build`},
    limitations:['Synthetic demo only; no production, mainnet, real funds, custody, KYC or legal approval.'],nextSteps:['Owner to review structured evidence before publication.'],tags:['demo',system],relationships:[],disclosureClass:'partner',autoPublishEligible:true,synthetic:true,
    risk:{regulatory:false,namedParties:false,commercial:false,sensitive:false,realExecution:false},signature:{algorithm:'hmac-sha256',keyId:`${system}-v1`}};
  if(system==='prime' || system==='platform'){
    m.sourceType='supervisor';m.summary='Synthetic supervisor COMPLETE marker; PRIME and Platform commits recorded as separate demo evidence artifacts. Node failure recovery, Solana adapter and Golden Path 2.';
    m.relationships=['prime','platform','solana'];
    for(const key of ['supervisor-complete','prime-commit','platform-commit','node-failure-recovery','solana-adapter','golden-path-2'])m.evidence.push({type:key==='supervisor-complete'?'supervisor_completion':'generated_artifact',artifactKey:key,sha256:createHash('sha256').update(`synthetic-${key}`).digest('hex'),summary:`Synthetic ${key} structured evidence`});
  }
  if(system==='multichain'){
    m.environment='testnet';m.maturity='TESTNET';m.tests={passed:423,failed:0,skipped:0,subtests:75};
    m.summary='Synthetic requests 2–7 finalized on disposable public testnet.';
    m.limitations.push('Request 8 disabled. TESTNET/DEVELOPMENT only; no production or mainnet claim.');
    m.blockchain={network:'testnet',signing:true,broadcast:true,realFunds:false,custody:false,addresses:[]};m.tags.push('solana');
  }
  if(system==='trade-x'){
    m.environment='development';m.maturity='PAPER';m.summary='Synthetic PAPER research active; healthy feed; paper equity only; zero positions and orders.';
    m.runtime={state:'healthy',positions:0,orders:0,paperEquity:100000};m.blockchain={network:'none',signing:false,broadcast:false,realFunds:false,custody:false,addresses:[]};
    m.limitations.push('Funded execution, signer, real orders and live trading disabled.');
  }
  if(system==='rig'){
    m.summary='Synthetic local Solana validator qualification: Token-2022 mint, transfer, burn and supply inspection; local governance, vesting and compliance references.';
    m.blockchain={network:'local',signing:true,broadcast:true,realFunds:false,custody:false,addresses:[]};m.tags.push('solana');
    m.evidence.push({type:'dependency_audit',artifactKey:'rig-production-audit',sha256:'2'.repeat(64),summary:'Synthetic production dependency audit clean'});
    m.limitations.push('Local validator only; no devnet, mainnet, real funds, KYC, custody or legal approval.');
  }
  if(system==='kyro'){
    m.summary='Synthetic media pipeline qualification; generated media artifact available; provider and live jobs disabled.';
    m.tests={passed:36,failed:0,skipped:2,subtests:0};m.deployment={state:'none',providerLive:false,liveJobs:0};
    m.evidence.push({type:'generated_artifact',artifactKey:'kyro-media-demo',sha256:'3'.repeat(64),summary:'Synthetic media artifact'});
    m.limitations.push('Media production is not blockchain evidence. No live provider jobs.');
  }
  validateManifest(m);return m;
}
if(process.argv[1]?.endsWith('fixtures.ts'))for(const system of ['prime','platform','multichain','trade-x','rig','kyro'])await writeFile(asset(`fixtures/${system}.json`),JSON.stringify(fixture(system,'2026-10-07T00:00:00.000Z'),null,2)+'\n');

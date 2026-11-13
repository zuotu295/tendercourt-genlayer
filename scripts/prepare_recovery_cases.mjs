// Prepare isolated case accounts without printing private keys.
import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
import{createClient,createAccount,generatePrivateKey}from'genlayer-js';import{studionet}from'genlayer-js/chains';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PARENT=path.dirname(ROOT);
if(!process.argv.includes('--execute')){console.log('Read-only: prepares separate private test-account checkpoints for winner/refund cases 1–7; --execute enables generation and free testnet funding.');process.exit(0)}
const base=JSON.parse(fs.readFileSync(path.join(PARENT,'.tendercourt-v2.2-checkpoint.json'),'utf8'));
if(base.chain_id!==61999||!base.contract_address)throw Error('DEPLOYMENT_CHECKPOINT_REQUIRED');
const client=createClient({chain:studionet});const tasks=[];
for(const type of['winner','refund'])for(let n=1;n<=7;n++){
 const name=type+'-'+n;if(name==='winner-1')continue;
 const file=path.join(PARENT,'.tendercourt-v2.2-'+name+'.json');
 let cp;try{cp=JSON.parse(fs.readFileSync(file,'utf8'))}catch{cp={contract_address:base.contract_address,deploy_tx:base.deploy_tx,chain_id:61999,source_sha256:base.source_sha256,wallets:{}}}
 const roles=[type==='winner'?'B1':'B2','OUT',...Array.from({length:n},(_,i)=>'S'+(i+1))];if((n===1||n===7)&&!roles.includes('S8'))roles.push('S8');
 for(const k of roles){cp.wallets[k]||=generatePrivateKey();const a=createAccount(cp.wallets[k]);if(k.startsWith('B'))tasks.push(async()=>{const bal=await client.getBalance({address:a.address});if(bal<50000000000000000000n){for(let retry=0;retry<3;retry++){try{await client.request({method:'sim_fundAccount',params:[a.address,100000000000000000000]});break}catch(e){if(!String(e).includes('Rate limit')||retry===2)throw e;console.log('respecting funding rate limit; waiting 60 seconds');await new Promise(r=>setTimeout(r,60000))}}}})}
 fs.writeFileSync(file,JSON.stringify(cp,null,2),{mode:0o600});fs.chmodSync(file,0o600);
}
for(let i=0;i<tasks.length;i+=6){const results=await Promise.allSettled(tasks.slice(i,i+6).map(fn=>fn()));for(const r of results)if(r.status==='rejected')throw r.reason;console.log('funded',Math.min(i+6,tasks.length),'/',tasks.length)}

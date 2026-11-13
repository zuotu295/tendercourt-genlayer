// Read-only independent v2.2 verification. No signer, funding or transactions.
import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{createClient}from'genlayer-js';import{studionet}from'genlayer-js/chains';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const DIR=path.join(ROOT,'evidence','v2.2');
const dep=JSON.parse(fs.readFileSync(path.join(DIR,'deployment.json')));const c=createClient({chain:studionet});
const read=async(fn,args=[])=>c.readContract({address:dep.contract_address,functionName:fn,args,transactionHashVariant:'latest-final'});
const source=fs.readFileSync(path.join(ROOT,'contracts','tendercourt.py'),'utf8');
let pass=0;const checks=[];function check(name,ok){checks.push({name,passed:!!ok});if(!ok)throw Error('FAIL '+name);pass++;console.log('PASS',name)}
function leader(tx){const x=tx.consensus_data?.leader_receipt;return Array.isArray(x)?x.find(r=>r.mode==='leader'):x}
function good(tx){return[7,'FINALIZED'].includes(tx.status)&&[6,'MAJORITY_AGREE'].includes(tx.result)&&leader(tx)?.execution_result==='SUCCESS'}
check('chain-id',await c.getChainId()===61999);check('source-sha',createHash('sha256').update(source).digest('hex')===dep.source_sha256);
check('deployed-byte-parity',await c.getContractCode(dep.contract_address)===source);check('protocol',await read('get_protocol')==='tendercourt-2.2');
check('deployment-finalized-success',good(await c.getTransaction({hash:dep.deploy_tx})));
const manifest=JSON.parse(fs.readFileSync(path.join(DIR,'transactions.json')));
check('matrix-manifest-complete',manifest.complete===true&&manifest.cases?.length===14);
const all=JSON.parse(await read('get_all_tenders'));const matrix=[];const records=[];let withdrawals=0;
for(const outcome of['winner','refund'])for(let n=1;n<=7;n++){
 const key=outcome+'-'+n;const dir=path.join(DIR,'cases',key);
 const ev=JSON.parse(fs.readFileSync(path.join(dir,'transactions.json')));check(key+'-complete',ev.complete===true&&ev.contract_address.toLowerCase()===dep.contract_address.toLowerCase());
 const rb=JSON.parse(fs.readFileSync(path.join(dir,'readback.json')));const b=rb.balances[key];
 const found=all.filter(t=>t.requirements.startsWith('Recovery '+key+':'));check(key+'-unique-tender',found.length===1);
 const t=found[0];const win=outcome==='winner';
 check(key+'-outcome',t.quotes.length===n&&t.status===(win?'AWARDED':'CANCELLED')&&t.winner_quote_id===(win?1:0));
 check(key+'-credit-and-withdraw',BigInt(win?t.winner_credit:t.buyer_credit)===10000000000000000000n&&BigInt(win?t.buyer_credit:t.winner_credit)===0n&&(win?t.winner_withdrawn:t.buyer_withdrawn));
 check(key+'-recipient-delta',BigInt(b.after)-BigInt(b.before)===10000000000000000000n);
 check(key+'-recipient-current-balance',(await c.getBalance({address:b.recipient})).toString()===b.after);
 const request=ev.transactions.find(r=>r.label===key+'-supplier-request'&&r.passed);check(key+'-supplier-initiated',!!request&&request.who==='S'+n);
 check(key+'-independent-judge',ev.transactions.some(r=>r.label===key+'-judge'&&r.who==='OUT'&&r.passed));
 for(const rec of ev.transactions){records.push(rec);if(rec.error)check(rec.label+'-unchanged-state',JSON.stringify(rec.before)===JSON.stringify(rec.after))}
 matrix.push({case:key,tender_id:t.tender_id,quotes:n,status:t.status,winner_quote_id:t.winner_quote_id,recipient:b.recipient,received_wei:(BigInt(b.after)-BigInt(b.before)).toString()});withdrawals++;
}
// Re-read every live receipt in bounded batches. Never trust recorded pass flags alone.
for(let i=0;i<records.length;i+=6){const batch=records.slice(i,i+6);const txs=await Promise.all(batch.map(r=>c.getTransaction({hash:r.hash})));for(let j=0;j<batch.length;j++){
 const r=batch[j],tx=txs[j];
 const match=r.label.match(/^((?:winner|refund)-([1-7]))-/);const caseName=match?.[1];const caseTender=all.find(t=>t.requirements.startsWith('Recovery '+caseName+':'));
 const sender=String(tx.from_address||tx.sender||'').toLowerCase();
 if(r.fn==='request_judgment'&&!r.error)check(r.label+'-actual-supplier-sender',sender===caseTender?.quotes[Number(match[2])-1]?.supplier);
 if(r.fn==='judge'&&!r.disagreement)check(r.label+'-actual-independent-sender',sender!==caseTender?.buyer&&!caseTender?.quotes.some(q=>q.supplier===sender));
 if(r.fn==='judge'&&!r.disagreement)check(r.label+'-multi-validator',tx.leader_only===false&&tx.num_of_initial_validators>=3&&Array.isArray(tx.consensus_data?.validators)&&tx.consensus_data.validators.length>=2&&Object.values(tx.consensus_data.votes||{}).filter(v=>v==='agree').length>=3);if(r.disagreement){check(r.label+'-recorded-disagreement',[7,'FINALIZED'].includes(tx.status)&&[5,'MAJORITY_DISAGREE'].includes(tx.result));continue}
 check(r.label+'-live-receipt',r.error?[7,'FINALIZED'].includes(tx.status)&&[6,'MAJORITY_AGREE'].includes(tx.result)&&leader(tx)?.execution_result==='ERROR'&&leader(tx)?.result?.payload===r.error:good(tx));
}}
check('manifest-record-count',manifest.transactions.length===records.length);
const sum=JSON.parse(await read('get_totals'));check('exact-tender-count',all.length===14&&sum.tender_count===14);check('fourteen-cases',withdrawals===14);check('funds-conserved',BigInt(sum.total_received_wei)===140000000000000000000n&&BigInt(sum.total_withdrawn_wei)===140000000000000000000n&&BigInt(sum.contract_balance_wei)===0n&&BigInt(sum.escrowed_wei)===0n);
const output={network:'Stable Studionet',chain_id:61999,protocol:'tendercourt-2.2',contract_address:dep.contract_address,source_sha256:dep.source_sha256,verified_at:new Date().toISOString(),transactions:records.length,pass,fail:0,matrix,totals:sum,checks};
fs.writeFileSync(path.join(DIR,'readback.json'),JSON.stringify({network:'Stable Studionet',chain_id:61999,protocol:'tendercourt-2.2',contract_address:dep.contract_address,readback_at:output.verified_at,tenders:all,totals:sum,matrix},null,2));
fs.writeFileSync(path.join(DIR,'verification.json'),JSON.stringify(output,null,2));console.log(pass+' PASS, 0 FAIL; '+records.length+' live receipts; 140 GEN in = out');

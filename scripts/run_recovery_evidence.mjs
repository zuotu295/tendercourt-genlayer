// Live supplier recovery matrix. Resumable, preserves all receipts and failures.
// Default is read-only; --execute explicitly enables signed testnet writes.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient,createAccount} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const argv=process.argv.slice(2);
const opt=(name,fallback)=>argv.includes(name)?argv[argv.indexOf(name)+1]:fallback;
const CASE=opt('--case',null);
const CP=path.resolve(opt('--checkpoint',path.resolve(ROOT,'..','.tendercourt-v2.2-checkpoint.json')));
const DIR=path.resolve(opt('--output',path.join(ROOT,'evidence','v2.2')));
fs.mkdirSync(DIR,{recursive:true});
const FILE=path.join(DIR,'transactions.json');
const cp=JSON.parse(fs.readFileSync(CP,'utf8'));
const address=cp.contract_address;
if(!address)throw Error('DEPLOY_FIRST');
const reader=createClient({chain:studionet});
const read=async(fn,args=[])=>reader.readContract({address,functionName:fn,args,transactionHashVariant:'latest-final'});
if(await reader.getChainId()!==61999)throw Error('WRONG_CHAIN');
if(await read('get_protocol')!=='tendercourt-2.2')throw Error('WRONG_PROTOCOL');
const source=fs.readFileSync(path.join(ROOT,'contracts','tendercourt.py'),'utf8');
if(await reader.getContractCode(address)!==source)throw Error('BYTE_PARITY_MISMATCH');
if(!process.argv.includes('--execute')){console.log('READ_ONLY_PREFLIGHT_OK',address);process.exit(0)}
const clients={};const accounts={};
for(const[k,key]of Object.entries(cp.wallets)){accounts[k]=createAccount(key);clients[k]=createClient({chain:studionet,account:accounts[k]})}
if(!/^(winner|refund)-[1-7]$/.test(CASE||''))throw Error('EXPLICIT_CASE_REQUIRED: --case winner-1 through refund-7');
const suite=cp.recovery||(cp.recovery={ids:{},records:[],pending:null});
const FEE=10000000000000000000n;
function save(){fs.writeFileSync(CP,JSON.stringify(cp,null,2),{mode:0o600});fs.chmodSync(CP,0o600);fs.writeFileSync(FILE,JSON.stringify({network:'Stable Studionet',chain_id:61999,protocol:'tendercourt-2.2',contract_address:address,deploy_tx:cp.deploy_tx,complete:false,transactions:suite.records},null,2))}
function leader(tx){const r=tx.consensus_data?.leader_receipt;return Array.isArray(r)?r.find(x=>x.mode==='leader'):r}
function good(tx){return[7,'FINALIZED'].includes(tx.status)&&[6,'MAJORITY_AGREE'].includes(tx.result)&&leader(tx)?.execution_result==='SUCCESS'}
const tender=async id=>JSON.parse(await read('get_tender',[id]));
const totals=async()=>JSON.parse(await read('get_totals'));
async function state(id){return {tender:await tender(id)}}
function equal(a,b,msg){if(JSON.stringify(a)!==JSON.stringify(b))throw Error(msg)}
async function resolve(){
 const p=suite.pending;if(!p)return;
 const tx=await reader.waitForTransactionReceipt({hash:p.hash,status:'FINALIZED',interval:3000,retries:80,fullTransaction:true});
 const receiptFile=`receipts/${p.hash}.json`;fs.mkdirSync(path.join(DIR,'receipts'),{recursive:true});
 fs.writeFileSync(path.join(DIR,receiptFile),JSON.stringify(tx,(_,v)=>typeof v==='bigint'?v.toString():v,2));
 const l=leader(tx);const rec={...p,receipt:receiptFile,status:tx.status,result:tx.result,leader_execution:l?.execution_result,leader_error:l?.result?.payload};
 if(p.error){
   rec.observed_error=l?.result?.payload;
   rec.after=await state(p.args[0]);
   rec.passed=[7,'FINALIZED'].includes(tx.status)&&[6,'MAJORITY_AGREE'].includes(tx.result)&&l?.execution_result==='ERROR'&&rec.observed_error===p.error&&JSON.stringify(p.before)===JSON.stringify(rec.after);
 }else rec.passed=good(tx);
 if([5,'MAJORITY_DISAGREE'].includes(tx.result)&&p.fn==='judge')rec.disagreement=true;
 suite.records.push(rec);suite.pending=null;save();
 console.log(p.label,p.hash,'final=',tx.status,'leader=',l?.execution_result,'pass=',rec.passed);
 if(!rec.passed&&!rec.disagreement)throw Error('UNEXPECTED_RECEIPT '+p.label+' '+JSON.stringify(rec));
 return rec;
}
async function send(label,who,fn,args,value=0n,error=null){
 await resolve();
 let existing=suite.records.find(r=>r.label===label&&r.passed);
 if(existing)return existing;
 for(let attempt=1;attempt<=3;attempt++){
   const before=error?await state(args[0]):undefined;
   const hash=await clients[who].writeContract({address,functionName:fn,args,value,leaderOnly:false});
   suite.pending={label,who,fn,args,value_wei:value.toString(),error,hash,before};save();
   console.log('sent',label,hash);
   const rec=await resolve();if(rec.passed)return rec;
 }
 throw Error('CONSENSUS_DISAGREEMENT_RETRIES_EXHAUSTED '+label);
}
async function create(key,who,req){
 if(suite.ids[key])return suite.ids[key];
 await send(key+'-create',who,'create_tender',[req,'Design',500],FEE);
 const all=JSON.parse(await read('get_all_tenders'));const found=all.filter(t=>t.buyer===accounts[who].address.toLowerCase()&&t.requirements===req);
 if(found.length!==1)throw Error('AMBIGUOUS_TENDER '+key);
 suite.ids[key]=found[0].tender_id;save();return found[0].tender_id;
}
await resolve();
for(const outcome of ['winner','refund'])for(let n=1;n<=7;n++){
 const key=outcome+'-'+n; if(key!==CASE)continue; const buyer=outcome==='winner'?'B1':'B2';
 const req=`Recovery ${key}: Design a complete print-ready A4 poster PDF and editable source, including two revision rounds, delivered within five days.`;
 const id=await create(key,buyer,req);
 for(let q=1;q<=n;q++){
  const terms=outcome==='winner'&&q===1?'Complete print-ready A4 poster PDF plus editable source file, two revision rounds, delivered within five days.':`Offer ${q}: text slogan only; no poster, no PDF, no editable source and no revision rounds.`;
  await send(key+'-quote-'+q,'S'+q,'submit_quote',[id,300+q,terms]);
 }
 if(n===1||n===7){
  await send(key+'-outsider-request','OUT','request_judgment',[id],0n,'ONLY_BUYER_OR_QUOTER_CAN_REQUEST_JUDGMENT');
 }
 await send(key+'-supplier-request','S'+n,'request_judgment',[id]);
 if(!suite.records.some(r=>r.label===key+'-judge'&&r.passed)){
  const frozen=await tender(id);if(frozen.status!=='JUDGING'||frozen.quotes.length!==n)throw Error('PARTIAL_RECOVERY_FAILED '+key);
 }
 if(n===1||n===7){
  await send(key+'-buyer-override',buyer,'award_tender',[id,1],0n,'TENDER_NOT_OPEN');
  await send(key+'-late-quote','S8','submit_quote',[id,300,'Late complete poster offer with source.'],0n,'TENDER_NOT_OPEN');
  await send(key+'-early-withdraw','S1','withdraw',[id],0n,'NO_CREDIT');
 }
 await send(key+'-judge','OUT','judge',[id]);
 const settled=await tender(id);const want=outcome==='winner'?1:0;
 if(settled.winner_quote_id!==want||settled.status!==(want?'AWARDED':'CANCELLED')||settled.quotes.length!==n)throw Error('WRONG_OUTCOME '+key);
 const recipient=want?'S1':buyer;
 // Store pre-withdraw balances before sending, and retain them across resumes.
 suite.balances||={};
 if(!suite.balances[key]){suite.balances[key]={recipient:accounts[recipient].address,before:(await reader.getBalance({address:accounts[recipient].address})).toString(),contract_before:(await reader.getBalance({address})).toString()};save()}
 await send(key+'-wrong-withdraw',want?buyer:'S1','withdraw',[id],0n,'NO_CREDIT');
 await send(key+'-withdraw',recipient,'withdraw',[id]);
 const b=suite.balances[key];
 if(!b.after){b.after=(await reader.getBalance({address:accounts[recipient].address})).toString();b.contract_after=(await reader.getBalance({address})).toString();save()}
 if(BigInt(b.after)-BigInt(b.before)!==FEE)throw Error('TRANSFER_BALANCE_MISMATCH '+key+' '+JSON.stringify(b));
 await send(key+'-double-withdraw',recipient,'withdraw',[id],0n,'NO_CREDIT');
 console.log('CASE_PASS',key,'tender',id,'recipient_delta',BigInt(b.after)-BigInt(b.before));
}
const all=JSON.parse(await read('get_all_tenders'));const sum=await totals();
fs.writeFileSync(path.join(DIR,'readback.json'),JSON.stringify({protocol:await read('get_protocol'),tenders:all,totals:sum,balances:suite.balances,readback_at:new Date().toISOString()},null,2));
fs.writeFileSync(FILE,JSON.stringify({network:'Stable Studionet',chain_id:61999,protocol:'tendercourt-2.2',contract_address:address,deploy_tx:cp.deploy_tx,complete:true,transactions:suite.records},null,2));
console.log('CASE_COMPLETE',CASE,suite.records.length,'receipts; recipient balance verified');

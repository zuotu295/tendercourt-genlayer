// Assemble only completed case manifests; preserve receipts, failures and balances.
import fs from'node:fs';import path from'node:path';import{fileURLToPath}from'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');const DIR=path.join(ROOT,'evidence','v2.2');
const dep=JSON.parse(fs.readFileSync(path.join(DIR,'deployment.json')));const records=[],cases=[];
for(const outcome of['winner','refund'])for(let n=1;n<=7;n++){
 const key=outcome+'-'+n;const file=path.join(DIR,'cases',key,'transactions.json');
 const ev=JSON.parse(fs.readFileSync(file));
 if(ev.complete!==true||ev.contract_address!==dep.contract_address)throw Error('INCOMPLETE_CASE '+key);
 cases.push({case:key,path:`cases/${key}/transactions.json`,transactions:ev.transactions.length});
 for(const rec of ev.transactions)records.push({...rec,case:key,receipt:`cases/${key}/${rec.receipt}`});
}
fs.writeFileSync(path.join(DIR,'transactions.json'),JSON.stringify({network:'Stable Studionet',chain_id:61999,protocol:'tendercourt-2.2',contract_address:dep.contract_address,deploy_tx:dep.deploy_tx,complete:true,cases,transactions:records},null,2));
console.log('Assembled',cases.length,'cases and',records.length,'transaction records');

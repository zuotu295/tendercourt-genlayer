// Render the actual App with fixture hook state. No RPC, wallet or signatures.
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import test from 'node:test';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const chain={CATEGORIES:['Design'],MAX_BUDGET_GEN:10000,FEE_WEI:10000000000000000000n,
 DEPLOYMENT:null,tempPrivateKey:()=>null,walletKind:()=> 'Fixture wallet',
 shortAddr:x=>x,fmtReadbackTime:x=>x,gen:x=>String(x),explorerAddress:x=>x};
function load(file,dependencies){
 const exports={};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>dependencies[name]??require(name)});
 return exports;
}
const validate=load('src/validate.ts',{'./chain':chain});
const i18n=load('src/i18n.ts',{});
function fixture(n,status='OPEN'){
 return {tender_id:1,buyer:'buyer',category:'Design',budget_gen:500,fee_wei:1e19,
  requirements:'Design a poster with editable source files.',status,
  quotes:Array.from({length:n},(_,i)=>({quote_id:i+1,supplier:'supplier-'+(i+1),price_gen:300,terms:'Complete poster delivery with source files.'})),
  winner_quote_id:status==='AWARDED'?1:0,winner_supplier:status==='AWARDED'?'supplier-1':'',reason:'',
  winner_credit:status==='AWARDED'?1e19:0,buyer_credit:0,winner_withdrawn:false,buyer_withdrawn:false};
}
function render(tender,address){
 let index=0;
 const overrides={2:[tender],5:{ok:true,at:'2026-11-13T00:00:00Z'},6:false,8:{mode:'injected',address}};
 const hooks={useState:initial=>{const i=index++;return [i in overrides?overrides[i]:initial,()=>{}]},useCallback:fn=>fn,useEffect:()=>{},useMemo:fn=>fn()};
 const App=load('src/App.tsx',{'react':hooks,'./chain':chain,'./validate':validate,'./i18n':i18n}).default;
 return renderToStaticMarkup(App());
}
const hasButton=(html,label)=>new RegExp('<button[^>]*>'+label).test(html);
test('accepted suppliers see request judgment at every partial size; outsiders do not',()=>{
 for(let n=1;n<=7;n++){
  assert.ok(hasButton(render(fixture(n),'supplier-'+n),'送交验证者裁决'),'supplier with '+n+' quotes');
  assert.ok(!hasButton(render(fixture(n),'outsider'),'送交验证者裁决'),'outsider with '+n+' quotes');
 }
});
test('JUDGING hides buyer overrides and late quotes while anyone can judge',()=>{
 for(const role of ['buyer','supplier-1','outsider']){
  const html=render(fixture(2,'JUDGING'),role);
  assert.ok(!hasButton(html,'授标给此报价'));
  assert.ok(!hasButton(html,'送交验证者裁决'));
  assert.ok(!hasButton(html,'投报价'));
  assert.ok(hasButton(html,'执行裁决'));
 }
});
test('settled winner sees withdrawal while outsiders and buyer do not',()=>{
 assert.ok(hasButton(render(fixture(2,'AWARDED'),'supplier-1'),'胜者提现'));
 for(const role of ['outsider','buyer','supplier-2'])assert.ok(!hasButton(render(fixture(2,'AWARDED'),role),'胜者提现'));
});

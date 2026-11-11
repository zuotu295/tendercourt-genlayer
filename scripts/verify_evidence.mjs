// TenderCourt v2: one-command independent verification (read-only).
// Re-reads everything live from Studionet and compares against
// evidence/deployment.json, evidence/transactions.json and the
// pre-registered EXPECTED.md v2 outcomes (mirrored below).
// No wallet, no transactions, no writes.
// For error-observed steps it requires ALL of: FINALIZED,
// MAJORITY_AGREE, leader execution_result ERROR, and the leader
// receipt's error payload EXACTLY equal to the step's recorded
// expected error code. A MAJORITY_DISAGREE or a wrong error code
// fails the check. A record with an unknown result value fails the
// check — a consensus disagreement is never counted as a pass.
// Scope note: this verifies the pre-registered v2 evidence set
// (tenders 1-7, 70 GEN). A post-evidence live-site write loop is
// documented separately in EVIDENCE.md; the checks below therefore
// match tenders 1-7 by id (not by total count) and require GEN
// conservation (in == out, balance 0, escrow 0) with at least the
// 70 GEN evidence baseline received.
// Usage: node scripts/verify_evidence.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deployment = JSON.parse(fs.readFileSync(path.join(REPO, 'evidence', 'deployment.json'), 'utf8'));
const evidence = JSON.parse(fs.readFileSync(path.join(REPO, 'evidence', 'transactions.json'), 'utf8'));
const source = fs.readFileSync(path.join(REPO, 'contracts', 'tendercourt.py'), 'utf8');
const ADDRESS = deployment.contract_address;

const sha = (s) => createHash('sha256').update(s).digest('hex');
const reader = createClient({chain: studionet});

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log('PASS', name, detail); }
  else { fail++; console.log('FAIL', name, detail); }
}
function leaderReceipt(tx) {
  let r = tx?.consensus_data?.leader_receipt;
  if (Array.isArray(r)) r = r.find((x) => x.mode === 'leader');
  return r || null;
}
function leaderExec(tx) {
  return leaderReceipt(tx)?.execution_result;
}
function leaderError(tx) {
  return leaderReceipt(tx)?.result?.payload || '';
}
async function receiptOf(hash) {
  return reader.waitForTransactionReceipt({hash, status: 'FINALIZED', interval: 5000, retries: 12, fullTransaction: true});
}

// 1. Byte parity: deployed code equals contracts/tendercourt.py.
const onChain = await reader.getContractCode(ADDRESS);
check('byte-parity', onChain === source, `source sha256 ${sha(source).slice(0, 12)}…`);
check('source-sha-matches-deployment', sha(source) === deployment.source_sha256);

// 2. Protocol + deploy tx.
const protocol = await reader.readContract({address: ADDRESS, functionName: 'get_protocol', args: [], transactionHashVariant: 'latest-final'});
check('protocol', protocol === 'tendercourt-2', String(protocol));
const deployTx = await receiptOf(deployment.deploy_tx);
check('deploy-tx', [7, 'FINALIZED'].includes(deployTx.status) && [6, 'MAJORITY_AGREE'].includes(deployTx.result) && leaderExec(deployTx) === 'SUCCESS',
  `status=${deployTx.status} result=${deployTx.result} leader=${leaderExec(deployTx)}`);

// 3. Every recorded evidence tx, re-read live.
for (const rec of evidence.transactions) {
  const tx = await receiptOf(rec.hash);
  if (rec.result === 'ok') {
    check(rec.label, [7, 'FINALIZED'].includes(tx.status) && [6, 'MAJORITY_AGREE'].includes(tx.result) && leaderExec(tx) === 'SUCCESS',
      `status=${tx.status} result=${tx.result} leader=${leaderExec(tx)}`);
  } else if (rec.result === 'error-observed') {
    check(rec.label, [7, 'FINALIZED'].includes(tx.status) && [6, 'MAJORITY_AGREE'].includes(tx.result) && leaderExec(tx) === 'ERROR' && leaderError(tx) === rec.expected_error,
      `status=${tx.status} result=${tx.result} leader=${leaderExec(tx)} leader_error=${leaderError(tx)} expected=${rec.expected_error}`);
  } else if (rec.result === 'disagreed-retry') {
    // A consensus disagreement is recorded for transparency only. It
    // must itself be FINALIZED + MAJORITY_DISAGREE; it is never a pass
    // for the business outcome (the retry's own record carries that).
    check(rec.label + ' (disagreed retry)', [7, 'FINALIZED'].includes(tx.status) && [5, 'MAJORITY_DISAGREE'].includes(tx.result),
      `status=${tx.status} result=${tx.result}`);
  } else {
    check(rec.label + ' (unknown result value)', false, `result=${rec.result} hash=${rec.hash}`);
  }
}

// 4. Tender outcomes vs EXPECTED.md v2 (T1 AWARDED/1, T2 AWARDED/1,
//    T3 CANCELLED/0, T4 CANCELLED/0, T5 AWARDED/1, T6 AWARDED/1,
//    T7 AWARDED/1).
const expected = {1: {status: 'AWARDED', winner: 1, winner_credit: 10000000000000000000, buyer_credit: 0},
  2: {status: 'AWARDED', winner: 1, winner_credit: 10000000000000000000, buyer_credit: 0},
  3: {status: 'CANCELLED', winner: 0, winner_credit: 0, buyer_credit: 10000000000000000000},
  4: {status: 'CANCELLED', winner: 0, winner_credit: 0, buyer_credit: 10000000000000000000},
  5: {status: 'AWARDED', winner: 1, winner_credit: 10000000000000000000, buyer_credit: 0},
  6: {status: 'AWARDED', winner: 1, winner_credit: 10000000000000000000, buyer_credit: 0},
  7: {status: 'AWARDED', winner: 1, winner_credit: 10000000000000000000, buyer_credit: 0}};
const all = JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_all_tenders', args: [], transactionHashVariant: 'latest-final'}));
check('tender-count', all.length >= 7, `got ${all.length} (evidence set is tenders 1-7; any extra tender is the separately documented post-evidence write loop)`);
for (const t of all) {
  const e = expected[t.tender_id];
  if (!e) { console.log('NOTE extra tender (post-evidence write loop):', `id=${t.tender_id} status=${t.status} winner=${t.winner_quote_id}`); continue; }
  check(`tender-${t.tender_id}`, t.status === e.status && t.winner_quote_id === e.winner && t.winner_credit === e.winner_credit && t.buyer_credit === e.buyer_credit,
    `status=${t.status} winner=${t.winner_quote_id} winner_credit=${t.winner_credit} buyer_credit=${t.buyer_credit}`);
}

// 5. GEN accounting: conservation must hold (in == out, balance 0,
//    escrow 0) with at least the 70 GEN evidence baseline received.
const totals = JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_totals', args: [], transactionHashVariant: 'latest-final'}));
check('accounting', BigInt(totals.total_received_wei) === BigInt(totals.total_withdrawn_wei) && BigInt(totals.total_received_wei) >= 70000000000000000000n && totals.contract_balance_wei === 0 && totals.escrowed_wei === 0,
  `in=${totals.total_received_wei} out=${totals.total_withdrawn_wei} balance=${totals.contract_balance_wei} escrowed=${totals.escrowed_wei}`);

console.log(`\n${pass} PASS, ${fail} FAIL`);
if (fail > 0) process.exit(1);
console.log('ALL CHECKS PASS.');

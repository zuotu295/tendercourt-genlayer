// TenderCourt: generate EVIDENCE.md from the recorded evidence.
// Read-only. Reads evidence/deployment.json + evidence/transactions.json
// and re-reads the final on-chain state (latest-final) for the tender
// outcomes and GEN accounting tables.
// Usage (after the evidence run finishes): node scripts/write_evidence_md.mjs
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
const EX = 'https://explorer-studio.genlayer.com';
const sha = (s) => createHash('sha256').update(s).digest('hex');
const reader = createClient({chain: studionet});

const onChain = await reader.getContractCode(ADDRESS);
const parity = onChain === source;
const tenders = JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_all_tenders', args: [], transactionHashVariant: 'latest-final'}));
const totals = JSON.parse(await reader.readContract({address: ADDRESS, functionName: 'get_totals', args: [], transactionHashVariant: 'latest-final'}));

const fmt = (wei) => `${Number(BigInt(wei) / 1000000000000000000n)} GEN`;
const link = (h) => `[${h.slice(0, 10)}…](${EX}/tx/${h})`;

let md = `# TenderCourt v1 — Evidence

Contract: [${ADDRESS}](${EX}/address/${ADDRESS})
Deploy tx: [${deployment.deploy_tx.slice(0, 10)}…](${EX}/tx/${deployment.deploy_tx})
Protocol: tendercourt-1 · Source SHA-256: ${sha(source)} · Byte parity with \`contracts/tendercourt.py\`: ${parity ? 'TRUE' : 'FALSE'}

All transactions below are FINALIZED on Stable Studionet (Chain ID 61999). Success steps: FINALIZED + MAJORITY_AGREE + leader SUCCESS. Negative steps (neg0–neg11): FINALIZED + MAJORITY_AGREE + leader ERROR with the expected error code in the live receipt, and no state change.

## Tender outcomes (live readback, latest-final)

| Tender | Category | Budget | Status | Winner | Winner credit | Buyer credit |
| --- | --- | --- | --- | --- | --- | --- |
`;
for (const t of tenders) {
  md += `| ${t.tender_id} | ${t.category} | ${t.budget_gen} GEN | ${t.status} | ${t.winner_quote_id === 0 ? 'NO_AWARD' : 'quote ' + t.winner_quote_id} | ${fmt(t.winner_credit)} | ${fmt(t.buyer_credit)} |\n`;
}
md += `
- Tender 1 (AWARDED, winner quote 1): three quotes — complete terms at 400 GEN, thin terms at 480 GEN, no ordering/menu at 350 GEN — validators judge quote 1 the winner; the supplier withdraws 10 GEN.
- Tender 2 (AWARDED, winner quote 1): two complete quotes; the buyer awards directly to quote 1 without judgment; the supplier withdraws 10 GEN.
- Tender 3 (CANCELLED, NO_AWARD): both quotes fail the requirements — machine-only translation with no review, and the first 5 pages only — validators return NO_AWARD (0); the buyer withdraws the full 10 GEN refund.
- Tender 4 (CANCELLED): the buyer cancels while OPEN with zero quotes; the buyer withdraws the full 10 GEN refund.
- Tender 5 (AWARDED, winner quote 1, injection): quote 2 embeds an instruction telling validators to pick it — validators judge quote 1 the winner (not the injected quote 2); the supplier withdraws 10 GEN.

## GEN accounting (live readback, latest-final)

- Total received: ${fmt(totals.total_received_wei)} (5 tenders × 10 GEN)
- Total withdrawn: ${fmt(totals.total_withdrawn_wei)}
- Contract balance: ${fmt(totals.contract_balance_wei)}
- Escrowed: ${fmt(totals.escrowed_wei)}
- Tender count: ${totals.tender_count}

## Evidence transactions

| Step | Result | Transaction |
| --- | --- | --- |
`;
for (const rec of evidence.transactions) {
  md += `| ${rec.label} | ${rec.result}${rec.expected_error ? ' (' + rec.expected_error + ')' : ''} | ${link(rec.hash)} |\n`;
}
md += `
## Notes

- The 10 GEN is the selection award, not the procurement contract value.
- No value was sent on any expected-failure payable call. Platform behavior (verified live 2026-11-11): on Studionet a FAILED payable call does not refund the sent value — it stays in the contract with no entitlement — so evidence never sends value on a negative payable.
- Pre-registered expectations: EXPECTED.md (written before the evidence run). Independent re-verification: \`node scripts/verify_evidence.mjs\`.
`;

fs.writeFileSync(path.join(REPO, 'EVIDENCE.md'), md);
console.log(`EVIDENCE.md written (${evidence.transactions.length} txs, ${tenders.length} tenders, parity=${parity}).`);

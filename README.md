# TenderCourt 比选庭 — Procurement Quote-Selection Court

**Live site: https://zuotu295.github.io/tendercourt-genlayer/**

TenderCourt lets a buyer publish requirements, category and budget, escrow a
fixed 10 GEN selection award, and receive supplier quotes. GenLayer validators
independently evaluate fit and agree on a winning quote id, or NO_AWARD. Contract
code credits the winner 10 GEN or refunds the buyer; the entitled address then
withdraws once. The award is not the procurement price and does not prove delivery.

## Supplier recovery — protocol tendercourt-2.2

| State | Action | Authorized caller | Result |
| --- | --- | --- | --- |
| OPEN, zero quotes | cancel_tender | buyer | CANCELLED, buyer credit |
| OPEN, 1–8 quotes | award_tender | buyer | AWARDED, selected supplier credit |
| OPEN, 1–8 quotes | request_judgment | buyer or accepted supplier | JUDGING, frozen quotes |
| JUDGING | judge | anyone | consensus winner or NO_AWARD |
| Settled, unwithdrawn credit | withdraw | credit owner | one 10 GEN transfer |

An accepted supplier can start judgment with **1–7 quotes**, without waiting for
the buyer or filling the remaining slots. This is the supplier-triggered recovery
alternative to a deadline; there is no elapsed-time timeout. A supplier may close
the bidding window immediately. Transaction order determines whether another
quote or a buyer's OPEN direct award precedes closure. Once JUDGING, the buyer
cannot bypass consensus with a direct award. Disagreement leaves JUDGING retryable;
it does not guarantee eventual consensus.

Each non-buyer address has one immutable quote. Price is an integer from 1 to the
budget (1–10,000 GEN); terms contain 10–1000 Unicode code points after trimming.
Eight quotes fit the 8000-character total. These caps do not prevent Sybil activity.
Only the buyer may cancel, and only an empty OPEN tender.

## Consensus

Validators independently read requirements and all quotes, with INPUT treated as
untrusted data. Exact agreement on `winner_quote_id` is required; deterministic
code validates the id and settles. The 15–280 character reason is explanatory,
not compared. Agreement is not proof of objective quality or delivery ability.
Direct awards while OPEN remain the buyer's choice, without consensus.

## Deployment and evidence

The current deployment in `public/deployment.json` is **tendercourt-2.2**:
[0xD879F2Aa15f8420694872e229424AF06cD9929B9](https://explorer-studio.genlayer.com/address/0xD879F2Aa15f8420694872e229424AF06cD9929B9).
The frontend rejects writes unless the configured contract returns this protocol.

[EVIDENCE.md](EVIDENCE.md) documents the current deployment and recovery matrix.
[evidence/v2.2](evidence/v2.2/) contains raw receipts and verification results.
The original v2.1 deployment/transaction JSONs remain at `evidence/deployment.json`
and `evidence/transactions.json`; [evidence/v2.1](evidence/v2.1/) preserves the
old source, expectations and narrative, including failures. They are historical,
not proof of the current source. [ERRATA.md](ERRATA.md) retains the earlier discrepancy.
[EXPECTED.md](EXPECTED.md) specifies coverage; [REVIEWER.md](REVIEWER.md) explains
recovery and tradeoffs.

## Reproduce

```bash
npm ci
npm test
npx tsc --noEmit
npm run build
npm run preview
node scripts/deploy_studionet.mjs --prepare
```

The deploy command defaults to read-only preflight (chain id, source hash, no
accounts/funding/signing). Actual execution requires `--execute` after deployment
authorization; it uses a separate v2.2 checkpoint and writes only
`evidence/v2.2/deployment.json`. Never reuse an old deployment/checkpoint for changed
source. After live validation, update the frontend deployment metadata and rebuild.
The live recovery runner accepts an explicit case (`--case winner-1` through
`refund-7`), checkpoint and output directory; it resolves pending hashes before
any new send. `npm run verify:recovery` independently re-reads every current
receipt, source and final state. The old `run_evidence.mjs` suite is disabled because its partial-fill denial
expectation is incompatible; it must not overwrite the historical receipts.
`verify_evidence.mjs` verifies only the preserved v2.1 source/receipts, read-only.

Local tests use a stub SDK and canned consensus outputs, not live validators or
real transfers. Build output is committed under `docs/` for existing GitHub Pages
hosting. Frontend: React, TypeScript, Vite; SDK: genlayer-js 1.1.8. Network remains
Stable Studionet 61999 at https://studio.genlayer.com/api.

## Frontend and limits

Bilingual CN/EN; reads use latest-final and label readback time. Wallets: OKX and
MetaMask. Temporary test accounts require key backup acknowledgement and cannot
fund tender creation. Sent hashes persist for receipt recovery; a timeout is
unknown, not final failure. Success requires FINALIZED and successful execution.

No delivery enforcement, guaranteed bidding duration, pagination, or guaranteed
consensus liveness is provided. Historical evidence reports failed payable calls
retaining sent value on Studionet; send no value on negative payable tests.

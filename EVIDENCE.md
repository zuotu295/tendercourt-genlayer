# TenderCourt v2.2 — Supplier recovery evidence

Contract: [0xD879F2Aa15f8420694872e229424AF06cD9929B9](https://explorer-studio.genlayer.com/address/0xD879F2Aa15f8420694872e229424AF06cD9929B9)

Deploy transaction: [0xe2c7a22fe59c70b672167929986df05db628ce00166c01abdf019722fe8d3d96](https://explorer-studio.genlayer.com/tx/0xe2c7a22fe59c70b672167929986df05db628ce00166c01abdf019722fe8d3d96)

Network: Stable Studionet (61999). Protocol: tendercourt-2.2.
Source SHA-256: `555f777f9f3aed483aab78623592909bccd5e3be9821b3cd7c21796b438ed944`. Deployed source equals `contracts/tendercourt.py` byte-for-byte.

## Live verification

`node scripts/verify_recovery_evidence.mjs`: **364 PASS, 0 FAIL**.
Readback completed: 2026-11-13T08:37:15.228Z (off-chain observation time).
The verifier independently re-read the deployment and all 156 matrix transaction receipts, protocol, source, tender states, totals and current recipient balances.

All successful business steps are FINALIZED + MAJORITY_AGREE + leader SUCCESS.
Judgment runs have leader-only disabled and multi-validator majority agreement; unanimity is not claimed.
Expected guard failures are FINALIZED + MAJORITY_AGREE + leader ERROR with the exact expected error and unchanged tender state.

| Quotes | Winner case / tender | Winner withdrawal | NO_AWARD case / tender | Buyer refund |
| --- | --- | --- | --- | --- |
| 1 | AWARDED #1, quote 1 | 10 GEN received | CANCELLED #2, quote 0 | 10 GEN received |
| 2 | AWARDED #3, quote 1 | 10 GEN received | CANCELLED #10, quote 0 | 10 GEN received |
| 3 | AWARDED #6, quote 1 | 10 GEN received | CANCELLED #11, quote 0 | 10 GEN received |
| 4 | AWARDED #7, quote 1 | 10 GEN received | CANCELLED #12, quote 0 | 10 GEN received |
| 5 | AWARDED #8, quote 1 | 10 GEN received | CANCELLED #13, quote 0 | 10 GEN received |
| 6 | AWARDED #9, quote 1 | 10 GEN received | CANCELLED #14, quote 0 | 10 GEN received |
| 7 | AWARDED #4, quote 1 | 10 GEN received | CANCELLED #5, quote 0 | 10 GEN received |

For every case, the last accepted supplier requested judgment, and an unrelated address executed it. After creation, no successful buyer action was required; boundary cases deliberately attempted and rejected buyer overrides. Each selected recipient's observed balance increased by exactly 10 GEN; the verifier also checked the current recipient balance against the stored post-transfer read.

## Funds and guard checks

- 14 tenders × 10 GEN: **140 GEN received, 140 GEN withdrawn, contract balance 0, escrow 0**.
- Wrong-recipient and duplicate withdrawals were rejected in all 14 cases.
- At both partial-fill boundaries (1 and 7 quotes), both winner/refund paths reject outsider requests, buyer overrides after JUDGING, late quotes, and early withdrawals.
- `112` successful business receipts, `44` expected guard-error receipts, and `0` recorded disagreement attempts. Deployment is recorded separately.

## Evidence files and reproduction

- [Aggregate transactions](evidence/v2.2/transactions.json): all hashes, expected errors, observations and per-case manifest paths.
- [Independent verification](evidence/v2.2/verification.json): exact checks, outcomes and totals.
- [Public receipt summaries](evidence/v2.2/public-receipts.json): whitelisted transaction identities, status, execution/error results and votes; provider configuration and raw payloads are excluded. Full SDK exports remain retained separately, with [original byte hashes](evidence/v2.2/receipt-index.json).
- [Execution observations](evidence/v2.2/EXECUTION_NOTES.md): serialization/RPC interruptions and delayed recipient balance visibility, retained without treating them as business passes.
- [Pre-deployment local validation](evidence/v2.2/LOCAL_VALIDATION.md): 36 contract test methods, 3 chain-gate tests, TypeScript and production build results, plus initial browser failures.

`npm run verify:recovery` requires no wallet, private key or transactions.
To reproduce signed matrix cases on a fresh authorized deployment, prepare separate checkpoints with `node scripts/prepare_recovery_cases.mjs --execute`, then run each explicit case with `node scripts/run_recovery_evidence.mjs --execute --case winner-1` (other cases use their matching `--checkpoint`). The runner preserves pending hashes and does not repeat completed writes. Assemble with `node scripts/assemble_recovery_evidence.mjs`, archive with `python3 scripts/archive_recovery_receipts.py`, and independently verify.

## Scope and limitations

Recovery is supplier-triggered, not an elapsed-time timeout. An accepted supplier may close the quote window immediately. Quotes freeze in JUDGING and the buyer can no longer award directly. Consensus disagreement remains retryable but success is not guaranteed. The 10 GEN selection award does not verify procurement delivery. All amounts are free Studionet test GEN.

The default-branch GitHub Pages site serves v2.2 (bundle 5c0fdcbc). Published-site checks cover the finalized readback, bilingual recovery notices, form guards and temporary-account backup flow; see [SITE_VALIDATION.md](evidence/v2.2/SITE_VALIDATION.md). A new browser-signed contract write loop was not executed; the 14-case on-chain matrix was signed through the SDK, and is not represented as browser interaction.

[v2.1 historical evidence](evidence/v2.1/EVIDENCE.md), including failed attempts, remains preserved. The original v2.1 deployment and transactions JSONs remain under evidence/. They do not prove v2.2. [ERRATA.md](ERRATA.md) retains the earlier discrepancy.

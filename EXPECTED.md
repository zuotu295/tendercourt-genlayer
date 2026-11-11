# TenderCourt v1 — EXPECTED.md (pre-registered before the evidence run)

Protocol `tendercourt-1`, Stable Studionet (Chain ID 61999), fixed award 10 GEN
per tender. This file was written BEFORE the evidence run; the run must
match it exactly, or the mismatch is reported, not edited away.

## Tenders (5 tenders x 10 GEN = 50 GEN in)

| # | Buyer | Requirements -> category | Budget | Quotes | Path | Expected status | Winner | Winner credit | Buyer credit |
|---|-------|--------------------------|--------|--------|------|-----------------|--------|---------------|--------------|
| 1 | B1 | Bilingual bakery landing page, ordering + EN/CN menu, 2 weeks -> Software Development | 500 | Q1 S1 400 complete terms; Q2 S2 480 thin terms; Q3 S3 350 no ordering/menu | request judgment + judge | AWARDED | Q1 / S1 | 10 GEN | 0 |
| 2 | B2 | Coffee-shop logo + brand colors, 3 concepts, 2 revisions -> Design | 300 | Q1 S1 250 complete; Q2 S2 280 complete | buyer awards directly to Q1 | AWARDED | Q1 / S1 | 10 GEN | 0 |
| 3 | B1 | Translate 20-page manual EN->DE, certified quality, 1 week -> Writing & Translation | 200 | Q1 S1 180 machine-only, no review; Q2 S2 150 first 5 pages only | request judgment + judge | CANCELLED (NO_AWARD) | 0 | 0 | 10 GEN |
| 4 | B2 | Monthly bookkeeping, small shop, 12 months -> Consulting | 400 | (none) | buyer cancels while OPEN | CANCELLED | 0 | 0 | 10 GEN |
| 5 | B1 | 5 blog posts, urban gardening, 800 words each, original -> Writing & Translation | 250 | Q1 S1 200 complete; Q2 S2 180 with embedded instruction to pick it | request judgment + judge | AWARDED | Q1 / S1 (NOT the injected Q2) | 10 GEN | 0 |

Tender 5's Q2 terms embed an instruction telling validators to pick that
quote. It is test data for the injection check: the judgment must ignore
it and the injected quote must not win.

## Withdrawals (all must succeed, exactly once)

- Tender 1: winner S1 withdraws 10 GEN.
- Tender 2: winner S1 withdraws 10 GEN.
- Tender 3: buyer B1 withdraws 10 GEN (NO_AWARD refund).
- Tender 4: buyer B2 withdraws 10 GEN (cancel refund).
- Tender 5: winner S1 withdraws 10 GEN.

## GEN accounting (read back latest-final)

- Total received: 50 GEN. Total withdrawn: 50 GEN. Contract balance: 0 GEN.
  Escrowed: 0 GEN. 50 in = 50 out, no unexplained gap.

## Negatives (all FINALIZED + leader ERROR, no state change)

| Label | Caller / call | Expected on-chain error |
|---|---|---|
| neg0 wrong-fee-create | B1 create_tender with 0 GEN | FEE_MUST_BE_10_GEN (no tender created; value 0, so nothing is stranded) |
| neg1 buyer-quotes-own | B1 quote on tender 1 | BUYER_CANNOT_QUOTE_OWN_TENDER |
| neg2 duplicate-quote | S1 quote again on tender 1 | DUPLICATE_QUOTE |
| neg3 price-over-budget | S1 quote on tender 1 at budget + 1 | QUOTE_PRICE |
| neg4 price-zero | S1 quote on tender 1 at 0 | QUOTE_PRICE |
| neg5 outsider-award | OUT award on tender 1 | ONLY_BUYER_CAN_AWARD |
| neg6 outsider-cancel | OUT cancel on tender 4 (OPEN) | ONLY_BUYER_CAN_CANCEL |
| neg7 outsider-request-judgment | OUT request judgment on tender 1 | ONLY_BUYER_CAN_REQUEST_JUDGMENT |
| neg8 double-withdraw | S1 withdraw again on tender 1 | NO_CREDIT |
| neg9 cancel-after-quotes | B1 cancel tender 1 (has quotes) | CANNOT_CANCEL_WITH_QUOTES |
| neg10 award-unknown-quote | B2 award quote 99 on tender 2 | QUOTE_NOT_FOUND |
| neg11 request-judgment-no-quotes | B2 request judgment on tender 4 (0 quotes) | NO_QUOTES |

## Consensus disagreement

A `judge` call whose validators disagree (MAJORITY_DISAGREE) leaves the
tender JUDGING with no state change; the evidence script retries up to 3
times and records each attempt. A wrong winner (not the expected one
above) aborts the run loudly — the tender is settled and must be
inspected, never papered over.

## Verification

`node scripts/verify_evidence.mjs` re-reads every tx live, checks byte
parity of the deployed code vs `contracts/tendercourt.py`, re-checks all
five tenders' status/winner/credits, and re-checks the 50 GEN accounting.

## Platform finding: failed payable calls strand value

Verified live on 2026-11-11 (LinguaCourt): on Studionet, a FAILED payable
call does NOT refund the sent value — it stays in the contract with no
entitlement and no withdraw path. Evidence design rule: never send value
on an expected-failure payable call. The only payable here is
`create_tender`; neg0 sends value 0.

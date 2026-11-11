# TenderCourt v2 — EXPECTED.md (pre-registered before the evidence run)

Protocol `tendercourt-2`, Stable Studionet (Chain ID 61999), fixed award 10 GEN
per tender. This file was written BEFORE the evidence run; the run must
match it exactly, or the mismatch is reported, not edited away.

v2 changes vs v1 (see contracts/tendercourt.py docstring):
- At most 8 quotes per tender (QUOTE_LIMIT) and the sum of all quotes'
  terms is capped at 8000 chars (QUOTE_TERMS_TOTAL). Both enforced in
  the contract.
- Once JUDGING, ANYONE may execute judge() (the winner is decided by
  consensus; the caller cannot bias it). A quoter may request judgment
  once the tender is full (8 quotes); a quoter on a non-full tender
  cannot (ONLY_BUYER_CAN_REQUEST_JUDGMENT).
- v1 evidence (tenders 1-5 on contract 0xD2A0Fe94...) is archived in
  evidence/v1/. It does NOT prove this contract; v2 evidence below is
  fresh, on the new deployment.

## Tenders (7 tenders x 10 GEN = 70 GEN in)

| # | Buyer | Requirements -> category | Budget | Quotes | Path | Expected status | Winner | Winner credit | Buyer credit |
|---|-------|--------------------------|--------|--------|------|-----------------|--------|---------------|--------------|
| 1 | B1 | Bilingual bakery landing page, ordering + EN/CN menu, 2 weeks -> Software Development | 500 | Q1 S1 400 complete terms; Q2 S2 480 thin terms; Q3 S3 350 no ordering/menu | request judgment + judge | AWARDED | Q1 / S1 | 10 GEN | 0 |
| 2 | B2 | Coffee-shop logo + brand colors, 3 concepts, 2 revisions -> Design | 300 | Q1 S1 250 complete; Q2 S2 280 complete | buyer awards directly to Q1 | AWARDED | Q1 / S1 | 10 GEN | 0 |
| 3 | B1 | Translate 20-page manual EN->DE, certified quality, 1 week -> Writing & Translation | 200 | Q1 S1 180 machine-only, no review; Q2 S2 150 first 5 pages only | request judgment + judge | CANCELLED (NO_AWARD) | 0 | 0 | 10 GEN |
| 4 | B2 | Monthly bookkeeping, small shop, 12 months -> Consulting | 400 | (none) | buyer cancels while OPEN | CANCELLED | 0 | 0 | 10 GEN |
| 5 | B1 | 5 blog posts, urban gardening, 800 words each, original -> Writing & Translation | 250 | Q1 S1 200 complete; Q2 S2 180 with embedded instruction to pick it | request judgment + judge | AWARDED | Q1 / S1 (NOT the injected Q2) | 10 GEN | 0 |
| 6 | B1 | Design a one-page flyer for a neighborhood farmers market, print-ready PDF, 2 revision rounds -> Design | 300 | 8 short quotes (S1-S8): Q1 S1 400 complete; Q2 S2 480 thin; Q3 S3 350 no PDF; Q4 S4 500 thin; Q5 S5 420 missing revisions; Q6 S6 460 thin; Q7 S7 440 incomplete; Q8 S8 490 thin | quoter S1 requests judgment (tender full) + OUT executes judge | AWARDED | Q1 / S1 | 10 GEN | 0 |
| 7 | B2 | Write a 40-page product catalog, EN + DE, print-ready, 4 weeks -> Writing & Translation | 800 | 4 quotes with exactly 2000-char terms each (S1-S4, total 8000 = cap): Q1 S1 600 most complete; Q2 S2 700 thinner; Q3 S3 750 thinner; Q4 S4 780 thinnest | buyer requests judgment + judge | AWARDED | Q1 / S1 | 10 GEN | 0 |

Tender 5's Q2 terms embed an instruction telling validators to pick that
quote. It is test data for the injection check: the judgment must ignore
it and the injected quote must not win.

Tender 6's Q1 is the cheapest complete quote; Q3 is cheaper but has no
print-ready PDF, so it does not satisfy the requirements. The key
mechanism assertions are: quoter-request-when-full succeeds, and a
non-buyer executes judge() in JUDGING.

Tender 7's 4 quotes each carry exactly 2000 chars of terms (total 8000,
exactly the cap). The 5th quote attempt must fail with
QUOTE_TERMS_TOTAL. The judge then runs over the 8000-char prompt.

## Withdrawals (all must succeed, exactly once)

- Tender 1: winner S1 withdraws 10 GEN.
- Tender 2: winner S1 withdraws 10 GEN.
- Tender 3: buyer B1 withdraws 10 GEN (NO_AWARD refund).
- Tender 4: buyer B2 withdraws 10 GEN (cancel refund).
- Tender 5: winner S1 withdraws 10 GEN.
- Tender 6: winner S1 withdraws 10 GEN.
- Tender 7: winner S1 withdraws 10 GEN.

## Negatives (16, all must show FINALIZED + MAJORITY_AGREE + leader ERROR with the exact expected error code in the leader receipt payload)

- neg0 wrong-fee-create: FEE_MUST_BE_10_GEN
- neg1 buyer-quotes-own: BUYER_CANNOT_QUOTE_OWN_TENDER
- neg2 duplicate-quote: DUPLICATE_QUOTE
- neg3 price-over-budget: QUOTE_PRICE
- neg4 price-zero: QUOTE_PRICE
- neg5 outsider-award: ONLY_BUYER_CAN_AWARD
- neg6 outsider-cancel: ONLY_BUYER_CAN_CANCEL
- neg7 outsider-request-judgment: ONLY_BUYER_CAN_REQUEST_JUDGMENT
- neg8 double-withdraw: NO_CREDIT (runs after withdrawals)
- neg9 cancel-after-quotes: CANNOT_CANCEL_WITH_QUOTES
- neg10 award-unknown-quote: QUOTE_NOT_FOUND
- neg11 request-judgment-no-quotes: NO_QUOTES
- neg12 ninth-quote-on-full-tender: QUOTE_LIMIT (tender 6, after 8 quotes)
- neg13 fifth-quote-over-terms-total: QUOTE_TERMS_TOTAL (tender 7, after 4 x 2000-char terms)
- neg14 judge-while-open: TENDER_NOT_JUDGING
- neg15 quoter-request-judgment-not-full: ONLY_BUYER_CAN_REQUEST_JUDGMENT (tender 7, 4 quotes, not full)

## GEN accounting (read back latest-final)

- Total received: 70 GEN. Total withdrawn: 70 GEN. Contract balance: 0 GEN.
  Escrowed: 0 GEN. 70 in = 70 out, no unexplained gap.

## Consensus disagreement

A `judge` call whose validators disagree (MAJORITY_DISAGREE) leaves the
tender JUDGING with no state change; the evidence script retries up to 3
times and records each attempt. A wrong winner (not the expected one
above) aborts the run loudly — the tender is settled and must be
inspected, never papered over.

## Verification

`node scripts/verify_evidence.mjs` re-reads every tx live, checks byte
parity of the deployed code vs `contracts/tendercourt.py`, re-checks all
seven tenders' status/winner/credits, and re-checks the 70 GEN
accounting. Negative checks compare the exact leader-receipt error
payload (not a substring of the whole receipt); a consensus
disagreement is never counted as a pass.

## Platform finding: failed payable calls strand value

Verified live on 2026-11-11 (LinguaCourt): on Studionet, a FAILED payable
call does NOT refund the sent value — it stays in the contract with no
entitlement and no withdraw path. Evidence design rule: never send value
on an expected-failure payable call. The only payable here is
`create_tender`; neg0 sends value 0.

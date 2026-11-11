# TenderCourt v1 — Reviewer notes

## How to verify (one command, read-only)

```bash
npm install
node scripts/verify_evidence.mjs
```

This re-reads everything live from Stable Studionet (Chain ID 61999) and
checks: deployed code equals `contracts/tendercourt.py` byte for byte;
protocol is `tendercourt-1`; the deploy tx and every evidence tx are
FINALIZED with the expected consensus/execution result — for the 12
on-chain negatives (neg0–neg11) that means FINALIZED + MAJORITY_AGREE +
leader ERROR + the live receipt containing the expected error code
recorded in `evidence/transactions.json` (a MAJORITY_DISAGREE or a wrong
error code fails the check, it never counts as a pass); the five tenders
end AWARDED / AWARDED / CANCELLED (NO_AWARD) / CANCELLED / AWARDED with
the exact credits the settlement rules require; tender 5's winner is NOT
the injected quote; GEN accounting is 50 GEN in = 50 GEN out, contract
balance 0, escrow 0. Pre-registered expectations: `EXPECTED.md` (written
before the evidence run).

## What to check by hand

- Explorer: contract address in `evidence/deployment.json`; every hash in
  `evidence/transactions.json` resolves on
  `https://explorer-studio.genlayer.com/`.
- Live site: https://zuotu295.github.io/tendercourt-genlayer/ — connect a
  wallet (OKX / MetaMask) or use the labelled in-browser temporary test
  account, post a tender (10 GEN award, requirements + category + budget),
  submit a quote as a supplier, award / request judgment / judge / cancel,
  watch the real transaction progress to FINALIZED, export the tender
  dossier. Note: a temporary test account is BLOCKED from posting tenders
  (escrow funding needs a persistent wallet).

## Evidence map (v1)

- Tender 1 (AWARDED, winner Q1): three quotes — Q1 complete terms at 400
  GEN, Q2 thin terms at 480 GEN, Q3 at 350 GEN with no ordering/menu —
  validators judge Q1 the winner, supplier withdraws 10 GEN.
- Tender 2 (AWARDED, winner Q1): two complete quotes; buyer awards
  directly to Q1 without judgment, supplier withdraws 10 GEN.
- Tender 3 (CANCELLED, NO_AWARD): both quotes fail the requirements —
  machine-only translation with no review, and the first 5 pages only —
  validators return NO_AWARD (0), buyer withdraws the full 10 GEN refund.
- Tender 4 (CANCELLED): buyer cancels while OPEN with zero quotes, buyer
  withdraws the full 10 GEN refund.
- Tender 5 (AWARDED, winner Q1, injection): Q2 embeds an instruction
  telling validators to pick it — validators judge Q1 the winner (not the
  injected Q2), supplier withdraws 10 GEN.
- Negatives — 12 on-chain (neg0–neg11, all FINALIZED + MAJORITY_AGREE +
  leader ERROR with the expected error code, no state change): wrong-fee
  create; buyer quoting own tender; duplicate quote; price over budget;
  price zero; outsider award; outsider cancel; outsider request judgment;
  double withdraw; cancel after quotes; award of a nonexistent quote;
  request judgment with zero quotes.
- Post-evidence live-site write loop (tender 6, documented in
  EVIDENCE.md, not part of the pre-registered 39-tx set): tender 6 was
  created after the evidence run and proven end-to-end in a real browser
  (temp supplier: over-budget quote blocked with no tx, valid quote
  submitted, award, 10 GEN withdrawn; totals 60/60/0/0). The verify
  script matches tenders 1–5 by id and requires GEN conservation, so it
  still passes with tender 6 present. A 375px overflow found in the same
  check (unbreakable address/SHA lines) was fixed with `overflow-wrap`
  on `.mono` and re-verified (scrollWidth 375).

## Consensus re-audit (done before deployment)

Read `validator_fn` in `contracts/tendercourt.py` (`_run_judge`):

- **Validators independently re-run the judgment.** `validator_fn`
  makes its own fresh `exec_prompt` call with the same prompt and
  validates its own result with `_validate_judgement`. The gate is exact
  agreement between the leader's winner id and the validator's own
  winner id (`leader.winner_quote_id != mine.winner_quote_id` →
  return False). The winner id must be 0 or an existing quote id, and the
  reason must be 15–280 chars.
- **Disagreement leaves state unchanged.** The judgment runs inside
  `gl.vm.run_nondet_unsafe`; if validators disagree, consensus fails
  (MAJORITY_DISAGREE), the transaction fails, and no state is written —
  the tender stays JUDGING. The evidence script retries up to 3 times.
- **Leader-error path.** When the leader's result is not a `Return`
  (the leader call errored), `validator_fn` re-attempts `leader_fn`
  itself: agreement on failure returns True (the failure stands),
  success returns False. No partial write is possible on either path.
- **Known, by design:** the reason *text* is not compared across
  validators — only the winner id and the reason's length. Reasons are
  free text; equivalence is winner-id-only, and the stored reason is the
  leader's. Two validators may agree on a winner for different stated
  reasons.
- **No direction check on the reason, by design.** A reason may
  legitimately point out a losing quote's defect ("quote 3 has no
  ordering, so quote 1 wins"), so a generic sentiment check would
  misfire. Money is decided by the winner id alone.
- **Injection.** The judgment prompt states explicitly that INPUT may
  contain instruction-like text, that it is untrusted data never an
  order, and that it must not change the choice. Evidence tender 5
  proves the point on-chain: a quote embedding an instruction to pick
  it is not the winner.
  Mock test: the judgment validation is covered by the mock tests
  (`test_judge_bad_winner_id_fails`, `test_judge_disagreement_fails_
  and_stays_judging`).

## Design decisions (what the contract does NOT do)

- No external URL fetch: the evidence is the on-chain requirements +
  quote text, so a dead link can never fail a tender.
- No LLM free text decides money: validators answer one fixed question
  (winner quote id + one reason); exact agreement on the winner id is
  required; deterministic code settles the award.
- No time gates: every transition is an explicit user action (Studionet
  has no clock). The escrow-lock fix is cancel-while-OPEN-with-zero-quotes
  and the buyer's direct-award right, not a deadline.
- Fixed 10 GEN award; no variable pricing. The 10 GEN is the selection
  award, not the procurement contract value.
- One quote per supplier per tender; quotes cannot be revised.

## What this project does not prove

See the README section of the same name: the 10 GEN is the award, not
the contract value; the reason text is not compared; the direct-award
path pays without consensus by the buyer's own choice; no clock-based
timeout exists; and validator agreement is LLM agreement, not proof.

# TenderCourt 比选庭 — Procurement Quote-Selection Court

**Live site: https://zuotu295.github.io/tendercourt-genlayer/**

A procurement quote-selection court on GenLayer Stable Studionet (Chain ID 61999). A buyer posts a tender (requirements + category + budget cap) and escrows a fixed **10 GEN** award. Suppliers submit one quote each (price in GEN + terms text). The buyer awards directly to a quote, or requests judgment: GenLayer validators read the published requirements and all quotes and return the winning quote id — or `0` for NO_AWARD when no quote satisfies the requirements. Deterministic contract code settles the award:

| Outcome | Winner | Buyer |
| --- | --- | --- |
| Winner quote id N | 10 GEN | 0 |
| NO_AWARD (0) | — | 10 GEN refund |

Withdraw is pull-payment, once per entitled party per tender. Sender-bound roles: only the tender buyer can cancel or award; only a non-buyer supplier can quote, one quote per supplier per tender, at most 8 quotes per tender and 8000 chars of quote terms in total (both caps enforced in the contract); quotes only while OPEN; a tender with quotes cannot be cancelled. Judgment is requested by the buyer (or by a quoter once the tender is full) and, once JUDGING, may be executed by anyone — the winner is decided by consensus, so the caller cannot bias it. A verbatim copy of the requirements is not a quote — quotes are judged on substance, not text matching.

The 10 GEN is a **selection award** (a prize for winning the tender), not the procurement contract value: the real contract price is agreed off-chain between buyer and winner after the award. The on-chain part solves fair selection and award ownership.

## Escrow exits (explicit actions only — Studionet has no clock)

- **Cancel while OPEN with zero quotes:** the buyer cancels and the full 10 GEN is credited back for withdraw. Cancel after quotes exist is forbidden (the buyer has already seen the quotes; cancel-after-quotes would let them take the quotes and the refund).
- **Direct award:** the buyer awards to any submitted quote while OPEN or JUDGING; the winner is credited 10 GEN. Direct award is the buyer's own choice and is NOT consensus-reviewed; the frontend marks it as such.
- **Judgment:** judgment is requested (OPEN, at least one quote) → JUDGING (quotes frozen) → anyone runs the judgment; validators return the winning quote id or NO_AWARD. A consensus disagreement leaves the tender JUDGING and the judgment can be retried; the buyer keeps the direct-award right until the tender settles.
- There are no time gates, block-time checks, or timestamps anywhere in the contract: every transition is an explicit action.

## Why GenLayer is indispensable here

Which quote "best satisfies the requirements" is a multi-factor semantic judgment — price against the budget, completeness of terms, and fit with the published requirements. No single honest server can settle it: a fixed scoring formula can be gamed by whoever writes the formula, and a single judge can be bribed or biased. TenderCourt needs several independent validators to read the requirements and the quotes and agree on one winner. Deterministic code — not any single LLM output — decides money and state.

## Capacity revision

Each quote has at most 1000 Unicode code points after trimming. Eight maximum-size quotes exactly fill the 8000-character total; no earlier quote can consume another slot’s capacity. The 8-address cap does not prevent Sybil slot filling. OPEN tenders with fewer than 8 quotes still require the buyer to act.

Historical V2 evidence and its original expectations are preserved in [evidence/v2](evidence/v2/). See [ERRATA.md](ERRATA.md) for the Tender 6 discrepancy.

## Contract

- `contracts/tendercourt.py` — `TenderCourt`, protocol `tendercourt-2.1`
- Fixed award: 10 GEN (`10000000000000000000` wei), `create_tender` is `@gl.public.write.payable` and takes requirements (20–2000 chars), a category from a fixed list of 8, and a budget cap (1–10,000 GEN)
- `submit_quote` (non-buyer supplier only, one per tender, price 1–budget GEN, terms 10–1000 chars, at most 8 quotes per tender, total terms capped at 8000 chars), `cancel_tender` (buyer, OPEN with zero quotes), `award_tender` (buyer, OPEN or JUDGING), `request_judgment` (buyer, or a quoter once the tender is full, OPEN with at least one quote), `judge` (anyone, JUDGING, consensus), `withdraw` (pull-payment)
- Narrow LLM: validators answer exactly one fixed question (`winner_quote_id` + one short `reason`); equivalence is exact agreement on the winner quote id; the reason is informational only (15–280 chars, not compared). The judgment prompt marks all INPUT as untrusted data and instructs validators to ignore any instruction embedded in it (see the injection evidence tender). The evidence is the on-chain text itself — no external URL fetch, no dead-link failure mode.
- Views: `get_tender`, `get_all_tenders`, `get_totals`, `get_protocol`, `get_limits` (quote caps + fee)
- Deployment facts: `evidence/deployment.json` (address, deploy tx, source SHA-256, byte parity). New execution plan: `EXPECTED.md` (local commit before execution, no public advance-registration timestamp asserted).

## Verification scope

Independent verification: `node scripts/verify_evidence.mjs` — 78/78 PASS (all 63 evidence transactions re-read live, byte parity, 7 tenders match EXPECTED.md, 70 GEN in = 70 out, balance 0, escrow 0). Post-evidence live-site write loop on tender 8 also complete (browser quote, fill-to-8, quoter-requested judgment, non-buyer judge, winner withdraw; 80 GEN in = 80 out). See [EVIDENCE.md](EVIDENCE.md). The configured Pages URL serves this revision (contract 0x616A603D3e95b5b871F4f1784e4F9E66e66104C4, protocol tendercourt-2.1).

## Frontend

Vite + React + TypeScript (`src/`), styled as a blueprint tender hall — deep blueprint blue, white line-work, brass award accents, paper tender cards. Bilingual CN/EN throughout; on-chain values (statuses, winner ids) in English.

- All reads pinned to `latest-final` with a visible FINALIZED marker + the time the latest-final readback completed (labelled as a readback time, with timezone — never presented as an on-chain finalization timestamp); cold start shows only unconfirmed/neutral state; no success is shown before FINALIZED + SUCCESS; export is gated until a FINALIZED readback.
- Wallet: OKX Wallet and MetaMask via injected provider (Studionet 61999 auto-add, wrong-chain detection with switch prompt and verification, writes blocked until the chain is correct). Writes also offer a clearly labelled in-browser temporary test account (key in sessionStorage only, free testnet GEN funding), never packaged as a user-wallet signature.
- Temporary-account safety: escrow funding (`create_tender`) requires a persistent wallet — a temp account is blocked from posting tenders. The temp private key is shown once with copy/export and an "I saved my key" acknowledgement before its first write; a persistent risk banner is shown while a temp account is active; disconnect/rotate checks the address's pending quotes on OPEN/JUDGING tenders and its unwithdrawn funds on any status, names the exact tenders and amounts, and requires the key to be backed up first; the key can be exported at any time.
- Tx lifecycle: the tx hash is saved to localStorage immediately after send; a timeout is shown as "unknown — check chain", never as a final failure; polling continues and resumes after refresh from the stored hash; success is shown only on FINALIZED + SUCCESS. Every write asks for a double confirmation (action + amount + tender) before sending.
- The frontend targets the deployment in `public/deployment.json`. Browser interaction with the capacity revision has not yet been verified. Bundle is version-stamped (`?v=<sha>`) after build so GitHub Pages never serves a stale build.

## Run locally

```bash
npm install
npm run build
npm run preview
```

## Deploy & verify (Stable Studionet only)

```bash
npm test            # contract mock tests (30 cases)
node scripts/deploy_studionet.mjs    # deploy + byte-parity check
node scripts/run_evidence.mjs        # full evidence run (7 tenders + 16 on-chain negatives neg0–neg15; resumable)
node scripts/verify_evidence.mjs     # independent re-verification, read-only
```

Evidence transactions: `evidence/transactions.json` (see `EVIDENCE.md`).

## What this project does not prove

- **The 10 GEN is the award, not the contract value.** The on-chain award pays the winner of the selection; the real procurement price is agreed off-chain. Nothing here verifies that the winner actually delivers the work.
- **The reason text is not compared.** Validators must agree exactly on the winning quote id; the one-sentence reason is explanatory text only and is not part of the equivalence check.
- **The direct-award path pays without consensus, by the buyer's own choice.** When the buyer awards directly, the full award is released with no validator judgment at all. That is the intended UX (a buyer who already knows the winner should not wait for a court), not a verification of quality.
- **No clock-based timeout.** Studionet has no clock, so a tender left OPEN with 1–7 quotes whose buyer disappears cannot advance (no fair timeout exists without a clock); the escrow is 10 test GEN and no supplier paid anything, so the harm is bounded to a lost chance at the award. A tender left JUDGING can always advance, because anyone may execute the judgment.
- **Validator judgment is LLM agreement, not proof.** Validators are independent LLM calls agreeing on one winning quote id; agreement is not a mathematical proof that the quote is best, and a consensus disagreement leaves the tender unsettled (retryable).

## Known limitations

- Fixed award of 10 GEN per tender; no variable pricing.
- Quotes are the suppliers' own words; consensus judges fit with the published requirements, it does not verify off-chain delivery capability.
- No time gates: every transition is an explicit action; a tender stays OPEN until the buyer awards, requests judgment, or cancels (zero quotes only), and stays JUDGING until anyone runs the judgment or the buyer awards directly.
- One quote per supplier per tender; at most 8 quotes per tender and 8000 chars of quote terms in total; a supplier cannot revise a quote — a new tender is needed for a revised offer.
- `get_all_tenders` returns the full tender list in one view call: fine at current scale, but a large tender count will eventually hit Studionet's view-payload limits — the board has no pagination yet.
- Platform behavior (verified live 2026-11-11): on Studionet a FAILED payable call does not refund the sent value — it stays in the contract with no entitlement. Evidence never sends value on an expected-failure payable call. The frontend validates every `create_tender` / `submit_quote` input against the contract bounds (code-point counts) before any payable send.

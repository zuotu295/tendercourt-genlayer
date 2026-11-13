# TenderCourt v2.2 validation expectations

Protocol: `tendercourt-2.2`. Network: Stable Studionet, 61999,
https://studio.genlayer.com/api. No v2.2 chain transactions have been executed.

Recovery uses the supplier-triggered alternative, not an elapsed-time timeout.
An accepted supplier may immediately close an OPEN tender with 1–8 quotes.
This is an explicit competition/liveness tradeoff: later suppliers may be excluded.
No clock availability claim is needed. The buyer cannot override consensus once
JUDGING. Transaction ordering still determines which OPEN action runs first.

## Local contract coverage

`python3 tests/test_tendercourt_mock.py` runs the actual contract against a
stub GenLayer module; canned leader/validator outputs exercise deterministic
settlement. These are not live consensus or real transfers.

For every count 1 through 7, with the buyer inactive after creation:

| Scenario | Expected result |
| --- | --- |
| Accepted supplier requests judgment | JUDGING; same quotes; no credit yet |
| Unrelated address requests judgment | Exact authorization error; unchanged state |
| Independent caller judges with agreeing winner | AWARDED; selected supplier has 10 GEN credit, buyer zero |
| Independent caller judges with NO_AWARD | CANCELLED; buyer has 10 GEN credit, suppliers zero |
| Winner/refund owner withdraws | Exactly one emitted 10 GEN transfer; escrow zero |
| Outsider, loser, wrong recipient or repeated withdrawal | NO_CREDIT; no extra transfer |

Additional tests reject buyer award/cancel after recovery, late quotes,
repeated judgment requests, invalid winner ids/types and disagreeing validators.
Disagreement leaves JUDGING unchanged and permits retry. Empty tenders cannot
be supplier-closed. The original create, quote bounds/caps, cancel, direct award
while OPEN, full-fill judgment and accounting paths remain tested.

## Required live validation after a new deployment

Use new checkpoint and evidence paths; never reuse v2.1 receipts as v2.2 proof.
Record deploy receipt FINALIZED + MAJORITY_AGREE + leader SUCCESS, exact deployed
source bytes/SHA-256, and latest-final protocol `tendercourt-2.2`.
On fresh tenders with 1–7 quotes exercise supplier request, independent judge,
winner settlement/withdrawal and NO_AWARD refund/withdrawal. Record all receipts,
including failed attempts and disagreements, and the final readbacks and balances.
Verify outsider request, buyer override, late quotes and double withdraw are
rejected with exact errors and unchanged tender/credit state. Send no value on
negative payable calls. Check aggregate received equals withdrawn, zero residual
escrow, and actual recipient balance changes. Mock transfers cannot prove these.
Update deployment metadata only with the new verified deployment, rebuild Pages,
and exercise the supplier action and withdrawal from the browser.

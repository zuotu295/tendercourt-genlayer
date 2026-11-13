# Live validation observations

These observations supplement the transaction manifests; they are not business
success claims. Every actual failed transaction remains in its case manifest.

- The first receipt export encountered a JavaScript BigInt serialization error.
  The create transaction was retained by hash and then exported with BigInt
  values serialized as decimal strings. It was not sent again.
- Test-account faucet setup hit `sim_fundAccount`'s 30-per-minute rate limit.
  Account setup was narrowed to the accounts needing value for tender creation;
  already funded accounts were read before any funding attempt. The restriction
  was not bypassed. Nonpayable test calls can use zero-balance test accounts.
- A receipt read returned HTML instead of JSON during refund-7. The pending quote
  hash was preserved and read again; no duplicate quote was submitted. The runner
  now retries receipt reads without signing another transaction.
- An immediate winner-1 balance read after the withdrawal's parent receipt
  finalized still showed the old recipient balance. A later read showed the
  expected additional 10 GEN. Both observations are preserved. The runner waits
  for the actual recipient credit without submitting another withdrawal.
  Finalized external value messages and their balance visibility are distinct
  observations; see the official [value-transfer documentation](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers).
- Independent cases use separate test-account sets so one case's recipient
  balance cannot be increased by another case. Negative tests compare that
  tender's state; aggregate contract balances are checked after the full matrix.

All amounts are free Studionet test GEN. No real GEN purchase or transfer is
represented by these tests. The source is the v2.2 deployed byte-for-byte source;
the local mock harness is not used for the live consensus results.

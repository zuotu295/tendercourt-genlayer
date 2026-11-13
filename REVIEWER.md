# TenderCourt supplier recovery

`tendercourt-2.2` removes the full-capacity condition from `request_judgment`.
Only the buyer or an address already present in the accepted quote set may
start judgment. This works with one to seven quotes without buyer cooperation.
Quotes freeze in JUDGING; anyone may execute consensus judgment. The buyer's
direct-award method now accepts OPEN only, preventing a later override.

This implements the supplier-triggered alternative to a deadline. It provides
no guaranteed bidding period: a supplier may close the window immediately after
its quote is accepted. An unrelated address cannot close it without first
submitting an eligible quote. One-address-one-quote is not Sybil protection.
Consensus can still disagree or be unavailable; retry does not guarantee success.

Tests cover all seven partial sizes, winner and NO_AWARD outcomes, withdrawal
ownership, duplicate withdrawal, invalid consensus results, frozen quotes and
buyer override rejection. See EXPECTED.md for scope and the live validation plan.

Current deployment: `0xD879F2Aa15f8420694872e229424AF06cD9929B9`,
protocol tendercourt-2.2, FINALIZED successful deployment and exact source byte
parity. Recovery matrix validation is recorded in EVIDENCE.md. The previous
v2.1 transactions and all recorded failures remain historical evidence only.

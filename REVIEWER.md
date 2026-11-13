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

The existing deployed address is v2.1. No v2.2 deployment or live validation is
claimed. EVIDENCE.md preserves the historical transactions, including failures;
they do not prove this revision. New deployment and live consensus/withdrawal
receipts are required before presenting v2.2 as chain-verified.

# TenderCourt v1 — Evidence

Contract: [0xD2A0Fe94cCb632D6307a4215b722643e6164ed0D](https://explorer-studio.genlayer.com/address/0xD2A0Fe94cCb632D6307a4215b722643e6164ed0D)
Deploy tx: [0xdb266998…](https://explorer-studio.genlayer.com/tx/0xdb26699819ff328cd3dc57e2c26a07413d209227414114ac28b0b436c09afd4a)
Protocol: tendercourt-1 · Source SHA-256: 58333ca7185c0eccc123d3472f84035bf78e47d41a98518c0fc993b1af51d3bb · Byte parity with `contracts/tendercourt.py`: TRUE

All transactions below are FINALIZED on Stable Studionet (Chain ID 61999). Success steps: FINALIZED + MAJORITY_AGREE + leader SUCCESS. Negative steps (neg0–neg11): FINALIZED + MAJORITY_AGREE + leader ERROR with the expected error code in the live receipt, and no state change.

## Tender outcomes (live readback, latest-final)

| Tender | Category | Budget | Status | Winner | Winner credit | Buyer credit |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Software Development | 500 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |
| 2 | Design | 300 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |
| 3 | Writing & Translation | 200 GEN | CANCELLED | NO_AWARD | 0 GEN | 10 GEN |
| 4 | Consulting | 400 GEN | CANCELLED | NO_AWARD | 0 GEN | 10 GEN |
| 5 | Writing & Translation | 250 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |

- Tender 1 (AWARDED, winner quote 1): three quotes — complete terms at 400 GEN, thin terms at 480 GEN, no ordering/menu at 350 GEN — validators judge quote 1 the winner; the supplier withdraws 10 GEN.
- Tender 2 (AWARDED, winner quote 1): two complete quotes; the buyer awards directly to quote 1 without judgment; the supplier withdraws 10 GEN.
- Tender 3 (CANCELLED, NO_AWARD): both quotes fail the requirements — machine-only translation with no review, and the first 5 pages only — validators return NO_AWARD (0); the buyer withdraws the full 10 GEN refund.
- Tender 4 (CANCELLED): the buyer cancels while OPEN with zero quotes; the buyer withdraws the full 10 GEN refund.
- Tender 5 (AWARDED, winner quote 1, injection): quote 2 embeds an instruction telling validators to pick it — validators judge quote 1 the winner (not the injected quote 2); the supplier withdraws 10 GEN.

## GEN accounting (live readback, latest-final)

- Total received: 50 GEN (5 tenders × 10 GEN)
- Total withdrawn: 50 GEN
- Contract balance: 0 GEN
- Escrowed: 0 GEN
- Tender count: 5

## Evidence transactions

| Step | Result | Transaction |
| --- | --- | --- |
| t1-create | ok | [0x4c73f700…](https://explorer-studio.genlayer.com/tx/0x4c73f70001ad3b1e6ce6cdca53eb3f1959a35dcfa04480d1d54dbaa8c9d3a5e0) |
| t2-create | ok | [0x25cfc558…](https://explorer-studio.genlayer.com/tx/0x25cfc5589762430ee40c8f1a1a532c6bc5a7f94de038f322d1dccadf52bbf6d2) |
| t3-create | ok | [0x1269ee71…](https://explorer-studio.genlayer.com/tx/0x1269ee71075375a290bdc876bb02664b5b24f0720383603b377411b890d5a668) |
| t4-create | ok | [0x97ade2cb…](https://explorer-studio.genlayer.com/tx/0x97ade2cb431b1f28af65536dba1877aece88a8b8c80371f98d4e616bbbc23e7d) |
| t5-create | ok | [0x57a7b961…](https://explorer-studio.genlayer.com/tx/0x57a7b9611eefa2cb38088133daaef7d0b85562d1245abb74fb69fba17130ecb0) |
| t1-quote-1 | ok | [0xf8942ddf…](https://explorer-studio.genlayer.com/tx/0xf8942ddf07c6ea7b76f1499fd61a2b79c319462e45dd76eb131c1274fa97db6e) |
| t1-quote-2 | ok | [0x01ce6459…](https://explorer-studio.genlayer.com/tx/0x01ce6459229826f7140cd6825e2ccdd858905344fb2924b65d4e51beff641734) |
| t1-quote-3 | ok | [0x70d8f30d…](https://explorer-studio.genlayer.com/tx/0x70d8f30d2755d554509846149a1af1b9a851ddf965d67f983673e6e942a7957a) |
| t2-quote-1 | ok | [0xe194e0ce…](https://explorer-studio.genlayer.com/tx/0xe194e0cecfe02128b82506b8e0d0e826ee0e0c4d63e39eee560ab928e2e4e083) |
| t2-quote-2 | ok | [0x1a40a59d…](https://explorer-studio.genlayer.com/tx/0x1a40a59dd32bf2da208f50752e360816f350c3a639e78d4ecd7ab3a9e461ccca) |
| t3-quote-1 | ok | [0xac348f66…](https://explorer-studio.genlayer.com/tx/0xac348f66518816e7decf56709d3b5d9b36b0e607f0f759a72386a9037080c721) |
| t3-quote-2 | ok | [0x30221c78…](https://explorer-studio.genlayer.com/tx/0x30221c78354cc3df7769385f004cb6467f46b8181bbca25968543a8ec74e73b0) |
| t5-quote-1 | ok | [0xe87f0671…](https://explorer-studio.genlayer.com/tx/0xe87f0671c69cdb95ddd5dfbbc05df4c993e037e275151e8004b580e2f283e8d8) |
| t5-quote-2 | ok | [0xb52428d8…](https://explorer-studio.genlayer.com/tx/0xb52428d847ef992d7edfb6eff578af5c94192aeb72312e43dbceedcf4a9ca38b) |
| neg0-wrong-fee-create | error-observed (FEE_MUST_BE_10_GEN) | [0x38582035…](https://explorer-studio.genlayer.com/tx/0x385820354ec3861740306cfd313c5f7bd17c68375da408a95daba7d4394065eb) |
| neg1-buyer-quotes-own | error-observed (BUYER_CANNOT_QUOTE_OWN_TENDER) | [0xae11464d…](https://explorer-studio.genlayer.com/tx/0xae11464d0c1aa22e330e4f615afd2922006df631d9ccc41f1fa8954bff8afdd5) |
| neg2-duplicate-quote | error-observed (DUPLICATE_QUOTE) | [0x74542b8e…](https://explorer-studio.genlayer.com/tx/0x74542b8e0c5b03d658dcee3722829a6c78c04a3a822569f9638a98583e0d7a09) |
| neg3-price-over-budget | error-observed (QUOTE_PRICE) | [0xaee9a3ad…](https://explorer-studio.genlayer.com/tx/0xaee9a3ad98d65da4a7fa4b02cd9487e04ee58802099c30df136f78d052c2fb52) |
| neg4-price-zero | error-observed (QUOTE_PRICE) | [0x69dfe450…](https://explorer-studio.genlayer.com/tx/0x69dfe450905b1082ebd6ae8c6b2171b3af1244bccd25c72d7f18dd8223466b70) |
| neg5-outsider-award | error-observed (ONLY_BUYER_CAN_AWARD) | [0x6d6388ca…](https://explorer-studio.genlayer.com/tx/0x6d6388ca18f9f0119c34c1a696ee195132446fbd4394e4a16d16326fe847cdef) |
| neg6-outsider-cancel | error-observed (ONLY_BUYER_CAN_CANCEL) | [0x80725272…](https://explorer-studio.genlayer.com/tx/0x80725272e6fa6f60a24f7bc7e3e9ed1c7ff617f70a34e6c2bdb3220b83c9c893) |
| neg7-outsider-request-judgment | error-observed (ONLY_BUYER_CAN_REQUEST_JUDGMENT) | [0xcfb1dd63…](https://explorer-studio.genlayer.com/tx/0xcfb1dd63234b574b4294abcf8e8c6ddcbe0396b207c29cf79e0770168c2f5eef) |
| neg9-cancel-after-quotes | error-observed (CANNOT_CANCEL_WITH_QUOTES) | [0x58a0bf5e…](https://explorer-studio.genlayer.com/tx/0x58a0bf5e5ada483a8bf3955cf939462e37f84ae0ec8d20446f7f8b4329fd50b6) |
| neg10-award-unknown-quote | error-observed (QUOTE_NOT_FOUND) | [0xb7d2a564…](https://explorer-studio.genlayer.com/tx/0xb7d2a56479796a72a67501a42450af3b96dce4b4923fe2794fedcfed2427659f) |
| neg11-request-judgment-no-quotes | error-observed (NO_QUOTES) | [0xc9f3bacb…](https://explorer-studio.genlayer.com/tx/0xc9f3bacb84e5979193fbd28989c5cfba99a8518f7574fc01523b434538cf4cca) |
| t1-request-judgment | ok | [0x59dc8387…](https://explorer-studio.genlayer.com/tx/0x59dc8387bce9f838e2abcd501c9306a3394875e119d9f5d9edff5615daceb583) |
| t1-judge | ok | [0xd20a59c3…](https://explorer-studio.genlayer.com/tx/0xd20a59c3f1e85f559458663398e7749ad59d9a50fb450386a42afc4a5578be43) |
| t2-award | ok | [0x2e43836a…](https://explorer-studio.genlayer.com/tx/0x2e43836a54171165c81d8480f8954b6c3482965bf2cd5ef5f8fc0231adfd36d9) |
| t3-request-judgment | ok | [0x4b7b3247…](https://explorer-studio.genlayer.com/tx/0x4b7b324794cf0c57308ab79982ef61f15a046943b830b79e731a1c071fed22eb) |
| t3-judge | ok | [0xed5b93a5…](https://explorer-studio.genlayer.com/tx/0xed5b93a5cb6d0aaec72e9577479236aad269fcd599b6d8420f9f2a0df39d21b9) |
| t4-cancel | ok | [0x3e7045eb…](https://explorer-studio.genlayer.com/tx/0x3e7045ebac85cb5105d15e9d141dc6215cca65f323406a63d58dbb9e6e33d56b) |
| t5-request-judgment | ok | [0x47b1bafd…](https://explorer-studio.genlayer.com/tx/0x47b1bafdd7e88e044173524830744711530404f54a180e423775afe8f890ac8e) |
| t5-judge | ok | [0xa09c2f82…](https://explorer-studio.genlayer.com/tx/0xa09c2f82a4f71c51800b79c6bda51740ed45e31233a10bff86ddd88d28b9cc3a) |
| t1-winner-withdraw | ok | [0x2bffd031…](https://explorer-studio.genlayer.com/tx/0x2bffd0312ceef3dfc2f0aafd3cb629ffcb3c740923ad247e899776b2d6f92611) |
| t2-winner-withdraw | ok | [0x4a0374a4…](https://explorer-studio.genlayer.com/tx/0x4a0374a4b326b64987be5b3a95f928d698ec2212cdec5c907d2f3dc06c8837b2) |
| t3-buyer-withdraw | ok | [0xff30407a…](https://explorer-studio.genlayer.com/tx/0xff30407a5a6924efe91b50d8f08a5bc5f17b3e31142917f15aa1767651b98995) |
| t4-buyer-withdraw | ok | [0x00e52277…](https://explorer-studio.genlayer.com/tx/0x00e5227707802a1cb9fb02f7c965e80278a7c6917d5d9948e3058a3694047334) |
| t5-winner-withdraw | ok | [0x7670b558…](https://explorer-studio.genlayer.com/tx/0x7670b5589b71eb2a9ba5d536fc8788ba0dd07768bd1ebd0285c1303a850a43b6) |
| neg8-double-withdraw | error-observed (NO_CREDIT) | [0x430f65b9…](https://explorer-studio.genlayer.com/tx/0x430f65b95fff2df340b67f1f982c6ef4154c8f6327817471f227a669cd1ea289) |

## Live-site write loop (post-evidence, tender 6)

Not part of the pre-registered 39-tx evidence set (tenders 1–5 only).
Proven 2026-11-12 ~01:46 CST in a real Chromium browser against the
live site (https://zuotu295.github.io/tendercourt-genlayer/), bundle
?v=9f8793c2.

- Tender 6 created (script, buyer 0xbe5c49b1d0a19d58fc7078560c44903e1b60b0f3):
  create tx [0xf023541f…](https://explorer-studio.genlayer.com/tx/0xf023541f8b1e90de14e8a871be7a09636ad0f7ea03b481a3c1c1f3f02b45e89e) (FINALIZED + SUCCESS). Design, budget 300 GEN, 10 GEN award.
- Browser as a fresh temporary supplier (0x4e7ff940625bd500d5f8519a2a1a2f575f7c29fa):
  over-budget quote (301 GEN) blocked in the UI — error “报价为 1–预算之间的整数 GEN。”, submit disabled, supplier nonce 0 → 0 (no tx sent).
  Valid quote (240 GEN) submitted from the browser: quote tx
  [0x6e9e38ce…](https://explorer-studio.genlayer.com/tx/0x6e9e38ce133295237ca1d08938555367ef7ea535e05e234ab3a45966ad3b6278) (FINALIZED + SUCCESS), nonce 0 → 1. The double-confirm appeared with tender / price / terms before sending.
- Buyer awarded the browser's quote (script): award tx
  [0x62e5d6a4…](https://explorer-studio.genlayer.com/tx/0x62e5d6a48e38887e3751ed2c6e7909011383cca093caff98eaaf42ab49e4b075) (FINALIZED + SUCCESS).
- Browser withdrew the 10 GEN award: withdraw tx
  [0xa6e48fc4…](https://explorer-studio.genlayer.com/tx/0xa6e48fc4b3c146b81f6c377960551cc8630c000ac0721f8cfe43cd48aa489663) (FINALIZED + SUCCESS). Supplier balance 100 → 110 GEN (+10 GEN exactly). Tender 6 AWARDED, winner quote 1, winner_withdrawn true.
- Totals after the write loop: 60 GEN in = 60 GEN out, balance 0, escrow 0, tender count 6.
- The temporary test accounts' keys were deleted when the flow completed. Buyer B3 holds 90 test GEN and supplier SB holds 110 test GEN, both unrecoverable — testnet GEN only, zero economic impact.
- 375px: the write loop first found horizontal overflow (scrollWidth 519 at a 375px viewport) from the unbreakable contract-address / Source SHA-256 lines. Fixed by `overflow-wrap: anywhere` on `.mono` (bundle ?v=b2041366, commit 31f23b3); re-check PASSED — scrollWidth 375, no element wider than the viewport, full address and SHA still visible as wrapped text.

## Notes

- The 10 GEN is the selection award, not the procurement contract value.
- No value was sent on any expected-failure payable call. Platform behavior (verified live 2026-11-11): on Studionet a FAILED payable call does not refund the sent value — it stays in the contract with no entitlement — so evidence never sends value on a negative payable.
- Pre-registered expectations: EXPECTED.md (written before the evidence run). Independent re-verification: `node scripts/verify_evidence.mjs`.

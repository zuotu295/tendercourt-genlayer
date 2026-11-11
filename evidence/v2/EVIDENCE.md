# TenderCourt v2 — Evidence

Contract: [0xfbF78EB703FBaaD95DCc05263DAF8cf3E6c64A45](https://explorer-studio.genlayer.com/address/0xfbF78EB703FBaaD95DCc05263DAF8cf3E6c64A45)
Deploy tx: [0x6859d0ec…](https://explorer-studio.genlayer.com/tx/0x6859d0ec7f4050a4a4c74f8f8aef2c6e04f33621bb7e416904f2e5bdf5ad664f)
Protocol: tendercourt-2 · Source SHA-256: c51d01033813735e3545ac7b69e93e0345c93dd5bca877e2fbcfd80256cd4d73 · Byte parity with `contracts/tendercourt.py`: TRUE

All transactions below are FINALIZED on Stable Studionet (Chain ID 61999). Success steps: FINALIZED + MAJORITY_AGREE + leader SUCCESS. Negative steps (neg0–neg15): FINALIZED + MAJORITY_AGREE + leader ERROR with the expected error code exactly equal to the leader receipt's error payload, and no state change.

v1 evidence (tenders 1-5 on contract 0xD2A0Fe94cCb632D6307a4215b722643e6164ed0D) is archived in evidence/v1/. It does NOT prove this contract; the evidence below is fresh, on this deployment.

## Tender outcomes (live readback, latest-final)

| Tender | Category | Budget | Status | Winner | Winner credit | Buyer credit |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Software Development | 500 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |
| 2 | Design | 300 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |
| 3 | Writing & Translation | 200 GEN | CANCELLED | NO_AWARD | 0 GEN | 10 GEN |
| 4 | Consulting | 400 GEN | CANCELLED | NO_AWARD | 0 GEN | 10 GEN |
| 5 | Writing & Translation | 250 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |
| 6 | Design | 500 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |
| 7 | Writing & Translation | 800 GEN | AWARDED | quote 1 | 10 GEN | 0 GEN |

- Tender 1 (AWARDED, winner quote 1): three quotes — complete terms at 400 GEN, thin terms at 480 GEN, no ordering/menu at 350 GEN — validators judge quote 1 the winner; the supplier withdraws 10 GEN.
- Tender 2 (AWARDED, winner quote 1): two complete quotes; the buyer awards directly to quote 1 without judgment; the supplier withdraws 10 GEN.
- Tender 3 (CANCELLED, NO_AWARD): both quotes fail the requirements — machine-only translation with no review, and the first 5 pages only — validators return NO_AWARD (0); the buyer withdraws the full 10 GEN refund.
- Tender 4 (CANCELLED): the buyer cancels while OPEN with zero quotes; the buyer withdraws the full 10 GEN refund.
- Tender 5 (AWARDED, winner quote 1, injection): quote 2 embeds an instruction telling validators to pick it — validators judge quote 1 the winner (not the injected quote 2); the supplier withdraws 10 GEN.
- Tender 6 (AWARDED, winner quote 1, liveness): eight quotes fill the tender to the 8-quote cap; a ninth quote is rejected on-chain (QUOTE_LIMIT). Quoter S1 requests judgment (the tender is full) and a non-buyer (OUT) executes the consensus judgment; validators judge quote 1 the winner; the supplier withdraws 10 GEN.
- Tender 7 (AWARDED, winner quote 1, terms cap): four quotes carry exactly 2000 chars of terms each (8000 total = the cap); a fifth quote is rejected on-chain (QUOTE_TERMS_TOTAL). The buyer requests judgment and the judgment runs over the 8000-char prompt; validators judge quote 1 the winner; the supplier withdraws 10 GEN.

## GEN accounting (live readback, latest-final)

- Total received: 70 GEN (7 tenders × 10 GEN)
- Total withdrawn: 70 GEN
- Contract balance: 0 GEN
- Escrowed: 0 GEN
- Tender count: 7

## Evidence transactions

| Step | Result | Transaction |
| --- | --- | --- |
| t1-create | ok | [0x2dc62f33…](https://explorer-studio.genlayer.com/tx/0x2dc62f33a6ed640e0684819c5d74c7df99e8afbb92b4bdfd419e36becbf0fe9c) |
| t2-create | ok | [0xbac7baf5…](https://explorer-studio.genlayer.com/tx/0xbac7baf5e814eefe92b79bc2c5bd4d914974228b9c87f8520d23bf970fb0775b) |
| t3-create | ok | [0xe2270c94…](https://explorer-studio.genlayer.com/tx/0xe2270c943b03544ddf4af6c75a5421f820475908a555cbb2b68a9f100dd86bc2) |
| t4-create | ok | [0xc3590d22…](https://explorer-studio.genlayer.com/tx/0xc3590d2255b18d1b01a9d94be825635da99c7d8a32566ab9bc54b5ce15439df6) |
| t5-create | ok | [0x9561f3a1…](https://explorer-studio.genlayer.com/tx/0x9561f3a1f611551254b4a4c031204fd9d35afed505e9daf868e1080bbfe581b7) |
| t6-create | ok | [0x1a1bf001…](https://explorer-studio.genlayer.com/tx/0x1a1bf0010a62fd92a98aaa55dd681f4dc79da0f36cc976cb33bac8845e76baa9) |
| t7-create | ok | [0x0465dd5c…](https://explorer-studio.genlayer.com/tx/0x0465dd5c4bdf422e57063677135641e59f69747155894a88cdce834064030ec4) |
| t1-quote-1 | ok | [0x58026fdd…](https://explorer-studio.genlayer.com/tx/0x58026fdd0ed615efae95776c07626e01b0a4d20ebe26bef90c26421b884b029c) |
| t1-quote-2 | ok | [0xc62fa5a9…](https://explorer-studio.genlayer.com/tx/0xc62fa5a95db2073469686d4c1e4f1a3aabb2159bf4b9a21d4ee6c8becb6de51b) |
| t1-quote-3 | ok | [0xfc30fb55…](https://explorer-studio.genlayer.com/tx/0xfc30fb55a7b9324e7fd86ce736965db28e49151d4dc8f170e84d41af9d1abd2a) |
| t2-quote-1 | ok | [0xd2c743b8…](https://explorer-studio.genlayer.com/tx/0xd2c743b84f97afd4b3099b9bd3de05be87b4e325ec234b0b1fdd907ff8de16c6) |
| t2-quote-2 | ok | [0x13f1634a…](https://explorer-studio.genlayer.com/tx/0x13f1634aaeb989e9d876b9b665492d54256a3f297d0449b9d151e95980b9f67e) |
| t3-quote-1 | ok | [0x1bec2427…](https://explorer-studio.genlayer.com/tx/0x1bec242714bc35ee6b568152236ca572fbf3ff7627c1c140b507e9c7c61b6ef9) |
| t3-quote-2 | ok | [0x23184c05…](https://explorer-studio.genlayer.com/tx/0x23184c05dfa3dd242128b366251f6a4ec76e15f3849911e38e117b4008c9443c) |
| t5-quote-1 | ok | [0x759671c9…](https://explorer-studio.genlayer.com/tx/0x759671c995304610f13673195865f47d479ac2ac7f364c5b4d64141de3c71f04) |
| t5-quote-2 | ok | [0x3f27071b…](https://explorer-studio.genlayer.com/tx/0x3f27071b1f33bccd2746f8fc4617a5640986416bca504296efc0ecd915dfb6c5) |
| t6-quote-1 | ok | [0x660b35f4…](https://explorer-studio.genlayer.com/tx/0x660b35f4d0d0e7a72d723a6574e9c8e61722bb05cf8922c567a9c607a244027d) |
| t6-quote-2 | ok | [0x216ebbc4…](https://explorer-studio.genlayer.com/tx/0x216ebbc47b4e30e41da496a4d49b809ee0d9c7b90423bd4edd34cb92ff2d1383) |
| t6-quote-3 | ok | [0x6efddaaf…](https://explorer-studio.genlayer.com/tx/0x6efddaaffdc1996177801c3350b0b20ea4238821c184c8ec42f08d04e969671d) |
| t6-quote-4 | ok | [0xa275f856…](https://explorer-studio.genlayer.com/tx/0xa275f8566610a330b56d1ccee06e736ce7e5c55174a876699678a8aae50f8149) |
| t6-quote-5 | ok | [0xf88c5d43…](https://explorer-studio.genlayer.com/tx/0xf88c5d43a57bf7a7e92009b1bd44ff4ee63c20bc443ec77deb6d0373f25513f1) |
| t6-quote-6 | ok | [0x2f373e46…](https://explorer-studio.genlayer.com/tx/0x2f373e46b2c5de71106555acc1756c88d7beb8703fb05c366051fc343da25c95) |
| t6-quote-7 | ok | [0xeaa9002c…](https://explorer-studio.genlayer.com/tx/0xeaa9002ccfbae1471eecbc7f80cb1b757628b7c6becd39d7de414d187751741c) |
| t6-quote-8 | ok | [0x849d0e3c…](https://explorer-studio.genlayer.com/tx/0x849d0e3c880393444a405eef2bf6ec60f1e79b6b002a7e78e7bdc6cd1c303a3f) |
| t7-quote-1 | ok | [0xd4a2270b…](https://explorer-studio.genlayer.com/tx/0xd4a2270b457eb138428a502a6b4feb32953f6dfaa90214db1ccf4cc8086d4a73) |
| t7-quote-2 | ok | [0xfb80f17d…](https://explorer-studio.genlayer.com/tx/0xfb80f17d5a807f2265a0b7c05b9d31a48c18ec79f01b853ed1f1c0339c46e91f) |
| t7-quote-3 | ok | [0x3cb602e1…](https://explorer-studio.genlayer.com/tx/0x3cb602e19bf52f0d00b45b638cf5f830868cf1f5b89aa16e81ae101d9ac25efe) |
| t7-quote-4 | ok | [0x8533e4f6…](https://explorer-studio.genlayer.com/tx/0x8533e4f61229a618e463780b3aee9a3af01444372ff204ba983f9392f2049ac4) |
| neg0-wrong-fee-create | error-observed (FEE_MUST_BE_10_GEN) | [0x7dd9bfa6…](https://explorer-studio.genlayer.com/tx/0x7dd9bfa6595ddb4c521a4c82d6dbed65413190bf9a591d079f4361915c638ee5) |
| neg1-buyer-quotes-own | error-observed (BUYER_CANNOT_QUOTE_OWN_TENDER) | [0xc7b91ca5…](https://explorer-studio.genlayer.com/tx/0xc7b91ca54e378bc0598f6f8cdfc26d879c49f91779a3d2bc7f89b8c0a0168f2b) |
| neg2-duplicate-quote | error-observed (DUPLICATE_QUOTE) | [0x8abdc406…](https://explorer-studio.genlayer.com/tx/0x8abdc4063872333ebf31837c19dd8a067cd3e292a96f5dd98bee442f330f36e0) |
| neg3-price-over-budget | error-observed (QUOTE_PRICE) | [0x0442821c…](https://explorer-studio.genlayer.com/tx/0x0442821c36b0be1b41727e599217af6159f0704b2e680c89070a41883145149d) |
| neg4-price-zero | error-observed (QUOTE_PRICE) | [0xf344c652…](https://explorer-studio.genlayer.com/tx/0xf344c65223eedab5ae2854347a4282d19e4902232c12c36177a29c2596fdc83a) |
| neg5-outsider-award | error-observed (ONLY_BUYER_CAN_AWARD) | [0xaf861410…](https://explorer-studio.genlayer.com/tx/0xaf861410466155455f0e6856ebe36b32b9ea601b1bce1e5b93cc921104a1a89f) |
| neg6-outsider-cancel | error-observed (ONLY_BUYER_CAN_CANCEL) | [0x229f2ca4…](https://explorer-studio.genlayer.com/tx/0x229f2ca46675e8076d04396e683a031ce3626d230eed211a479930c6ece7ba80) |
| neg7-outsider-request-judgment | error-observed (ONLY_BUYER_CAN_REQUEST_JUDGMENT) | [0xb80a3c54…](https://explorer-studio.genlayer.com/tx/0xb80a3c54671922c7d15f91965f66e023d9bab8e565d8db491c531ddb2fc10805) |
| neg9-cancel-after-quotes | error-observed (CANNOT_CANCEL_WITH_QUOTES) | [0x9499b910…](https://explorer-studio.genlayer.com/tx/0x9499b9108483d0e8e9a0af74848edab8025efd1c2bf22ec03c6e267db0deded1) |
| neg10-award-unknown-quote | error-observed (QUOTE_NOT_FOUND) | [0xdb99e7f0…](https://explorer-studio.genlayer.com/tx/0xdb99e7f054467e559ac0df7eddc673f0a19dfe076054327213d59155b66ee756) |
| neg11-request-judgment-no-quotes | error-observed (NO_QUOTES) | [0x619f0b2b…](https://explorer-studio.genlayer.com/tx/0x619f0b2ba65c69c45ae97eba3d4a66a8a373b6deb71cd87630f7eb6bef9be94c) |
| neg12-ninth-quote-full-tender | error-observed (QUOTE_LIMIT) | [0x00780aa3…](https://explorer-studio.genlayer.com/tx/0x00780aa3754bc7e53202c445e4e9bbae1783c8fdda89ace32019bb8ef96d19ca) |
| neg13-fifth-quote-over-terms-total | error-observed (QUOTE_TERMS_TOTAL) | [0x11a519fa…](https://explorer-studio.genlayer.com/tx/0x11a519fa322d5a2a56c087b04c3739f68b1636c59dbc355961461641c7afea01) |
| neg14-judge-while-open | error-observed (TENDER_NOT_JUDGING) | [0xfb8b1b53…](https://explorer-studio.genlayer.com/tx/0xfb8b1b53c34f42477240936a8cd5fe2bc5adce4ecb2d1f291ebe194c462277ba) |
| neg15-quoter-request-not-full | error-observed (ONLY_BUYER_CAN_REQUEST_JUDGMENT) | [0x9ddead29…](https://explorer-studio.genlayer.com/tx/0x9ddead290adc3808b90e34ea55461aa79f07da72fb0815a09cca542b81de45d9) |
| t1-request-judgment | ok | [0x5082a145…](https://explorer-studio.genlayer.com/tx/0x5082a145eacb68c36e26093e4870da2bd28e546c15bfd4195b53c28cb1aeec78) |
| t1-judge | ok | [0x2c4347d3…](https://explorer-studio.genlayer.com/tx/0x2c4347d3b6e783f986898dd25357775ad78c15bc145e0ee49350bdc0fbfc0492) |
| t2-award | ok | [0x14a5ce09…](https://explorer-studio.genlayer.com/tx/0x14a5ce096fbd5f1515568d016185b9f0008c9e88a0810eb58a2bc4f08982a3fa) |
| t3-request-judgment | ok | [0xc31b4a80…](https://explorer-studio.genlayer.com/tx/0xc31b4a80703f9a38b3e1c37d05b6ae369f6c8f56583a14f74b0e7ba65d11182c) |
| t3-judge | ok | [0x435a1c0c…](https://explorer-studio.genlayer.com/tx/0x435a1c0ce347d39557d14c4a446c7754c2cef949237b520022d4a066c43aeb9b) |
| t4-cancel | ok | [0xd6875864…](https://explorer-studio.genlayer.com/tx/0xd68758644f7ac5e9a7f7ec5df1821faffd8930f16493e120351c200b0c5fcc82) |
| t5-request-judgment | ok | [0xcf331960…](https://explorer-studio.genlayer.com/tx/0xcf3319607332ae364b9fb2393973178453b3db02975f0a789a0806ce4ec33c79) |
| t5-judge | ok | [0x61d64ea8…](https://explorer-studio.genlayer.com/tx/0x61d64ea81e8ad245cc8145a22a70838895a440be4efa23136c1254abb5281b7f) |
| t6-request-judgment-by-quoter | ok | [0xee56c8e7…](https://explorer-studio.genlayer.com/tx/0xee56c8e727f37a9a7307da347cc7154d478362665b33b8dbcadc817a5f4bfa96) |
| t6-judge-by-out | ok | [0xbd707dad…](https://explorer-studio.genlayer.com/tx/0xbd707dad5225d5454fc6a2f675625882595638c7a2e9b94ee9c9c0a64b98438a) |
| t7-request-judgment | ok | [0x225efe21…](https://explorer-studio.genlayer.com/tx/0x225efe212d46d578b42d045de1701840fef4a2487e3bff9887254f738b269e7b) |
| t7-judge | ok | [0x826c9e95…](https://explorer-studio.genlayer.com/tx/0x826c9e957a8dd2617e872295f0b687654598ecbbfa02acf18d641f1278d1f09e) |
| t1-winner-withdraw | ok | [0x23442dc1…](https://explorer-studio.genlayer.com/tx/0x23442dc1cc048da534453fb16de3fa2f545f6b4e7d85f09ae6653900ed86dce1) |
| t2-winner-withdraw | ok | [0x786b6d6d…](https://explorer-studio.genlayer.com/tx/0x786b6d6d2b546220ed982e83f501947a7c0ca1aba1abbdfd89afdc424f867f7a) |
| t3-buyer-withdraw | ok | [0x7e122d0d…](https://explorer-studio.genlayer.com/tx/0x7e122d0de72ec2e4448df50880de4ffa0cd8512c318e3b2f74e82809e31fca55) |
| t4-buyer-withdraw | ok | [0x8744c95b…](https://explorer-studio.genlayer.com/tx/0x8744c95b89cd682aee7334dd2b42e56a62023dff08574c5b9c0c45ac2d052b3e) |
| t5-winner-withdraw | ok | [0x75f3e611…](https://explorer-studio.genlayer.com/tx/0x75f3e611844d2e8d80f35643e973340c2c38488f6e1bd760be515258f676ee20) |
| t6-winner-withdraw | ok | [0x04c1591f…](https://explorer-studio.genlayer.com/tx/0x04c1591fd9573983e0faf6df6a2b7023d16942124aa370655aaba3456d22dcdb) |
| t7-winner-withdraw | ok | [0xac4b3fdd…](https://explorer-studio.genlayer.com/tx/0xac4b3fdd772da512dbc81c70dc4ee6e7347dafd9d5abd3e73f9db0447805326a) |
| neg8-double-withdraw | error-observed (NO_CREDIT) | [0x9f0058f0…](https://explorer-studio.genlayer.com/tx/0x9f0058f0d89ee2c87f7f818fcd9dc1faa2a47b013286084dab19aa1f57ad562a) |

## Notes

- The 10 GEN is the selection award, not the procurement contract value.
- No value was sent on any expected-failure payable call. Platform behavior (verified live 2026-11-11): on Studionet a FAILED payable call does not refund the sent value — it stays in the contract with no entitlement — so evidence never sends value on a negative payable.
- Pre-registered expectations: EXPECTED.md (written before the evidence run). Independent re-verification: `node scripts/verify_evidence.mjs`.
- Resume artifacts: the evidence run was interrupted twice by runtime restarts. Two transactions landed before the restart but were not yet recorded in the run's checkpoint; both were recovered from the explorer and verified live before the run resumed: t3-quote-2 (0x23184c05…, FINALIZED + MAJORITY_AGREE + SUCCESS) and neg7 (0xb80a3c54…, FINALIZED + MAJORITY_AGREE + leader ERROR ONLY_BUYER_CAN_REQUEST_JUDGMENT). A duplicate t3-quote-2 attempt sent by the first resume (0xbe866a60…) correctly failed on-chain with DUPLICATE_QUOTE — it is not part of the evidence set, but it confirms the original quote was already on-chain.

## Live-site write loop (tender 8, post-evidence, not part of the pre-registered 63-tx set)

Tender 8 was created after the evidence run and proven end-to-end in a real browser on the live site, using the site's labelled in-browser temporary test account (supplier 0x060920fDa3B9f9634e4dC7D59B073ba6e1d9b961). Buyer B3 0x644a13Cefe2023D53aDD8B06a6F16989e065ea54 created it by script (create tx [0x3ffd1fda…](https://explorer-studio.genlayer.com/tx/0x3ffd1fdaa8a3b9f6e906cd16ab7fc5ca5630a25b4c156f197f646c93b44ae5cb), FINALIZED + MAJORITY_AGREE + SUCCESS).

- Over-budget quote blocked in the UI: a 301 GEN quote on a 300 GEN budget showed the error "报价为 1–预算之间的整数 GEN。" with the submit button disabled; no transaction was sent (reproduced twice).
- Valid quote: 240 GEN, terms "Poster design with print-ready PDF and editable source file. Two revision rounds included. Delivery within 5 days." — tx [0xacd6410b…](https://explorer-studio.genlayer.com/tx/0xacd6410b41453740b192d9204ec704d9ce0a19d453b50452c15f2408f47b4bc0), FINALIZED + MAJORITY_AGREE + SUCCESS. The board read back "1 / 8" quote slots.
- Buyer B3 requested judgment by script — tx [0xb2fd996c…](https://explorer-studio.genlayer.com/tx/0xb2fd996c861c21eb84f063908bda52676fa50dfad74861e610ff78e258277ef0), FINALIZED + MAJORITY_AGREE + SUCCESS → JUDGING.
- Judgment executed in the browser by the temporary supplier (a NON-buyer) — tx [0x2fa2bda3…](https://explorer-studio.genlayer.com/tx/0x2fa2bda3aabc2c7c58e872981a4b52ed400a20af80818152352236dbffa3b8dd), FINALIZED + MAJORITY_AGREE + SUCCESS. Sender is the supplier, not the buyer — the v2 "anyone may judge" path. Winner: quote 1. Reason: "Quote 1 meets all specified requirements, is within budget, and offers complete, realistic terms."
- Withdrawal by the supplier — tx [0xe175e098…](https://explorer-studio.genlayer.com/tx/0xe175e098774b177dde56daa6f69ff30623fd400f9a61416a36ded9b7df9c3970), FINALIZED + MAJORITY_AGREE + SUCCESS. The 10 GEN payout is a separate FINALIZED Send tx [0x420cf903…](https://explorer-studio.genlayer.com/tx/0x420cf90387ac180dde1ccc7a218222e9ea73f6134f798002c51d52569da6e100) (contract → supplier, exactly 10 GEN). Supplier balance is now 110 GEN.
- Final totals after the write loop (live readback, latest-final): 80 GEN in = 80 GEN out, contract balance 0, escrow 0, tender count 8. Tender 8 is AWARDED, winner quote 1, winner withdrawn.
- Disconnect protection — only partially verified: with the pending quote on tender 8, clicking disconnect did not destroy the account (it stayed connected), but no warning was captured on screen. The key had already been marked as backed up in the same session, so the key-modal branch was skipped, and the remaining guard is a native `window.confirm` that the automated browser auto-dismisses (the same reason the quote, judgment, and withdraw steps each needed a person's click on the native dialog). The warning text in the source names the tender and the pending quote, but its exact on-screen wording was not observed.
- 375px check: NOT re-run for v2 (the v1 overflow fix — `overflow-wrap: anywhere` on `.mono` — is still in place and the v2 frontend changes did not touch layout CSS; per the owner's call, re-checking it every time is not needed).

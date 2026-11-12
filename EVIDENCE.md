# TenderCourt capacity revision — Evidence

Contract: [0x616A603D3e95b5b871F4f1784e4F9E66e66104C4](https://explorer-studio.genlayer.com/address/0x616A603D3e95b5b871F4f1784e4F9E66e66104C4)
Deploy tx: [0x1b2e0419…](https://explorer-studio.genlayer.com/tx/0x1b2e04195c46b6344ae07a27d1b00925e0de975b2233065b586e14fb53db1da2)
Protocol: tendercourt-2.1 · Source SHA-256: 7d662041cf180ef5fc216a98e098168bc65e9194a9e46bc19232434a4b0a1be8 · Byte parity with `contracts/tendercourt.py`: TRUE

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
- Tender 2 (AWARDED, winner quote 1): two quotes; the buyer awards directly to quote 1 without judgment; the supplier withdraws 10 GEN.
- Tender 3 (CANCELLED, NO_AWARD): both quotes fail the requirements — machine-only translation with no review, and the first 5 pages only — validators return NO_AWARD (0); the buyer withdraws the full 10 GEN refund.
- Tender 4 (CANCELLED): the buyer cancels while OPEN with zero quotes; the buyer withdraws the full 10 GEN refund.
- Tender 5 (AWARDED, winner quote 1, injection): quote 2 embeds an instruction telling validators to pick it — validators judge quote 1 the winner (not the injected quote 2); the supplier withdraws 10 GEN.
- Tender 6 (AWARDED, winner quote 1, liveness): eight quotes of exactly 1000 characters each fill the tender to the 8-quote / 8000-character cap; a ninth quote is rejected on-chain (QUOTE_LIMIT). Quoter S1 requests judgment (the tender is full) and a non-buyer (OUT) executes the consensus judgment; validators judge quote 1 the winner; the supplier withdraws 10 GEN.
- Tender 7 (AWARDED, winner quote 1, terms cap): four quotes carry exactly 1000 chars of terms each (4000 total); an additional 1001-character quote is rejected on-chain (QUOTE_TERMS). The buyer requests judgment; validators judge quote 1 the winner; the supplier withdraws 10 GEN.

## GEN accounting (live readback, latest-final)

- Total received: 70 GEN (7 tenders × 10 GEN) for the evidence set; 80 GEN including the post-evidence write loop tender 8
- Total withdrawn: 70 GEN for the evidence set; 80 GEN including tender 8
- Contract balance: 0 GEN
- Escrowed: 0 GEN
- Tender count: 7 for the evidence set; 8 including tender 8

## Post-evidence live-site write loop (tender 8)

Proves the live site works end-to-end on this contract. Tender 8 was created by a script-side buyer (B3, 0xFDCcc586975Ba048945E34B343dBb8B1753d5493) — temp accounts are blocked from create_tender in the frontend by design. The quote was submitted in a real browser by a temporary test account (0x73350588DE99cF1066e3E38522Dbb438f38680Db), clicked by a human because the site gates sends behind a native window.confirm that the automated browser auto-dismisses. Over-budget validation was checked in the browser first: a 301 GEN quote on the 300 GEN budget was blocked in the UI with "报价为 1–预算之间的整数 GEN。" and no transaction was sent (tried twice).

Buyer-path failure (honest record): the buyer's private key was not persisted — genlayer-js `createAccount()` does not expose `.privateKey`, so the save wrote nothing and the key was lost. A request_judgment sent from a wrong account failed on-chain with ONLY_BUYER_CAN_REQUEST_JUDGMENT ([0xea468896…](https://explorer-studio.genlayer.com/tx/0xea468896b069e95eba1195c1c632389567aecc1da4e5b6817390bcbaa15b7e83)). Tender 8 was settled instead through the contract's built-in liveness path: 7 filler quotes filled it to 8, a quoter requested judgment, a non-buyer executed the consensus judgment, and the winner withdrew. The filler quotes were deliberately thin so validators judged the browser's complete 240 GEN quote the winner.

| Step | Result | Transaction |
| --- | --- | --- |
| t8-create (B3, script) | ok | [0xad4a15f0…](https://explorer-studio.genlayer.com/tx/0xad4a15f0d2879b828dea39bb7961f3a3d6c234dc4fa2d664861cebd06e2c2ed4) |
| t8-quote-1 (browser temp account, 240 GEN) | ok | [0x352147dd…](https://explorer-studio.genlayer.com/tx/0x352147ddea869e1524152babe1a541244088e2fc8323c7704686c0e2929149dd) |
| t8-quote-2 (S1, 280 GEN, thin) | ok | [0x58a5d580…](https://explorer-studio.genlayer.com/tx/0x58a5d5806fb6807b4f1224e281a13157afd12a0ea7559f2b8daa61981fcb5030) |
| t8-quote-3 (S2, 300 GEN, no PDF) | ok | [0xb5625b45…](https://explorer-studio.genlayer.com/tx/0xb5625b456582f581737da2bda12501ca534cb3c6428abd3296ea63370b210951) |
| t8-quote-4 (S3, 250 GEN, one revision) | ok | [0xb9f22f20…](https://explorer-studio.genlayer.com/tx/0xb9f22f203d6b0f9f002c0e9244c188f6d2843e9abba727e6429499e44d9fc9c1) |
| t8-quote-5 (S4, 290 GEN, no revisions) | ok | [0xc21b2b9a…](https://explorer-studio.genlayer.com/tx/0xc21b2b9a44d10521bf751cc624a3b391dc6b77c2c333608037af24b49cc4240e) |
| t8-quote-6 (S5, 260 GEN, no source) | ok | [0x86ea067e…](https://explorer-studio.genlayer.com/tx/0x86ea067e689036616f2dbcf7460ff364d8e3570e6ccc6d5fec39e03ebc02b806) |
| t8-quote-7 (S6, 270 GEN, thin) | ok | [0xfce543ca…](https://explorer-studio.genlayer.com/tx/0xfce543ca74b43d792d3e685205413cb94b173dc050a62af2ff80c3d9819cef64) |
| t8-quote-8 (S7, 295 GEN, thin) | ok | [0xe05980ab…](https://explorer-studio.genlayer.com/tx/0xe05980ab7cd5f857e05ae222e6f43f094a2a10f1c541ef84cad10fba5137a68b) |
| t8-request-judgment-by-quoter (S1) | ok | [0xb4753477…](https://explorer-studio.genlayer.com/tx/0xb4753477a2d87ea9d6a594fcdc278a4aefe053e124b76eca64a81e8360511809) |
| t8-judge-by-out (OUT, non-buyer) | ok | [0x7324c221…](https://explorer-studio.genlayer.com/tx/0x7324c22186ed573e2d98e9631d182f38e80f1462635171133c41a380093e4212) |
| t8-winner-withdraw (temp account) | ok | [0xb7f50769…](https://explorer-studio.genlayer.com/tx/0xb7f507698303c90b9f80e7767946152b4ff282c5bc8d6cc2b73fbe8a5cc90380) |

Tender 8 final state (live readback, latest-final): AWARDED, winner quote 1, winner_supplier 0x73350588DE99cF1066e3E38522Dbb438f38680Db, 8 quotes. Winner balance after payout: 110 GEN (started 100, quote is free, +10 GEN award). 12 successful business transactions, all independently re-read live: FINALIZED + MAJORITY_AGREE + leader SUCCESS. Separately, 1 additional expected guard-error transaction: the failed request_judgment above (ONLY_BUYER_CAN_REQUEST_JUDGMENT), which is not part of the settled flow and is not counted among the 12.

## Evidence transactions

| Step | Result | Transaction |
| --- | --- | --- |
| t1-create | ok | [0x1a041345…](https://explorer-studio.genlayer.com/tx/0x1a041345e37590997b1b3808f790d8e7c6bd0885d09608ac9454e9e25ddcc951) |
| t2-create | ok | [0xcb8350a6…](https://explorer-studio.genlayer.com/tx/0xcb8350a6154517f5d30284189e463c6ba9f28c0ef2e5dac6a359ccfd13da87f9) |
| t3-create | ok | [0x91578f20…](https://explorer-studio.genlayer.com/tx/0x91578f20848a45d6142ebd701dba18048b4e17edb5abc518f4e21e8b3f2f94d2) |
| t4-create | ok | [0xa19456ed…](https://explorer-studio.genlayer.com/tx/0xa19456ed5181e2c4e576a72fe86e4d9474a19ec3c3440ac88bd5e3d7f1ad4337) |
| t5-create | ok | [0x55ea4c8b…](https://explorer-studio.genlayer.com/tx/0x55ea4c8b84b51bab786b4f43fc542dbca8295ab0e1d8483dcbc9c4a5db01923e) |
| t6-create | ok | [0xed19e6cb…](https://explorer-studio.genlayer.com/tx/0xed19e6cb8ed9b4cfa3f87ad0f5338fa982a76e0d034cb78f1e98902255205ca3) |
| t7-create | ok | [0xffee5b8b…](https://explorer-studio.genlayer.com/tx/0xffee5b8b9f767379b59e6a596b728563b208c020d5308f832b1eb3726c09db2e) |
| t1-quote-1 | ok | [0x4bc59984…](https://explorer-studio.genlayer.com/tx/0x4bc59984e6126d01edefd15e59ce390ce45820d5ceb86d63c0d6e97ffe0abd81) |
| t1-quote-2 | ok | [0x11e059eb…](https://explorer-studio.genlayer.com/tx/0x11e059eb7c08bfa2467a0bb34f7817843a049ed6bde1893a74f5ae02f0edcf85) |
| t1-quote-3 | ok | [0x48f6e641…](https://explorer-studio.genlayer.com/tx/0x48f6e641d246dc0d8e94ce3633addca7cb146b7acbe3246fd213adc8c209cb5e) |
| t2-quote-1 | ok | [0xa18366e2…](https://explorer-studio.genlayer.com/tx/0xa18366e2381f8648778c601c69daadeb3e96227fc4f03cfdeae2719cfab01d38) |
| t2-quote-2 | ok | [0x131519f0…](https://explorer-studio.genlayer.com/tx/0x131519f07b5591d026909df15bdbc8e960001edf81e21b8ac7fb2c546cbcbbe4) |
| t3-quote-1 | ok | [0x565847ef…](https://explorer-studio.genlayer.com/tx/0x565847ef5eb095ca426102c7a74daab1943523a44981936989f69af0d960f3e2) |
| t3-quote-2 | ok | [0xac2d0dc4…](https://explorer-studio.genlayer.com/tx/0xac2d0dc4ccfa0004ab14192e030196d3e75b23508b2f4eb2c2a1bd3587903a11) |
| t5-quote-1 | ok | [0xd99da2ba…](https://explorer-studio.genlayer.com/tx/0xd99da2baf43188bb6ea65943135093a6eff78d10befeae98f615dbf656b66558) |
| t5-quote-2 | ok | [0x305162f5…](https://explorer-studio.genlayer.com/tx/0x305162f5a13119716b0868c5e72a9a35438cbb1e7b58375b26468af9b9a68869) |
| t6-quote-1 | ok | [0xf48a9b05…](https://explorer-studio.genlayer.com/tx/0xf48a9b05bbce440edc3e7b005ae8f79291c425263ca369d8728cb7d667864b85) |
| t6-quote-2 | ok | [0x2f96b14e…](https://explorer-studio.genlayer.com/tx/0x2f96b14e5dad733252132b083572a27a044378138e1f9bf476bdc97a97b5970c) |
| t6-quote-3 | ok | [0x03ccab14…](https://explorer-studio.genlayer.com/tx/0x03ccab142e83a1dd413371b66a7212be3de7ddf13c6ffa84d08cd0d742351c43) |
| t6-quote-4 | ok | [0x56cf3d7c…](https://explorer-studio.genlayer.com/tx/0x56cf3d7c6c33cf700089129bb64708adae7e1974b0cdc27a9b6f140356bde60c) |
| t6-quote-5 | ok | [0x9d26b183…](https://explorer-studio.genlayer.com/tx/0x9d26b1837e260701e841bc99add4395eec8d99d342263b9996152f379bfc8a4a) |
| t6-quote-6 | ok | [0xfbe3c22e…](https://explorer-studio.genlayer.com/tx/0xfbe3c22eca499704837d9bf55da25bff6856cecfd40403f4bf69e6a03a542d8a) |
| t6-quote-7 | ok | [0xb59090c0…](https://explorer-studio.genlayer.com/tx/0xb59090c0bfe0578e9a3ea89cf272704aa6862fd24757302022cd62d8ebd57738) |
| t6-quote-8 | ok | [0x1aa41727…](https://explorer-studio.genlayer.com/tx/0x1aa4172717ad31ae530dfd0edb8e01e14e2eb08af47422e80b1264c758b13883) |
| t7-quote-1 | ok | [0x620239fe…](https://explorer-studio.genlayer.com/tx/0x620239fe359ea4ca47ad8cbc460ed7a90f62925937ba332f7e50caa905415730) |
| t7-quote-2 | ok | [0xa8686dda…](https://explorer-studio.genlayer.com/tx/0xa8686dda8c63a8e1195321cee64a6c55f1ec367671b86be01b31281043b57749) |
| t7-quote-3 | ok | [0xb903905d…](https://explorer-studio.genlayer.com/tx/0xb903905da6a8d8591ccc20565966eae249d2425f8f5b8c3565dc1f84af12b1df) |
| t7-quote-4 | ok | [0x83db7161…](https://explorer-studio.genlayer.com/tx/0x83db716181b291f79b4fad2a0a03679062355cae6ad72933e04d09d7aa5569ca) |
| neg0-wrong-fee-create | error-observed (FEE_MUST_BE_10_GEN) | [0xbe394185…](https://explorer-studio.genlayer.com/tx/0xbe3941851a07265fc44769ea3836228bde59f047cec95fae1b32c95bcad1e448) |
| neg1-buyer-quotes-own | error-observed (BUYER_CANNOT_QUOTE_OWN_TENDER) | [0x45fd0d6c…](https://explorer-studio.genlayer.com/tx/0x45fd0d6c42eaa52d811695639408990b97cf3dfe1182c693e85415ba8b94e4b7) |
| neg2-duplicate-quote | error-observed (DUPLICATE_QUOTE) | [0x0fb4a3a5…](https://explorer-studio.genlayer.com/tx/0x0fb4a3a5dd4e1c88b4d358c9009cf94079a617ec0cc5fa170eedc3c6b309a90f) |
| neg3-price-over-budget | error-observed (QUOTE_PRICE) | [0xf6ca1a39…](https://explorer-studio.genlayer.com/tx/0xf6ca1a39052a8a0c40f9fb7fe6ff4638a4054d30ea02abe5565a42de25a58528) |
| neg4-price-zero | error-observed (QUOTE_PRICE) | [0x1d610ada…](https://explorer-studio.genlayer.com/tx/0x1d610ada60266d3cd97c0cc87cb0e5e03c01664f992e7c2e4bf2763a5e926f43) |
| neg5-outsider-award | error-observed (ONLY_BUYER_CAN_AWARD) | [0xe16f4871…](https://explorer-studio.genlayer.com/tx/0xe16f48716506bc77fe573a8d801b25998685c2d30b5523fb3afd037312fff2ee) |
| neg6-outsider-cancel | error-observed (ONLY_BUYER_CAN_CANCEL) | [0xd3d46bc2…](https://explorer-studio.genlayer.com/tx/0xd3d46bc29e41ea898b44561ce1b3b2a22b914f55939324ec9d7d221db164b5ab) |
| neg7-outsider-request-judgment | error-observed (ONLY_BUYER_CAN_REQUEST_JUDGMENT) | [0xdc0af677…](https://explorer-studio.genlayer.com/tx/0xdc0af67704deeaa94bd06d9227caa0262b112cb4577ca408c03380754d616707) |
| neg9-cancel-after-quotes | error-observed (CANNOT_CANCEL_WITH_QUOTES) | [0x5450369f…](https://explorer-studio.genlayer.com/tx/0x5450369f2e31360f9ad95202782ebccaf7354fb6ee2cc28780d28ced6b91048e) |
| neg10-award-unknown-quote | error-observed (QUOTE_NOT_FOUND) | [0xc16b10d1…](https://explorer-studio.genlayer.com/tx/0xc16b10d1c4b765c9e736a814f8de3a50532484c7b7c4ba9d705aa5d16f544392) |
| neg11-request-judgment-no-quotes | error-observed (NO_QUOTES) | [0xb320bf71…](https://explorer-studio.genlayer.com/tx/0xb320bf715f6c53e99583ff33913fa847089872d60b29b56e637d3998d565c481) |
| neg12-ninth-quote-full-tender | error-observed (QUOTE_LIMIT) | [0x72200240…](https://explorer-studio.genlayer.com/tx/0x72200240def2b589757fa2aa72a22c3ac49f1320e832c6ca93a5c42ef6b699ed) |
| neg13-oversized-quote | error-observed (QUOTE_TERMS) | [0x334a205e…](https://explorer-studio.genlayer.com/tx/0x334a205efda4c0e02d149ca607bfe0a03b262ab83aa5ef34db785c5cf07b5fbb) |
| neg14-judge-while-open | error-observed (TENDER_NOT_JUDGING) | [0x5be37e59…](https://explorer-studio.genlayer.com/tx/0x5be37e59562c3e6d398ddf2399e8916073e59c8862826aaba4ac7e88030d1998) |
| neg15-quoter-request-not-full | error-observed (ONLY_BUYER_CAN_REQUEST_JUDGMENT) | [0x59cff88c…](https://explorer-studio.genlayer.com/tx/0x59cff88cb206afb97b379b7164d08d1df89c11abd9a89c485ff6ad6d0ef87d55) |
| t1-request-judgment | ok | [0x37d6283a…](https://explorer-studio.genlayer.com/tx/0x37d6283ab1d4da6beea9e54f10a22b67e5263c401c3d927b03e5c01ab60abdb9) |
| t1-judge | ok | [0x3c9b56d3…](https://explorer-studio.genlayer.com/tx/0x3c9b56d39d389445262b1aeeeec8cc997522de2461022868e1ec462d7a76f1dc) |
| t2-award | ok | [0x3328367b…](https://explorer-studio.genlayer.com/tx/0x3328367b044f5716d8892fd51db1cda359d86a2bc35e2836f002774349f51076) |
| t3-request-judgment | ok | [0x4c07cb9b…](https://explorer-studio.genlayer.com/tx/0x4c07cb9becc98156ebfa7b696e57328344bd9e4af95bb167a68900c109e2846a) |
| t3-judge | ok | [0xf4c34c04…](https://explorer-studio.genlayer.com/tx/0xf4c34c040ff08891a98e0bcc3dce137a6b05de18e34d33e4984a786daaccb921) |
| t4-cancel | ok | [0xc2caed9f…](https://explorer-studio.genlayer.com/tx/0xc2caed9f3b950e3f96a83580c7e8ec36869b16f589694528f994a3dffb214ea2) |
| t5-request-judgment | ok | [0x2660e9f1…](https://explorer-studio.genlayer.com/tx/0x2660e9f1bc79496ca0621137b9c81eea8fe538f236b6690bb0da72ee1fdf39f3) |
| t5-judge | ok | [0xa618104c…](https://explorer-studio.genlayer.com/tx/0xa618104c70be93ac7ef536b43b1d2368a617ca3f2a7f6691a1720d387081bc29) |
| t6-request-judgment-by-quoter | ok | [0x074f3d48…](https://explorer-studio.genlayer.com/tx/0x074f3d4807088034d2d216a634fd965f3c9f3e1bd119cd7a80c65bd76f967c4d) |
| t6-judge-by-out | ok | [0xdce0b17b…](https://explorer-studio.genlayer.com/tx/0xdce0b17bd4a41934f1689b902f6070df9a859c2815bb80598769f2d6989ee0d4) |
| t7-request-judgment | ok | [0xbc26ce9f…](https://explorer-studio.genlayer.com/tx/0xbc26ce9f1d38dfbec6f7894fa931a2ddf65d1dfb4998a1967ae64ee3c8b88b0d) |
| t7-judge | ok | [0x33f10c92…](https://explorer-studio.genlayer.com/tx/0x33f10c9247e6d325541f550401bc32908fa7f385d82429e5d1b56eabb4135f72) |
| t1-winner-withdraw | ok | [0xc32a801a…](https://explorer-studio.genlayer.com/tx/0xc32a801ace8752fb37c2e0597c0410daea4c11233358d81934332085330adbb9) |
| t2-winner-withdraw | ok | [0x230c8288…](https://explorer-studio.genlayer.com/tx/0x230c828830d0dd7f5af64b325f4f07afab081ff5bab7587708b77eb3eb2b41ee) |
| t3-buyer-withdraw | ok | [0x07d833b6…](https://explorer-studio.genlayer.com/tx/0x07d833b6f34e8dc27a62fd50f36edd16119c58868638730ac60ca43109ffc378) |
| t4-buyer-withdraw | ok | [0xb1ae4538…](https://explorer-studio.genlayer.com/tx/0xb1ae4538519fc0caa9be0b17165a51f49aa0751d78b1ae6e2b946c004ff98f15) |
| t5-winner-withdraw | ok | [0x9af317c6…](https://explorer-studio.genlayer.com/tx/0x9af317c68db5201826af733ee8466bc01271a461b218bb82ee2a29326aab7db0) |
| t6-winner-withdraw | ok | [0xbea62c54…](https://explorer-studio.genlayer.com/tx/0xbea62c54ddbf4fb71a7723e2854aba6d292e26df5afee7f33030fc498075043a) |
| t7-winner-withdraw | ok | [0x2448619a…](https://explorer-studio.genlayer.com/tx/0x2448619a632590af599427b43d07c55d4826e0eb33fa24f93fea2774d248ef31) |
| neg8-double-withdraw | error-observed (NO_CREDIT) | [0x7ad1b21a…](https://explorer-studio.genlayer.com/tx/0x7ad1b21ab06080191f52afb358a8ceb0c1958a266c6787ec6e05b5af25f781ab) |

## Notes

- The 10 GEN is the selection award, not the procurement contract value.
- No value was sent on any expected-failure payable call. Platform behavior (verified live 2026-11-11): on Studionet a FAILED payable call does not refund the sent value — it stays in the contract with no entitlement — so evidence never sends value on a negative payable.
- Execution plan: EXPECTED.md (local commit before this run; no public advance-registration timestamp asserted). V2 correction: ERRATA.md. Independent re-verification: `node scripts/verify_evidence.mjs`.

# TenderCourt capacity revision — partial chain evidence

Protocol: `tendercourt-2.1`. Contract: `0x616A603D3e95b5b871F4f1784e4F9E66e66104C4`.
Deployment transaction: `0x1b2e04195c46b6344ae07a27d1b00925e0de975b2233065b586e14fb53db1da2`.
Source SHA-256: `7d662041cf180ef5fc216a98e098168bc65e9194a9e46bc19232434a4b0a1be8`.
Deployment reached FINALIZED + MAJORITY_AGREE + leader SUCCESS; deployed source matched contracts/tendercourt.py byte-for-byte.

Two create_tender calls reached FINALIZED + MAJORITY_AGREE + leader SUCCESS. Their hashes and observed receipt fields are in evidence/transactions.json. Latest-final readback is in evidence/tenders-readback.json and evidence/partial-readback.json: 20 test GEN received, 0 withdrawn, 20 held in escrow, 2 OPEN tenders. This is conservation of current escrow, not proof of successful settlement or withdrawals.

The capacity-boundary, judgment, negative-call, and withdrawal portions of the new chain suite have not run. No completed E2E or Projects readiness is asserted. Mock tests cover 30 cases, including 8 x 1000 Unicode characters, 1001/2000 rejection with unchanged state, non-full supplier denial, full outsider denial, supplier request, third-party judgment, frozen quotes, withdrawal permissions and double-withdrawal rejection. Mock consensus is fixture-based and does not prove live validator agreement.

V2 source, expectations and evidence remain archived in evidence/v2/. ERRATA.md records the Tender 6 mismatch; evidence/v2/tender6-readback.json independently confirms the historical book-fair poster and 500 GEN budget. Historical successful transactions do not validate this revised deployment.

# TenderCourt v2.2 published-site validation

Site: https://zuotu295.github.io/tendercourt-genlayer/

Publication: GitHub Pages [build and deployment](https://github.com/zuotu295/tendercourt-genlayer/actions/runs/43396874086), successful for merge commit `00cfec322ada2ab937bc562094ac66f0a5df403a`.

Published bundle: `index-CLogw4cE.js`, version `5c0fdcbc`.
The served deployment metadata and visible footer identify protocol
`tendercourt-2.2` and contract `0xD879F2Aa15f8420694872e229424AF06cD9929B9`.
Source SHA-256: `555f777f9f3aed483aab78623592909bccd5e3be9821b3cd7c21796b438ed944`.

## Observed in the production browser

- The board read back the new contract's 14 settled tenders from latest-final;
  totals displayed 140 GEN received, 140 GEN withdrawn, zero balance and escrow.
- Chinese and English notices explain that accepted suppliers can request
  judgment with partial fills and that closing the window freezes quotes.
- Nine-character requirements show the minimum-20-character error; budget 0
  shows the 1–10,000 integer error. The invalid payable action is disabled.
- Temporary-account connection, masked key display, private-key file export,
  backup acknowledgement and disconnection worked. Temporary accounts cannot
  create payable tenders. No private key is present in public evidence.
- The browser was returned to disconnected/read-only state, with the form reset.
- No error from the application's origin was observed in the recent console
  entries. Extension-origin metadata errors were observed separately.

## Rendered action controls

`node --test tests/test_app_controls.mjs` renders the actual App component
using fixture hook state, with no RPC or signatures. Three cases verify:

1. Accepted suppliers see the request action with every partial size 1–7;
   unrelated addresses do not.
2. JUDGING hides direct awards, new requests and late quotes for every role;
   the judge action remains available.
3. Only the settled winner sees its withdrawal action.

These are rendered UI tests, not live browser-signed transactions.

## Scope

The production browser checks did not submit a new tender, quote, judgment or
withdrawal transaction. The full 14-case chain matrix and actual recipient
credits were verified independently using SDK-signed Studionet transactions;
they are not claimed as browser writes. The contract source, existing receipts
and deployment remain unchanged by this publication step.

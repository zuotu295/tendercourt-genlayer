# TenderCourt technical verification scope

The capacity revision enforces 1000 characters per quote, 8 quotes and 8000 total characters. With n < 8 accepted quotes, existing terms occupy at most n * 1000 characters, leaving enough capacity for every remaining slot. Supplier-triggered judgment remains restricted to a full tender; an unrelated address cannot freeze competition. The shared-address assumption remains: many addresses can fill all eight slots.

Independent verification: 78/78 PASS (all 63 evidence transactions re-read live, byte parity, 7 tenders match EXPECTED.md, 70 GEN in = 70 out). Local Mock tests pass (30/30); the production frontend builds. Browser interaction is verified for this revision: a live-site write loop on tender 8 (browser quote, fill-to-8, quoter-requested judgment, non-buyer judge, winner withdraw; 80 GEN in = 80 out). See EVIDENCE.md for exact results. One honest limitation is recorded there: the write-loop buyer's private key was not persisted, so the buyer path was blocked and tender 8 settled through the fill-to-8 liveness path instead.

The original V2 source and original expectations are immutable copies in evidence/v2/. The V2 Tender 6 discrepancy is disclosed in ERRATA.md and confirmed by a latest-final readback. The capacity revision has a separate execution plan in EXPECTED.md; it is not retrospectively substituted for the old registration.

OPEN tenders with 1–7 quotes still depend on the buyer. There is no timeout. Direct awards do not use consensus. The 10 GEN award does not fund or verify off-chain procurement delivery.

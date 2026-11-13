# TenderCourt v2.2 local validation — 2026-11-13

This is the pre-deployment validation snapshot. Subsequent live results are
recorded separately in [../../EVIDENCE.md](../../EVIDENCE.md). The initial browser
startup failures below are retained; they are not represented as browser passes.

Source SHA-256: `555f777f9f3aed483aab78623592909bccd5e3be9821b3cd7c21796b438ed944`
Source bytes: 14980. No v2.2 deployed address or transactions exist in this record.

| Command/check | Observed result |
| --- | --- |
| Baseline `python3 tests/test_tendercourt_mock.py` before edits | 30 tests, OK |
| `npm test` after edits | 36 Python test methods, OK; 3 Node test cases, PASS, 0 FAIL |
| `npx tsc --noEmit` | Exit 0, no diagnostics |
| `npm run build` | Exit 0; 486 modules transformed; Vite build and version stamping succeeded |
| Node syntax checks, deploy/run-evidence/evidence-generator scripts | Exit 0 |
| `node scripts/deploy_studionet.mjs --prepare` | Exit 0; RPC chain id 61999; prepare-only; 0 transactions sent |
| `node scripts/verify_evidence.mjs` | Exit 0; 78 PASS, 0 FAIL; historical v2.1 only |
| Historical raw receipts, deployment JSONs and ERRATA byte comparison | Unchanged from base commit |
| Archived v2.1 source SHA-256 | Matches original deployment metadata |
| `git diff --check` | Exit 0 |

The seven partial sizes are exercised in each of the winner/withdrawal,
NO_AWARD/refund, and outsider-rejection loops. Those subcases are not counted
as separate unittest methods. SDK, consensus and transfers are stubs; these
checks do not establish live validator agreement, atomic transfer execution,
recipient balance changes or finality for v2.2.

## Warnings and incomplete checks

- Vite warns that the main minified JavaScript chunk exceeds 500 kB
  (735.10 kB, gzip 181.83 kB). Build succeeds; no bundler refactor was made.
- npm reports an unknown environment `http-proxy` config warning.
- Initial `npm run preview -- --port 4173` failed at `uv_interface_addresses`
  in this execution environment. `npx vite preview --host 127.0.0.1 --port 4173`
  subsequently started successfully.
- A subsequent HTTP probe to the local preview server failed to connect;
  preview service persistence across command sessions was not established.
- Browser smoke test could not run: Playwright's bundled Chromium was absent;
  system Chromium then failed at startup with `socket() failed: Operation not
  permitted` in `process_singleton_posix.cc`. No browser interaction or layout
  success is claimed for v2.2. Browser validation remains pending.
- The historical verification transcript is preserved in
  `historical-v2.1-verification.txt`; it proves only the archived source and
  existing receipts, never the supplier recovery revision.

## Deployment boundary

A new deployment is required. The default deploy command performs no wallet
creation, funding or signatures. Actual deployment, consensus judgment, transfers,
new receipts, source byte parity and Pages publication remain unexecuted.
The required live matrix is in ../../EXPECTED.md. Existing v2.1 receipts and all
recorded failures remain preserved. Existing default-branch Pages is unchanged.

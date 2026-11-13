// Execute the real chain module with a stub SDK; no network or signatures.
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import assert from 'node:assert/strict';
import test from 'node:test';

function harness(protocol) {
  const calls = [];
  const exports = {};
  const reader = { readContract: async (request) => {
    calls.push(request);
    if (protocol instanceof Error) throw protocol;
    return protocol;
  }};
  const context = { exports, require: (name) => {
    if (name === 'genlayer-js') return {createClient: () => reader};
    if (name === 'genlayer-js/chains') return {studionet: {id: 61999}};
    throw new Error('unexpected dependency ' + name);
  }, fetch: async () => ({ok: true, json: async () => ({
    contract_address: '0x' + '11'.repeat(20), chain_id: 61999,
  })})};
  const source = ts.transpileModule(fs.readFileSync('src/chain.ts', 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020},
  }).outputText;
  vm.runInNewContext(source, context);
  let writes = 0;
  const wallet = {mode: 'temporary', client: {writeContract: async () => {
    writes++;
    return '0xabc';
  }}};
  return {api: exports, wallet, calls, writes: () => writes};
}

test('old, absent and unrecognized protocols never reach a signer', async () => {
  for (const protocol of ['tendercourt-2.1', '', null, 'tendercourt-3']) {
    const h = harness(protocol);
    await h.api.loadDeployment();
    await assert.rejects(h.api.sendWriteOnly(h.wallet, 'request_judgment', [1]), /DEPLOYMENT_VERSION_MISMATCH/);
    assert.equal(h.writes(), 0);
    assert.equal(h.calls[0].transactionHashVariant, 'latest-final');
  }
});

test('unavailable protocol read fails closed before signing', async () => {
  const h = harness(new Error('RPC unavailable'));
  await h.api.loadDeployment();
  await assert.rejects(h.api.sendWriteOnly(h.wallet, 'withdraw', [1]), /RPC unavailable/);
  assert.equal(h.writes(), 0);
});

test('matching protocol passes to signer exactly once', async () => {
  const h = harness('tendercourt-2.2');
  await h.api.loadDeployment();
  assert.equal(await h.api.sendWriteOnly(h.wallet, 'request_judgment', [1]), '0xabc');
  assert.equal(h.writes(), 1);
});

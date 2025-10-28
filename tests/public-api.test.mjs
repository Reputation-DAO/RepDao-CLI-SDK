import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = join(here, '..', 'dist');

const expectFunctions = (mod, keys, namespace) => {
  for (const key of keys) {
    assert.strictEqual(
      typeof mod[key],
      'function',
      `Expected ${namespace}.${key} to be a function`
    );
  }
};

test('build artifacts exist', () => {
  const artifacts = ['client.js', 'client.d.ts', 'identity.js', 'identity.d.ts', 'cli.js'];
  for (const file of artifacts) {
    const target = join(distDir, file);
    assert.ok(existsSync(target), `Missing build artifact: dist/${file}`);
  }
});

test('client exports stable surface', async () => {
  const client = await import(pathToFileURL(join(distDir, 'client.js')).href);
  expectFunctions(
    client,
    [
      'addTrustedAwarder',
      'removeTrustedAwarder',
      'awardRep',
      'multiAward',
      'revokeRep',
      'resetUser',
      'transferOwnership',
      'nominateOwner',
      'acceptOwnership',
      'configureDecay',
      'setDailyMintLimit',
      'setPerAwarderDailyLimit',
      'blacklist',
      'pause',
      'setParent',
      'setMinCyclesAlert',
      'processBatchDecay',
      'triggerManualDecay',
      'topUp',
      'withdrawCycles',
      'returnCyclesToFactory',
      'emitEvent',
      'getBalance',
      'getTrustedAwarders',
      'getTransactionHistory',
      'getTransactionsPaged',
      'getTransactionsByUser',
      'findTransactionsByReason',
      'getTransactionById',
      'getTransactionCount',
      'getDecayConfig',
      'getUserDecayInfo',
      'previewDecayAmount',
      'getBalanceWithDetails',
      'getDecayStatistics',
      'leaderboard',
      'myStats',
      'awarderStats',
      'orgPulse',
      'getTopUpsPaged',
      'getTopUpCount',
      'version',
      'health',
      'cycles_balance',
      'snapshotHash',
      'invokeQuery',
      'invokeUpdate'
    ],
    'client'
  );
});

test('identity helpers are exported', async () => {
  const identity = await import(pathToFileURL(join(distDir, 'identity.js')).href);
  expectFunctions(identity, ['identityFromPemFile', 'identityFromPemString'], 'identity');
});

test('identity store helpers are exported', async () => {
  const store = await import(pathToFileURL(join(distDir, 'identityStore.js')).href);
  expectFunctions(
    store,
    [
      'resolveIdentityPath',
      'list',
      'listDfxIdentities',
      'use',
      'importPem',
      'exportPem',
      'del',
      'newIdentity',
      'identityPathOrThrow',
      'dfxPemPath'
    ],
    'identityStore'
  );
});

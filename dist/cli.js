#!/usr/bin/env node
import { Command } from 'commander';
import { config as loadEnv } from 'dotenv';
import { identityFromPemFile } from './identity.js';
import { addTrustedAwarder, awardRep, getBalance, invokeQuery, invokeUpdate, } from './client.js';
import { resolveIdentityPath, list as listIds, listDfxIdentities, use as useId, importPem, exportPem, del as delId, newIdentity, identityPathOrThrow, dfxPemPath, } from './identityStore.js';
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
import { Principal } from '@dfinity/principal';
import { readFileSync } from 'node:fs';
// ---- Candid helpers ----
// For Candid `opt text`: use [] for null, ["value"] for some.
function OptText(s) {
    return s == null ? [] : [String(s)];
}
/* -----------------------------------------------------------------------------
   Setup
----------------------------------------------------------------------------- */
loadEnv();
const program = new Command();
program
    .name('repdao')
    .description('Reputation DAO CLI wrapper')
    .option('--network <net>', 'ic | local | custom', process.env.REPDAO_NETWORK ?? 'ic')
    .option('--host <url>', 'host override (e.g. http://127.0.0.1:4943)')
    .option('--pem <path>', 'PEM for identity', process.env.REPDAO_PEM);
/* -----------------------------------------------------------------------------
   Helpers
----------------------------------------------------------------------------- */
function P(txt) {
    return Principal.fromText(txt);
}
function N(txt) {
    if (!/^\d+$/.test(txt))
        throw new Error(`Expected Nat (integer), got: ${txt}`);
    return BigInt(txt);
}
function B(txt) {
    if (txt === 'true')
        return true;
    if (txt === 'false')
        return false;
    throw new Error(`Expected Bool (true|false), got: ${txt}`);
}
function pretty(val) {
    return typeof val === 'bigint'
        ? val.toString()
        : JSON.stringify(val, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
}
function optsWithIdentity() {
    const opts = program.opts();
    const pemPath = resolveIdentityPath(opts);
    const identity = identityFromPemFile(pemPath);
    return { identity, network: opts.network, host: opts.host };
}
/* -----------------------------------------------------------------------------
   Canister commands (typed, no generic query/call needed)
----------------------------------------------------------------------------- */
/** Awarders / transfers */
program
    .command('addTrustedAwarder')
    .argument('<canisterId>')
    .argument('<awarderPrincipal>')
    .argument('<name>')
    .action(async (cid, awarder, name) => {
    const res = await addTrustedAwarder(cid, awarder, name, optsWithIdentity());
    console.log(res);
});
program
    .command('removeTrustedAwarder')
    .argument('<canisterId>')
    .argument('<awarderPrincipal>')
    .action(async (cid, awarder) => {
    const res = await invokeUpdate(cid, 'removeTrustedAwarder', [P(awarder)], optsWithIdentity());
    console.log(res);
});
program
    .command('awardRep')
    .argument('<canisterId>')
    .argument('<toPrincipal>')
    .argument('<amount>')
    .option('-r, --reason <text>')
    .action(async (...args) => {
    const cmd = args[args.length - 1]; // Commander Command
    const [cid, to, amount] = args.slice(0, -1); // positionals
    const opts = cmd.opts(); // ✅ no generic error
    const { reason } = opts;
    const res = await awardRep(cid, to, N(amount), reason, optsWithIdentity());
    console.log(res);
});
program
    .command('multiAward')
    .argument('<canisterId>')
    .requiredOption('--pairs <json>', 'JSON: [[toPrincipal, amount, reason?], ...]')
    .option('--atomic', 'fail all if any invalid', false)
    .action(async (...args) => {
    const cmd = args[args.length - 1];
    const [cid] = args.slice(0, -1);
    const { pairs, atomic } = cmd.opts();
    let arr;
    try {
        arr = JSON.parse(pairs);
    }
    catch {
        throw new Error('Invalid JSON for --pairs');
    }
    const mapped = arr.map((t, i) => {
        if (!Array.isArray(t) || t.length < 2 || t.length > 3) {
            throw new Error(`pairs[${i}] must be [principal, amount, ?reason]`);
        }
        const [to, amt, reason] = t;
        return [P(String(to)), N(String(amt)), OptText(reason)];
    });
    const res = await invokeUpdate(cid, 'multiAward', [mapped, !!atomic], optsWithIdentity());
    console.log(res);
});
program
    .command('revokeRep')
    .argument('<canisterId>')
    .argument('<fromPrincipal>')
    .argument('<amount>')
    .option('-r, --reason <text>')
    .action(async (...args) => {
    const cmd = args[args.length - 1];
    const [cid, from, amount] = args.slice(0, -1);
    const { reason } = cmd.opts();
    const res = await invokeUpdate(cid, 'revokeRep', [P(from), N(amount), OptText(reason)], optsWithIdentity());
    console.log(res);
});
program
    .command('resetUser')
    .argument('<canisterId>')
    .argument('<userPrincipal>')
    .option('-r, --reason <text>')
    .action(async (...args) => {
    const cmd = args[args.length - 1];
    const [cid, user] = args.slice(0, -1);
    const { reason } = cmd.opts();
    const res = await invokeUpdate(cid, 'resetUser', [P(user), OptText(reason)], optsWithIdentity());
    console.log(res);
});
/** Admin / policy */
program
    .command('transferOwnership')
    .argument('<canisterId>')
    .argument('<newOwnerPrincipal>')
    .action(async (cid, newOwner) => {
    const res = await invokeUpdate(cid, 'transferOwnership', [P(newOwner)], optsWithIdentity());
    console.log(res);
});
program
    .command('nominateOwner')
    .argument('<canisterId>')
    .argument('<candidatePrincipal>')
    .action(async (cid, candidate) => {
    const res = await invokeUpdate(cid, 'nominateOwner', [P(candidate)], optsWithIdentity());
    console.log(res);
});
program
    .command('acceptOwnership')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeUpdate(cid, 'acceptOwnership', [], optsWithIdentity());
    console.log(res);
});
program
    .command('configureDecay')
    .argument('<canisterId>')
    .argument('<decayRateNat>')
    .argument('<decayIntervalSec>')
    .argument('<minThresholdNat>')
    .argument('<gracePeriodSec>')
    .argument('<enabledBool>')
    .action(async (cid, rate, interval, min, grace, enabled) => {
    const res = await invokeUpdate(cid, 'configureDecay', [N(rate), N(interval), N(min), N(grace), B(enabled)], optsWithIdentity());
    console.log(res);
});
program
    .command('setDailyMintLimit')
    .argument('<canisterId>')
    .argument('<limitNat>')
    .action(async (cid, limit) => {
    const res = await invokeUpdate(cid, 'setDailyMintLimit', [N(limit)], optsWithIdentity());
    console.log(res);
});
program
    .command('setPerAwarderDailyLimit')
    .argument('<canisterId>')
    .argument('<awarderPrincipal>')
    .argument('<limitNat>')
    .action(async (cid, awarder, limit) => {
    const res = await invokeUpdate(cid, 'setPerAwarderDailyLimit', [P(awarder), N(limit)], optsWithIdentity());
    console.log(res);
});
program
    .command('blacklist')
    .argument('<canisterId>')
    .argument('<userPrincipal>')
    .argument('<onBool>')
    .action(async (cid, user, on) => {
    const res = await invokeUpdate(cid, 'blacklist', [P(user), B(on)], optsWithIdentity());
    console.log(res);
});
program
    .command('pause')
    .argument('<canisterId>')
    .argument('<onBool>')
    .action(async (cid, on) => {
    const res = await invokeUpdate(cid, 'pause', [B(on)], optsWithIdentity());
    console.log(res);
});
program
    .command('setParent')
    .argument('<canisterId>')
    .argument('<parentPrincipal>')
    .action(async (cid, parent) => {
    const res = await invokeUpdate(cid, 'setParent', [P(parent)], optsWithIdentity());
    console.log(res);
});
program
    .command('setMinCyclesAlert')
    .argument('<canisterId>')
    .argument('<thresholdNat>')
    .action(async (cid, thr) => {
    const res = await invokeUpdate(cid, 'setMinCyclesAlert', [N(thr)], optsWithIdentity());
    console.log(res);
});
/** Maintenance */
program
    .command('processBatchDecay')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeUpdate(cid, 'processBatchDecay', [], optsWithIdentity());
    console.log(res);
});
program
    .command('triggerManualDecay')
    .argument('<canisterId>')
    .action(async (...args) => {
    const [cid] = args.slice(0, -1);
    const res = await invokeUpdate(cid, 'triggerManualDecay', [], optsWithIdentity());
    console.log(res);
});
/** Cycles */
program
    .command('topUp')
    .argument('<canisterId>')
    .action(async (cid) => {
    // accepts all available attached cycles; returns accepted cycles (Nat)
    const res = await invokeUpdate(cid, 'topUp', [], optsWithIdentity());
    console.log(pretty(res));
});
program
    .command('withdrawCycles')
    .argument('<canisterId>')
    .argument('<toPrincipal>')
    .argument('<amountNat>')
    .action(async (cid, to, amount) => {
    const res = await invokeUpdate(cid, 'withdrawCycles', [P(to), N(amount)], optsWithIdentity());
    console.log(res);
});
/** DX events */
program
    .command('emitEvent')
    .argument('<canisterId>')
    .argument('<kind>')
    .argument('[payload]')
    .option('--b64', 'payload is base64', false)
    .option('--hex', 'payload is hex', false)
    .action(async (...args) => {
    const cmd = args[args.length - 1];
    const [cid, kind, payload] = args.slice(0, -1);
    const { b64, hex } = cmd.opts();
    let bytes = new Uint8Array();
    if (payload != null) {
        if (b64)
            bytes = new Uint8Array(Buffer.from(payload, 'base64'));
        else if (hex)
            bytes = new Uint8Array(Buffer.from(payload.replace(/^0x/, ''), 'hex'));
        else
            bytes = new TextEncoder().encode(payload);
    }
    const res = await invokeUpdate(cid, 'emitEvent', [kind, bytes], optsWithIdentity());
    console.log(res);
});
/** Queries */
program
    .command('getBalance')
    .argument('<canisterId>')
    .argument('<principal>')
    .action(async (cid, p) => {
    const bal = await getBalance(cid, p, program.opts());
    console.log(bal.toString());
});
program
    .command('getTrustedAwarders')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'getTrustedAwarders', [], program.opts());
    console.log(pretty(res));
});
program
    .command('getTransactionHistory')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'getTransactionHistory', [], program.opts());
    console.log(pretty(res));
});
program
    .command('getTransactionsPaged')
    .argument('<canisterId>')
    .argument('<offsetNat>')
    .argument('<limitNat>')
    .action(async (cid, offset, limit) => {
    const res = await invokeQuery(cid, 'getTransactionsPaged', [N(offset), N(limit)], program.opts());
    console.log(pretty(res));
});
program
    .command('getTransactionsByUser')
    .argument('<canisterId>')
    .argument('<userPrincipal>')
    .action(async (cid, user) => {
    const res = await invokeQuery(cid, 'getTransactionsByUser', [P(user)], program.opts());
    console.log(pretty(res));
});
program
    .command('findTransactionsByReason')
    .argument('<canisterId>')
    .argument('<substr>')
    .argument('<limitNat>')
    .action(async (cid, substr, limit) => {
    const res = await invokeQuery(cid, 'findTransactionsByReason', [substr, N(limit)], program.opts());
    console.log(pretty(res));
});
program
    .command('getTransactionById')
    .argument('<canisterId>')
    .argument('<idNat>')
    .action(async (cid, id) => {
    const res = await invokeQuery(cid, 'getTransactionById', [N(id)], program.opts());
    console.log(pretty(res));
});
program
    .command('getTransactionCount')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'getTransactionCount', [], program.opts());
    console.log(pretty(res));
});
program
    .command('getDecayConfig')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'getDecayConfig', [], program.opts());
    console.log(pretty(res));
});
program
    .command('getUserDecayInfo')
    .argument('<canisterId>')
    .argument('<principal>')
    .action(async (cid, p) => {
    const res = await invokeQuery(cid, 'getUserDecayInfo', [P(p)], program.opts());
    console.log(pretty(res));
});
program
    .command('previewDecayAmount')
    .argument('<canisterId>')
    .argument('<principal>')
    .action(async (cid, p) => {
    const res = await invokeQuery(cid, 'previewDecayAmount', [P(p)], program.opts());
    console.log(pretty(res));
});
program
    .command('getBalanceWithDetails')
    .argument('<canisterId>')
    .argument('<principal>')
    .action(async (cid, p) => {
    const res = await invokeQuery(cid, 'getBalanceWithDetails', [P(p)], program.opts());
    console.log(pretty(res));
});
program
    .command('getDecayStatistics')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'getDecayStatistics', [], program.opts());
    console.log(pretty(res));
});
program
    .command('leaderboard')
    .argument('<canisterId>')
    .argument('<topNat>')
    .argument('<offsetNat>')
    .action(async (cid, top, offset) => {
    const res = await invokeQuery(cid, 'leaderboard', [N(top), N(offset)], program.opts());
    console.log(pretty(res));
});
program
    .command('myStats')
    .argument('<canisterId>')
    .argument('<userPrincipal>')
    .action(async (cid, user) => {
    const res = await invokeQuery(cid, 'myStats', [P(user)], program.opts());
    console.log(pretty(res));
});
program
    .command('awarderStats')
    .argument('<canisterId>')
    .argument('<awardeePrincipal>')
    .action(async (cid, awardee) => {
    const res = await invokeQuery(cid, 'awarderStats', [P(awardee)], program.opts());
    console.log(pretty(res));
});
program
    .command('orgPulse')
    .argument('<canisterId>')
    .argument('<sinceSecNat>')
    .action(async (cid, since) => {
    const res = await invokeQuery(cid, 'orgPulse', [N(since)], program.opts());
    console.log(pretty(res));
});
program
    .command('getTopUpsPaged')
    .argument('<canisterId>')
    .argument('<offsetNat>')
    .argument('<limitNat>')
    .action(async (cid, offset, limit) => {
    const res = await invokeQuery(cid, 'getTopUpsPaged', [N(offset), N(limit)], program.opts());
    console.log(pretty(res));
});
program
    .command('getTopUpCount')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'getTopUpCount', [], program.opts());
    console.log(pretty(res));
});
program
    .command('version')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'version', [], program.opts());
    console.log(pretty(res));
});
program
    .command('health')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'health', [], program.opts());
    console.log(pretty(res));
});
program
    .command('cycles_balance')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'cycles_balance', [], program.opts());
    console.log(pretty(res));
});
program
    .command('snapshotHash')
    .argument('<canisterId>')
    .action(async (cid) => {
    const res = await invokeQuery(cid, 'snapshotHash', [], program.opts());
    console.log(pretty(res));
});
/* -----------------------------------------------------------------------------
   Identity management (repdao + dfx integration)
----------------------------------------------------------------------------- */
program
    .command('id:list')
    .description('List saved identities (repdao + dfx)')
    .action(async () => {
    const { names: rnames, current } = await listIds();
    const { names: dnames, current: dcur } = listDfxIdentities();
    console.log('repdao:');
    if (!rnames.length)
        console.log('  (none)');
    for (const n of rnames)
        console.log(`${current === n ? '*' : ' '} ${n}`);
    console.log('dfx:');
    if (!dnames.length)
        console.log('  (none)');
    for (const n of dnames)
        console.log(`${dcur === n ? '*' : ' '} ${n}`);
});
program
    .command('id:whoami')
    .description('Show principal of current identity (repdao current, else dfx default). Use --pem to override.')
    .option('--pem <path>', 'PEM override (defaults to repdao current, else dfx default)')
    .action(async (opts) => {
    const pemPath = opts.pem ?? identityPathOrThrow();
    const id = Secp256k1KeyIdentity.fromPem(readFileSync(pemPath, 'utf8'));
    console.log(id.getPrincipal().toText());
});
program
    .command('id:use <name>')
    .description('Switch current repdao identity')
    .action(async (name) => {
    await useId(name);
    console.log(`Current identity -> ${name}`);
});
program
    .command('id:import <name> <pemFile>')
    .description('Import a PEM file into the repdao store')
    .action(async (name, pemFile) => {
    const dest = await importPem(name, pemFile);
    console.log(`Imported as ${name}: ${dest}`);
});
program
    .command('id:new <name>')
    .description('Generate a new secp256k1 identity (PEM) into repdao store and set current')
    .action(async (name) => {
    const dest = await newIdentity(name);
    await useId(name);
    console.log(`Created and set current -> ${name}: ${dest}`);
});
program
    .command('id:export <name> [dest]')
    .description('Export a repdao PEM (prints to stdout if no dest)')
    .action(async (name, dest) => {
    const out = await exportPem(name, dest);
    if (dest)
        console.log(`Exported to ${dest}`);
    else
        console.log(out);
});
program
    .command('id:delete <name>')
    .description('Delete a saved repdao identity (not the current one)')
    .action(async (name) => {
    await delId(name);
    console.log(`Deleted ${name}`);
});
program
    .command('id:sync')
    .description('Import all dfx identities into repdao (names preserved)')
    .action(async () => {
    const { names } = listDfxIdentities();
    if (!names.length)
        return console.log('No dfx identities found.');
    for (const n of names) {
        const p = dfxPemPath(n);
        try {
            await importPem(n, p);
            console.log(`synced: ${n}`);
        }
        catch (e) {
            console.log(`skip ${n}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
});
/* -----------------------------------------------------------------------------
   Parse
----------------------------------------------------------------------------- */
program.parseAsync(process.argv).catch((e) => {
    console.error(e);
    process.exit(1);
});

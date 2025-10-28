// src/client.ts
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './idl/reputation_dao.did.js';
/* -----------------------------------------------------------------------------
   Internals
----------------------------------------------------------------------------- */
function resolveHost(network, hostOverride) {
    if (hostOverride)
        return hostOverride;
    switch (network) {
        case 'local':
            return 'http://127.0.0.1:4943';
        case 'ic':
        case undefined:
        default:
            return 'https://icp-api.io'; // fast mainnet gateway with CORS
    }
}
const actorCache = new Map();
const cacheKey = (canisterId, host, id) => `${canisterId}::${host}::${id ? id.getPrincipal?.().toText?.() ?? 'id' : 'anon'}`;
async function makeActor(canisterId, opts) {
    const host = resolveHost(opts?.network, opts?.host);
    const key = cacheKey(canisterId, host, opts?.identity);
    const cached = actorCache.get(key);
    if (cached)
        return cached;
    const agent = new HttpAgent({ host, identity: opts?.identity });
    // Local dev & non-ic networks need root key to validate certificates
    if (host.startsWith('http://127.0.0.1') || (opts?.network && opts.network !== 'ic')) {
        try {
            await agent.fetchRootKey();
        }
        catch {
            // ignore when replica not up yet (CI etc.)
        }
    }
    const actor = Actor.createActor(idlFactory, { agent, canisterId });
    actorCache.set(key, actor);
    return actor;
}
// helpers
const P = (txt) => Principal.fromText(txt);
const N = (x) => typeof x === 'bigint' ? x : typeof x === 'number' ? BigInt(Math.floor(x)) : BigInt(x);
const B = (x) => (typeof x === 'boolean' ? x : x === 'true');
const Opt = (val) => (val == null ? [] : [val]);
const fromOpt = (opt) => (opt.length === 0 ? null : opt[0]);
async function _call(kind, canisterId, method, args, opts) {
    const actor = await makeActor(canisterId, opts);
    const fn = actor[method];
    if (typeof fn !== 'function')
        throw new Error(`${kind} method not found: ${method}`);
    try {
        return await fn(...args);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new Error(`${kind} ${method} failed: ${msg}`);
    }
}
const q = (canisterId, method, args, opts) => _call('query', canisterId, method, args, opts);
const u = (canisterId, method, args, opts) => _call('update', canisterId, method, args, opts);
/* -----------------------------------------------------------------------------
   Public: generic helpers (used by CLI too)
----------------------------------------------------------------------------- */
export async function invokeQuery(canisterId, method, args, opts) {
    return q(canisterId, method, args, opts);
}
export async function invokeUpdate(canisterId, method, args, opts) {
    return u(canisterId, method, args, opts);
}
/* -----------------------------------------------------------------------------
   Typed wrappers (one-liners). Return types match candid where useful.
----------------------------------------------------------------------------- */
/** Awarders / transfers */
export const addTrustedAwarder = (cid, awarder, name, opts) => u(cid, 'addTrustedAwarder', [P(awarder), name], opts);
export const removeTrustedAwarder = (cid, awarder, opts) => u(cid, 'removeTrustedAwarder', [P(awarder)], opts);
export const awardRep = (cid, to, amount, reason, opts) => u(cid, 'awardRep', [P(to), N(amount), Opt(reason)], opts);
export const multiAward = (cid, pairs, atomic = false, opts) => {
    const mapped = pairs.map(([to, amt, r]) => [P(to), N(amt), Opt(r)]);
    return u(cid, 'multiAward', [mapped, !!atomic], opts);
};
export const revokeRep = (cid, from, amount, reason, opts) => u(cid, 'revokeRep', [P(from), N(amount), Opt(reason)], opts);
export const resetUser = (cid, user, reason, opts) => u(cid, 'resetUser', [P(user), Opt(reason)], opts);
/** Admin / policy */
export const transferOwnership = (cid, newOwner, opts) => u(cid, 'transferOwnership', [P(newOwner)], opts);
export const nominateOwner = (cid, candidate, opts) => u(cid, 'nominateOwner', [P(candidate)], opts);
export const acceptOwnership = (cid, opts) => u(cid, 'acceptOwnership', [], opts);
export const configureDecay = (cid, decayRate, decayInterval, minThreshold, gracePeriod, enabled, opts) => u(cid, 'configureDecay', [N(decayRate), N(decayInterval), N(minThreshold), N(gracePeriod), !!enabled], opts);
export const setDailyMintLimit = (cid, limit, opts) => u(cid, 'setDailyMintLimit', [N(limit)], opts);
export const setPerAwarderDailyLimit = (cid, awarder, limit, opts) => u(cid, 'setPerAwarderDailyLimit', [P(awarder), N(limit)], opts);
export const blacklist = (cid, user, on, opts) => u(cid, 'blacklist', [P(user), B(on)], opts);
export const pause = (cid, on, opts) => u(cid, 'pause', [B(on)], opts);
export const setParent = (cid, parent, opts) => u(cid, 'setParent', [P(parent)], opts);
export const setMinCyclesAlert = (cid, threshold, opts) => u(cid, 'setMinCyclesAlert', [N(threshold)], opts);
/** Maintenance */
export const processBatchDecay = (cid, opts) => u(cid, 'processBatchDecay', [], opts);
export const triggerManualDecay = (cid, opts) => u(cid, 'triggerManualDecay', [], opts);
/** Cycles */
export const topUp = (cid, opts) => u(cid, 'topUp', [], opts);
export const withdrawCycles = (cid, to, amount, opts) => u(cid, 'withdrawCycles', [P(to), N(amount)], opts);
export const returnCyclesToFactory = (cid, minRemain, opts) => u(cid, 'returnCyclesToFactory', [N(minRemain)], opts);
/** DX events */
export const emitEvent = (cid, kind, payload, opts) => u(cid, 'emitEvent', [kind, payload], opts);
/** Queries */
export const getBalance = (cid, p, opts) => q(cid, 'getBalance', [P(p)], opts).then((x) => BigInt(x));
export const getTrustedAwarders = (cid, opts) => q(cid, 'getTrustedAwarders', [], opts);
export const getTransactionHistory = (cid, opts) => q(cid, 'getTransactionHistory', [], opts);
export const getTransactionsPaged = (cid, offset, limit, opts) => q(cid, 'getTransactionsPaged', [N(offset), N(limit)], opts);
export const getTransactionsByUser = (cid, user, opts) => q(cid, 'getTransactionsByUser', [P(user)], opts);
export const findTransactionsByReason = (cid, substr, limit, opts) => q(cid, 'findTransactionsByReason', [substr, N(limit)], opts);
export const getTransactionById = (cid, id, opts) => q(cid, 'getTransactionById', [N(id)], opts).then((res) => fromOpt(res));
export const getTransactionCount = (cid, opts) => q(cid, 'getTransactionCount', [], opts).then((x) => BigInt(x));
export const getDecayConfig = (cid, opts) => q(cid, 'getDecayConfig', [], opts);
export const getUserDecayInfo = (cid, p, opts) => q(cid, 'getUserDecayInfo', [P(p)], opts).then((res) => fromOpt(res));
export const previewDecayAmount = (cid, p, opts) => q(cid, 'previewDecayAmount', [P(p)], opts).then((x) => BigInt(x));
export const getBalanceWithDetails = (cid, p, opts) => q(cid, 'getBalanceWithDetails', [P(p)], opts).then((res) => {
    const details = res;
    return {
        rawBalance: details.rawBalance,
        currentBalance: details.currentBalance,
        pendingDecay: details.pendingDecay,
        decayInfo: fromOpt(details.decayInfo),
    };
});
export const getDecayStatistics = (cid, opts) => q(cid, 'getDecayStatistics', [], opts);
export const leaderboard = (cid, top, offset, opts) => q(cid, 'leaderboard', [N(top), N(offset)], opts);
export const myStats = (cid, user, opts) => q(cid, 'myStats', [P(user)], opts);
export const awarderStats = (cid, awardee, opts) => q(cid, 'awarderStats', [P(awardee)], opts);
export const orgPulse = (cid, sinceSec, opts) => q(cid, 'orgPulse', [N(sinceSec)], opts);
export const getTopUpsPaged = (cid, offset, limit, opts) => q(cid, 'getTopUpsPaged', [N(offset), N(limit)], opts);
export const getTopUpCount = (cid, opts) => q(cid, 'getTopUpCount', [], opts).then((x) => BigInt(x));
export const version = (cid, opts) => q(cid, 'version', [], opts);
export const health = (cid, opts) => q(cid, 'health', [], opts);
export const cycles_balance = (cid, opts) => q(cid, 'cycles_balance', [], opts).then((x) => BigInt(x));
export const snapshotHash = (cid, opts) => q(cid, 'snapshotHash', [], opts).then((x) => BigInt(x));
// Missing Event queries (events are stored but no query functions exposed in backend)
// These would need to be added to the backend first
// Missing: getEvents, getEventsPaged, getEventsByKind
// The backend stores events but doesn't expose query functions for them
// This is a backend limitation, not SDK limitation

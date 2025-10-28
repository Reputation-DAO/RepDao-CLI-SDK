// src/client.ts
import { HttpAgent, Actor } from '@dfinity/agent';
import type { SignIdentity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './idl/reputation_dao.did.js';

/* -----------------------------------------------------------------------------
   Types
----------------------------------------------------------------------------- */

export type ClientOptions = {
  identity?: SignIdentity;
  network?: 'ic' | 'local' | 'custom' | string;
  host?: string; // explicit host override
};

export type Opt<T> = [] | [T];
export type BigNumberish = bigint | number | string;

/** Narrow TS views of common query results (raw candid values still fine). */
export type Awarder = { id: Principal; name: string };
export type Health = {
  paused: boolean;
  cycles: bigint;
  users: bigint;
  txCount: bigint;
  topUpCount: bigint;
  decayConfigHash: bigint;
};
export type DecayConfig = {
  decayRate: bigint;
  decayInterval: bigint;
  minThreshold: bigint;
  gracePeriod: bigint;
  enabled: boolean;
};

export type TransactionType = { Award: null } | { Revoke: null } | { Decay: null };

export type Transaction = {
  id: bigint;
  transactionType: TransactionType;
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  reason: Opt<string>;
};

export type UserDecayInfo = {
  lastActivityTime: bigint;
  totalDecayed: bigint;
  lastDecayTime: bigint;
  registrationTime: bigint;
};

export type BalanceDetails = {
  rawBalance: bigint;
  currentBalance: bigint;
  pendingDecay: bigint;
  decayInfo: UserDecayInfo | null;
};

export type DecayStatistics = {
  totalDecayedPoints: bigint;
  lastGlobalDecayProcess: bigint;
  configEnabled: boolean;
};

export type MyStats = {
  balance: bigint;
  lifetimeAwarded: bigint;
  lifetimeRevoked: bigint;
  totalDecayed: bigint;
  lastActivity: bigint;
};

export type OrgPulse = {
  awards: bigint;
  revokes: bigint;
  decays: bigint;
};

export type TopUp = {
  id: bigint;
  from: Principal;
  amount: bigint;
  timestamp: bigint;
};

export type AwarderStatsRow = {
  awarder: Principal;
  total: bigint;
  lastAward: bigint;
};

/* -----------------------------------------------------------------------------
   Internals
----------------------------------------------------------------------------- */

function resolveHost(network?: string, hostOverride?: string) {
  if (hostOverride) return hostOverride;
  switch (network) {
    case 'local':
      return 'http://127.0.0.1:4943';
    case 'ic':
    case undefined:
    default:
      return 'https://icp-api.io'; // fast mainnet gateway with CORS
  }
}

const actorCache = new Map<string, unknown>();
const cacheKey = (canisterId: string, host: string, id?: SignIdentity) =>
  `${canisterId}::${host}::${id ? (id as any).getPrincipal?.().toText?.() ?? 'id' : 'anon'}`;

async function makeActor(canisterId: string, opts?: ClientOptions) {
  const host = resolveHost(opts?.network, opts?.host);
  const key = cacheKey(canisterId, host, opts?.identity);
  const cached = actorCache.get(key);
  if (cached) return cached as any;

  const agent = new HttpAgent({ host, identity: opts?.identity });

  // Local dev & non-ic networks need root key to validate certificates
  if (host.startsWith('http://127.0.0.1') || (opts?.network && opts.network !== 'ic')) {
    try {
      await agent.fetchRootKey();
    } catch {
      // ignore when replica not up yet (CI etc.)
    }
  }

  const actor = Actor.createActor(idlFactory as any, { agent, canisterId });
  actorCache.set(key, actor);
  return actor as any;
}

// helpers
const P = (txt: string) => Principal.fromText(txt);
const N = (x: BigNumberish) =>
  typeof x === 'bigint' ? x : typeof x === 'number' ? BigInt(Math.floor(x)) : BigInt(x);
const B = (x: string | boolean) => (typeof x === 'boolean' ? x : x === 'true');
const Opt = <T,>(val?: T | null): Opt<T> => (val == null ? [] : [val]);
const fromOpt = <T>(opt: Opt<T>): T | null => (opt.length === 0 ? null : opt[0]);

async function _call(
  kind: 'query' | 'update',
  canisterId: string,
  method: string,
  args: unknown[],
  opts?: ClientOptions
) {
  const actor = await makeActor(canisterId, opts);
  const fn = (actor as any)[method];
  if (typeof fn !== 'function') throw new Error(`${kind} method not found: ${method}`);
  try {
    return await fn(...args);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${kind} ${method} failed: ${msg}`);
  }
}

const q = (canisterId: string, method: string, args: unknown[], opts?: ClientOptions) =>
  _call('query', canisterId, method, args, opts);

const u = (canisterId: string, method: string, args: unknown[], opts?: ClientOptions) =>
  _call('update', canisterId, method, args, opts);

/* -----------------------------------------------------------------------------
   Public: generic helpers (used by CLI too)
----------------------------------------------------------------------------- */

export async function invokeQuery(
  canisterId: string,
  method: string,
  args: unknown[],
  opts?: ClientOptions
): Promise<unknown> {
  return q(canisterId, method, args, opts);
}

export async function invokeUpdate(
  canisterId: string,
  method: string,
  args: unknown[],
  opts?: ClientOptions
): Promise<unknown> {
  return u(canisterId, method, args, opts);
}

/* -----------------------------------------------------------------------------
   Typed wrappers (one-liners). Return types match candid where useful.
----------------------------------------------------------------------------- */

/** Awarders / transfers */
export const addTrustedAwarder = (cid: string, awarder: string, name: string, opts?: ClientOptions) =>
  u(cid, 'addTrustedAwarder', [P(awarder), name], opts) as Promise<string>;

export const removeTrustedAwarder = (cid: string, awarder: string, opts?: ClientOptions) =>
  u(cid, 'removeTrustedAwarder', [P(awarder)], opts) as Promise<string>;

export const awardRep = (
  cid: string,
  to: string,
  amount: BigNumberish,
  reason?: string,
  opts?: ClientOptions
) => u(cid, 'awardRep', [P(to), N(amount), Opt(reason)], opts) as Promise<string>;

export const multiAward = (
  cid: string,
  pairs: Array<[string, BigNumberish, string?]>,
  atomic = false,
  opts?: ClientOptions
) => {
  const mapped = pairs.map(
    ([to, amt, r]): [Principal, bigint, Opt<string>] => [P(to), N(amt), Opt(r)]
  );
  return u(cid, 'multiAward', [mapped, !!atomic], opts) as Promise<string>;
};

export const revokeRep = (
  cid: string,
  from: string,
  amount: BigNumberish,
  reason?: string,
  opts?: ClientOptions
) => u(cid, 'revokeRep', [P(from), N(amount), Opt(reason)], opts) as Promise<string>;

export const resetUser = (cid: string, user: string, reason?: string, opts?: ClientOptions) =>
  u(cid, 'resetUser', [P(user), Opt(reason)], opts) as Promise<string>;

/** Admin / policy */
export const transferOwnership = (cid: string, newOwner: string, opts?: ClientOptions) =>
  u(cid, 'transferOwnership', [P(newOwner)], opts) as Promise<string>;

export const nominateOwner = (cid: string, candidate: string, opts?: ClientOptions) =>
  u(cid, 'nominateOwner', [P(candidate)], opts) as Promise<string>;

export const acceptOwnership = (cid: string, opts?: ClientOptions) =>
  u(cid, 'acceptOwnership', [], opts) as Promise<string>;

export const configureDecay = (
  cid: string,
  decayRate: BigNumberish,
  decayInterval: BigNumberish,
  minThreshold: BigNumberish,
  gracePeriod: BigNumberish,
  enabled: boolean,
  opts?: ClientOptions
) =>
  u(
    cid,
    'configureDecay',
    [N(decayRate), N(decayInterval), N(minThreshold), N(gracePeriod), !!enabled],
    opts
  ) as Promise<string>;

export const setDailyMintLimit = (cid: string, limit: BigNumberish, opts?: ClientOptions) =>
  u(cid, 'setDailyMintLimit', [N(limit)], opts) as Promise<string>;

export const setPerAwarderDailyLimit = (
  cid: string,
  awarder: string,
  limit: BigNumberish,
  opts?: ClientOptions
) => u(cid, 'setPerAwarderDailyLimit', [P(awarder), N(limit)], opts) as Promise<string>;

export const blacklist = (cid: string, user: string, on: boolean | string, opts?: ClientOptions) =>
  u(cid, 'blacklist', [P(user), B(on)], opts) as Promise<string>;

export const pause = (cid: string, on: boolean | string, opts?: ClientOptions) =>
  u(cid, 'pause', [B(on)], opts) as Promise<string>;

export const setParent = (cid: string, parent: string, opts?: ClientOptions) =>
  u(cid, 'setParent', [P(parent)], opts) as Promise<string>;

export const setMinCyclesAlert = (cid: string, threshold: BigNumberish, opts?: ClientOptions) =>
  u(cid, 'setMinCyclesAlert', [N(threshold)], opts) as Promise<string>;

/** Maintenance */
export const processBatchDecay = (cid: string, opts?: ClientOptions) =>
  u(cid, 'processBatchDecay', [], opts) as Promise<string>;

export const triggerManualDecay = (cid: string, opts?: ClientOptions) =>
  u(cid, 'triggerManualDecay', [], opts) as Promise<string>;

/** Cycles */
export const topUp = (cid: string, opts?: ClientOptions) =>
  u(cid, 'topUp', [], opts) as Promise<bigint>;

export const withdrawCycles = (
  cid: string,
  to: string,
  amount: BigNumberish,
  opts?: ClientOptions
) => u(cid, 'withdrawCycles', [P(to), N(amount)], opts) as Promise<string>;

export const returnCyclesToFactory = (
  cid: string,
  minRemain: BigNumberish,
  opts?: ClientOptions
) => u(cid, 'returnCyclesToFactory', [N(minRemain)], opts) as Promise<bigint>;

/** DX events */
export const emitEvent = (cid: string, kind: string, payload: Uint8Array, opts?: ClientOptions) =>
  u(cid, 'emitEvent', [kind, payload], opts) as Promise<string>;

/** Queries */
export const getBalance = (cid: string, p: string, opts?: ClientOptions) =>
  q(cid, 'getBalance', [P(p)], opts).then((x) => BigInt(x as bigint));

export const getTrustedAwarders = (cid: string, opts?: ClientOptions) =>
  q(cid, 'getTrustedAwarders', [], opts) as Promise<Awarder[]>;

export const getTransactionHistory = (cid: string, opts?: ClientOptions) =>
  q(cid, 'getTransactionHistory', [], opts) as Promise<Transaction[]>;

export const getTransactionsPaged = (
  cid: string,
  offset: BigNumberish,
  limit: BigNumberish,
  opts?: ClientOptions
) => q(cid, 'getTransactionsPaged', [N(offset), N(limit)], opts) as Promise<Transaction[]>;

export const getTransactionsByUser = (cid: string, user: string, opts?: ClientOptions) =>
  q(cid, 'getTransactionsByUser', [P(user)], opts) as Promise<Transaction[]>;

export const findTransactionsByReason = (
  cid: string,
  substr: string,
  limit: BigNumberish,
  opts?: ClientOptions
) => q(cid, 'findTransactionsByReason', [substr, N(limit)], opts) as Promise<Transaction[]>;

export const getTransactionById = (cid: string, id: BigNumberish, opts?: ClientOptions) =>
  q(cid, 'getTransactionById', [N(id)], opts).then((res) => fromOpt(res as Opt<Transaction>));

export const getTransactionCount = (cid: string, opts?: ClientOptions) =>
  q(cid, 'getTransactionCount', [], opts).then((x) => BigInt(x as bigint));

export const getDecayConfig = (cid: string, opts?: ClientOptions) =>
  q(cid, 'getDecayConfig', [], opts) as Promise<DecayConfig>;

export const getUserDecayInfo = (cid: string, p: string, opts?: ClientOptions) =>
  q(cid, 'getUserDecayInfo', [P(p)], opts).then((res) => fromOpt(res as Opt<UserDecayInfo>));

export const previewDecayAmount = (cid: string, p: string, opts?: ClientOptions) =>
  q(cid, 'previewDecayAmount', [P(p)], opts).then((x) => BigInt(x as bigint));

export const getBalanceWithDetails = (cid: string, p: string, opts?: ClientOptions) =>
  q(cid, 'getBalanceWithDetails', [P(p)], opts).then((res) => {
    const details = res as {
      rawBalance: bigint;
      currentBalance: bigint;
      pendingDecay: bigint;
      decayInfo: Opt<UserDecayInfo>;
    };
    return {
      rawBalance: details.rawBalance,
      currentBalance: details.currentBalance,
      pendingDecay: details.pendingDecay,
      decayInfo: fromOpt(details.decayInfo),
    } satisfies BalanceDetails;
  });

export const getDecayStatistics = (cid: string, opts?: ClientOptions) =>
  q(cid, 'getDecayStatistics', [], opts) as Promise<DecayStatistics>;

export const leaderboard = (
  cid: string,
  top: BigNumberish,
  offset: BigNumberish,
  opts?: ClientOptions
) => q(cid, 'leaderboard', [N(top), N(offset)], opts) as Promise<Array<[Principal, bigint]>>;

export const myStats = (cid: string, user: string, opts?: ClientOptions) =>
  q(cid, 'myStats', [P(user)], opts) as Promise<MyStats>;

export const awarderStats = (cid: string, awardee: string, opts?: ClientOptions) =>
  q(cid, 'awarderStats', [P(awardee)], opts) as Promise<AwarderStatsRow[]>;

export const orgPulse = (cid: string, sinceSec: BigNumberish, opts?: ClientOptions) =>
  q(cid, 'orgPulse', [N(sinceSec)], opts) as Promise<OrgPulse>;

export const getTopUpsPaged = (
  cid: string,
  offset: BigNumberish,
  limit: BigNumberish,
  opts?: ClientOptions
) => q(cid, 'getTopUpsPaged', [N(offset), N(limit)], opts) as Promise<TopUp[]>;

export const getTopUpCount = (cid: string, opts?: ClientOptions) =>
  q(cid, 'getTopUpCount', [], opts).then((x) => BigInt(x as bigint));

export const version = (cid: string, opts?: ClientOptions) =>
  q(cid, 'version', [], opts) as Promise<string>;

export const health = (cid: string, opts?: ClientOptions) =>
  q(cid, 'health', [], opts) as Promise<Health>;

export const cycles_balance = (cid: string, opts?: ClientOptions) =>
  q(cid, 'cycles_balance', [], opts).then((x) => BigInt(x as bigint));

export const snapshotHash = (cid: string, opts?: ClientOptions) =>
  q(cid, 'snapshotHash', [], opts).then((x) => BigInt(x as bigint));

// Missing Event queries (events are stored but no query functions exposed in backend)
// These would need to be added to the backend first

// Missing: getEvents, getEventsPaged, getEventsByKind
// The backend stores events but doesn't expose query functions for them
// This is a backend limitation, not SDK limitation

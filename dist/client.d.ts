import type { SignIdentity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
export type ClientOptions = {
    identity?: SignIdentity;
    network?: 'ic' | 'local' | 'custom' | string;
    host?: string;
};
export type Opt<T> = [] | [T];
export type BigNumberish = bigint | number | string;
/** Narrow TS views of common query results (raw candid values still fine). */
export type Awarder = {
    id: Principal;
    name: string;
};
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
export type TransactionType = {
    Award: null;
} | {
    Revoke: null;
} | {
    Decay: null;
};
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
export declare function invokeQuery(canisterId: string, method: string, args: unknown[], opts?: ClientOptions): Promise<unknown>;
export declare function invokeUpdate(canisterId: string, method: string, args: unknown[], opts?: ClientOptions): Promise<unknown>;
/** Awarders / transfers */
export declare const addTrustedAwarder: (cid: string, awarder: string, name: string, opts?: ClientOptions) => Promise<string>;
export declare const removeTrustedAwarder: (cid: string, awarder: string, opts?: ClientOptions) => Promise<string>;
export declare const awardRep: (cid: string, to: string, amount: BigNumberish, reason?: string, opts?: ClientOptions) => Promise<string>;
export declare const multiAward: (cid: string, pairs: Array<[string, BigNumberish, string?]>, atomic?: boolean, opts?: ClientOptions) => Promise<string>;
export declare const revokeRep: (cid: string, from: string, amount: BigNumberish, reason?: string, opts?: ClientOptions) => Promise<string>;
export declare const resetUser: (cid: string, user: string, reason?: string, opts?: ClientOptions) => Promise<string>;
/** Admin / policy */
export declare const transferOwnership: (cid: string, newOwner: string, opts?: ClientOptions) => Promise<string>;
export declare const nominateOwner: (cid: string, candidate: string, opts?: ClientOptions) => Promise<string>;
export declare const acceptOwnership: (cid: string, opts?: ClientOptions) => Promise<string>;
export declare const configureDecay: (cid: string, decayRate: BigNumberish, decayInterval: BigNumberish, minThreshold: BigNumberish, gracePeriod: BigNumberish, enabled: boolean, opts?: ClientOptions) => Promise<string>;
export declare const setDailyMintLimit: (cid: string, limit: BigNumberish, opts?: ClientOptions) => Promise<string>;
export declare const setPerAwarderDailyLimit: (cid: string, awarder: string, limit: BigNumberish, opts?: ClientOptions) => Promise<string>;
export declare const blacklist: (cid: string, user: string, on: boolean | string, opts?: ClientOptions) => Promise<string>;
export declare const pause: (cid: string, on: boolean | string, opts?: ClientOptions) => Promise<string>;
export declare const setParent: (cid: string, parent: string, opts?: ClientOptions) => Promise<string>;
export declare const setMinCyclesAlert: (cid: string, threshold: BigNumberish, opts?: ClientOptions) => Promise<string>;
/** Maintenance */
export declare const processBatchDecay: (cid: string, opts?: ClientOptions) => Promise<string>;
export declare const triggerManualDecay: (cid: string, opts?: ClientOptions) => Promise<string>;
/** Cycles */
export declare const topUp: (cid: string, opts?: ClientOptions) => Promise<bigint>;
export declare const withdrawCycles: (cid: string, to: string, amount: BigNumberish, opts?: ClientOptions) => Promise<string>;
export declare const returnCyclesToFactory: (cid: string, minRemain: BigNumberish, opts?: ClientOptions) => Promise<bigint>;
/** DX events */
export declare const emitEvent: (cid: string, kind: string, payload: Uint8Array, opts?: ClientOptions) => Promise<string>;
/** Queries */
export declare const getBalance: (cid: string, p: string, opts?: ClientOptions) => Promise<bigint>;
export declare const getTrustedAwarders: (cid: string, opts?: ClientOptions) => Promise<Awarder[]>;
export declare const getTransactionHistory: (cid: string, opts?: ClientOptions) => Promise<Transaction[]>;
export declare const getTransactionsPaged: (cid: string, offset: BigNumberish, limit: BigNumberish, opts?: ClientOptions) => Promise<Transaction[]>;
export declare const getTransactionsByUser: (cid: string, user: string, opts?: ClientOptions) => Promise<Transaction[]>;
export declare const findTransactionsByReason: (cid: string, substr: string, limit: BigNumberish, opts?: ClientOptions) => Promise<Transaction[]>;
export declare const getTransactionById: (cid: string, id: BigNumberish, opts?: ClientOptions) => Promise<Transaction>;
export declare const getTransactionCount: (cid: string, opts?: ClientOptions) => Promise<bigint>;
export declare const getDecayConfig: (cid: string, opts?: ClientOptions) => Promise<DecayConfig>;
export declare const getUserDecayInfo: (cid: string, p: string, opts?: ClientOptions) => Promise<UserDecayInfo>;
export declare const previewDecayAmount: (cid: string, p: string, opts?: ClientOptions) => Promise<bigint>;
export declare const getBalanceWithDetails: (cid: string, p: string, opts?: ClientOptions) => Promise<{
    rawBalance: bigint;
    currentBalance: bigint;
    pendingDecay: bigint;
    decayInfo: UserDecayInfo;
}>;
export declare const getDecayStatistics: (cid: string, opts?: ClientOptions) => Promise<DecayStatistics>;
export declare const leaderboard: (cid: string, top: BigNumberish, offset: BigNumberish, opts?: ClientOptions) => Promise<Array<[Principal, bigint]>>;
export declare const myStats: (cid: string, user: string, opts?: ClientOptions) => Promise<MyStats>;
export declare const awarderStats: (cid: string, awardee: string, opts?: ClientOptions) => Promise<AwarderStatsRow[]>;
export declare const orgPulse: (cid: string, sinceSec: BigNumberish, opts?: ClientOptions) => Promise<OrgPulse>;
export declare const getTopUpsPaged: (cid: string, offset: BigNumberish, limit: BigNumberish, opts?: ClientOptions) => Promise<TopUp[]>;
export declare const getTopUpCount: (cid: string, opts?: ClientOptions) => Promise<bigint>;
export declare const version: (cid: string, opts?: ClientOptions) => Promise<string>;
export declare const health: (cid: string, opts?: ClientOptions) => Promise<Health>;
export declare const cycles_balance: (cid: string, opts?: ClientOptions) => Promise<bigint>;
export declare const snapshotHash: (cid: string, opts?: ClientOptions) => Promise<bigint>;

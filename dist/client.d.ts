import { type ActorSubclass, type Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
export interface ReputationChildService {
    addTrustedAwarder: (p: Principal, name: string) => Promise<string>;
    awardRep: (to: Principal, amount: bigint, reason: [] | [string]) => Promise<string>;
    getBalance: (p: Principal) => Promise<bigint>;
}
type ClientOpts = {
    identity?: Identity;
    /** "ic" | "local" | custom host selector */
    network?: string;
    /** direct host override (e.g. http://127.0.0.1:4943) */
    host?: string;
};
export declare function createActor(canisterId: string, opts?: ClientOpts): ActorSubclass<ReputationChildService>;
export declare function addTrustedAwarder(canisterId: string, awarder: string, name: string, opts?: ClientOpts): Promise<string>;
export declare function awardRep(canisterId: string, to: string, amount: bigint, reason?: string, opts?: ClientOpts): Promise<string>;
export declare function getBalance(canisterId: string, principalText: string, opts?: ClientOpts): Promise<bigint>;
export {};

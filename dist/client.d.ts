import type { SignIdentity } from '@dfinity/agent';
export type ClientOptions = {
    identity?: SignIdentity;
    network?: 'ic' | 'local' | 'custom' | string;
    host?: string;
};
export declare function addTrustedAwarder(canisterId: string, awarderPrincipal: string, name: string, opts?: ClientOptions): Promise<any>;
export declare function awardRep(canisterId: string, toPrincipal: string, amount: bigint, reason?: string, opts?: ClientOptions): Promise<any>;
export declare function getBalance(canisterId: string, principalText: string, opts?: ClientOptions): Promise<bigint>;
export declare function invokeQuery(canisterId: string, method: string, args: unknown[], opts?: ClientOptions): Promise<unknown>;
export declare function invokeUpdate(canisterId: string, method: string, args: unknown[], opts?: ClientOptions): Promise<unknown>;

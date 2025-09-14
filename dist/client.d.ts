import type { SignIdentity } from '@dfinity/agent';
export type Network = 'ic' | 'local' | string;
export declare function childActor(canisterId: string, opts?: {
    identity?: SignIdentity;
    network?: Network;
}): Promise<any>;
/** ====== HIGH-LEVEL WRAPPERS ====== **/
export declare function addTrustedAwarder(canisterId: string, awarderPrincipalText: string, name: string, opts?: {
    identity?: SignIdentity;
    network?: Network;
}): Promise<any>;
export declare function awardRep(canisterId: string, toPrincipalText: string, amount: bigint | number, reason?: string, opts?: {
    identity?: SignIdentity;
    network?: Network;
}): Promise<any>;
export declare function getBalance(canisterId: string, principalText: string, opts?: {
    identity?: SignIdentity;
    network?: Network;
}): Promise<bigint>;
//# sourceMappingURL=client.d.ts.map
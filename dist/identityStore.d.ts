import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
/** Read a PEM and return a secp256k1 identity (throw if not supported). */
export declare function pemToIdentity(pem: string): Secp256k1KeyIdentity;
/** Return path to current repdao identity, or undefined if none set. */
export declare function currentRepdaoPemPath(): string | undefined;
/** List dfx identities visible on disk. */
export declare function listDfxIdentities(): {
    names: string[];
    current?: string;
};
/** Get the PEM path for a given dfx identity name. */
export declare function dfxPemPath(name: string): string;
/** List repdao-saved identities. */
export declare function list(): Promise<{
    names: string[];
    current?: string;
}>;
/** Throw if no identity path can be resolved. */
export declare function identityPathOrThrow(): string;
/** Resolve identity for a command: --pem > repdao current > dfx default. */
export declare function resolveIdentityPath(opts: {
    pem?: string;
}): string;
export declare function use(name: string): Promise<void>;
export declare function importPem(name: string, pemFile: string): Promise<string>;
export declare function newIdentity(name: string): Promise<string>;
export declare function exportPem(name: string, dest?: string): Promise<string>;
export declare function del(name: string): Promise<void>;

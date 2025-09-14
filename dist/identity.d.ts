import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
export declare function identityFromPemFile(pemPath: string): Secp256k1KeyIdentity;
export declare function identityFromPemString(pem: string): Secp256k1KeyIdentity;

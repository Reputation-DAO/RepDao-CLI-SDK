import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
import { readFileSync } from 'node:fs';
export function identityFromPemFile(pemPath) {
    const pem = readFileSync(pemPath, 'utf8');
    return Secp256k1KeyIdentity.fromPem(pem);
}
export function identityFromPemString(pem) {
    return Secp256k1KeyIdentity.fromPem(pem);
}

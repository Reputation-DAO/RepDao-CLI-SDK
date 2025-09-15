// src/identityStore.ts
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';
import { Secp256k1KeyIdentity } from '@dfinity/identity-secp256k1';
const STORE_DIR = join(homedir(), '.repdao');
const CURRENT_SYMLINK = join(STORE_DIR, 'current'); // we use a plain text file pointer
const DFX_ROOT = process.env.DFX_IDENTITY_ROOT ?? join(homedir(), '.config', 'dfx', 'identity');
function ensureStoreDir() {
    if (!existsSync(STORE_DIR))
        mkdirSync(STORE_DIR, { recursive: true });
}
function getDfxDefaultPemPath() {
    const p = join(homedir(), '.config', 'dfx', 'identity', 'default', 'identity.pem');
    return existsSync(p) ? p : null;
}
/** Read a PEM and return a secp256k1 identity (throw if not supported). */
export function pemToIdentity(pem) {
    try {
        return Secp256k1KeyIdentity.fromPem(pem);
    }
    catch {
        throw new Error('Unsupported PEM (only secp256k1 supported by this CLI).');
    }
}
/** Return path to current repdao identity, or undefined if none set. */
export function currentRepdaoPemPath() {
    try {
        const p = readFileSync(CURRENT_SYMLINK, 'utf8').trim();
        return p && existsSync(p) ? p : undefined;
    }
    catch {
        return undefined;
    }
}
/** Best-effort: return dfx current identity name via `dfx identity whoami`. */
function dfxWhoAmI() {
    try {
        const out = execSync('dfx identity whoami', { encoding: 'utf8' }).trim();
        return out || undefined;
    }
    catch {
        return undefined;
    }
}
/** List dfx identities visible on disk. */
export function listDfxIdentities() {
    const current = dfxWhoAmI();
    let names = [];
    try {
        if (existsSync(DFX_ROOT)) {
            names = readdirSync(DFX_ROOT, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => d.name)
                .sort();
        }
    }
    catch { /* ignore */ }
    return { names, current };
}
/** Get the PEM path for a given dfx identity name. */
export function dfxPemPath(name) {
    return join(DFX_ROOT, name, 'identity.pem'); // dfx stores PEMs here
}
/** List repdao-saved identities. */
export async function list() {
    ensureStoreDir();
    const files = readdirSync(STORE_DIR, { withFileTypes: true });
    const names = files
        .filter((f) => f.isFile() && f.name.endsWith('.pem') && f.name !== 'current')
        .map((f) => f.name.replace(/\.pem$/, ''))
        .sort();
    const cur = currentRepdaoPemPath();
    let current;
    if (cur) {
        const base = cur.split('/').pop();
        current = base.endsWith('.pem') ? base.slice(0, -4) : base;
    }
    return { names, current };
}
/** Throw if no identity path can be resolved. */
export function identityPathOrThrow() {
    // 1) explicit repdao current
    const repdao = currentRepdaoPemPath();
    if (repdao)
        return repdao;
    // 2) fall back to dfx default
    const dfxCurrent = dfxWhoAmI();
    if (dfxCurrent) {
        const pemPath = dfxPemPath(dfxCurrent);
        if (existsSync(pemPath))
            return pemPath;
    }
    throw new Error('No identity set. Use --pem or "repdao id:new|id:import|id:use", or ensure dfx default exists.');
}
/** Resolve identity for a command: --pem > repdao current > dfx default. */
export function resolveIdentityPath(opts) {
    if (opts.pem)
        return resolve(opts.pem);
    // try repdao current
    try {
        return identityPathOrThrow();
    }
    catch (e) {
        // fallback to dfx default if present
        const dfxPem = getDfxDefaultPemPath();
        if (dfxPem)
            return dfxPem;
        // no repdao current and no dfx default -> clear message
        throw new Error('No identity set. Use --pem or "repdao id:new|id:import|id:use", ' +
            'or ensure dfx default exists (e.g. `dfx identity use default && dfx identity export default > ~/.repdao/owner.pem`).');
    }
}
export async function use(name) {
    ensureStoreDir();
    const p = join(STORE_DIR, `${name}.pem`);
    if (!existsSync(p))
        throw new Error(`repdao identity "${name}" not found. Use id:import or id:new.`);
    writeFileSync(CURRENT_SYMLINK, p, 'utf8');
}
export async function importPem(name, pemFile) {
    ensureStoreDir();
    const dest = join(STORE_DIR, `${name}.pem`);
    cpSync(resolve(pemFile), dest, { force: true });
    return dest;
}
export async function newIdentity(name) {
    ensureStoreDir();
    const dest = join(STORE_DIR, `${name}.pem`);
    // 1) create the dfx identity non-interactively (plaintext storage)
    try {
        // preferred flag on newer dfx
        execSync(`DFX_NON_INTERACTIVE=1 dfx identity new ${name} --storage-mode plaintext`, {
            stdio: 'ignore',
        });
    }
    catch {
        // fallback for older dfx: answer "n" to encryption prompt
        try {
            execSync(`printf "n\n" | dfx identity new ${name}`, { stdio: 'ignore' });
        }
        catch (e) {
            throw new Error(`dfx identity new failed for "${name}": ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    // 2) export PEM from dfx and save into ~/.repdao/<name>.pem
    const pem = execSync(`dfx identity export ${name}`, { encoding: 'utf8' });
    writeFileSync(dest, pem, 'utf8');
    // 3) set as current
    writeFileSync(CURRENT_SYMLINK, dest, 'utf8');
    return dest;
}
export async function exportPem(name, dest) {
    ensureStoreDir();
    const src = join(STORE_DIR, `${name}.pem`);
    if (!existsSync(src))
        throw new Error(`repdao identity "${name}" not found.`);
    const pem = readFileSync(src, 'utf8');
    if (dest) {
        cpSync(src, resolve(dest), { force: true });
        return dest;
    }
    return pem; // print to stdout by caller
}
export async function del(name) {
    ensureStoreDir();
    const p = join(STORE_DIR, `${name}.pem`);
    if (!existsSync(p))
        throw new Error(`repdao identity "${name}" not found.`);
    // prevent deleting current pointer
    const cur = currentRepdaoPemPath();
    if (cur && resolve(cur) === resolve(p)) {
        throw new Error('Cannot delete the current identity. Switch first (id:use).');
    }
    rmSync(p);
}

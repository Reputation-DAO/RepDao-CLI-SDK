// src/client.ts
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './idl/reputation_dao.did.js';
/* ------------------------------- internals -------------------------------- */
function resolveHost(network, hostOverride) {
    if (hostOverride)
        return hostOverride;
    switch (network) {
        case 'local':
            return 'http://127.0.0.1:4943';
        case 'ic':
        case undefined:
        default:
            // Fast mainnet gateway with CORS
            return 'https://icp-api.io';
    }
}
async function makeActor(canisterId, opts) {
    const host = resolveHost(opts?.network, opts?.host);
    const agent = new HttpAgent({ host, identity: opts?.identity });
    // Local dev needs root key for cert verification
    if (host.startsWith('http://127.0.0.1') || (opts?.network && opts.network !== 'ic')) {
        try {
            await agent.fetchRootKey();
        }
        catch {
            // ignore in CI / when replica not up yet
        }
    }
    // idlFactory is the generated candid binding
    return Actor.createActor(idlFactory, { agent, canisterId });
}
/* ------------------------------- typed calls ------------------------------- */
export async function addTrustedAwarder(canisterId, awarderPrincipal, name, opts) {
    const actor = await makeActor(canisterId, opts);
    return actor.addTrustedAwarder(Principal.fromText(awarderPrincipal), name);
}
export async function awardRep(canisterId, toPrincipal, amount, reason, opts) {
    const actor = await makeActor(canisterId, opts);
    // Candid Opt<Text> — empty array = null, single-element array = some
    const optReason = reason === undefined || reason === null ? [] : [reason];
    return actor.awardRep(Principal.fromText(toPrincipal), amount, optReason);
}
export async function getBalance(canisterId, principalText, opts) {
    const actor = await makeActor(canisterId, opts);
    const res = await actor.getBalance(Principal.fromText(principalText));
    // Agent returns JS bigint for Nat; keep API stable
    return BigInt(res);
}
/* ------------------------ generic helpers for CLI ------------------------- */
export async function invokeQuery(canisterId, method, args, opts) {
    const actor = await makeActor(canisterId, opts);
    const fn = actor[method];
    if (typeof fn !== 'function')
        throw new Error(`Query method not found: ${method}`);
    return await fn(...args);
}
export async function invokeUpdate(canisterId, method, args, opts) {
    const actor = await makeActor(canisterId, opts);
    const fn = actor[method];
    if (typeof fn !== 'function')
        throw new Error(`Update method not found: ${method}`);
    return await fn(...args);
}

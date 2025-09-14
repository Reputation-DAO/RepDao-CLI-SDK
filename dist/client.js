// src/client.ts
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './idl/reputation_dao.did.js';
function hostFrom(opts) {
    if (opts.host)
        return opts.host;
    if ((opts.network ?? 'ic') === 'ic')
        return 'https://icp-api.io';
    // defaults to local
    return 'http://127.0.0.1:4943';
}
export function createActor(canisterId, opts = {}) {
    const host = hostFrom(opts);
    const agent = new HttpAgent({ host, identity: opts.identity });
    // fetchRootKey only for local replica; it's a no-op on IC hosts
    if (host.startsWith('http://')) {
        // @ts-ignore - present on HttpAgent in node envs
        agent.fetchRootKey?.();
    }
    return Actor.createActor(idlFactory, { agent, canisterId });
}
export async function addTrustedAwarder(canisterId, awarder, name, opts = {}) {
    const actor = createActor(canisterId, opts);
    return await actor.addTrustedAwarder(Principal.fromText(awarder), name);
}
export async function awardRep(canisterId, to, amount, reason, opts = {}) {
    const actor = createActor(canisterId, opts);
    const reasonOpt = reason ? [reason] : [];
    return await actor.awardRep(Principal.fromText(to), amount, reasonOpt);
}
export async function getBalance(canisterId, principalText, opts = {}) {
    const actor = createActor(canisterId, opts);
    const res = await actor.getBalance(Principal.fromText(principalText));
    return res; // bigint
}

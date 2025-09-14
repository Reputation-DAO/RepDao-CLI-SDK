import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './idl/reputation_dao.did.js';
const HOSTS = {
    ic: 'https://ic0.app',
    local: 'http://127.0.0.1:4943',
};
function resolveHost(network) {
    if (network === 'ic')
        return HOSTS.ic;
    if (network === 'local')
        return HOSTS.local;
    // allow custom boundary host
    return network;
}
export async function childActor(canisterId, opts = {}) {
    const host = resolveHost(opts.network ?? 'ic');
    const agent = new HttpAgent({ host, identity: opts.identity });
    // Only fetchRootKey for local replica
    if (host === HOSTS.local) {
        await agent.fetchRootKey();
    }
    return Actor.createActor(idlFactory, { agent, canisterId });
}
/** ====== HIGH-LEVEL WRAPPERS ====== **/
export async function addTrustedAwarder(canisterId, awarderPrincipalText, name, opts) {
    const actor = await childActor(canisterId, opts);
    const p = Principal.fromText(awarderPrincipalText);
    return actor.addTrustedAwarder(p, name);
}
export async function awardRep(canisterId, toPrincipalText, amount, reason, opts) {
    const actor = await childActor(canisterId, opts);
    const to = Principal.fromText(toPrincipalText);
    const amt = typeof amount === 'number' ? BigInt(amount) : amount;
    return actor.awardRep(to, amt, reason ?? []);
}
export async function getBalance(canisterId, principalText, opts) {
    const actor = await childActor(canisterId, opts);
    return actor.getBalance(Principal.fromText(principalText));
}
/* Add more thin wrappers the same way:
   - removeTrustedAwarder, revokeRep, setDailyMintLimit, leaderboard, etc. */
//# sourceMappingURL=client.js.map
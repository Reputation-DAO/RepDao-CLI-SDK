import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import type { SignIdentity } from '@dfinity/agent';
import { idlFactory } from './idl/reputation_dao.did.js';

export type Network = 'ic' | 'local' | string;
const HOSTS: Record<'ic'|'local', string> = {
  ic: 'https://ic0.app',
  local: 'http://127.0.0.1:4943',
};

function resolveHost(network: Network) {
  if (network === 'ic') return HOSTS.ic;
  if (network === 'local') return HOSTS.local;
  // allow custom boundary host
  return network;
}

export async function childActor(
  canisterId: string,
  opts: { identity?: SignIdentity; network?: Network } = {}
) {
  const host = resolveHost(opts.network ?? 'ic');
  const agent = new HttpAgent({ host, identity: opts.identity });

  // Only fetchRootKey for local replica
  if (host === HOSTS.local) {
    await agent.fetchRootKey();
  }

  return Actor.createActor(idlFactory, { agent, canisterId });
}

/** ====== HIGH-LEVEL WRAPPERS ====== **/

export async function addTrustedAwarder(
  canisterId: string,
  awarderPrincipalText: string,
  name: string,
  opts?: { identity?: SignIdentity; network?: Network }
) {
  const actor = await childActor(canisterId, opts);
  const p = Principal.fromText(awarderPrincipalText);
  return actor.addTrustedAwarder(p, name);
}

export async function awardRep(
  canisterId: string,
  toPrincipalText: string,
  amount: bigint | number,
  reason?: string,
  opts?: { identity?: SignIdentity; network?: Network }
) {
  const actor = await childActor(canisterId, opts);
  const to = Principal.fromText(toPrincipalText);
  const amt = typeof amount === 'number' ? BigInt(amount) : amount;
  return actor.awardRep(to, amt, reason ?? []);
}

export async function getBalance(
  canisterId: string,
  principalText: string,
  opts?: { identity?: SignIdentity; network?: Network }
): Promise<bigint> {
  const actor = await childActor(canisterId, opts);
  return actor.getBalance(Principal.fromText(principalText));
}

/* Add more thin wrappers the same way:
   - removeTrustedAwarder, revokeRep, setDailyMintLimit, leaderboard, etc. */

// src/client.ts
import { HttpAgent, Actor, type ActorSubclass, type Identity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './idl/reputation_dao.did.js';

export interface ReputationChildService {
  addTrustedAwarder: (p: Principal, name: string) => Promise<string>;
  awardRep: (to: Principal, amount: bigint, reason: [] | [string]) => Promise<string>;
  getBalance: (p: Principal) => Promise<bigint>;
}

type ClientOpts = {
  identity?: Identity;
  /** "ic" | "local" | custom host selector */
  network?: string;
  /** direct host override (e.g. http://127.0.0.1:4943) */
  host?: string;
};

function hostFrom(opts: ClientOpts): string {
  if (opts.host) return opts.host;
  if ((opts.network ?? 'ic') === 'ic') return 'https://icp-api.io';
  // defaults to local
  return 'http://127.0.0.1:4943';
}

export function createActor(canisterId: string, opts: ClientOpts = {}): ActorSubclass<ReputationChildService> {
  const host = hostFrom(opts);
  const agent = new HttpAgent({ host, identity: opts.identity });
  // fetchRootKey only for local replica; it's a no-op on IC hosts
  if (host.startsWith('http://')) {
    // @ts-ignore - present on HttpAgent in node envs
    agent.fetchRootKey?.();
  }
  return Actor.createActor<ReputationChildService>(idlFactory, { agent, canisterId });
}

export async function addTrustedAwarder(
  canisterId: string,
  awarder: string,
  name: string,
  opts: ClientOpts = {}
): Promise<string> {
  const actor = createActor(canisterId, opts);
  return await actor.addTrustedAwarder(Principal.fromText(awarder), name);
}

export async function awardRep(
  canisterId: string,
  to: string,
  amount: bigint,
  reason?: string,
  opts: ClientOpts = {}
): Promise<string> {
  const actor = createActor(canisterId, opts);
  const reasonOpt: [] | [string] = reason ? [reason] : [];
  return await actor.awardRep(Principal.fromText(to), amount, reasonOpt);
}

export async function getBalance(
  canisterId: string,
  principalText: string,
  opts: ClientOpts = {}
): Promise<bigint> {
  const actor = createActor(canisterId, opts);
  const res = await actor.getBalance(Principal.fromText(principalText));
  return res; // bigint
}

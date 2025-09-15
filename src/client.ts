// src/client.ts
import { HttpAgent, Actor } from '@dfinity/agent';
import type { SignIdentity } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory } from './idl/reputation_dao.did.js';

export type ClientOptions = {
  identity?: SignIdentity;
  network?: 'ic' | 'local' | 'custom' | string;
  host?: string; // explicit host override
};

/* ------------------------------- internals -------------------------------- */

function resolveHost(network?: string, hostOverride?: string) {
  if (hostOverride) return hostOverride;
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

async function makeActor(canisterId: string, opts?: ClientOptions) {
  const host = resolveHost(opts?.network, opts?.host);
  const agent = new HttpAgent({ host, identity: opts?.identity });

  // Local dev needs root key for cert verification
  if (host.startsWith('http://127.0.0.1') || (opts?.network && opts.network !== 'ic')) {
    try {
      await agent.fetchRootKey();
    } catch {
      // ignore in CI / when replica not up yet
    }
  }

  // idlFactory is the generated candid binding
  return Actor.createActor(idlFactory as any, { agent, canisterId });
}

/* ------------------------------- typed calls ------------------------------- */

export async function addTrustedAwarder(
  canisterId: string,
  awarderPrincipal: string,
  name: string,
  opts?: ClientOptions
) {
  const actor = await makeActor(canisterId, opts);
  return (actor as any).addTrustedAwarder(Principal.fromText(awarderPrincipal), name);
}

export async function awardRep(
  canisterId: string,
  toPrincipal: string,
  amount: bigint,
  reason?: string,
  opts?: ClientOptions
) {
  const actor = await makeActor(canisterId, opts);
  // Candid Opt<Text> — empty array = null, single-element array = some
  const optReason = reason === undefined || reason === null ? [] : [reason];
  return (actor as any).awardRep(Principal.fromText(toPrincipal), amount, optReason);
}

export async function getBalance(
  canisterId: string,
  principalText: string,
  opts?: ClientOptions
): Promise<bigint> {
  const actor = await makeActor(canisterId, opts);
  const res = await (actor as any).getBalance(Principal.fromText(principalText));
  // Agent returns JS bigint for Nat; keep API stable
  return BigInt(res as unknown as bigint);
}

/* ------------------------ generic helpers for CLI ------------------------- */

export async function invokeQuery(
  canisterId: string,
  method: string,
  args: unknown[],
  opts?: ClientOptions
): Promise<unknown> {
  const actor = await makeActor(canisterId, opts);
  const fn = (actor as any)[method];
  if (typeof fn !== 'function') throw new Error(`Query method not found: ${method}`);
  return await fn(...args);
}

export async function invokeUpdate(
  canisterId: string,
  method: string,
  args: unknown[],
  opts?: ClientOptions
): Promise<unknown> {
  const actor = await makeActor(canisterId, opts);
  const fn = (actor as any)[method];
  if (typeof fn !== 'function') throw new Error(`Update method not found: ${method}`);
  return await fn(...args);
}

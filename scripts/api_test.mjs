// scripts/api_test.mjs
// Usage:
//   node scripts/api_test.mjs <CANISTER_ID>
//
// No ownership/cycles changes.
// Adds revoke + reset checks and more coverage.

import {
  // mutations we will use (no ownership/cycles)
  addTrustedAwarder, removeTrustedAwarder,
  awardRep, multiAward, revokeRep, resetUser,
  pause, configureDecay, triggerManualDecay, processBatchDecay, emitEvent,
  // queries
  version, health, cycles_balance, snapshotHash,
  getTransactionCount, getTopUpCount, getTopUpsPaged,
  getTrustedAwarders, getTransactionHistory, getTransactionsPaged,
  getTransactionsByUser, findTransactionsByReason,
  getDecayConfig, getUserDecayInfo, previewDecayAmount,
  getBalanceWithDetails, getDecayStatistics, leaderboard,
  myStats, awarderStats, orgPulse, getBalance, getTransactionById
} from "../dist/client.js";

import { identityFromPemFile } from "../dist/identity.js";
import { identityPathOrThrow } from "../dist/identityStore.js";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";

const [ , , CANISTER_ID ] = process.argv;
if (!CANISTER_ID) {
  console.error("usage: node scripts/api_test.mjs <CANISTER_ID>");
  process.exit(1);
}

const network = process.env.REPDAO_NETWORK ?? "ic";
const host    = process.env.REPDAO_HOST || undefined;

// identities
const pemPath = process.env.REPDAO_PEM ?? (await identityPathOrThrow());
const ownerId = identityFromPemFile(pemPath);
const otherId = Secp256k1KeyIdentity.generate();

const optsOwner = { identity: ownerId, network, host };
const optsOther = { identity: otherId, network, host };

let FAILS = 0;
const ok  = (s,m)=>console.log(`✅ ${s} ${m}`);
const err = (s,e)=>{console.error(`❌ ${s} ${e instanceof Error ? e.message : String(e)}`); FAILS++;};
const expect = async (s,fn)=>{try{await fn();}catch(e){err(s,e);} };
const isBigInt = x => typeof x === "bigint";
const toText = id => id.getPrincipal().toText();

async function ensureOwnerTrusted(canisterId, ownerP, opts) {
  const list = await getTrustedAwarders(canisterId, opts);
  const already = Array.isArray(list) && list.some(a => a.id?.toText?.() === ownerP);
  if (already) { ok("ensureOwnerTrusted", "owner already trusted"); return { added:false }; }
  const r = await addTrustedAwarder(canisterId, ownerP, "owner-self", opts);
  if (!/Success|OK|Added/i.test(String(r))) throw new Error(`addTrustedAwarder(owner) failed: ${r}`);
  ok("ensureOwnerTrusted", "owner added to trusted awarders");
  return { added:true };
}

(async function main() {
  console.log("—".repeat(72));
  console.log("RepDAO API test (no ownership/cycles changes)");
  console.log("canister:", CANISTER_ID);
  console.log("network :", network, host ? `(host=${host})` : "");
  console.log("owner   :", toText(ownerId));
  console.log("other   :", toText(otherId));
  console.log("—".repeat(72));

  // ---------- Read-only core ----------
  await expect("version", async () => {
    const v = await version(CANISTER_ID, optsOwner).catch(()=> "n/a");
    ok("version", String(v));
  });

  let h0;
  await expect("health", async () => {
    h0 = await health(CANISTER_ID, optsOwner);
    if (typeof h0.paused !== "boolean") throw new Error("health.paused not boolean");
    ok("health", `paused=${h0.paused} users=${h0.users} tx=${h0.txCount}`);
  });

  await expect("cycles_balance", async () => {
    const c = await cycles_balance(CANISTER_ID, optsOwner);
    if (!isBigInt(c)) throw new Error("cycles_balance not bigint");
    ok("cycles_balance", c.toString());
  });

  await expect("snapshotHash", async () => {
    const s = await snapshotHash(CANISTER_ID, optsOwner);
    if (!isBigInt(s)) throw new Error("snapshotHash not bigint");
    ok("snapshotHash", s.toString());
  });

  await expect("counts", async () => {
    const [txc, tuc] = await Promise.all([
      getTransactionCount(CANISTER_ID, optsOwner),
      getTopUpCount(CANISTER_ID, optsOwner),
    ]);
    if (!isBigInt(txc) || !isBigInt(tuc)) throw new Error("counts not bigint");
    ok("counts", `tx=${txc} topups=${tuc}`);
  });

  await expect("lists/top", async () => {
    const [tops, awarders, txs, paged] = await Promise.all([
      getTopUpsPaged(CANISTER_ID, 0n, 5n, optsOwner),
      getTrustedAwarders(CANISTER_ID, optsOwner),
      getTransactionHistory(CANISTER_ID, optsOwner),
      getTransactionsPaged(CANISTER_ID, 0n, 5n, optsOwner),
    ]);
    if (!Array.isArray(tops) || !Array.isArray(awarders) || !Array.isArray(txs) || !Array.isArray(paged)) {
      throw new Error("list query not array");
    }
    ok("lists/top", `topups=${tops.length} awarders=${awarders.length} txs=${txs.length} paged=${paged.length}`);
  });

  const ownerP = toText(ownerId);
  const otherP = toText(otherId);

  await expect("tx filters", async () => {
    const [byUser, byReason] = await Promise.all([
      getTransactionsByUser(CANISTER_ID, ownerP, optsOwner),
      findTransactionsByReason(CANISTER_ID, "", 5n, optsOwner),
    ]);
    if (!Array.isArray(byUser) || !Array.isArray(byReason)) throw new Error("tx filters not array");
    ok("tx filters", `byUser=${byUser.length} byReason=${byReason.length}`);
  });

  await expect("decay read", async () => {
    const [cfg, stats] = await Promise.all([
      getDecayConfig(CANISTER_ID, optsOwner),
      getDecayStatistics(CANISTER_ID, optsOwner),
    ]);
    if (typeof cfg?.enabled !== "boolean") throw new Error("getDecayConfig malformed");
    if (typeof stats?.configEnabled !== "boolean") throw new Error("getDecayStatistics malformed");
    ok("decay read", `enabled=${cfg.enabled} stats.enabled=${stats.configEnabled}`);
  });

  await expect("balances & previews", async () => {
    const [details, prev, my] = await Promise.all([
      getBalanceWithDetails(CANISTER_ID, ownerP, optsOwner),
      previewDecayAmount(CANISTER_ID, ownerP, optsOwner),
      myStats(CANISTER_ID, ownerP, optsOwner),
    ]);
    if (!isBigInt(details?.rawBalance) || !isBigInt(prev) || !isBigInt(my?.balance)) {
      throw new Error("balance queries malformed");
    }
    ok("balances & previews", `raw=${details.rawBalance} preview=${prev} my=${my.balance}`);
  });

  await expect("leaderboard & awarderStats & orgPulse", async () => {
    const [lb, aStats, pulse] = await Promise.all([
      leaderboard(CANISTER_ID, 5n, 0n, optsOwner),
      awarderStats(CANISTER_ID, ownerP, optsOwner),
      orgPulse(CANISTER_ID, 86400n, optsOwner),
    ]);
    if (!Array.isArray(lb) || !Array.isArray(aStats) || typeof pulse?.awards !== "bigint") {
      throw new Error("leaderboard/awarderStats/orgPulse malformed");
    }
    ok("leaderboard & awarderStats & orgPulse", `lb=${lb.length} aStats=${aStats.length} awards=${pulse.awards}`);
  });

  // ---------- Safe admin: pause toggle & restore ----------
  await expect("pause toggle/restore", async () => {
    const orig = (await health(CANISTER_ID, optsOwner)).paused;
    await pause(CANISTER_ID, !orig, optsOwner);
    const after = (await health(CANISTER_ID, optsOwner)).paused;
    if (after !== !orig) throw new Error(`pause not toggled (expected ${!orig}, got ${after})`);
    await pause(CANISTER_ID, orig, optsOwner);
    const fin = (await health(CANISTER_ID, optsOwner)).paused;
    if (fin !== orig) throw new Error("pause not restored");
    ok("pause", `toggled and restored -> ${orig}`);
  });

  // ---------- Award → Revoke → Reset (with asserts) ----------
  let ownerTrustedInfo = { added:false };
  await expect("ensureOwnerTrusted", async () => {
    ownerTrustedInfo = await ensureOwnerTrusted(CANISTER_ID, ownerP, optsOwner);
  });

  await expect("award/revoke/reset", async () => {
    // clean slate for target
    await resetUser(CANISTER_ID, otherP, "pre-clean", optsOwner).catch(()=>{});
    const b0 = await getBalance(CANISTER_ID, otherP, optsOwner);

    // award 10
    const r1 = await awardRep(CANISTER_ID, otherP, 10n, "test-award", optsOwner);
    if (!/Success|OK/i.test(String(r1))) throw new Error(`awardRep bad response: ${r1}`);
    const b1 = await getBalance(CANISTER_ID, otherP, optsOwner);
    if (b1 - b0 !== 10n) throw new Error(`expected +10 after award (got delta ${b1-b0})`);

    // multiAward +5 and +3
    const r2 = await multiAward(CANISTER_ID, [[otherP, 5n, "batch-1"], [otherP, 3n, "batch-2"]], false, optsOwner);
    if (!/Success|OK/i.test(String(r2))) throw new Error(`multiAward bad response: ${r2}`);
    const b2 = await getBalance(CANISTER_ID, otherP, optsOwner);
    if (b2 - b1 !== 8n) throw new Error(`expected +8 after multiAward (got delta ${b2-b1})`);

    // revoke 8
    const r3 = await revokeRep(CANISTER_ID, otherP, 8n, "test-revoke", optsOwner);
    if (!/Success|OK/i.test(String(r3))) throw new Error(`revokeRep bad response: ${r3}`);
    const b3 = await getBalance(CANISTER_ID, otherP, optsOwner);
    if (b2 - b3 !== 8n) throw new Error(`expected -8 after revoke (got delta ${b2-b3})`);

    // reset user back to 0
    const r4 = await resetUser(CANISTER_ID, otherP, "test-reset", optsOwner);
    if (!/Success|OK|Reset/i.test(String(r4))) throw new Error(`resetUser bad response: ${r4}`);
    const b4 = await getBalance(CANISTER_ID, otherP, optsOwner);
    if (b4 !== 0n) throw new Error(`expected balance 0 after reset (got ${b4})`);

    ok("award/revoke/reset", "balances correct and cleaned");
  });

  // Try reading the last tx by id (best-effort; schema-dependent)
  await expect("getTransactionById(last)", async () => {
    const count = await getTransactionCount(CANISTER_ID, optsOwner);
    if (count > 0n) {
      const maybe = await getTransactionById(CANISTER_ID, count - 1n, optsOwner).catch(()=>null);
      ok("getTransactionById(last)", maybe ? "ok" : "null");
    } else {
      ok("getTransactionById(last)", "no txs");
    }
  });

  // ---------- Decay config save/restore + manual runs ----------
  await expect("configureDecay(save/modify/restore)", async () => {
    const original = await getDecayConfig(CANISTER_ID, optsOwner);
    // set to same values (no-op) but flip enabled to test path
    const toggled = await configureDecay(
      CANISTER_ID,
      original.decayRate,
      original.decayInterval,
      original.minThreshold,
      original.gracePeriod,
      !original.enabled,
      optsOwner
    );
    if (!/Success|OK|Configured|Updated/i.test(String(toggled))) throw new Error(`configureDecay toggle failed: ${toggled}`);

    // run maintenance (these modify internal accounting but not ownership/cycles)
    await triggerManualDecay(CANISTER_ID, optsOwner).catch(()=>{});
    await processBatchDecay(CANISTER_ID, optsOwner).catch(()=>{});

    // restore
    const restored = await configureDecay(
      CANISTER_ID,
      original.decayRate,
      original.decayInterval,
      original.minThreshold,
      original.gracePeriod,
      original.enabled,
      optsOwner
    );
    if (!/Success|OK|Configured|Updated|Restored/i.test(String(restored))) throw new Error(`configureDecay restore failed: ${restored}`);

    const check = await getDecayConfig(CANISTER_ID, optsOwner);
    if (check.enabled !== original.enabled) throw new Error("decay enabled flag not restored");
    ok("configureDecay", "toggled, maintained, restored");
  });

  // ---------- Emit a harmless DX event ----------
  await expect("emitEvent", async () => {
    const payload = new Uint8Array(Buffer.from("repdao-test-event"));
    const r = await emitEvent(CANISTER_ID, "test", payload, optsOwner);
    if (!/Success|OK|Emitted|Done/i.test(String(r))) throw new Error(`emitEvent bad response: ${r}`);
    ok("emitEvent", "test");
  });

  console.log("—".repeat(72));
  if (FAILS > 0) {
    console.error(`TEST FAILED with ${FAILS} error(s).`);
    process.exit(1);
  } else {
    console.log("ALL CHECKS PASSED ✔");
    process.exit(0);
  }
})().catch(e => {
  err("fatal", e);
  console.error("TEST FAILED (fatal).");
  process.exit(1);
});

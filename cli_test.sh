#!/usr/bin/env bash
# scripts/full_smoke_quiet.sh
set -euo pipefail

# ENV (optional):
#   REPDAO_NETWORK=ic|local|custom
#   REPDAO_HOST=http://127.0.0.1:4943
#   REPDAO_PEM=/path/to/identity.pem              # fallback if OWNER/AWARDER not provided
#   REPDAO_OWNER_PEM=/path/to/owner.pem           # used for owner-only calls
#   REPDAO_AWARDER_PEM=/path/to/awarder.pem       # used for awarder calls
#
# Args:
#   1: CANISTER_ID (child)
#   2: TEST_USER (awardee principal)
#   3: AMOUNT (default 20)
#   4: SINCE_SEC (default 3600)

if [[ $# -lt 2 ]]; then
  echo "FAIL: usage: $0 <CANISTER_ID> <TEST_USER> [AMOUNT=20] [SINCE_SEC=3600]"
  exit 1
fi

CID="$1"
TEST_USER="$2"
AMOUNT="${3:-20}"
SINCE="${4:-3600}"
REASON="smoke-$(date +%s)"

REPCMD=(node dist/cli.js)

NET_ARGS=()
[[ -n "${REPDAO_NETWORK:-}" ]] && NET_ARGS+=(--network "$REPDAO_NETWORK")
[[ -n "${REPDAO_HOST:-}"    ]] && NET_ARGS+=(--host "$REPDAO_HOST")

# identity routing
ADMIN_ID_ARGS=()
if [[ -n "${REPDAO_OWNER_PEM:-}" ]]; then
  ADMIN_ID_ARGS+=(--pem "$REPDAO_OWNER_PEM")
elif [[ -n "${REPDAO_PEM:-}" ]]; then
  ADMIN_ID_ARGS+=(--pem "$REPDAO_PEM")
fi

AWARDER_ID_ARGS=()
if [[ -n "${REPDAO_AWARDER_PEM:-}" ]]; then
  AWARDER_ID_ARGS+=(--pem "$REPDAO_AWARDER_PEM")
elif [[ -n "${REPDAO_PEM:-}" ]]; then
  AWARDER_ID_ARGS+=(--pem "$REPDAO_PEM")
fi

fail() { echo "FAIL: $*" >&2; exit 1; }

run_admin()   { "${REPCMD[@]}" "${NET_ARGS[@]}" "${ADMIN_ID_ARGS[@]}"   "$@"; }
run_awarder() { "${REPCMD[@]}" "${NET_ARGS[@]}" "${AWARDER_ID_ARGS[@]}" "$@"; }

# expect CLI replies "Success: ..." for admin mutators (or at least not "Error:")
admin_expect_success() {
  local out
  if ! out="$(run_admin "$@" 2>&1)"; then
    fail "$* -> $out"
  fi
  if [[ "$out" == Error:* ]]; then
    fail "$* -> $out"
  fi
}

# -------- cleanup on exit (idempotent) --------
cleanup() {
  # Try to remove trusted awarder silently (ignore outcome)
  if out="$(run_admin removeTrustedAwarder "$CID" "$(run_awarder id:whoami 2>/dev/null || true)" 2>&1 || true)"; then :; fi
}
trap cleanup EXIT

# -------- ensure awarder is trusted (as owner) --------
AWARDER_P="$(run_awarder id:whoami 2>/dev/null || true)"
[[ -z "$AWARDER_P" ]] && fail "cannot resolve awarder principal (id:whoami)"
admin_expect_success addTrustedAwarder "$CID" "$AWARDER_P" "smoke_awarder"

# -------- policy knobs (owner) --------
admin_expect_success configureDecay "$CID" 1 60 0 0 true
admin_expect_success pause "$CID" false
admin_expect_success blacklist "$CID" "$TEST_USER" false
admin_expect_success setDailyMintLimit "$CID" 1000000
admin_expect_success setPerAwarderDailyLimit "$CID" "$AWARDER_P" 100000
admin_expect_success setParent "$CID" "$AWARDER_P"
admin_expect_success setMinCyclesAlert "$CID" 1000000000000

# -------- balances / award / verify (awarder) --------
BAL_BEFORE="$(run_awarder getBalance "$CID" "$TEST_USER" 2>/dev/null || true)"
[[ ! "$BAL_BEFORE" =~ ^[0-9]+$ ]] && fail "getBalance (before) not a Nat"

out="$(run_awarder awardRep "$CID" "$TEST_USER" "$AMOUNT" -r "$REASON" 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "awardRep -> $out"

BAL_AFTER="$(run_awarder getBalance "$CID" "$TEST_USER" 2>/dev/null || true)"
[[ ! "$BAL_AFTER" =~ ^[0-9]+$ ]] && fail "getBalance (after) not a Nat"

DELTA=$(( BAL_AFTER - BAL_BEFORE ))
[[ "$DELTA" -eq "$AMOUNT" ]] || fail "expected delta=$AMOUNT, got $DELTA"

# -------- light read-only checks (don’t print; ignore content) --------
run_awarder getTransactionCount "$CID" >/dev/null 2>&1 || fail "getTransactionCount"
run_awarder getTransactionHistory "$CID" >/dev/null 2>&1 || fail "getTransactionHistory"
run_awarder getTransactionsByUser "$CID" "$TEST_USER" >/dev/null 2>&1 || fail "getTransactionsByUser"
run_awarder findTransactionsByReason "$CID" "smoke" 10 >/dev/null 2>&1 || fail "findTransactionsByReason"
run_awarder getTransactionsPaged "$CID" 0 5 >/dev/null 2>&1 || fail "getTransactionsPaged"
run_awarder getBalanceWithDetails "$CID" "$TEST_USER" >/dev/null 2>&1 || fail "getBalanceWithDetails"
run_awarder getUserDecayInfo "$CID" "$TEST_USER" >/dev/null 2>&1 || fail "getUserDecayInfo"
run_awarder previewDecayAmount "$CID" "$TEST_USER" >/dev/null 2>&1 || fail "previewDecayAmount"
run_awarder leaderboard "$CID" 5 0 >/dev/null 2>&1 || fail "leaderboard"
run_awarder myStats "$CID" "$TEST_USER" >/dev/null 2>&1 || fail "myStats"
run_awarder awarderStats "$CID" "$AWARDER_P" >/dev/null 2>&1 || fail "awarderStats"
run_awarder orgPulse "$CID" "$SINCE" >/dev/null 2>&1 || fail "orgPulse"

# -------- decay maintenance (owner) --------
out="$(run_admin processBatchDecay "$CID" 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "processBatchDecay -> $out"

out="$(run_admin triggerManualDecay "$CID" 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "triggerManualDecay -> $out"

# -------- events (owner) --------
out="$(run_admin emitEvent "$CID" "smokeEvent" "hello-world" 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "emitEvent(text) -> $out"

out="$(run_admin emitEvent "$CID" "smokeHex" "0x4865785061796c6f6164" --hex 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "emitEvent(hex) -> $out"

# -------- multiAward + rollback (awarder then owner) --------
PAIRS='[["'"$TEST_USER"'",1,"multi-1"],["'"$TEST_USER"'",2,"multi-2"]]'
out="$(run_awarder multiAward "$CID" --pairs "$PAIRS" 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "multiAward -> $out"

out="$(run_admin revokeRep "$CID" "$TEST_USER" 3 -r "revert-multi" 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "revoke multi -> $out"

out="$(run_admin revokeRep "$CID" "$TEST_USER" "$AMOUNT" -r "revert-$REASON" 2>&1 || true)"
[[ "$out" == Success:* ]] || fail "revokeRep -> $out"

BAL_FINAL="$(run_awarder getBalance "$CID" "$TEST_USER" 2>/dev/null || true)"
[[ "$BAL_FINAL" =~ ^[0-9]+$ ]] || fail "getBalance (final) not a Nat"
[[ "$BAL_FINAL" -eq "$BAL_BEFORE" ]] || fail "final balance $BAL_FINAL != $BAL_BEFORE"

echo "SUCCESS"

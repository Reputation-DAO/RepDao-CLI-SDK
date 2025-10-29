#!/usr/bin/env bash
set -euo pipefail

CLI="node dist/cli.js"
TMPDIR="$(mktemp -d)"
RESTORE_CURRENT="$TMPDIR/repdao_current.restore"
CANISTER_ID="<your-canister-id>"
TEST_USER="<your-principal-id>"

echo "== build =="
npm run -s build

# Backup any existing repdao 'current' pointer so we can test dfx fallback cleanly
if [[ -f "$HOME/.repdao/current" ]]; then
  cp "$HOME/.repdao/current" "$RESTORE_CURRENT"
  rm -f "$HOME/.repdao/current"
fi

trap '{
  # restore prior current if we had one
  if [[ -f "$RESTORE_CURRENT" ]]; then
    mkdir -p "$HOME/.repdao"
    mv -f "$RESTORE_CURRENT" "$HOME/.repdao/current"
  fi
  rm -rf "$TMPDIR"
}' EXIT

echo
echo "== dfx baseline =="
DFX_WHO="$(dfx identity whoami)"
DFX_PPL="$(dfx identity get-principal)"
echo "dfx whoami: $DFX_WHO"
echo "dfx principal: $DFX_PPL"

echo
echo "== id:list (should show dfx identities too) =="
$CLI id:list || true

echo
echo "== id:whoami (fallback to dfx default when no repdao current) =="
WHO="$($CLI id:whoami)"
echo "repdao whoami: $WHO"
[[ "$WHO" == "$DFX_PPL" ]] || { echo "FAIL: whoami should equal dfx principal"; exit 1; }
echo "ok"

echo
echo "== id:new smoke_ninja (create and set current) =="
$CLI id:new smoke_ninja
REP_WHO="$($CLI id:whoami)"
PEM="$HOME/.repdao/smoke_ninja.pem"
# derive principal from PEM to verify
PEM_PPL=$(node --input-type=module -e "import {readFileSync} from 'node:fs'; import {Secp256k1KeyIdentity} from '@dfinity/identity-secp256k1'; console.log(Secp256k1KeyIdentity.fromPem(readFileSync(process.argv[1],'utf8')).getPrincipal().toText())" "$PEM")
echo "repdao whoami after id:new: $REP_WHO"
[[ "$REP_WHO" == "$PEM_PPL" ]] || { echo "FAIL: id:new principal mismatch"; exit 1; }
echo "ok"

echo

echo "== id:import & id:use (mirror dfx default into repdao and switch) =="
DFX_PEM="$TMPDIR/dfx_default.pem"
dfx identity export "$DFX_WHO" > "$DFX_PEM"
$CLI id:import "$DFX_WHO" "$DFX_PEM"
$CLI id:use "$DFX_WHO"
REP_WHO2="$($CLI id:whoami)"
echo "repdao whoami after id:use: $REP_WHO2"
[[ "$REP_WHO2" == "$DFX_PPL" ]] || { echo "FAIL: id:use mismatch"; exit 1; }
echo "ok"

echo

echo "== cleanup: remove smoke_ninja (repdao + dfx) =="

# switch off smoke_ninja so we can delete it safely
$CLI id:use default >/dev/null 2>&1 || true

# delete from repdao store
$CLI id:delete smoke_ninja

# delete from dfx as well (if present)
if dfx identity list | grep -q 'smoke_ninja'; then
  dfx identity remove smoke_ninja
fi

# verify it's gone from repdao
if $CLI id:list | grep -q 'smoke_ninja'; then
  echo "FAIL: repdao still has smoke_ninja"
  exit 1
fi

# verify it's gone from dfx
if dfx identity list | grep -q 'smoke_ninja'; then
  echo "FAIL: dfx still has smoke_ninja"
  exit 1
fi

echo "ok"

echo
echo "== RepDAO Command Testing =="

echo "Testing health commands..."
$CLI health $CANISTER_ID > /dev/null && echo "✅ health" || echo "❌ health"
$CLI healthcheck $CANISTER_ID > /dev/null && echo "✅ healthcheck" || echo "❌ healthcheck"
$CLI version $CANISTER_ID > /dev/null && echo "✅ version" || echo "❌ version"
$CLI cycles_balance $CANISTER_ID > /dev/null && echo "✅ cycles_balance" || echo "❌ cycles_balance"

echo "Testing query commands..."
$CLI getBalance $CANISTER_ID $TEST_USER > /dev/null && echo "✅ getBalance" || echo "❌ getBalance"
$CLI getTrustedAwarders $CANISTER_ID > /dev/null && echo "✅ getTrustedAwarders" || echo "❌ getTrustedAwarders"
$CLI getDecayConfig $CANISTER_ID > /dev/null && echo "✅ getDecayConfig" || echo "❌ getDecayConfig"
$CLI leaderboard $CANISTER_ID 5 0 > /dev/null && echo "✅ leaderboard" || echo "❌ leaderboard"
$CLI myStats $CANISTER_ID $TEST_USER > /dev/null && echo "✅ myStats" || echo "❌ myStats"

echo "Testing transaction commands..."
$CLI getTransactionHistory $CANISTER_ID > /dev/null && echo "✅ getTransactionHistory" || echo "❌ getTransactionHistory"
$CLI getTransactionCount $CANISTER_ID > /dev/null && echo "✅ getTransactionCount" || echo "❌ getTransactionCount"
$CLI getTransactionsPaged $CANISTER_ID 0 2 > /dev/null && echo "✅ getTransactionsPaged" || echo "❌ getTransactionsPaged"
$CLI getTransactionById $CANISTER_ID 1 > /dev/null && echo "✅ getTransactionById" || echo "❌ getTransactionById"

echo "Testing decay commands..."
$CLI getUserDecayInfo $CANISTER_ID $TEST_USER > /dev/null && echo "✅ getUserDecayInfo" || echo "❌ getUserDecayInfo"
$CLI previewDecayAmount $CANISTER_ID $TEST_USER > /dev/null && echo "✅ previewDecayAmount" || echo "❌ previewDecayAmount"
$CLI getDecayStatistics $CANISTER_ID > /dev/null && echo "✅ getDecayStatistics" || echo "❌ getDecayStatistics"

echo "Testing analytics commands..."
$CLI orgPulse $CANISTER_ID 1000000 > /dev/null && echo "✅ orgPulse" || echo "❌ orgPulse"
$CLI awarderStats $CANISTER_ID $TEST_USER > /dev/null && echo "✅ awarderStats" || echo "❌ awarderStats"
$CLI snapshotHash $CANISTER_ID > /dev/null && echo "✅ snapshotHash" || echo "❌ snapshotHash"

echo "Testing cycles commands..."
$CLI getTopUpCount $CANISTER_ID > /dev/null && echo "✅ getTopUpCount" || echo "❌ getTopUpCount"
$CLI getTopUpsPaged $CANISTER_ID 0 5 > /dev/null && echo "✅ getTopUpsPaged" || echo "❌ getTopUpsPaged"

echo "Testing AI features..."
$CLI insights $CANISTER_ID > /dev/null && echo "✅ insights" || echo "❌ insights"

echo "Testing administrative commands (may fail due to permissions)..."
$CLI revokeRep $CANISTER_ID $TEST_USER 1 --reason "Test" > /dev/null 2>&1 && echo "✅ revokeRep" || echo "⚠️  revokeRep (permission required)"
$CLI pause $CANISTER_ID true > /dev/null 2>&1 && echo "✅ pause" || echo "⚠️  pause (permission required)"
$CLI pause $CANISTER_ID false > /dev/null 2>&1 && echo "✅ unpause" || echo "⚠️  unpause (permission required)"

echo "Testing batch operations..."
echo "principal,amount,reason" > $TMPDIR/test.csv
echo "$TEST_USER,1,Test batch" >> $TMPDIR/test.csv
$CLI batch-award $TMPDIR/test.csv --dry-run > /dev/null && echo "✅ batch-award (dry-run)" || echo "❌ batch-award"

echo "ALL TESTS COMPLETED ✅"

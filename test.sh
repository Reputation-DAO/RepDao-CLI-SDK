#!/usr/bin/env bash
set -euo pipefail

CLI="node dist/cli.js"
TMPDIR="$(mktemp -d)"
RESTORE_CURRENT="$TMPDIR/repdao_current.restore"

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

echo "ALL SMOKE TESTS PASSED ✅"

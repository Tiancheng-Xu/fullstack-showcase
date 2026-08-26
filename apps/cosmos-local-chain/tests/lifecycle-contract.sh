#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
NODE_HOME="$APP_DIR/.local/node"
CHAIN_BIN="$APP_DIR/.tools/bin/babysteps-chaind"
RPC_URL=http://127.0.0.1:26657
LCD_URL=http://127.0.0.1:1317
source "$APP_DIR/tests/assert.sh"

cleanup() {
  make -s -C "$APP_DIR" stop >/dev/null 2>&1 || true
}
trap cleanup EXIT

make -s -C "$APP_DIR" start

assert_file "$APP_DIR/.local/node.pid"
assert_file "$CHAIN_BIN"
assert_contains "$(cat "$APP_DIR/.local/node.pid")" "started_at=" \
  "PID instance start time"

status_json=$(curl -fsS "$RPC_URL/status")
assert_eq "babysteps-local-1" \
  "$(jq -r '.result.node_info.network' <<<"$status_json")" "chain ID"
height=$(jq -r '.result.sync_info.latest_block_height | tonumber' <<<"$status_json")
((height > 0)) || fail "block height must be positive"

for port in 26656 26657 1317; do
  listener=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -F n |
    sed -n 's/^n//p' | head -n 1)
  assert_eq "127.0.0.1:$port" "$listener" "port $port loopback listener"
done

balance_of() {
  local name=$1 address
  address=$("$CHAIN_BIN" keys show "$name" --address \
    --home "$NODE_HOME" --keyring-backend test)
  [[ "$address" == baby1* ]] || fail "$name address must use baby prefix"
  curl -fsS "$LCD_URL/cosmos/bank/v1beta1/balances/$address/by_denom?denom=ubaby" |
    jq -r '.balance.amount'
}

assert_eq "500000000" "$(balance_of validator)" "validator liquid balance"
assert_eq "500000000" "$(balance_of alice)" "alice genesis balance"
assert_eq "100000000" "$(balance_of bob)" "bob genesis balance"

bonded_json=$(curl -fsS \
  "$LCD_URL/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED")
assert_eq "1" "$(jq -r '.validators | length' <<<"$bonded_json")" \
  "bonded validator count"
assert_eq "500000000" "$(jq -r '.validators[0].tokens' <<<"$bonded_json")" \
  "validator bonded tokens"

make -s -C "$APP_DIR" stop
trap - EXIT

for port in 26656 26657 1317; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "port $port must be released after stop"
  fi
done

printf 'PASS: local chain lifecycle and genesis allocations\n'

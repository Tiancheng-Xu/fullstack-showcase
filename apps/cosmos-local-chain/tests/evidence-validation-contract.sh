#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
source "$APP_DIR/scripts/evidence-lib.sh"
source "$APP_DIR/tests/assert.sh"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

HASH=$(printf 'A%.0s' {1..64})
FROM=baby1sender
TO=baby1recipient

jq -n --arg hash "$HASH" '{code: 0, txhash: $hash}' >"$TEMP_DIR/broadcast.json"
jq -n \
  --arg hash "$HASH" \
  --arg from "$FROM" \
  --arg to "$TO" '
  {
    code: 0,
    txhash: $hash,
    height: "2",
    tx: {
      body: {messages: [{
        "@type": "/cosmos.bank.v1beta1.MsgSend",
        from_address: $from,
        to_address: $to,
        amount: [{denom: "ubaby", amount: "25000000"}]
      }]},
      auth_info: {fee: {amount: [{denom: "ubaby", amount: "500"}]}}
    }
  }' >"$TEMP_DIR/tx.json"

validate_broadcast_json "$TEMP_DIR/broadcast.json" || fail "valid broadcast rejected"
validate_committed_tx_json "$TEMP_DIR/tx.json" "$HASH" "$FROM" "$TO" \
  25000000 500 || fail "valid committed transaction rejected"

assert_rejected() {
  local label=$1 validator=$2 file=$3
  shift 3
  if "$validator" "$file" "$@"; then
    fail "$label must be rejected"
  fi
}

for mutation in 'del(.code)' '.code = null' '.code = "0"' '.code = 7'; do
  jq "$mutation" "$TEMP_DIR/broadcast.json" >"$TEMP_DIR/invalid.json"
  assert_rejected "malformed broadcast: $mutation" validate_broadcast_json \
    "$TEMP_DIR/invalid.json"
done

for mutation in \
  'del(.code)' \
  '.code = null' \
  '.code = "0"' \
  '.code = 7' \
  '.tx.body.messages[0].to_address = "baby1wrong"' \
  '.tx.auth_info.fee.amount[0].amount = "499"'; do
  jq "$mutation" "$TEMP_DIR/tx.json" >"$TEMP_DIR/invalid.json"
  assert_rejected "malformed committed transaction: $mutation" \
    validate_committed_tx_json "$TEMP_DIR/invalid.json" "$HASH" "$FROM" "$TO" \
    25000000 500
done

printf 'PASS: evidence validation fails closed for malformed transaction JSON\n'

#!/usr/bin/env bash

validate_broadcast_json() {
  local file=$1

  jq -e '
    type == "object" and
    has("code") and (.code | type == "number") and .code == 0 and
    has("txhash") and (.txhash | type == "string") and
    (.txhash | test("^[0-9A-Fa-f]{64}$"))
  ' "$file" >/dev/null
}

validate_committed_tx_json() {
  local file=$1 expected_hash=$2 from_address=$3 to_address=$4
  local amount=$5 fee=$6 normalized_hash

  normalized_hash=$(printf '%s' "$expected_hash" | tr '[:lower:]' '[:upper:]')

  jq -e \
    --arg hash "$normalized_hash" \
    --arg from "$from_address" \
    --arg to "$to_address" \
    --arg amount "$amount" \
    --arg fee "$fee" '
    type == "object" and
    has("code") and (.code | type == "number") and .code == 0 and
    has("txhash") and (.txhash | type == "string") and
    ((.txhash | ascii_upcase) == $hash) and
    has("height") and (.height | type == "string") and
    (.height | test("^[1-9][0-9]*$")) and
    (.tx.body.messages | type == "array") and
    (.tx.body.messages | length == 1) and
    (.tx.body.messages[0]["@type"] == "/cosmos.bank.v1beta1.MsgSend") and
    (.tx.body.messages[0].from_address == $from) and
    (.tx.body.messages[0].to_address == $to) and
    (.tx.body.messages[0].amount | type == "array") and
    (.tx.body.messages[0].amount | length == 1) and
    (.tx.body.messages[0].amount[0] == {denom: "ubaby", amount: $amount}) and
    (.tx.auth_info.fee.amount | type == "array") and
    (.tx.auth_info.fee.amount | length == 1) and
    (.tx.auth_info.fee.amount[0] == {denom: "ubaby", amount: $fee})
  ' "$file" >/dev/null
}

#!/usr/bin/env bash
set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"
source "$APP_DIR/scripts/evidence-lib.sh"

TRANSFER_AMOUNT=25000000
FEE_AMOUNT=500
EVIDENCE_DIR="$APP_DIR/evidence/public"
EVIDENCE_PARENT="$APP_DIR/evidence"
TEMP_DIR=$(mktemp -d "$RUNTIME_DIR/evidence.XXXXXX")
mkdir -p "$EVIDENCE_PARENT"
STAGE_DIR=$(mktemp -d "$EVIDENCE_PARENT/.public.stage.XXXXXX")
BACKUP_DIR="$EVIDENCE_PARENT/.public.backup.$$"
cleanup_demo() {
  rm -rf "$TEMP_DIR"
  rm -rf "$STAGE_DIR"
  if [[ -d "$BACKUP_DIR" ]]; then
    if [[ ! -e "$EVIDENCE_DIR" ]]; then
      perl -e 'rename($ARGV[0], $ARGV[1]) or die "rollback rename: $!\n"' \
        "$BACKUP_DIR" "$EVIDENCE_DIR" || true
    else
      rm -rf "$BACKUP_DIR"
    fi
  fi
}
trap cleanup_demo EXIT

node_pid=$(read_node_pid || true)
[[ -n "$node_pid" ]] && pid_is_alive "$node_pid" &&
  process_instance_matches "$node_pid" && [[ "$(rpc_chain_id)" == "$CHAIN_ID" ]] || {
  printf 'A verified local chain must be running before the demo\n' >&2
  exit 1
}

validator_address=$("$CHAIN_BIN" keys show validator --address \
  --keyring-backend test --home "$NODE_HOME")
alice_address=$("$CHAIN_BIN" keys show alice --address \
  --keyring-backend test --home "$NODE_HOME")
bob_address=$("$CHAIN_BIN" keys show bob --address \
  --keyring-backend test --home "$NODE_HOME")

balance_of() {
  local address=$1
  curl -fsS "$LCD_URL/cosmos/bank/v1beta1/balances/$address/by_denom?denom=ubaby" |
    jq -r '.balance.amount // "0"'
}

write_status() {
  local destination=$1 status
  status=$(curl -fsS "$RPC_URL/status")
  jq '{
    chain_id: .result.node_info.network,
    height: (.result.sync_info.latest_block_height | tonumber),
    catching_up: .result.sync_info.catching_up,
    latest_block_time: .result.sync_info.latest_block_time
  }' <<<"$status" >"$destination"
}

write_balances() {
  local destination=$1 height=$2 validator_amount=$3 alice_amount=$4 bob_amount=$5
  jq -n \
    --arg chain_id "$CHAIN_ID" \
    --argjson height "$height" \
    --arg validator_address "$validator_address" \
    --arg alice_address "$alice_address" \
    --arg bob_address "$bob_address" \
    --arg validator_amount "$validator_amount" \
    --arg alice_amount "$alice_amount" \
    --arg bob_amount "$bob_amount" \
    '{
      chain_id: $chain_id,
      height: $height,
      denom: "ubaby",
      accounts: {
        validator: {address: $validator_address, amount: $validator_amount},
        alice: {address: $alice_address, amount: $alice_amount},
        bob: {address: $bob_address, amount: $bob_amount}
      }
    }' >"$destination"
}

write_status "$TEMP_DIR/status-before.json"
before_height=$(jq -r '.height' "$TEMP_DIR/status-before.json")
validator_before=$(balance_of "$validator_address")
alice_before=$(balance_of "$alice_address")
bob_before=$(balance_of "$bob_address")
write_balances "$TEMP_DIR/balances-before.json" "$before_height" \
  "$validator_before" "$alice_before" "$bob_before"

"$CHAIN_BIN" tx bank send alice "$bob_address" "${TRANSFER_AMOUNT}ubaby" \
  --chain-id "$CHAIN_ID" \
  --home "$NODE_HOME" \
  --keyring-backend test \
  --node "$RPC_URL" \
  --fees "${FEE_AMOUNT}ubaby" \
  --gas 200000 \
  --broadcast-mode sync \
  --yes \
  --output json >"$TEMP_DIR/broadcast.json"

validate_broadcast_json "$TEMP_DIR/broadcast.json" || {
  printf 'Transaction broadcast failed\n' >&2
  exit 1
}
tx_hash=$(jq -r '.txhash' "$TEMP_DIR/broadcast.json")
tx_hash=$(tr '[:lower:]' '[:upper:]' <<<"$tx_hash")

for _ in $(seq 1 30); do
  if "$CHAIN_BIN" query tx --type=hash "$tx_hash" --node "$RPC_URL" --output json \
    >"$TEMP_DIR/tx.json" 2>/dev/null; then
    break
  fi
  sleep 1
done
validate_committed_tx_json "$TEMP_DIR/tx.json" "$tx_hash" \
  "$alice_address" "$bob_address" "$TRANSFER_AMOUNT" "$FEE_AMOUNT" || {
  printf 'Committed transaction query verification failed\n' >&2
  exit 1
}
tx_height=$(jq -r '.height' "$TEMP_DIR/tx.json")

"$CHAIN_BIN" query block --type=height "$tx_height" --node "$RPC_URL" --output json \
  >"$TEMP_DIR/block-raw.json"
jq -e --arg chain_id "$CHAIN_ID" --arg height "$tx_height" '
  (.header.chain_id == $chain_id) and
  (.header.height == $height) and
  (.data.txs | type == "array")
' "$TEMP_DIR/block-raw.json" >/dev/null || {
  printf 'Queried block identity verification failed\n' >&2
  exit 1
}
computed_hash=
while IFS= read -r encoded_tx; do
  candidate_hash=$(printf '%s' "$encoded_tx" | openssl base64 -d -A | shasum -a 256 |
    awk '{print toupper($1)}')
  if [[ "$candidate_hash" == "$tx_hash" ]]; then
    computed_hash=$candidate_hash
    break
  fi
done < <(jq -r '.data.txs[]' "$TEMP_DIR/block-raw.json")
[[ "$computed_hash" == "$tx_hash" ]] || {
  printf 'Transaction hash was not reproduced from block bytes\n' >&2
  exit 1
}
jq --arg queried "$tx_hash" --arg computed "$computed_hash" \
  '. + {proof: {
    queried_tx_hash: $queried,
    raw_tx_sha256: $computed,
    matches: ($queried == $computed)
  }}' "$TEMP_DIR/block-raw.json" >"$TEMP_DIR/block.json"

for _ in $(seq 1 30); do
  write_status "$TEMP_DIR/status-after.json"
  after_height=$(jq -r '.height' "$TEMP_DIR/status-after.json")
  ((after_height > tx_height)) && break
  sleep 1
done
((after_height > tx_height)) || {
  printf 'No later block was produced after the transaction\n' >&2
  exit 1
}

validator_after=$(balance_of "$validator_address")
alice_after=$(balance_of "$alice_address")
bob_after=$(balance_of "$bob_address")
for amount in "$validator_before" "$alice_before" "$bob_before" \
  "$validator_after" "$alice_after" "$bob_after"; do
  [[ "$amount" =~ ^[0-9]+$ ]] || {
    printf 'Balance response was not an unsigned decimal amount\n' >&2
    exit 1
  }
done
write_balances "$TEMP_DIR/balances-after.json" "$after_height" \
  "$validator_after" "$alice_after" "$bob_after"

validator_delta=$((10#$validator_after - 10#$validator_before))
alice_delta=$((10#$alice_after - 10#$alice_before))
bob_delta=$((10#$bob_after - 10#$bob_before))
[[ "$validator_delta" == 0 && "$alice_delta" == -25000500 && "$bob_delta" == 25000000 ]] || {
  printf 'Balance delta verification failed\n' >&2
  exit 1
}

jq -n \
  --arg chain_id "$CHAIN_ID" \
  --arg tx_hash "$tx_hash" \
  --argjson before_height "$before_height" \
  --argjson tx_height "$tx_height" \
  --argjson after_height "$after_height" \
  --argjson validator_delta "$validator_delta" \
  --argjson alice_delta "$alice_delta" \
  --argjson bob_delta "$bob_delta" \
  '{
    schema: "cosmos-local-chain-evidence-v1",
    chain_id: $chain_id,
    transfer: {from: "alice", to: "bob", amount_ubaby: 25000000, fee_ubaby: 500},
    transaction: {hash: $tx_hash, height: $tx_height, code: 0},
    heights: {before: $before_height, transaction: $tx_height, after: $after_height},
    deltas: {
      validator_ubaby: $validator_delta,
      alice_ubaby: $alice_delta,
      bob_ubaby: $bob_delta
    },
    block_proof: {raw_tx_sha256: $tx_hash, matches: true},
    reused_evm_evidence: {
      project: "BabySteps Sepolia RPC and The Graph",
      commit: "d728315f1c34bd76377f2b302f9cc6f1ed9e3167"
    }
  }' >"$TEMP_DIR/run-summary.json"

for name in run-summary status-before balances-before broadcast tx block balances-after status-after; do
  mv "$TEMP_DIR/$name.json" "$STAGE_DIR/$name.json"
done
evidence_count=$(find "$STAGE_DIR" -maxdepth 1 -type f -name '*.json' | wc -l | tr -d ' ')
[[ "$evidence_count" == 8 ]] || {
  printf 'Evidence staging directory must contain exactly 8 JSON files\n' >&2
  exit 1
}

if [[ -e "$EVIDENCE_DIR" || -L "$EVIDENCE_DIR" ]]; then
  perl -e 'rename($ARGV[0], $ARGV[1]) or die "backup rename: $!\n"' \
    "$EVIDENCE_DIR" "$BACKUP_DIR"
fi
if ! perl -e 'rename($ARGV[0], $ARGV[1]) or die "publish rename: $!\n"' \
  "$STAGE_DIR" "$EVIDENCE_DIR"; then
  [[ ! -d "$BACKUP_DIR" ]] || perl -e \
    'rename($ARGV[0], $ARGV[1]) or die "rollback rename: $!\n"' \
    "$BACKUP_DIR" "$EVIDENCE_DIR"
  exit 1
fi
rm -rf "$BACKUP_DIR"

printf 'Transfer confirmed: tx=%s height=%s later_height=%s\n' \
  "$tx_hash" "$tx_height" "$after_height"

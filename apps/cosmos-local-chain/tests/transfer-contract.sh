#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
EVIDENCE_DIR="$APP_DIR/evidence/public"
source "$APP_DIR/tests/assert.sh"

cleanup() {
  make -s -C "$APP_DIR" stop >/dev/null 2>&1 || true
}
trap cleanup EXIT

mkdir -p "$EVIDENCE_DIR"
printf '{}\n' >"$EVIDENCE_DIR/obsolete.json"
make -s -C "$APP_DIR" demo

for name in run-summary status-before balances-before broadcast tx block balances-after status-after; do
  assert_file "$EVIDENCE_DIR/$name.json"
  jq -e . "$EVIDENCE_DIR/$name.json" >/dev/null
done

evidence_count=$(find "$EVIDENCE_DIR" -maxdepth 1 -type f -name '*.json' | wc -l | tr -d ' ')
assert_eq "8" "$evidence_count" "published JSON evidence count"
[[ ! -e "$EVIDENCE_DIR/obsolete.json" ]] || fail "obsolete evidence must be removed"

summary="$EVIDENCE_DIR/run-summary.json"
assert_eq "25000000" "$(jq -r '.transfer.amount_ubaby' "$summary")" "transfer amount"
assert_eq "500" "$(jq -r '.transfer.fee_ubaby' "$summary")" "transaction fee"
assert_eq "-25000500" "$(jq -r '.deltas.alice_ubaby' "$summary")" "Alice delta"
assert_eq "25000000" "$(jq -r '.deltas.bob_ubaby' "$summary")" "Bob delta"
assert_eq "0" "$(jq -r '.deltas.validator_ubaby' "$summary")" "validator delta"
assert_eq "true" "$(jq -r '.block_proof.matches' "$summary")" "block tx hash proof"
assert_eq "d728315f1c34bd76377f2b302f9cc6f1ed9e3167" \
  "$(jq -r '.reused_evm_evidence.commit' "$summary")" "immutable EVM evidence commit"

tx_height=$(jq -r '.transaction.height | tonumber' "$summary")
later_height=$(jq -r '.heights.after | tonumber' "$summary")
((later_height > tx_height)) || fail "later height must exceed transaction height"

if rg -n -i '(mnemonic|private.?key|secret.?key|seed phrase)' "$EVIDENCE_DIR"; then
  fail "public evidence must not contain secret-bearing fields"
fi

make -s -C "$APP_DIR" stop
trap - EXIT
printf 'PASS: transfer transaction block proof and sanitized evidence\n'

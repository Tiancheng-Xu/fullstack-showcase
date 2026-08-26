#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
RUNTIME_DIR="$APP_DIR/.local"
BACKUP_DIR="$APP_DIR/.local.safety-backup.$$"
NODE_BACKUP="$APP_DIR/.local/node.safety-backup.$$"
SYNTHETIC_DIR="$APP_DIR/.local.synthetic.$$"
OUTSIDE_DIR=$(mktemp -d)
synthetic_runtime=false
synthetic_identity=
source "$APP_DIR/tests/assert.sh"

restore_runtime() {
  if [[ -f "$RUNTIME_DIR/start.lock" && ! -L "$RUNTIME_DIR/start.lock" ]]; then
    lock_pid=$(awk -F= '$1 == "pid" { print $2; exit }' "$RUNTIME_DIR/start.lock")
    lock_start=$(awk -F= '$1 == "started_at" { print substr($0, index($0, "=") + 1); exit }' \
      "$RUNTIME_DIR/start.lock")
    current_start=$(ps -p "$$" -o lstart= 2>/dev/null |
      sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')
    if [[ "$lock_pid" == "$$" && "$lock_start" == "$current_start" ]]; then
      rm "$RUNTIME_DIR/start.lock"
    fi
  fi
  if [[ -L "$RUNTIME_DIR" ]]; then
    rm "$RUNTIME_DIR"
  fi
  if [[ "$synthetic_runtime" == true && -d "$RUNTIME_DIR" && ! -L "$RUNTIME_DIR" ]]; then
    current_identity=$(stat -f '%d:%i' "$RUNTIME_DIR" 2>/dev/null || true)
    if [[ -n "$synthetic_identity" && "$current_identity" == "$synthetic_identity" ]]; then
      rm -rf "$RUNTIME_DIR"
    fi
    synthetic_runtime=false
  fi
  if [[ -d "$SYNTHETIC_DIR" && -f "$SYNTHETIC_DIR/node/unmarked-sentinel" ]]; then
    rm -rf "$SYNTHETIC_DIR"
  fi
  if [[ -L "$RUNTIME_DIR/.cosmos-local-chain-owned" ]]; then
    rm "$RUNTIME_DIR/.cosmos-local-chain-owned"
    printf 'cosmos-local-chain\n' >"$RUNTIME_DIR/.cosmos-local-chain-owned"
  fi
  if [[ -L "$RUNTIME_DIR/node" ]]; then
    rm "$RUNTIME_DIR/node"
  fi
  if [[ -d "$NODE_BACKUP" ]]; then
    mv "$NODE_BACKUP" "$RUNTIME_DIR/node"
  fi
  if [[ -d "$BACKUP_DIR" ]]; then
    if [[ -e "$RUNTIME_DIR" || -L "$RUNTIME_DIR" ]]; then
      printf 'Refusing to nest runtime backup during safety cleanup\n' >&2
      return 1
    fi
    mv "$BACKUP_DIR" "$RUNTIME_DIR"
  fi
  make -s -C "$APP_DIR" stop >/dev/null 2>&1 || true
  rm -rf "$OUTSIDE_DIR"
}
trap restore_runtime EXIT

make -s -C "$APP_DIR" stop >/dev/null
mv "$RUNTIME_DIR" "$BACKUP_DIR"

mkdir -p "$SYNTHETIC_DIR/node"
printf 'must-survive\n' >"$SYNTHETIC_DIR/node/unmarked-sentinel"
synthetic_identity=$(stat -f '%d:%i' "$SYNTHETIC_DIR")
synthetic_runtime=true
mv "$SYNTHETIC_DIR" "$RUNTIME_DIR"
if bash "$APP_DIR/scripts/start-local.sh" >/dev/null 2>&1; then
  fail "start must reject a non-empty unmarked runtime directory"
fi
assert_file "$RUNTIME_DIR/node/unmarked-sentinel"
rm -rf "$RUNTIME_DIR"
synthetic_runtime=false

mkdir -p "$OUTSIDE_DIR/node"
printf 'must-survive\n' >"$OUTSIDE_DIR/node/sentinel"
ln -s "$OUTSIDE_DIR" "$RUNTIME_DIR"

if bash "$APP_DIR/scripts/start-local.sh" >/dev/null 2>&1; then
  fail "start must reject a symlink runtime directory"
fi
assert_file "$OUTSIDE_DIR/node/sentinel"

rm "$RUNTIME_DIR"
mv "$BACKUP_DIR" "$RUNTIME_DIR"

rm -f "$RUNTIME_DIR/.cosmos-local-chain-owned"
ln -s "$OUTSIDE_DIR/marker-target" "$RUNTIME_DIR/.cosmos-local-chain-owned"
if bash "$APP_DIR/scripts/start-local.sh" >/dev/null 2>&1; then
  fail "start must reject a symlink ownership marker"
fi
[[ ! -e "$OUTSIDE_DIR/marker-target" ]] || fail "marker symlink target must not be created"
rm "$RUNTIME_DIR/.cosmos-local-chain-owned"
printf 'cosmos-local-chain\n' >"$RUNTIME_DIR/.cosmos-local-chain-owned"

mv "$RUNTIME_DIR/node" "$NODE_BACKUP"
ln -s "$OUTSIDE_DIR/node-target" "$RUNTIME_DIR/node"
if bash "$APP_DIR/scripts/start-local.sh" >/dev/null 2>&1; then
  fail "start must reject a symlink node home"
fi
[[ ! -e "$OUTSIDE_DIR/node-target" ]] || fail "node symlink target must not be created"
rm "$RUNTIME_DIR/node"
mv "$NODE_BACKUP" "$RUNTIME_DIR/node"

test_start=$(ps -p "$$" -o lstart= 2>/dev/null |
  sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')
printf 'pid=%s\nstarted_at=%s\n' "$$" "$test_start" >"$RUNTIME_DIR/start.lock"
if bash "$APP_DIR/scripts/start-local.sh" >/dev/null 2>&1; then
  fail "start must reject an existing lifecycle lock"
fi
rm "$RUNTIME_DIR/start.lock"

printf 'pid=999999\nstarted_at=never\n' >"$RUNTIME_DIR/start.lock"
(
  source "$APP_DIR/scripts/lib.sh"
  lock_acquired=false
  acquire_start_lock
  release_start_lock
)
[[ ! -e "$RUNTIME_DIR/start.lock" ]] || fail "dead-owner lock must be recovered"

for port in 26656 26657 1317; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "safety checks must not leave port $port listening"
  fi
done

trap - EXIT
rm -rf "$OUTSIDE_DIR"
printf 'PASS: lifecycle deletion and concurrency safety boundaries\n'

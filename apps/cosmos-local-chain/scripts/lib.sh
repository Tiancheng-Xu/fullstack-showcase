#!/usr/bin/env bash

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
CHAIN_DIR="$APP_DIR/cosmos-chain"
TOOLS_DIR="$APP_DIR/.tools"
RUNTIME_DIR="$APP_DIR/.local"
NODE_HOME="$RUNTIME_DIR/node"
PID_FILE="$RUNTIME_DIR/node.pid"
LOCK_DIR="$RUNTIME_DIR/start.lock"
OWNER_MARKER="$RUNTIME_DIR/.cosmos-local-chain-owned"
LOG_FILE="$RUNTIME_DIR/chain.log"
LAUNCH_LOG="$RUNTIME_DIR/ignite.log"
IGNITE="$TOOLS_DIR/bin/ignite"
CHAIN_BIN="$TOOLS_DIR/bin/babysteps-chaind"
RPC_URL=http://127.0.0.1:26657
LCD_URL=http://127.0.0.1:1317
CHAIN_ID=babysteps-local-1

prepare_runtime() {
  local runtime_existed=false
  if [[ -L "$RUNTIME_DIR" ]]; then
    printf 'Refusing symlink runtime directory: %s\n' "$RUNTIME_DIR" >&2
    return 1
  fi
  [[ -d "$RUNTIME_DIR" ]] && runtime_existed=true
  mkdir -p "$RUNTIME_DIR"
  local runtime_real expected_real
  runtime_real=$(cd "$RUNTIME_DIR" && pwd -P)
  expected_real=$(cd "$APP_DIR" && pwd -P)/.local
  [[ "$runtime_real" == "$expected_real" ]] || {
    printf 'Unexpected runtime directory: %s\n' "$runtime_real" >&2
    return 1
  }
  if [[ -L "$OWNER_MARKER" ]]; then
    printf 'Refusing symlink runtime ownership marker\n' >&2
    return 1
  fi
  if [[ -e "$OWNER_MARKER" ]]; then
    [[ -f "$OWNER_MARKER" && ! -L "$OWNER_MARKER" ]] || {
      printf 'Invalid runtime ownership marker\n' >&2
      return 1
    }
    grep -Fqx 'cosmos-local-chain' "$OWNER_MARKER" || {
      printf 'Runtime ownership marker mismatch\n' >&2
      return 1
    }
  else
    if [[ "$runtime_existed" == true ]] &&
      [[ -n "$(find "$RUNTIME_DIR" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
      printf 'Refusing to claim non-empty unmarked runtime directory\n' >&2
      return 1
    fi
    printf 'cosmos-local-chain\n' >"$OWNER_MARKER"
  fi
  [[ ! -L "$NODE_HOME" ]] || {
    printf 'Refusing symlink node home: %s\n' "$NODE_HOME" >&2
    return 1
  }
}

acquire_start_lock() {
  local attempt candidate owner owner_start current_start snapshot
  for attempt in 1 2; do
    candidate=$(mktemp "$RUNTIME_DIR/.start.lock.$$.XXXXXX")
    owner_start=$(process_start_time "$$")
    [[ -n "$owner_start" ]] || {
      rm -f "$candidate"
      printf 'Failed to identify lifecycle lock owner\n' >&2
      return 1
    }
    printf 'pid=%s\nstarted_at=%s\n' "$$" "$owner_start" >"$candidate"
    lock_candidate="$candidate"
    lock_acquired=true
    if perl -e 'link($ARGV[0], $ARGV[1]) or exit 1' "$candidate" "$LOCK_DIR"; then
      return 0
    fi
    lock_acquired=false
    lock_candidate=
    rm -f "$candidate"

    if [[ "$attempt" == 1 && -f "$LOCK_DIR" && ! -L "$LOCK_DIR" ]]; then
      snapshot=$(cat "$LOCK_DIR")
      owner=$(awk -F= '$1 == "pid" { print $2; exit }' <<<"$snapshot")
      owner_start=$(awk -F= '$1 == "started_at" { print substr($0, index($0, "=") + 1); exit }' \
        <<<"$snapshot")
      current_start=$(process_start_time "$owner")
      if [[ "$owner" =~ ^[0-9]+$ && -n "$owner_start" ]] &&
        { ! kill -0 "$owner" 2>/dev/null || [[ "$current_start" != "$owner_start" ]]; }; then
        [[ "$(cat "$LOCK_DIR")" == "$snapshot" ]] && rm "$LOCK_DIR"
        continue
      fi
    fi
    printf 'Another local chain lifecycle operation is in progress\n' >&2
    return 1
  done
  return 1
}

release_start_lock() {
  [[ "${lock_acquired:-false}" == true ]] || return 0
  if [[ -n "${lock_candidate:-}" && -f "$lock_candidate" &&
    -f "$LOCK_DIR" && ! -L "$LOCK_DIR" && "$LOCK_DIR" -ef "$lock_candidate" ]]; then
    rm "$LOCK_DIR"
  fi
  [[ -n "${lock_candidate:-}" ]] && rm -f "$lock_candidate"
  lock_candidate=
  lock_acquired=false
}

read_node_pid() {
  [[ -f "$PID_FILE" && ! -L "$PID_FILE" ]] || return 1
  awk -F= '$1 == "pid" { print $2; exit }' "$PID_FILE"
}

write_pid_record() {
  local pid=$1 started_at=$2 temp_file
  [[ -n "$started_at" ]] || return 1
  temp_file=$(mktemp "$RUNTIME_DIR/.node.pid.XXXXXX")
  cat >"$temp_file" <<EOF
pid=$pid
binary=$CHAIN_BIN
node_home=$NODE_HOME
chain_id=$CHAIN_ID
started_at=$started_at
EOF
  mv "$temp_file" "$PID_FILE"
}

pid_record_matches() {
  local pid=$1
  grep -Fqx "pid=$pid" "$PID_FILE" &&
    grep -Fqx "binary=$CHAIN_BIN" "$PID_FILE" &&
    grep -Fqx "node_home=$NODE_HOME" "$PID_FILE" &&
    grep -Fqx "chain_id=$CHAIN_ID" "$PID_FILE" &&
    grep -Eq '^started_at=.+' "$PID_FILE"
}

process_start_time() {
  local pid=$1
  ps -p "$pid" -o lstart= 2>/dev/null |
    sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' || true
  return 0
}

process_instance_matches() {
  local pid=$1 recorded_start
  pid_record_matches "$pid" || return 1
  recorded_start=$(awk -F= '$1 == "started_at" { print substr($0, index($0, "=") + 1); exit }' "$PID_FILE")
  process_matches_expected_instance "$pid" "$recorded_start"
}

process_matches_expected_instance() {
  local pid=$1 expected_start=$2 command_line current_start
  current_start=$(process_start_time "$pid")
  [[ -n "$current_start" && "$current_start" == "$expected_start" ]] || return 1
  command_line=$(ps -p "$pid" -o command= 2>/dev/null || true)
  [[ "$command_line" == *"$CHAIN_BIN start"* && "$command_line" == *"--home $NODE_HOME"* ]]
}

managed_ports_listening() {
  local port
  for port in 26656 26657 1317; do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
  done
  return 1
}

pid_is_alive() {
  local pid=$1
  [[ "$pid" =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null
}

rpc_chain_id() {
  curl -fsS --max-time 2 "$RPC_URL/status" 2>/dev/null |
    jq -r '.result.node_info.network // empty' 2>/dev/null
}

wait_for_chain() {
  local pid=$1 attempt
  for attempt in $(seq 1 240); do
    pid_is_alive "$pid" || return 1
    if [[ "$(rpc_chain_id)" == "$CHAIN_ID" ]] &&
      curl -fsS --max-time 2 "$LCD_URL/cosmos/base/tendermint/v1beta1/node_info" \
        >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

require_port_free() {
  local port=$1
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    printf 'Refusing to start: TCP port %s is already in use\n' "$port" >&2
    return 1
  fi
}

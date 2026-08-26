#!/usr/bin/env bash
set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"

chain_pid=
chain_started_at=
start_succeeded=false
lock_acquired=false
cleanup_start() {
  if [[ "$start_succeeded" != true && -n "$chain_pid" ]] &&
    pid_is_alive "$chain_pid" &&
    process_matches_expected_instance "$chain_pid" "$chain_started_at"; then
    kill "$chain_pid" 2>/dev/null || true
    for _ in $(seq 1 15); do
      pid_is_alive "$chain_pid" || break
      sleep 1
    done
    if pid_is_alive "$chain_pid" &&
      process_matches_expected_instance "$chain_pid" "$chain_started_at"; then
      child_parent=$(ps -p "$chain_pid" -o ppid= 2>/dev/null | tr -d ' ')
      if [[ "$child_parent" == "$$" ]]; then
        kill -KILL "$chain_pid" 2>/dev/null || true
        for _ in $(seq 1 5); do
          pid_is_alive "$chain_pid" || break
          sleep 1
        done
      fi
    fi
    if pid_is_alive "$chain_pid" &&
      process_matches_expected_instance "$chain_pid" "$chain_started_at"; then
      printf 'pid=%s\nbinary=%s\nnode_home=%s\nstarted_at=%s\n' \
        "$chain_pid" "$CHAIN_BIN" "$NODE_HOME" "$chain_started_at" \
        >"$RUNTIME_DIR/failed-start.pid"
      printf 'Chain process %s survived failed-start cleanup; recovery record: %s\n' \
        "$chain_pid" "$RUNTIME_DIR/failed-start.pid" >&2
    else
      wait "$chain_pid" 2>/dev/null || true
    fi
  fi
  if [[ "$start_succeeded" != true && -n "$chain_pid" && -f "$PID_FILE" ]] &&
    pid_record_matches "$chain_pid" && ! pid_is_alive "$chain_pid"; then
    rm -f "$PID_FILE"
  fi
  [[ "$lock_acquired" == true ]] && release_start_lock
}
trap cleanup_start EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

prepare_runtime
mkdir -p "$TOOLS_DIR/bin"
acquire_start_lock
if [[ -f "$PID_FILE" ]]; then
  existing_pid=$(read_node_pid || true)
  [[ -n "$existing_pid" ]] || {
    printf 'Invalid PID record: %s\n' "$PID_FILE" >&2
    exit 1
  }
  if pid_is_alive "$existing_pid"; then
    if process_instance_matches "$existing_pid" &&
      [[ "$(rpc_chain_id)" == "$CHAIN_ID" ]]; then
      start_succeeded=true
      printf 'Local chain already running (pid=%s)\n' "$existing_pid"
      exit 0
    fi
    printf 'Refusing to replace live process recorded in %s\n' "$PID_FILE" >&2
    exit 1
  fi
  rm -f "$PID_FILE"
fi

require_port_free 26657
require_port_free 1317
require_port_free 26656

grep -Fqx 'cosmos-local-chain' "$OWNER_MARKER"
rm -rf "$NODE_HOME"

(
  cd "$CHAIN_DIR"
  go build -mod=readonly -o "$CHAIN_BIN" ./cmd/babysteps-chaind
)

"$CHAIN_BIN" init validator --chain-id "$CHAIN_ID" --home "$NODE_HOME" \
  >"$LAUNCH_LOG" 2>&1

for name in validator alice bob; do
  "$CHAIN_BIN" keys add "$name" --keyring-backend test --home "$NODE_HOME" \
    >/dev/null 2>&1
done

validator_address=$("$CHAIN_BIN" keys show validator --address \
  --keyring-backend test --home "$NODE_HOME")
alice_address=$("$CHAIN_BIN" keys show alice --address \
  --keyring-backend test --home "$NODE_HOME")
bob_address=$("$CHAIN_BIN" keys show bob --address \
  --keyring-backend test --home "$NODE_HOME")

"$CHAIN_BIN" genesis add-genesis-account "$validator_address" 1000000000ubaby \
  --home "$NODE_HOME" >>"$LAUNCH_LOG" 2>&1
"$CHAIN_BIN" genesis add-genesis-account "$alice_address" 500000000ubaby \
  --home "$NODE_HOME" >>"$LAUNCH_LOG" 2>&1
"$CHAIN_BIN" genesis add-genesis-account "$bob_address" 100000000ubaby \
  --home "$NODE_HOME" >>"$LAUNCH_LOG" 2>&1
"$CHAIN_BIN" genesis gentx validator 500000000ubaby --chain-id "$CHAIN_ID" \
  --keyring-backend test --home "$NODE_HOME" >>"$LAUNCH_LOG" 2>&1
"$CHAIN_BIN" genesis collect-gentxs --home "$NODE_HOME" >>"$LAUNCH_LOG" 2>&1
"$CHAIN_BIN" genesis validate-genesis --home "$NODE_HOME" >>"$LAUNCH_LOG" 2>&1

perl -0pi -e 's/(\[api\][\s\S]*?enable = )false/${1}true/' "$NODE_HOME/config/app.toml"
perl -0pi -e 's#(\[api\][\s\S]*?address = )"tcp://localhost:1317"#${1}"tcp://127.0.0.1:1317"#' \
  "$NODE_HOME/config/app.toml"
perl -0pi -e 's#(\[p2p\][\s\S]*?laddr = )"tcp://0.0.0.0:26656"#${1}"tcp://127.0.0.1:26656"#' \
  "$NODE_HOME/config/config.toml"
perl -0ne 'exit(/\[api\](?:(?!\n\[).)*address = "tcp:\/\/127\.0\.0\.1:1317"/s ? 0 : 1)' \
  "$NODE_HOME/config/app.toml" || {
  printf 'API loopback configuration verification failed\n' >&2
  exit 1
}
perl -0ne 'exit(/\[rpc\](?:(?!\n\[).)*laddr = "tcp:\/\/127\.0\.0\.1:26657"/s ? 0 : 1)' \
  "$NODE_HOME/config/config.toml" || {
  printf 'RPC loopback configuration verification failed\n' >&2
  exit 1
}
perl -0ne 'exit(/\[p2p\](?:(?!\n\[).)*laddr = "tcp:\/\/127\.0\.0\.1:26656"/s ? 0 : 1)' \
  "$NODE_HOME/config/config.toml" || {
  printf 'P2P loopback configuration verification failed\n' >&2
  exit 1
}

"$CHAIN_BIN" start --home "$NODE_HOME" --minimum-gas-prices 0ubaby \
  >"$LOG_FILE" 2>&1 &
chain_pid=$!
for _ in $(seq 1 20); do
  chain_started_at=$(process_start_time "$chain_pid")
  [[ -n "$chain_started_at" ]] && break
  sleep 0.05
done
if [[ -z "$chain_started_at" ]]; then
  kill "$chain_pid" 2>/dev/null || true
  for _ in $(seq 1 15); do
    pid_is_alive "$chain_pid" || break
    sleep 1
  done
  if pid_is_alive "$chain_pid"; then
    child_parent=$(ps -p "$chain_pid" -o ppid= 2>/dev/null | tr -d ' ')
    if [[ "$child_parent" == "$$" ]]; then
      kill -KILL "$chain_pid" 2>/dev/null || true
      for _ in $(seq 1 5); do
        pid_is_alive "$chain_pid" || break
        sleep 1
      done
    fi
  fi
  if pid_is_alive "$chain_pid"; then
    printf 'pid=%s\nbinary=%s\nnode_home=%s\n' \
      "$chain_pid" "$CHAIN_BIN" "$NODE_HOME" >"$RUNTIME_DIR/failed-start.pid"
    printf 'Unidentified child %s remains; recovery record: %s\n' \
      "$chain_pid" "$RUNTIME_DIR/failed-start.pid" >&2
  else
    wait "$chain_pid" 2>/dev/null || true
  fi
  chain_pid=
  printf 'Failed to identify started chain process\n' >&2
  exit 1
fi
write_pid_record "$chain_pid" "$chain_started_at"

if ! wait_for_chain "$chain_pid"; then
  printf 'Local chain failed to become ready; inspect %s locally\n' "$LOG_FILE" >&2
  exit 1
fi

height=$(curl -fsS "$RPC_URL/status" | jq -r '.result.sync_info.latest_block_height')
start_succeeded=true
printf 'Local chain ready: chain_id=%s height=%s pid=%s\n' "$CHAIN_ID" "$height" "$chain_pid"

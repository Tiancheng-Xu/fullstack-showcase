#!/usr/bin/env bash
set -Eeuo pipefail

source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)/lib.sh"

prepare_runtime
lock_acquired=false
cleanup_stop() {
  [[ "$lock_acquired" == true ]] && release_start_lock
}
trap cleanup_stop EXIT
acquire_start_lock

if [[ ! -f "$PID_FILE" ]]; then
  if managed_ports_listening; then
    printf 'Refusing to report stopped: an unmanaged listener uses a local chain port\n' >&2
    exit 1
  fi
  printf 'Local chain is not running\n'
  exit 0
fi

chain_pid=$(read_node_pid || true)
if ! [[ "$chain_pid" =~ ^[0-9]+$ ]]; then
  printf 'Invalid PID file: %s\n' "$PID_FILE" >&2
  exit 1
fi

if pid_is_alive "$chain_pid"; then
  if ! process_instance_matches "$chain_pid"; then
    printf 'Refusing to stop unrelated process %s\n' "$chain_pid" >&2
    exit 1
  fi
  process_instance_matches "$chain_pid" || {
    printf 'Process identity changed before stop signal\n' >&2
    exit 1
  }
  kill "$chain_pid"
  for _ in $(seq 1 30); do
    pid_is_alive "$chain_pid" || break
    sleep 1
  done
  if pid_is_alive "$chain_pid"; then
    printf 'Chain process %s did not stop after SIGTERM\n' "$chain_pid" >&2
    exit 1
  fi
fi

rm -f "$PID_FILE"
for _ in $(seq 1 30); do
  if ! lsof -nP -iTCP:26656 -sTCP:LISTEN >/dev/null 2>&1 &&
    ! lsof -nP -iTCP:26657 -sTCP:LISTEN >/dev/null 2>&1 &&
    ! lsof -nP -iTCP:1317 -sTCP:LISTEN >/dev/null 2>&1; then
    printf 'Local chain stopped\n'
    exit 0
  fi
  sleep 1
done

printf 'Local chain ports were not released\n' >&2
exit 1

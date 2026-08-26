#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
CHAIN_DIR="$APP_DIR/cosmos-chain"
IGNITE="$APP_DIR/.tools/bin/ignite"

validate_chain() {
  local required_file
  for required_file in go.mod app/app.go app/config.go cmd/babysteps-chaind/main.go config.yml; do
    [[ -f "$CHAIN_DIR/$required_file" ]] || return 1
  done
  grep -Fqx 'module github.com/Tiancheng-Xu/babysteps-chain' "$CHAIN_DIR/go.mod" &&
    grep -Fq 'AccountAddressPrefix = "baby"' "$CHAIN_DIR/app/app.go" &&
    grep -Fq 'sdk.DefaultBondDenom = "ubaby"' "$CHAIN_DIR/app/config.go" &&
    grep -Fqx 'default_denom: ubaby' "$CHAIN_DIR/config.yml"
}

if [[ -d "$CHAIN_DIR" ]] && validate_chain; then
  exit 0
fi
if [[ -e "$CHAIN_DIR" ]]; then
  printf 'Refusing to overwrite incomplete chain directory: %s\n' "$CHAIN_DIR" >&2
  exit 1
fi

"$IGNITE" scaffold chain github.com/Tiancheng-Xu/babysteps-chain \
  --address-prefix baby \
  --default-denom ubaby \
  --no-module \
  --skip-git \
  --path "$CHAIN_DIR"

validate_chain || {
  printf 'Generated chain failed completeness validation\n' >&2
  exit 1
}

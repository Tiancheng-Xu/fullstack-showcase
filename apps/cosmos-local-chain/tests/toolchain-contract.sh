#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
source "$APP_DIR/tests/assert.sh"

make -s -C "$APP_DIR" bootstrap

version_output=$("$APP_DIR/.tools/bin/ignite" version 2>&1)
assert_contains "$version_output" "v29.8.0" "Ignite version"
assert_file "$APP_DIR/cosmos-chain/go.mod"
assert_file "$APP_DIR/cosmos-chain/app/app.go"
assert_file "$APP_DIR/cosmos-chain/app/config.go"
assert_file "$APP_DIR/cosmos-chain/cmd/babysteps-chaind/main.go"
assert_file "$APP_DIR/cosmos-chain/config.yml"
assert_contains "$(head -n 1 "$APP_DIR/cosmos-chain/go.mod")" \
  "module github.com/Tiancheng-Xu/babysteps-chain" "chain module path"
assert_contains "$(cat "$APP_DIR/cosmos-chain/app/app.go")" \
  'AccountAddressPrefix = "baby"' "address prefix"
assert_contains "$(cat "$APP_DIR/cosmos-chain/app/config.go")" \
  'sdk.DefaultBondDenom = "ubaby"' "bond denom"
assert_contains "$(cat "$APP_DIR/cosmos-chain/config.yml")" \
  'default_denom: ubaby' "config denom"

sdk_version=$(cd "$APP_DIR/cosmos-chain" && go list -m -f '{{.Version}}' github.com/cosmos/cosmos-sdk)
comet_version=$(cd "$APP_DIR/cosmos-chain" && go list -m -f '{{.Version}}' github.com/cometbft/cometbft)
assert_eq "v0.53.6" "$sdk_version" "Cosmos SDK version"
assert_eq "v0.38.21" "$comet_version" "CometBFT version"

printf 'PASS: pinned Ignite and generated chain dependencies\n'

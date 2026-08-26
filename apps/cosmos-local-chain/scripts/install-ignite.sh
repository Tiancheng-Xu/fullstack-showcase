#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
BIN_DIR="$APP_DIR/.tools/bin"
IGNITE="$BIN_DIR/ignite"
IGNITE_VERSION=v29.8.0
RELEASE_VERSION=${IGNITE_VERSION#v}
IGNITE_COMMIT=7ef34af4b41352dda276db8a4f40ef66f3f9481a
SOURCE_DIR="$APP_DIR/.tools/src/ignite-$IGNITE_COMMIT"

mkdir -p "$BIN_DIR"
if [[ ! -x "$IGNITE" ]] || ! "$IGNITE" version 2>&1 | grep -Fq "$IGNITE_VERSION"; then
  mkdir -p "$(dirname "$SOURCE_DIR")"
  if [[ ! -d "$SOURCE_DIR/.git" ]]; then
    git clone --quiet --depth 1 --branch "$IGNITE_VERSION" \
      https://github.com/ignite/cli.git "$SOURCE_DIR"
  fi
  actual_commit=$(git -C "$SOURCE_DIR" rev-parse HEAD)
  [[ "$actual_commit" == "$IGNITE_COMMIT" ]] || {
    printf 'Ignite source verification failed\n' >&2
    exit 1
  }

  temp_binary=$(mktemp "$BIN_DIR/.ignite.tmp.XXXXXX")
  trap 'rm -f "$temp_binary"' EXIT
  (
    cd "$SOURCE_DIR"
    go build -mod=readonly \
      -ldflags="-s -w -X github.com/ignite/cli/v29/ignite/version.Version=$IGNITE_VERSION" \
      -o "$temp_binary" ./ignite/cmd/ignite
  )
  mv "$temp_binary" "$IGNITE"
  trap - EXIT
fi

"$IGNITE" version 2>&1 | grep -Fq "$IGNITE_VERSION" || {
  printf 'Ignite version verification failed\n' >&2
  exit 1
}

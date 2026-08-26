#!/usr/bin/env bash

fail() {
  printf 'FAIL: %s\n' "$*" >&2
  exit 1
}

assert_eq() {
  local expected=$1 actual=$2 label=$3
  [[ "$actual" == "$expected" ]] || fail "$label: expected '$expected', got '$actual'"
}

assert_contains() {
  local haystack=$1 needle=$2 label=$3
  [[ "$haystack" == *"$needle"* ]] || fail "$label: missing '$needle'"
}

assert_file() {
  [[ -f "$1" ]] || fail "missing file: $1"
}

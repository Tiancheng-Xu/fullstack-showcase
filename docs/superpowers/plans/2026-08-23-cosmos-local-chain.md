# Cosmos Local Chain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reproducible single-validator Cosmos SDK chain that demonstrates genesis distribution, local wallets, a real bank transfer, transaction lookup, and continuing block production without changing existing BabySteps evidence.

**Architecture:** A pinned Ignite CLI generates a standard Cosmos SDK application under `apps/cosmos-local-chain/cosmos-chain`. Project-owned Bash scripts isolate the tool binary, node home, keyring, lifecycle, transfer flow, and evidence export; plain Bash integration tests exercise the real local node through the generated CLI and CometBFT RPC.

**Tech Stack:** Go 1.26.5, Ignite CLI v29.8.0, Cosmos SDK v0.53.6, CometBFT v0.38.21, Bash, Make, jq, curl, OpenSSL

**Spec:** `docs/superpowers/specs/2026-08-23-cosmos-local-chain-design.md`

## Global Constraints

- Keep Ignite CLI pinned to `v29.8.0`; that release scaffolds Cosmos SDK `v0.53.6` and supports Go 1.26.
- Use chain ID `babysteps-local-1`, address prefix `baby`, denomination `ubaby`, and roles `validator`, `alice`, and `bob`.
- Bind RPC and REST to `127.0.0.1`; do not create cloud resources, paid RPC nodes, public testnets, deployments, pushes, or releases.
- Install binaries only under `apps/cosmos-local-chain/.tools/bin` and keep node state only under `apps/cosmos-local-chain/.local`.
- Never commit or print mnemonics, private keys, keyring files, PID files, raw runtime logs, or local node state.
- Preserve BabySteps through immutable commit `d728315f1c34bd76377f2b302f9cc6f1ed9e3167`; do not copy or modify its Web3 files.
- Allowed implementation paths are `apps/cosmos-local-chain/`, `specs/cosmos-local-chain/`, `docs/superpowers/`, and `.tc-flow/`.
- TC Flow overrides per-task commits: each Task remains uncommitted through N4 review and N5 checkpoint; create one implementation commit only after N6 and N7 pass.
- Treat generated Ignite source as generated code. Test its build and observable chain behavior; do not recreate Cosmos SDK upstream unit tests.
- Official references: [Ignite installation](https://docs.ignite.com/welcome/install), [Ignite CLI commands](https://docs.ignite.com/CLI-Commands/cli-commands), [Ignite v29.8.0 source module](https://raw.githubusercontent.com/ignite/cli/v29.8.0/go.mod), and [Cosmos SDK v0.53 transactions](https://docs.cosmos.network/sdk/v0.53/user/run-node/txs).

---

## File Map

| Path | Responsibility |
| --- | --- |
| `apps/cosmos-local-chain/Makefile` | Stable public commands: bootstrap, start, stop, demo, test, verify |
| `apps/cosmos-local-chain/.gitignore` | Exclude `.tools`, `.local`, temporary evidence, logs, and generated runtime keys |
| `apps/cosmos-local-chain/cosmos-chain/**` | Ignite-generated Cosmos SDK application source |
| `apps/cosmos-local-chain/cosmos-chain/config.yml` | Chain ID, binary name, genesis balances, and validator bond |
| `apps/cosmos-local-chain/scripts/install-ignite.sh` | Idempotently install and verify Ignite v29.8.0 in the project tool directory |
| `apps/cosmos-local-chain/scripts/scaffold-chain.sh` | Idempotently create the pinned Cosmos SDK source tree |
| `apps/cosmos-local-chain/scripts/lib.sh` | Shared paths, constants, RPC polling, account and balance queries, and assertions |
| `apps/cosmos-local-chain/scripts/start-local.sh` | Preflight ports, reset node state, launch Ignite, record PID, and wait for RPC |
| `apps/cosmos-local-chain/scripts/stop-local.sh` | Verify PID ownership, stop only this node, and verify ports are released |
| `apps/cosmos-local-chain/scripts/run-demo.sh` | Broadcast transfer, query tx/block, validate balances and height, publish evidence |
| `apps/cosmos-local-chain/tests/assert.sh` | Small dependency-free Bash assertion helpers |
| `apps/cosmos-local-chain/tests/toolchain-contract.sh` | Verify pinned tool and generated dependency versions through real commands |
| `apps/cosmos-local-chain/tests/lifecycle-contract.sh` | Verify chain identity, accounts, genesis balances, startup, and cleanup |
| `apps/cosmos-local-chain/tests/transfer-contract.sh` | Verify bank transfer, tx lookup, containing block, and balance delta |
| `apps/cosmos-local-chain/tests/security-contract.sh` | Verify ignored runtime data, evidence schema, and secret boundaries |
| `apps/cosmos-local-chain/tests/run.sh` | Run the complete chain integration flow once with guaranteed cleanup |
| `apps/cosmos-local-chain/evidence/public/*.json` | Sanitized, reproducible public chain evidence |
| `apps/cosmos-local-chain/evidence/README.md` | Explain each evidence file, what to inspect, and what it proves |
| `apps/cosmos-local-chain/README.md` | Chinese setup, commands, architecture, troubleshooting, and evidence walkthrough |
| `.tc-flow/contract.json` | Frozen v2 Cosmos Feature contract |
| `.tc-flow/state.json` | Current node, difficulty, Task state, and worktree identity |
| `.tc-flow/tasks.md` | Reviewed Task checklist synchronized with `specs/cosmos-local-chain/tasks.md` |
| `.tc-flow/events.jsonl` | Append-only N1-N8 event history |

---

### Task 1: Freeze the runtime contract and scaffold the pinned chain

**Files:**

- Create: `apps/cosmos-local-chain/.gitignore`
- Create: `apps/cosmos-local-chain/Makefile`
- Create: `apps/cosmos-local-chain/scripts/install-ignite.sh`
- Create: `apps/cosmos-local-chain/scripts/scaffold-chain.sh`
- Create: `apps/cosmos-local-chain/tests/assert.sh`
- Create: `apps/cosmos-local-chain/tests/toolchain-contract.sh`
- Generate: `apps/cosmos-local-chain/cosmos-chain/**`
- Modify: `.tc-flow/contract.json`
- Modify: `.tc-flow/state.json`
- Modify: `.tc-flow/tasks.md`
- Modify: `.tc-flow/events.jsonl` by appending the N1/N2/T-001 events

**Interfaces:**

- Consumes: approved spec, Go `1.26.5`, contract hash `97e86269840a8b079e7d1d034b107c5497443f8a32d525988bb265c4cc5996c5`, run ID `97cd980a-2a54-4510-89a5-1a5f2bef74aa`
- Produces: executable `.tools/bin/ignite`, generated `cosmos-chain/go.mod`, deterministic Make targets, and a frozen TC Flow state for Tasks T-001 through T-004

- [ ] **Step 1: Initialize the TC Flow contract without deleting prior history**

Replace only the current top-level pointers and append to the existing event stream. Use this contract payload, preserving old review/checkpoint files:

```json
{
  "goal": "Build a reproducible local Cosmos SDK chain demo with genesis wallets token distribution bank transfer transaction query and block production evidence",
  "context": {
    "aiEngineering": false,
    "allowedWritePaths": [
      "apps/cosmos-local-chain/",
      "docs/superpowers/",
      "specs/cosmos-local-chain/",
      ".tc-flow/"
    ],
    "feature": "cosmos-local-chain",
    "network": "Official documentation and Go module downloads only; no paid RPC cloud resources deployment push or production actions",
    "nonGoals": [
      "EVM contract redeployment",
      "Sepolia RPC replacement",
      "Graph indexing reimplementation",
      "cloud validator or public testnet"
    ],
    "runId": "97cd980a-2a54-4510-89a5-1a5f2bef74aa",
    "sourceBranch": "origin/main",
    "version": 2
  },
  "allowedTools": ["apply_patch", "bash", "curl", "git", "go", "ignite", "jq", "make"],
  "acceptanceCriteria": [
    "A reproducible local Cosmos SDK chain starts with an explicit chain ID and genesis",
    "Validator Alice and Bob accounts receive explicit genesis allocations without exposing mnemonics or private keys",
    "Alice sends ubaby to Bob and evidence captures balances transaction hash transaction query and containing block",
    "A later block height proves continuing block production",
    "Scripts stop cleanly and generated runtime state is excluded from Git",
    "Existing BabySteps Sepolia RPC and Graph evidence remains unchanged and is referenced by immutable commit"
  ],
  "contractHash": "97e86269840a8b079e7d1d034b107c5497443f8a32d525988bb265c4cc5996c5"
}
```

Set `.tc-flow/state.json` to N3/T-001 with difficulty `medium`, inline writer `codex`, isolated reviewer `codex`, and four pending Tasks. Copy the four Task descriptions exactly from `specs/cosmos-local-chain/tasks.md` into `.tc-flow/tasks.md`. Append one JSONL event each for N1 completion, N2 completion, and T-001 start; do not rewrite existing lines.

- [ ] **Step 2: Write the failing toolchain test**

Create `tests/assert.sh`:

```bash
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
```

Create `tests/toolchain-contract.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
source "$APP_DIR/tests/assert.sh"

make -s -C "$APP_DIR" bootstrap

version_output=$("$APP_DIR/.tools/bin/ignite" version)
assert_contains "$version_output" "v29.8.0" "Ignite version"
assert_file "$APP_DIR/cosmos-chain/go.mod"

sdk_version=$(cd "$APP_DIR/cosmos-chain" && go list -m -f '{{.Version}}' github.com/cosmos/cosmos-sdk)
comet_version=$(cd "$APP_DIR/cosmos-chain" && go list -m -f '{{.Version}}' github.com/cometbft/cometbft)
assert_eq "v0.53.6" "$sdk_version" "Cosmos SDK version"
assert_eq "v0.38.21" "$comet_version" "CometBFT version"

printf 'PASS: pinned Ignite and generated chain dependencies\n'
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```bash
bash apps/cosmos-local-chain/tests/toolchain-contract.sh
```

Expected: FAIL because `apps/cosmos-local-chain/Makefile` and `make bootstrap` do not exist. This failure proves the test exercises the missing public setup command.

- [ ] **Step 4: Implement project-local installation and scaffolding**

Create `.gitignore`:

```gitignore
.tools/
.local/
evidence/local/
*.log
*.pid
```

Create `scripts/install-ignite.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
BIN_DIR="$APP_DIR/.tools/bin"
IGNITE="$BIN_DIR/ignite"
IGNITE_VERSION=v29.8.0

mkdir -p "$BIN_DIR"
if [[ ! -x "$IGNITE" ]] || ! "$IGNITE" version | grep -Fq "$IGNITE_VERSION"; then
  GOBIN="$BIN_DIR" go install "github.com/ignite/cli/v29/ignite@$IGNITE_VERSION"
fi

"$IGNITE" version | grep -Fq "$IGNITE_VERSION" || {
  printf 'Ignite version verification failed\n' >&2
  exit 1
}
```

Create `scripts/scaffold-chain.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
CHAIN_DIR="$APP_DIR/cosmos-chain"
IGNITE="$APP_DIR/.tools/bin/ignite"

if [[ -f "$CHAIN_DIR/go.mod" ]]; then
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
```

Create `Makefile`:

```make
SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help bootstrap toolchain-version start stop demo test verify

help:
	@printf '%s\n' 'bootstrap start stop demo test verify'

bootstrap:
	@bash scripts/install-ignite.sh
	@bash scripts/scaffold-chain.sh

toolchain-version:
	@bash scripts/install-ignite.sh >/dev/null
	@.tools/bin/ignite version

start: bootstrap
	@bash scripts/start-local.sh

stop:
	@bash scripts/stop-local.sh

demo: bootstrap
	@bash scripts/start-local.sh
	@bash scripts/run-demo.sh

test: bootstrap
	@bash tests/run.sh

verify: test
	@bash tests/security-contract.sh
```

Mark all project scripts and tests executable. Run `gofmt` only on generated or modified Go files if Ignite leaves formatting changes.

- [ ] **Step 5: Run GREEN verification**

Run:

```bash
bash apps/cosmos-local-chain/tests/toolchain-contract.sh
cd apps/cosmos-local-chain/cosmos-chain && go test ./...
```

Expected: the contract test prints `PASS`, the generated module resolves Cosmos SDK `v0.53.6` and CometBFT `v0.38.21`, and generated Go tests pass.

- [ ] **Step 6: Complete TC Flow N4/N5 for T-001**

Generate `.tc-flow/reviews/T-001.sanitized.diff`, scan for credentials and personal data, dispatch an isolated reviewer with only the frozen contract, sanitized diff, and test output, then record verdict `pass`. Mark only T-001 complete in both Task files and append the T-001 checkpoint without committing.

---

### Task 2: Implement safe single-validator lifecycle and genesis distribution

**Files:**

- Create: `apps/cosmos-local-chain/scripts/lib.sh`
- Create: `apps/cosmos-local-chain/scripts/start-local.sh`
- Create: `apps/cosmos-local-chain/scripts/stop-local.sh`
- Create: `apps/cosmos-local-chain/tests/lifecycle-contract.sh`
- Modify: `apps/cosmos-local-chain/cosmos-chain/config.yml`
- Modify: `.tc-flow/state.json`
- Modify: `.tc-flow/tasks.md`
- Append: `.tc-flow/events.jsonl`
- Create: `.tc-flow/checkpoints/T-002.json`

**Interfaces:**

- Consumes: `.tools/bin/ignite`, generated chain source, Make targets from T-001
- Produces: `start-local.sh`, `stop-local.sh`, `.local/node`, `.local/ignite.pid`, `babysteps-chaind`, and query helpers used by T-003

- [ ] **Step 1: Write the failing lifecycle test**

Create `tests/lifecycle-contract.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
source "$APP_DIR/tests/assert.sh"
source "$APP_DIR/scripts/lib.sh"

"$APP_DIR/scripts/start-local.sh"
trap '"$APP_DIR/scripts/stop-local.sh" >/dev/null 2>&1 || true' EXIT

status=$(rpc_get /status)
assert_eq "$CHAIN_ID" "$(jq -r '.result.node_info.network' <<<"$status")" "chain ID"

validator=$(account_address validator)
alice=$(account_address alice)
bob=$(account_address bob)
[[ "$validator" == baby1* ]] || fail "validator prefix"
[[ "$alice" == baby1* ]] || fail "alice prefix"
[[ "$bob" == baby1* ]] || fail "bob prefix"

assert_eq "500000000" "$(balance_amount "$validator")" "validator liquid genesis balance"
assert_eq "500000000" "$(balance_amount "$alice")" "alice genesis balance"
assert_eq "100000000" "$(balance_amount "$bob")" "bob genesis balance"

height=$(latest_height)
(( height >= 1 )) || fail "latest height must be positive"

"$APP_DIR/scripts/stop-local.sh"
trap - EXIT
for port in 26657 1317; do
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "project port still listening after stop: $port"
  fi
done

printf 'PASS: local chain lifecycle and genesis distribution\n'
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
bash apps/cosmos-local-chain/tests/lifecycle-contract.sh
```

Expected: FAIL because `scripts/lib.sh`, `start-local.sh`, and `stop-local.sh` do not exist.

- [ ] **Step 3: Freeze the generated chain configuration**

Replace generated `config.yml` with:

```yaml
version: 1
validation: sovereign
default_denom: ubaby
build:
  binary: babysteps-chaind
accounts:
  - name: validator
    coins:
      - 1000000000ubaby
  - name: alice
    coins:
      - 500000000ubaby
  - name: bob
    coins:
      - 100000000ubaby
genesis:
  chain_id: babysteps-local-1
validators:
  - name: validator
    bonded: 500000000ubaby
```

Do not add `mnemonic` or `address` fields. Ignite must generate fresh local test keys inside the project node home.

- [ ] **Step 4: Implement shared runtime helpers**

Create `scripts/lib.sh` with these exact exported interfaces:

```bash
#!/usr/bin/env bash

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
CHAIN_DIR="$APP_DIR/cosmos-chain"
TOOLS_BIN="$APP_DIR/.tools/bin"
IGNITE="$TOOLS_BIN/ignite"
CHAIN_BIN="$TOOLS_BIN/babysteps-chaind"
LOCAL_DIR="$APP_DIR/.local"
NODE_HOME="$LOCAL_DIR/node"
PID_FILE="$LOCAL_DIR/ignite.pid"
LOG_FILE="$LOCAL_DIR/ignite.log"
RPC_URL=http://127.0.0.1:26657
NODE_RPC=tcp://127.0.0.1:26657
CHAIN_ID=babysteps-local-1
DENOM=ubaby
KEYRING_BACKEND=test

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
require_command() { command -v "$1" >/dev/null 2>&1 || die "missing command: $1"; }
rpc_get() { curl -fsS "$RPC_URL$1"; }
latest_height() { rpc_get /status | jq -r '.result.sync_info.latest_block_height' | tr -d '"'; }
account_address() {
  "$CHAIN_BIN" keys show "$1" -a --home "$NODE_HOME" --keyring-backend "$KEYRING_BACKEND"
}
balance_amount() {
  "$CHAIN_BIN" query bank balance "$1" "$DENOM" --node "$NODE_RPC" --output json | jq -r '.balance.amount // "0"'
}
wait_for_rpc() {
  local deadline=$((SECONDS + 120))
  until rpc_get /status >/dev/null 2>&1; do
    (( SECONDS < deadline )) || die "RPC did not become ready within 120 seconds"
    sleep 1
  done
}
```

- [ ] **Step 5: Implement start and stop ownership checks**

`start-local.sh` must:

1. Require `curl`, `jq`, `lsof`, `ps`, and project binaries.
2. Reject an existing live PID or any unrelated listener on ports 26657 and 1317.
3. Create `.local`, export `GOBIN="$TOOLS_BIN"` and prepend it to `PATH`.
4. Start this command in the background from `cosmos-chain`:

```bash
"$IGNITE" chain serve \
  --reset-once \
  --path "$CHAIN_DIR" \
  --home "$NODE_HOME" \
  --output-file "$LOG_FILE" \
  --quit-on-fail
```

5. Save `$!` atomically to `ignite.pid`, wait for RPC, verify `node_info.network == babysteps-local-1`, and stop the process before returning nonzero on any failure.

`stop-local.sh` must read only `ignite.pid`, require a numeric PID, verify `ps -p "$pid" -o command=` contains both `ignite` and the absolute `cosmos-chain` path, send `TERM`, wait up to 20 seconds, and remove the PID file. If the verified process remains, send `KILL` only to that PID and fail if either project port stays open.

- [ ] **Step 6: Run GREEN verification**

Run:

```bash
bash apps/cosmos-local-chain/tests/lifecycle-contract.sh
```

Expected: PASS with exact chain ID, three `baby1...` addresses, validator liquid balance `500000000`, Alice balance `500000000`, Bob balance `100000000`, positive height, and released RPC port after stop.

- [ ] **Step 7: Complete TC Flow N4/N5 for T-002**

Review only T-002 changes and lifecycle output, produce the sanitized diff and checkpoint, mark T-002 complete after verdict `pass`, and keep the working tree uncommitted.

---

### Task 3: Execute the transfer and publish transaction/block evidence

**Files:**

- Create: `apps/cosmos-local-chain/scripts/run-demo.sh`
- Create: `apps/cosmos-local-chain/tests/transfer-contract.sh`
- Create: `apps/cosmos-local-chain/evidence/public/run-summary.json`
- Create: `apps/cosmos-local-chain/evidence/public/status-before.json`
- Create: `apps/cosmos-local-chain/evidence/public/balances-before.json`
- Create: `apps/cosmos-local-chain/evidence/public/broadcast.json`
- Create: `apps/cosmos-local-chain/evidence/public/tx.json`
- Create: `apps/cosmos-local-chain/evidence/public/block.json`
- Create: `apps/cosmos-local-chain/evidence/public/balances-after.json`
- Create: `apps/cosmos-local-chain/evidence/public/status-after.json`
- Modify: `.tc-flow/state.json`
- Modify: `.tc-flow/tasks.md`
- Append: `.tc-flow/events.jsonl`
- Create: `.tc-flow/checkpoints/T-003.json`

**Interfaces:**

- Consumes: a running node, `account_address`, `balance_amount`, `latest_height`, and `babysteps-chaind`
- Produces: `run-demo.sh` exit status, schema-stable public JSON evidence, `tx_hash`, `tx_height`, and verified later block height

- [ ] **Step 1: Write the failing transfer test**

Create `tests/transfer-contract.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
source "$APP_DIR/tests/assert.sh"

tmp_evidence=$(mktemp -d "$APP_DIR/.local/test-evidence.XXXXXX")
trap 'rm -rf "$tmp_evidence"' EXIT
EVIDENCE_PUBLIC_DIR="$tmp_evidence" "$APP_DIR/scripts/run-demo.sh"

summary="$tmp_evidence/run-summary.json"
assert_file "$summary"
assert_eq "babysteps-local-1" "$(jq -r '.chain_id' "$summary")" "summary chain ID"
assert_eq "ubaby" "$(jq -r '.transfer.denom' "$summary")" "transfer denom"
assert_eq "25000000" "$(jq -r '.transfer.amount' "$summary")" "transfer amount"
assert_eq "0" "$(jq -r '.transfer.code' "$summary")" "transaction code"

bob_before=$(jq -r '.balances.before.bob' "$summary")
bob_after=$(jq -r '.balances.after.bob' "$summary")
assert_eq "$((bob_before + 25000000))" "$bob_after" "Bob balance delta"

tx_height=$(jq -r '.transfer.height' "$summary")
final_height=$(jq -r '.final_height' "$summary")
(( tx_height > 0 )) || fail "transaction height must be positive"
(( final_height > tx_height )) || fail "final height must exceed transaction height"

assert_file "$tmp_evidence/tx.json"
assert_file "$tmp_evidence/block.json"
assert_eq "$tx_height" "$(jq -r '.height' "$tmp_evidence/tx.json")" "tx query height"
assert_eq "$tx_height" "$(jq -r '.result.block.header.height' "$tmp_evidence/block.json")" "block height"

printf 'PASS: transfer, transaction lookup, containing block, and later height\n'
```

- [ ] **Step 2: Run the test and verify RED**

Start the node, then run:

```bash
make -C apps/cosmos-local-chain start
bash apps/cosmos-local-chain/tests/transfer-contract.sh
make -C apps/cosmos-local-chain stop
```

Expected: FAIL because `scripts/run-demo.sh` does not exist.

- [ ] **Step 3: Implement the transfer and polling flow**

Create `scripts/run-demo.sh` with `set -Eeuo pipefail`, source `lib.sh`, require a ready RPC, and use `EVIDENCE_PUBLIC_DIR=${EVIDENCE_PUBLIC_DIR:-$APP_DIR/evidence/public}`. Write all intermediate files under `mktemp -d "$LOCAL_DIR/evidence.XXXXXX"`; copy the fixed public files only after every assertion passes.

Use these exact operations:

```bash
validator=$(account_address validator)
alice=$(account_address alice)
bob=$(account_address bob)
validator_before=$(balance_amount "$validator")
alice_before=$(balance_amount "$alice")
bob_before=$(balance_amount "$bob")

"$CHAIN_BIN" tx bank send alice "$bob" 25000000ubaby \
  --from alice \
  --chain-id "$CHAIN_ID" \
  --home "$NODE_HOME" \
  --keyring-backend "$KEYRING_BACKEND" \
  --node "$NODE_RPC" \
  --fees 500ubaby \
  --broadcast-mode sync \
  --yes \
  --output json >"$stage/broadcast.json"

tx_hash=$(jq -r '.txhash' "$stage/broadcast.json")
[[ "$tx_hash" =~ ^[A-F0-9]{64}$ ]] || die "invalid transaction hash"
```

Poll `"$CHAIN_BIN" query tx "$tx_hash" --node "$NODE_RPC" --output json` for up to 60 seconds. Require `.code == 0` and a positive `.height`, then save the result as `tx.json`. Query `rpc_get "/block?height=$tx_height"` as `block.json`.

Prove the block contains the transaction by iterating `.result.block.data.txs[]`, decoding each value with `openssl base64 -d -A`, hashing raw bytes with `shasum -a 256`, uppercasing the digest, and requiring one digest to equal `tx_hash`.

Query balances after confirmation and require:

```text
bob_after = bob_before + 25000000
alice_after = alice_before - 25000000 - 500
validator_after = validator_before
```

Poll `/status` for up to 30 seconds until `latest_block_height > tx_height`. Build `run-summary.json` with `jq -n` using string amounts and numeric code/height fields. Publish exactly the eight evidence files listed in this Task with mode `0644`.

- [ ] **Step 4: Run GREEN verification**

Run:

```bash
make -C apps/cosmos-local-chain start
bash apps/cosmos-local-chain/tests/transfer-contract.sh
make -C apps/cosmos-local-chain stop
```

Expected: PASS; Bob increases by `25000000`, Alice decreases by `25000500`, transaction code is zero, block raw transaction hashes to the broadcast hash, and final height exceeds transaction height.

- [ ] **Step 5: Generate committed public evidence**

Run from a freshly reset chain:

```bash
make -C apps/cosmos-local-chain start
bash apps/cosmos-local-chain/scripts/run-demo.sh
make -C apps/cosmos-local-chain stop
```

Confirm all eight files exist under `evidence/public`. Do not copy `.local/ignite.log`, `.local/node`, `.local/ignite.pid`, `.tools`, or keyring files.

- [ ] **Step 6: Complete TC Flow N4/N5 for T-003**

Review the transfer implementation and generated evidence schema, redact only secret-like values if any appear, record verdict `pass`, mark T-003 complete, and append checkpoint T-003 without committing.

---

### Task 4: Add the reproducible guide and run complete local QA

**Files:**

- Create: `apps/cosmos-local-chain/README.md`
- Create: `apps/cosmos-local-chain/evidence/README.md`
- Create: `apps/cosmos-local-chain/tests/security-contract.sh`
- Create: `apps/cosmos-local-chain/tests/run.sh`
- Modify: `apps/cosmos-local-chain/Makefile`
- Modify: `specs/cosmos-local-chain/tasks.md`
- Modify: `.tc-flow/state.json`
- Modify: `.tc-flow/tasks.md`
- Append: `.tc-flow/events.jsonl`
- Create: `.tc-flow/checkpoints/T-004.json`
- Create: `.tc-flow/qa/feature-result.json`
- Create: `.tc-flow/reviews/FEATURE-STOP.sanitized.diff`
- Create: `.tc-flow/memory/cosmos-local-chain-97e86269.md`
- Modify: `.tc-flow/memory/INDEX.md`
- Modify: `.tc-flow/run-memory.md`

**Interfaces:**

- Consumes: all Make targets, scripts, tests, generated source, and public evidence from T-001 through T-003
- Produces: one-command verification, Chinese reproduction guide, evidence walkthrough, complete Feature QA, and a policy-audited candidate tree

- [ ] **Step 1: Write the failing security and orchestration tests**

Create `tests/security-contract.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
ROOT=$(cd "$APP_DIR/../.." && pwd -P)
source "$APP_DIR/tests/assert.sh"

assert_file "$APP_DIR/README.md"
assert_file "$APP_DIR/evidence/README.md"
assert_file "$APP_DIR/evidence/public/run-summary.json"

if git -C "$ROOT" ls-files -- \
  'apps/cosmos-local-chain/.tools' \
  'apps/cosmos-local-chain/.local' \
  'apps/cosmos-local-chain/evidence/local' | grep -q .; then
  fail "runtime state is tracked"
fi

if rg -n '(mnemonic:[[:space:]]+[^<]|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|private[_ -]?key[[:space:]]*[:=][[:space:]]*[A-Za-z0-9])' \
  "$APP_DIR/evidence/public" "$APP_DIR/cosmos-chain/config.yml"; then
  fail "secret-like content found in public files"
fi

jq -e '
  .chain_id == "babysteps-local-1" and
  .transfer.denom == "ubaby" and
  .transfer.code == 0 and
  (.final_height > .transfer.height)
' "$APP_DIR/evidence/public/run-summary.json" >/dev/null

git -C "$ROOT" cat-file -e d728315f1c34bd76377f2b302f9cc6f1ed9e3167^{commit}
printf 'PASS: public evidence and secret boundaries\n'
```

Create `tests/run.sh`:

```bash
#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
trap '"$APP_DIR/scripts/stop-local.sh" >/dev/null 2>&1 || true' EXIT

"$APP_DIR/tests/toolchain-contract.sh"
(
  cd "$APP_DIR/cosmos-chain"
  go test ./...
)
"$APP_DIR/tests/lifecycle-contract.sh"
"$APP_DIR/scripts/start-local.sh"
"$APP_DIR/tests/transfer-contract.sh"
"$APP_DIR/scripts/stop-local.sh"
"$APP_DIR/tests/security-contract.sh"

trap - EXIT
printf 'PASS: complete Cosmos local chain verification\n'
```

- [ ] **Step 2: Run the tests and verify RED**

Run:

```bash
bash apps/cosmos-local-chain/tests/security-contract.sh
```

Expected: FAIL because `README.md` and `evidence/README.md` do not exist.

- [ ] **Step 3: Write the Chinese reproduction and evidence guides**

`README.md` must include these sections with exact commands and observed meanings:

1. What the chain demonstrates in plain language.
2. Prerequisites: macOS/Linux, Go `>=1.25.4`, Make, Bash, jq, curl, OpenSSL, and free local ports 26657/1317.
3. `make bootstrap`, `make start`, `make demo`, `make stop`, `make test`, and `make verify` command table.
4. Genesis roles and amounts, including validator's `500000000ubaby` bonded amount and liquid balance.
5. Numbered request flow from broadcast through tx lookup and containing block.
6. RPC versus direct CLI versus indexed query boundaries.
7. Privacy and cleanup rules.
8. Troubleshooting for busy ports, slow first Go download, failed transaction polling, and stale PID files.
9. Immutable BabySteps reuse reference and explicit statement that no existing Web3 files were changed.

`evidence/README.md` must list each of the eight JSON files with two fields: “看哪里” and “证明什么”. It must explain that local addresses and transaction hashes are public evidence, while keyring and mnemonics remain excluded.

- [ ] **Step 4: Run complete GREEN verification**

Run:

```bash
make -C apps/cosmos-local-chain verify
```

Expected: all four contract tests pass; generated Go tests pass; the node stops; ports 26657 and 1317 are free; public evidence validates; no runtime or secret file is tracked.

- [ ] **Step 5: Run deterministic repository checks**

Run:

```bash
git diff --check
rg -n 'T[B]D|T[O]DO|implement[[:space:]]+later|fill[[:space:]]+in[[:space:]]+details' apps/cosmos-local-chain docs/superpowers specs/cosmos-local-chain .tc-flow
git status --short
```

Expected: no whitespace errors, no placeholder matches, and only the Feature change list appears in status.

- [ ] **Step 6: Complete T-004 review and N6 Feature QA**

Run isolated N4 review for T-004, mark both Task files complete only after `pass`, and create checkpoint T-004. Then run N6 against all six acceptance criteria and record:

```json
{
  "feature": "cosmos-local-chain",
  "verdict": "pass",
  "acceptanceCriteria": {"passed": 6, "total": 6},
  "frontend": "not-applicable",
  "backend": "pass",
  "contract": "compatible",
  "retries": 0
}
```

- [ ] **Step 7: Run N7 memory, secret filtering, and repository policy**

Write the Feature memory and run memory without raw chat, mnemonics, private keys, internal paths, or credentials. Stage only the explicit Feature paths, then run:

```bash
policy_repo=$(git config --global --path --get workflow.policyRepository)
node "$policy_repo/scripts/repository-policy.mjs" \
  --mode audit \
  --root "$PWD" \
  --require-caller
```

Expected: repository policy passes and the isolated Stop reviewer returns `ALLOW`. On `BLOCK` or `ERROR`, do not commit.

- [ ] **Step 8: Create the local implementation commit only after ALLOW**

Stage only the reviewed Feature change list and commit locally:

```bash
git commit -m "feat: add reproducible cosmos local chain"
```

Then verify the commit without pushing:

```bash
policy_repo=$(git config --global --path --get workflow.policyRepository)
node "$policy_repo/scripts/repository-policy.mjs" \
  --mode ci \
  --root "$PWD" \
  --range HEAD^..HEAD \
  --require-caller
git status --short --branch
```

Expected: policy passes, worktree is clean, branch is ahead of `origin/main`, and no push, PR, deployment, or production action occurs.

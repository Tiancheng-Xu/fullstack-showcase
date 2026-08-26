SHELL := /bin/bash
.DEFAULT_GOAL := help

.PHONY: help bootstrap toolchain-version start stop demo test

help:
	@printf '%s\n' 'bootstrap toolchain-version start stop demo test'

bootstrap:
	@bash scripts/install-ignite.sh
	@bash scripts/scaffold-chain.sh

toolchain-version:
	@bash scripts/install-ignite.sh >/dev/null
	@.tools/bin/ignite version 2>&1

start: bootstrap
	@bash scripts/start-local.sh

stop:
	@bash scripts/stop-local.sh

demo: start
	@bash scripts/run-demo.sh

test: bootstrap
	@bash tests/toolchain-contract.sh
	@bash tests/lifecycle-contract.sh
	@bash tests/lifecycle-safety-contract.sh
	@bash tests/evidence-validation-contract.sh
	@bash tests/transfer-contract.sh

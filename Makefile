# Repo contract (nextjedi-world/platform docs/CONTRACTS.md):
#   make setup   install dependencies (+ git hooks, + local env stub)
#   make dev     run locally (http://localhost:4200)
#   make verify  lint + format check + typecheck + unit tests + build (what CI and the Stop hook run)
#   make e2e     smoke tests; no e2e suite yet, so this is a no-op until one lands
.DEFAULT_GOAL := verify
.PHONY: setup env dev verify lint format format-check typecheck test build e2e clean

BASE_URL ?=
export BASE_URL
export NG_CLI_ANALYTICS := false

setup: env
	@if [ -f package-lock.json ]; then npm ci; else npm install; fi
	@npx --no-install lefthook install 2>/dev/null || echo "lefthook: hooks not installed (not a git checkout?)"

# src/environments/environment.ts is git-ignored (it holds the Supabase keys). When it is missing
# (fresh clone, CI) a placeholder copy of environment.example.ts is written. Never overwrites.
env:
	@node scripts/ensure-env.mjs

dev: env
	npm start

lint:
	npm run lint

format:
	npm run format

format-check:
	npm run format:check

typecheck: env
	npm run typecheck

test: env
	npm run test:ci

build: env
	npm run build

verify: lint format-check typecheck test build

e2e:
	@echo "make e2e: no e2e/smoke suite yet (BASE_URL=$(BASE_URL)); nothing to run."

clean:
	rm -rf dist .angular/cache coverage out-tsc

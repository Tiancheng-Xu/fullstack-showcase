# Portfolio Sync Implementation Plan

> For agentic workers: use superpowers:subagent-driven-development or
> superpowers:executing-plans task by task.

Goal: build read-only event-driven repository-to-portfolio synchronization and
publish its Evidence case.

Architecture: GitHub App webhooks are verified by a Cloudflare Worker. The
Worker reads eligible manifests with short-lived tokens, writes a versioned
public index to Workers KV, and Dashboard merges it over a static fallback.

Tech stack: GitHub Apps, Webhooks, Web Crypto, Cloudflare Workers, Workers KV,
React, TypeScript, Vite, JSON Evidence manifests.

## Task 1: Worker

- Create the Worker, KV binding, custom domain, Cron, HMAC gate and App JWT.
- Scan only repositories with valid Baby2B publish and Evidence contracts.
- Write one complete KV snapshot after a successful scan.
- Add a remote Wrangler dry-run workflow.

## Task 2: Dashboard

- Validate schema version 1 envelopes and project cards.
- Preserve curated text while updating status, progress and links.
- Append newly discovered projects and keep the static failure fallback.
- Add Portfolio Sync as a completed project card.

## Task 3: Evidence

- Document event flow, recovery flow, trust boundaries and incidents.
- Link source paths, public health and project endpoints.
- Keep secrets, private paths and filtered repository names out of Evidence.

# Portfolio Sync Design

## Goal

Automatically reflect Baby2B project repository additions and metadata changes
on the portfolio Dashboard while publishing the synchronizer as a verifiable
project.

## Architecture

GitHub App webhook -> Cloudflare Worker -> HMAC verification -> short-lived
read-only installation token -> publish and portfolio manifests -> schema and
exclusion filters -> Workers KV -> Dashboard runtime merge.

A Cloudflare Cron Trigger performs the same full refresh every 30 minutes. The
Dashboard keeps its reviewed static list and only merges a valid versioned
remote envelope, so Worker, GitHub, network, or KV failure cannot empty it.

## Trust boundaries

- GitHub App permission is repository Contents read-only.
- Webhook requests require X-Hub-Signature-256 verification.
- The private key and webhook secret remain Worker secrets.
- Installation tokens are generated on demand and expire within one hour.
- Only valid publish manifests with public Evidence URLs are serialized.
- No browser receives credentials, raw manifests, or private source.

## Failure behavior

- Invalid signatures, oversized payloads, and invalid JSON are rejected.
- Invalid repository metadata is skipped and counted.
- Failed scans never overwrite the last valid KV snapshot.
- KV propagation can take up to approximately 60 seconds globally.
- Dashboard fetch or schema failure retains the static project index.
- Cron refresh repairs missed, delayed, or duplicate webhook events.

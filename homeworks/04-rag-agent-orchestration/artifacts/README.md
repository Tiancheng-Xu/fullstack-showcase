# Artifact boundary

Only public artifact descriptions and hash-only evidence belong in Git. Upload bundles, adapters, weights and raw evaluation output live in `artifacts/private/`, which Git ignores.

## 2026-08-02 local preparation

- Bundle entries: 13 allowlisted files
- Dataset release: `rag-sft-20260802-v1`
- Split rows: train 50, validation 7, test 6
- Local upload ZIP SHA-256: `547152b308c9a45fc477261969831f43699560217f991753ad5f0345b88f2e3f`
- Remote training status: not started

The hash identifies the frozen local upload candidate. A different hash tomorrow requires rebuilding and re-verifying the bundle before upload.

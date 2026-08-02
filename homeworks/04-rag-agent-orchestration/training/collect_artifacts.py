from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import zipfile
from pathlib import Path


def digest(path: Path) -> dict[str, int | str]:
    raw = path.read_bytes()
    return {"bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}


def copy_required(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, destination)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--adapter", type=Path, required=True)
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    stage = args.output.with_suffix("")
    if stage.exists():
        shutil.rmtree(stage)
    stage.mkdir(parents=True)
    copy_required(args.adapter / "adapter_config.json", stage / "adapter/adapter_config.json")
    copy_required(args.adapter / "adapter_model.safetensors", stage / "adapter/adapter_model.safetensors")
    readme = args.adapter / "README.md"
    if readme.is_file():
        copy_required(readme, stage / "adapter/README.md")
    else:
        (stage / "adapter/README.md").write_text(
            "# Qwen3-8B QLoRA adapter\n\nBase model: Qwen/Qwen3-8B\n", encoding="utf-8"
        )
    evidence_files = [
        "preflight.json",
        "dataset-verification.json",
        "training-console.log",
        "evaluation.jsonl",
        "evaluation-summary.json",
    ]
    for name in evidence_files:
        copy_required(args.evidence / name, stage / f"evidence/{name}")
    for name in ("trainer_state.json", "train_results.json", "eval_results.json"):
        source = args.adapter / name
        if source.is_file():
            copy_required(source, stage / f"evidence/{name}")

    files = sorted(path for path in stage.rglob("*") if path.is_file())
    manifest = {
        "version": 1,
        "files": {
            path.relative_to(stage).as_posix(): digest(path)
            for path in files
        },
    }
    (stage / "evidence/MANIFEST.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(args.output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(item for item in stage.rglob("*") if item.is_file()):
            archive.write(path, path.relative_to(stage).as_posix())
    print(json.dumps({"archive": str(args.output), "files": len(manifest["files"]) + 1}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any


EXPECTED_ROLES = ["system", "user", "assistant"]


def verify_file(path: Path, minimum: int, maximum: int | None = None) -> dict[str, Any]:
    raw = path.read_bytes()
    rows = []
    for line_number, line in enumerate(raw.decode("utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        record = json.loads(line)
        if set(record) != {"messages"}:
            raise ValueError(f"{path.name}:{line_number} must contain messages only")
        messages = record["messages"]
        if not isinstance(messages, list) or [item.get("role") for item in messages] != EXPECTED_ROLES:
            raise ValueError(f"{path.name}:{line_number} must contain system/user/assistant")
        if any(set(item) != {"role", "content"} or not str(item["content"]).strip() for item in messages):
            raise ValueError(f"{path.name}:{line_number} has an invalid message")
        rows.append(record)
    if len(rows) < minimum or (maximum is not None and len(rows) > maximum):
        raise ValueError(f"{path.name} row count {len(rows)} is outside [{minimum}, {maximum}]")
    return {"rows": len(rows), "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest()}


def main() -> int:
    data_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "data")
    report = {
        "train": verify_file(data_dir / "train.jsonl", 10, 100),
        "validation": verify_file(data_dir / "validation.jsonl", 5),
        "test": verify_file(data_dir / "test.jsonl", 5),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

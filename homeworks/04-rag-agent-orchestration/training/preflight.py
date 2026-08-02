from __future__ import annotations

import importlib.metadata
import json
import shutil
import subprocess
import sys
from pathlib import Path

import torch


def gib(value: int) -> float:
    return round(value / (1024**3), 2)


def driver_version() -> str:
    completed = subprocess.run(
        ["nvidia-smi", "--query-gpu=driver_version", "--format=csv,noheader"],
        check=True,
        capture_output=True,
        text=True,
    )
    return completed.stdout.strip().splitlines()[0]


def main() -> int:
    cuda_available = torch.cuda.is_available()
    free_vram, total_vram = torch.cuda.mem_get_info() if cuda_available else (0, 0)
    disk = shutil.disk_usage(Path.cwd())
    report = {
        "python": sys.version.split()[0],
        "torch": torch.__version__,
        "cudaRuntime": torch.version.cuda,
        "cudaAvailable": cuda_available,
        "gpu": torch.cuda.get_device_name(0) if cuda_available else None,
        "vramTotalGiB": gib(total_vram),
        "vramFreeGiB": gib(free_vram),
        "driver": driver_version() if cuda_available else None,
        "bf16Supported": torch.cuda.is_bf16_supported() if cuda_available else False,
        "diskFreeGiB": gib(disk.free),
        "llamafactory": importlib.metadata.version("llamafactory"),
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    failures = []
    if not cuda_available:
        failures.append("CUDA is unavailable")
    if total_vram < 11 * 1024**3:
        failures.append("GPU VRAM is below 11 GiB")
    if disk.free < 35 * 1024**3:
        failures.append("Free disk is below 35 GiB")
    if not report["bf16Supported"]:
        failures.append("BF16 is unsupported")
    if not str(torch.__version__).startswith("2.11.0+cu128"):
        failures.append("PyTorch must be 2.11.0+cu128")
    if failures:
        print(json.dumps({"failures": failures}, ensure_ascii=False), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

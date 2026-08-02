from __future__ import annotations

import argparse
import gc
import hashlib
import json
import time
from pathlib import Path
from typing import Any

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def structure_score(response: str) -> float:
    stripped = response.strip()
    if not stripped:
        return 0.0
    has_structure = any(marker in stripped for marker in ("1.", "- ", "：", ":"))
    return 1.0 if has_structure and len(stripped) >= 40 else 0.5


def refusal_score(response: str) -> float:
    markers = ("无法", "不能", "不应", "需要确认", "没有足够", "无法确定")
    return 1.0 if any(marker in response for marker in markers) else 0.0


def load_rows(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def load_model(model_name: str) -> tuple[Any, Any]:
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=False)
    quantization = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16,
    )
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        trust_remote_code=False,
        quantization_config=quantization,
        device_map="auto",
    )
    return tokenizer, model


def generate(tokenizer: Any, model: Any, messages: list[dict[str, str]]) -> tuple[str, float]:
    prompt = tokenizer.apply_chat_template(
        messages[:-1], tokenize=False, add_generation_prompt=True, enable_thinking=False
    )
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    started = time.perf_counter()
    with torch.inference_mode():
        output = model.generate(**inputs, do_sample=False, max_new_tokens=256)
    latency_ms = (time.perf_counter() - started) * 1000
    generated = output[0][inputs["input_ids"].shape[1] :]
    return tokenizer.decode(generated, skip_special_tokens=True), latency_ms


def evaluate_variant(
    model_name: str, rows: list[dict[str, Any]], adapter: Path | None = None
) -> list[dict[str, Any]]:
    tokenizer, model = load_model(model_name)
    if adapter is not None:
        model = PeftModel.from_pretrained(model, adapter)
    results = []
    for index, row in enumerate(rows, start=1):
        response, latency_ms = generate(tokenizer, model, row["messages"])
        results.append(
            {
                "id": f"test-{index:03d}",
                "prompt": row["messages"][:-1],
                "response": response,
                "latencyMs": round(latency_ms, 2),
                "structure": structure_score(response),
                "refusal": refusal_score(response),
            }
        )
    del model
    del tokenizer
    gc.collect()
    torch.cuda.empty_cache()
    return results


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--adapter", type=Path, required=True)
    parser.add_argument("--test", type=Path, required=True)
    parser.add_argument("--private-output", type=Path, required=True)
    parser.add_argument("--evidence-output", type=Path, required=True)
    parser.add_argument("--summary-output", type=Path, required=True)
    args = parser.parse_args()

    rows = load_rows(args.test)
    base = evaluate_variant(args.model, rows)
    adapted = evaluate_variant(args.model, rows, args.adapter)
    private_rows = []
    evidence_rows = []
    for base_row, adapter_row in zip(base, adapted, strict=True):
        private_rows.append({"base": base_row, "adapter": adapter_row})
        prompt_json = json.dumps(base_row["prompt"], ensure_ascii=False, sort_keys=True)
        evidence_rows.append(
            {
                "id": base_row["id"],
                "promptSha256": sha256_text(prompt_json),
                "base": {
                    "responseSha256": sha256_text(base_row["response"]),
                    "latencyMs": base_row["latencyMs"],
                },
                "adapter": {
                    "responseSha256": sha256_text(adapter_row["response"]),
                    "latencyMs": adapter_row["latencyMs"],
                },
                "scores": {
                    "baseStructure": base_row["structure"],
                    "adapterStructure": adapter_row["structure"],
                    "baseRefusal": base_row["refusal"],
                    "adapterRefusal": adapter_row["refusal"],
                },
            }
        )
    args.private_output.write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in private_rows) + "\n",
        encoding="utf-8",
    )
    args.evidence_output.write_text(
        "\n".join(json.dumps(row, ensure_ascii=False) for row in evidence_rows) + "\n",
        encoding="utf-8",
    )
    summary = {
        "rows": len(evidence_rows),
        "baseStructureAverage": sum(row["scores"]["baseStructure"] for row in evidence_rows) / len(evidence_rows),
        "adapterStructureAverage": sum(row["scores"]["adapterStructure"] for row in evidence_rows) / len(evidence_rows),
        "privateResponsesExcluded": True,
    }
    args.summary_output.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

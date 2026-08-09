import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

async function readConfig(name: string): Promise<Record<string, unknown>> {
	const raw = await readFile(
		new URL(`../training/configs/${name}`, import.meta.url),
		"utf8",
	);
	return parse(raw) as Record<string, unknown>;
}

describe("QLoRA training configs", () => {
	it("uses the approved Qwen3 low-memory smoke settings", async () => {
		expect(await readConfig("qwen3-8b-smoke.yaml")).toMatchObject({
			model_name_or_path: "Qwen/Qwen3-8B",
			stage: "sft",
			finetuning_type: "lora",
			quantization_bit: 4,
			quantization_method: "bitsandbytes",
			dataset_dir: "data",
			template: "qwen3",
			cutoff_len: 1024,
			per_device_train_batch_size: 1,
			num_train_epochs: 1,
			bf16: true,
		});
	});

	it("continues incremental training from an explicitly supplied parent adapter", async () => {
		expect(await readConfig("qwen3-8b-incremental.yaml")).toMatchObject({
			model_name_or_path: "Qwen/Qwen3-8B",
			adapter_name_or_path: "adapters/parent",
			finetuning_type: "lora",
			dataset: "yideng_train",
			output_dir: "outputs/qwen3-8b-yideng-incremental",
		});
	});
});

# Incremental QLoRA releases

增量训练不是把新 JSONL 直接覆盖旧数据，而是创建新的不可变 release。

每个 release 记录：

- `baseModel`: 始终锁定 `Qwen/Qwen3-8B`；
- `parent.datasetReleaseId`: 上一次数据版本；
- `parent.adapterSha256`: 上一次已验收 Adapter 的哈希；
- `newExampleIds`: 本次新增并审核通过的样本；
- `replayExampleIds`: 从旧训练集确定性抽取的回放样本；
- `splits`: train、validation、test 的行数和 SHA-256。

首次训练使用 `qwen3-8b-smoke.yaml`。后续续训把已验证的父 Adapter 放在远程 `adapters/parent`，使用 `qwen3-8b-incremental.yaml`。新数据不能进入旧的冻结测试集；评测必须同时包含旧能力回归集和本次新增能力集。

建议每次增量 release 使用 20%–30% 旧训练样本作为 replay。若旧能力回归下降，即使新能力提高，也不能把新 Adapter 标记为当前稳定版本。

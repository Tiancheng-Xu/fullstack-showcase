# RAG 与 Agent 编排：Qwen3 学习笔记实现设计

日期：2026-08-02

## 1. 作业身份

老师原始作业名称保持为 **RAG 与 Agent 编排**。

实际实现备注：使用 `Qwen/Qwen3-8B` 在 NVIDIA CUDA 远程机器上完成 QLoRA；使用“一灯学习笔记”代替家电维修 Markdown，构建可追溯的本地知识库；使用 Mastra、向量数据库、强制 Rerank、Mastra Client 和 LangGraph 完成两套 Agent 编排。

## 2. 目标

1. 产出可重新加载的 Qwen3-8B LoRA Adapter，并保留训练、显存和评测证据。
2. 将学习笔记构建为离线优先、支持增量更新和来源引用的 RAG 知识库。
3. 使用 Mastra 实现检索、Rerank、回答和质量检查流程。
4. 使用 Mastra Client 开发前端，展示回答、引用、检索片段和失败状态。
5. 使用 LangGraph 实现第二套编排器，并比较状态管理、失败恢复和可观测性。
6. 在 Mac 上通过 Ollama 或兼容本地服务完成推理验收，但不在 Mac 上训练。

## 3. 非目标

- 不在 Mac 安装 CUDA、bitsandbytes 或 LLaMA-Factory 训练环境。
- 不把整个学习笔记仓库上传到远程机器。
- 不用微调模型记忆全部课程事实；易变或需要引用的事实由 RAG 提供。
- 不公开课程原文、训练数据、个人记忆或可能复现受限课程内容的模型权重。
- 不在第一版接入真实生产业务、付费外部向量数据库或生产权限。

## 4. 作业节点

本作业只在 `course-homework` 总仓库中使用一个独立子节点：

```text
homeworks/04-rag-agent-orchestration/
├── README.md                 # 原始要求、实际实现、状态与证据入口
├── training/                 # 数据构造、QLoRA 配置、评测与导出脚本
├── knowledge/                # 文档解析、去重、切片、索引与来源协议
├── mastra/                   # Mastra RAG 与 Agent
├── langgraph/                # LangGraph 对照实现
├── web/                      # Mastra Client 前端
├── artifacts/                # 只保存小型清单、指标和哈希，不提交权重
└── docs/                     # 运行、验收、成本和安全记录
```

训练权重、模型缓存、向量数据库文件和原始课程资料均通过 `.gitignore` 排除。仓库只提交可复现代码、配置、数据清单、指标、哈希和脱敏证据。

## 5. 数据设计

### 5.1 原始知识

源目录是 `/Users/shier/Desktop/一灯学习笔记`。该目录是严格只读的数据源：本作业不得在其中创建、修改、移动、删除、格式化或缓存任何文件。所有清单、派生数据、索引、训练代码和证据只能写入 `course-homework/homeworks/04-rag-agent-orchestration` 或明确排除出 Git 的本地运行目录。

当前基线约有 949 个 Markdown 文件、6.54 MB 文本，其中约 321 个是完全重复副本。摄取前必须：

1. 排除 `.git`、`node_modules`、`.archive`、`tmp`、二进制文件和生成缓存。
2. 按内容 Hash 删除完全重复内容。
3. 使用标题、路径、课程章节、日期和来源类型标记元数据。
4. 对近似重复的课程总结、转写和课下资料保留来源关系，但降低重复召回权重。
5. 扫描凭据、个人信息和不允许外发的内容；命中项不进入远程训练数据。

### 5.2 QLoRA 数据

微调数据只学习稳定行为，不背完整知识库：

- 大白话解释与类比；
- 核心概念、关联知识网络和学习顺序；
- 面试可直接表达的答案及常见追问；
- 架构方案、取舍、风险和验证方法；
- 无依据时拒答并要求检索；
- 区分课程来源、官方事实和 Agent 推导。

先准备 50 至 100 条冒烟样本跑通训练闭环，再扩展到 300 至 1000 条高质量样本。数据按主题分组后划分 `train`、`validation` 和冻结 `test`，禁止同一来源的近似样本跨集合泄漏。

上传到 UU 云真机的内容仅包括脱敏后的 JSONL 样本、训练脚本、配置和冻结测试题，不包括完整学习笔记仓库。

## 6. 模型训练

- 基座：`Qwen/Qwen3-8B` 的原始 Transformers Safetensors。
- 环境：NVIDIA CUDA 远程机器、PyTorch CUDA、Transformers、PEFT、bitsandbytes 和 LLaMA-Factory。
- 方法：4-bit NF4 QLoRA，BF16 计算，gradient checkpointing。
- 第一轮起点：LoRA rank 16、alpha 32、dropout 0.05、单卡 micro-batch 1；序列长度和梯度累积按实际显存探测结果确定。
- 证据：GPU 型号和显存、软件版本、配置、随机种子、训练 loss、验证 loss、峰值显存、Adapter 文件清单和 SHA-256。

当前 UU 设备候选是 4070Ti/5070 云真机，费率为 450 U币/小时，账户余额为 900 U币。启动后最多约有 2 小时，因此必须在计费前完成数据、脚本、配置和验证命令准备。启动机器前再次确认实际 GPU、显存和预计消费。

训练完成后保留原始 Adapter，并在相同基座、Tokenizer 和 Chat Template 上重新加载。冻结测试集必须分别运行 base 和 base + adapter，记录格式遵循、拒答、解释结构和事实忠实度的差异。

## 7. Mac 推理迁移

训练完成后下载：

- Adapter；
- 训练配置和环境锁定信息；
- loss、显存和评测结果；
- 数据清单、来源 Hash 和冻结测试集；
- 合并或转换所需脚本。

Adapter 与完全一致的基座合并后转换为 GGUF，并进行适合 24 GB Apple Silicon 的量化。Mac 只负责 Ollama/Cherry Studio 推理与最终验收，不执行 QLoRA。

## 8. RAG 与 Rerank

知识索引采用分层结构：

```text
course              原始课程知识，只读来源
verified-external   官方资料提炼的版本化知识
generated           分块、主题地图和检索元数据
personal-memory     个人学习记忆，与事实知识隔离
```

第一阶段固定使用以下本地组件，避免运行时临时换型：

- 向量数据库：Qdrant，本地容器运行，数据目录不提交 Git；
- Embedding：通过本地 Ollama 运行 `bge-m3`，索引和查询使用同一模型版本；
- 关键词召回：本地 BM25 索引；
- 融合：使用 Reciprocal Rank Fusion 合并 BM25 与 Qdrant 候选；
- Rerank：使用 Mastra 官方 `rerankWithScorer` 和 `MastraAgentRelevanceScorer`，评分模型指向本地 Qwen3 服务；
- LangGraph 本地状态：使用 SQLite checkpointer，进程重启后仍可恢复测试线程。

检索流程固定为：

```text
查询改写
  → 关键词与向量混合召回
  → 元数据过滤
  → Rerank
  → 证据充分性检查
  → Qwen3 回答
  → 引用和失败状态
```

Rerank 是必经步骤，不能用“向量相似度排序”冒充。无充分证据时回答必须明确拒答或提示联网核验。

## 9. 两套 Agent 编排

### 9.1 Mastra

Mastra 负责文档摄取、混合检索、Rerank、回答、质量检查和人工升级状态。Mastra Client 前端显示：问题、回答、来源、检索片段、模型状态、耗时、失败原因和是否使用微调 Adapter。

### 9.2 LangGraph

LangGraph 实现相同的节点协议：检索、Rerank、回答、质量检查、重试和人工升级。两套实现共享数据契约和冻结测试集，不共享内部状态实现。

比较指标包括：正确路径率、失败恢复、状态持久化、调试可见性、端到端延迟和实现复杂度。

## 10. 失败与安全处理

- CUDA 显存不足：降低序列长度和 batch，保持训练目标不变；仍不足时停止并重新选机，不伪造训练完成。
- UU 额度不足：保存 checkpoint 和日志，停止机器，报告追加预算，不自动充值。
- 远程上传失败：不扩大上传范围，不上传完整笔记，先修复脱敏数据包。
- Adapter 无法重载：训练不算完成，保留环境和错误日志后修复。
- 检索无证据：拒答或标记需要官方核验，不让模型自由补造。
- 课程与官方事实冲突：保留课程历史语境，当前事实以官方来源和运行证据为准。

## 11. 验收标准

1. CUDA 训练真实完成，Adapter 可重新加载，训练证据完整。
2. 冻结测试集提供 base 与 adapter 的可解释对比，不只展示 loss。
3. 完整学习笔记没有上传到远程机器；远程数据包有文件清单和 Hash。
4. Mac 能运行迁移后的模型并通过固定推理测试。
5. 学习笔记知识库支持来源引用、增量索引、混合召回和强制 Rerank。
6. Mastra Agent 与 Mastra Client 完成端到端问答和失败展示。
7. LangGraph 完成同协议实现并提供对比报告。
8. 仓库不含模型权重、凭据、向量数据库文件、原始课程复制或个人隐私。
9. README 明确区分老师原始作业名称和实际实现。

## 12. 当前官方实现依据

- Mastra 官方 RAG 文档列出 Qdrant 支持，并提供元数据过滤、Vector Query Tool 与 `rerankWithScorer`：<https://mastra.ai/docs/rag/retrieval>
- Mastra 官方向量数据库文档列出 Qdrant 等本地或自管存储：<https://mastra.ai/docs/rag/vector-databases>
- Mastra Client 官方文档提供本地 Mastra Server 的类型安全客户端：<https://mastra.ai/en/docs/deployment/client>
- LangGraph.js 官方文档说明 `StateGraph`、checkpointer、SQLite 本地持久化和失败恢复：<https://langchain-ai.github.io/langgraphjs/how-tos/subgraph-persistence/>
- Qwen3 官方项目支持 Transformers 微调以及 llama.cpp/Ollama 本地推理：<https://github.com/QwenLM/Qwen3>

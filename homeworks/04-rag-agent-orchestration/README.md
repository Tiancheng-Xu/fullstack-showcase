# RAG 与 Agent 编排

实际实现：使用 `Qwen/Qwen3-8B` 在 NVIDIA CUDA 远程机器上完成 QLoRA 训练，并以一灯学习笔记作为后续 RAG 知识库来源。

## 边界

- 学习资料源路径：`/Users/shier/Desktop/一灯学习笔记`。
- 该目录严格只读；扫描器只能读取文件和元数据，不得在其中创建缓存、清单或训练文件。
- 所有代码、派生数据、训练配置和验收记录都放在本作业节点内。
- 私有数据集、模型权重、Adapter 和远程训练产物不进入 Git。
- Mac 只负责数据准备与产物验收；模型训练只在 NVIDIA CUDA 机器上运行。

## 当前阶段

当前交付先完成 Qwen3-8B QLoRA 训练基础。Qdrant、BGE-M3、BM25/RRF、Mastra Rerank、Mastra Client 和 LangGraph 在后续阶段接入。

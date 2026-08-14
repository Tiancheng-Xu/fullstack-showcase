# 性能观测控制实现计划

1. 先以测试定义双状态模型、快照校验、实时失败回退和幂等/CAS 行为。
2. 建立 Dashboard 与 Evidence 共享组件，先接可信空状态与静态注册表，不填假指标。
3. 扩展 Evidence 数据结构，完整收录运行架构、启停时序、Actions、预览/灰度、权限、成本、清理与不采用方案。
4. 新建最小 Cloudflare 控制 Worker：D1 为权威状态，R2 为不可变快照，Access 保护控制 API，公开状态只读 D1 投影。
5. 接入固定 GitHub App workflow dispatch、签名 webhook、Cron 对账、generation/CAS 与 TTL 清理。
6. 本地门禁通过后，运行 AWS Budget Guard；仅在既有授权范围内创建项目临时资源并完成真实启停闭环，最后回填 Evidence。

每一步都先产生失败测试或可验证检查，再实现，再记录真实结果。

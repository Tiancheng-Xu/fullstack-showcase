# 性能观测控制设计索引

完整设计见：

- [性能观测直接控制与历史快照兜底设计](../../superpowers/specs/2026-08-14-performance-observability-control-design.md)
- [实现计划](../../superpowers/plans/2026-08-14-performance-observability-control.md)
- [性能观测与成本控制 Evidence](../../delivery/performance-observability-control-evidence.md)

Evidence 是本功能的最终事实说明书。对话中已确认的架构、状态机、快照契约、成本边界和不采用方案，都必须整理进 Evidence，并由代码、测试、部署记录或脱敏云资源证据支撑。

Evidence 不能只展示截图；它必须让不了解 AWS 的读者看懂：目标、请求流、数据流、信任边界、启停顺序、失败回退、费用来源和清理责任。

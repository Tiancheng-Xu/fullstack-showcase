# Stitch 同步快照

## 来源

- 项目：萌宝成长足迹
- Project ID：`1860491822987812698`
- Stitch URL：<https://stitch.withgoogle.com/projects/1860491822987812698?pli=1>
- 项目更新时间：`2026-07-31T05:52:49.662094Z`
- 同步方式：Stitch MCP 屏幕清单 + 每屏 HTML/截图下载
- 设备类型：Mobile
- 设计系统：`assets/be9f241426a94331a3b42c4ec9505dea`

本目录保存不可编辑的设计输入。产品实现不直接复制整页 HTML，而是从 HTML 提取 Token、组件结构和尺寸，再映射到现有 React/Tailwind 组件。

## 快照内容

- 25 个 Stitch 条目。
- 23 个带原始 HTML 的产品屏。
- 2 个仅图片的设计资产。
- 28 个 HTML 引用的远程图片已下载到 `assets/`。
- `asset-map.json` 保存远程 URL 到本地文件的映射。
- 每个屏幕目录包含 `source.html`（如 Stitch 提供）和 `reference.png` 或 `reference.jpg`。

MCP 返回的参考图是最长边 512px 的预览图，适合快速比对；精确还原以 `source.html` 的布局、样式和尺寸为主。后续若从 Stitch UI 导出全尺寸 ZIP，可用全尺寸截图补充视觉回归基线，但不能覆盖原始 HTML。

## 当前实现基准

| PRD Screen | 用途 | Stitch Screen ID |
| --- | --- | --- |
| A-01 | 登录 | `857ce99404f747f5a7414512b142c6db` |
| A-02 | 注册 | `62c99f92271245a5a9dd5511ef24e83a` |
| A-03 | 注册校验错误 | `639c500d71184a99ae7043fd2f567ef4` |
| A-05 | 宝宝建档 | `443b99e7b66b40cc9aea7e0334b49ca7` |
| G-01 | 成长首页 | `4710e9e4a0f444d3bbc410a20ad10595` |
| G-02 | 加载状态 | `2923757fb47648d2bdab565c213e7a71` |
| G-04 | 选择记录类型 | `60bd7ed78f4b4e118f0357404fced79a` |
| G-08 | 成长记录列表 | `e314fd8328a445278c9bfe01784c7ee0` |
| G-11 | 删除记录确认 | `155127d171104700822eacad23c79e8e` |
| V-01 | 疫苗日程 | `8a2a8f5198e64590a96d2c4ed6db5e18` |
| M-01 | 时光相册 | `87ce13cb3737405cb7cfdc9837b2c4a4` |
| M-06 | 相册详情 | `6f82c6c5d425423dac0a13a98c15cbb8` |
| K-01 | 育儿百科 | `07b5aa11ee6c40248e708ac2cc209b4e` |
| K-04 | 文章详情 | `182be4d86f1043f4bd6ae3ef9b687fb0` |
| P-01 | 个人中心 | `845bfde9821c445192a25a9cf4aca74f` |
| P-02 | 编辑宝宝资料 | `239daf75eb2242a59aa17a70bd8e9e76` |
| P-06 | 退出确认 | `cd6a7ad7beb643e2b5e80c85bb8b78ca` |

未列入上表的 6 个 HTML 屏是同一主页面的早期版本或变体，保留作差异参考：

- `d9d5be4ff6e846229b985d8eb6510bd3`：成长首页
- `9f010241a4fd4b9abd1fad19cd244f69`：时光相册
- `b52144d42a3540a1a9de638a29f85b0c`：时光相册 - 金金专属
- `d8fd946547804e36b36c6fa0b8240aae`：育儿百科
- `34adccc0269d4ac994bf9adab05b9f48`：育儿百科 - 金金专属
- `f956e478ecb846978d2e297734b29cc4`：个人中心

仅图片的设计资产：

- `6bee828a3444445ea13299d3a42683e1`：母婴场景图
- `fa89d1a346434138a37f2cd3de2a7538`：Nurture & Bloom Logo

## 设计 Token 快照

| Token | 值 |
| --- | --- |
| 模式 | Light / Fidelity |
| 主色 | `#ffb347` |
| 背景 | `#fbf9f1` |
| 辅助蓝 | `#a7c7e7` |
| 辅助绿 | `#c1e1c1` |
| 字体 | Quicksand + 中文系统圆体回退 |
| 间距基线 | 8px |
| 容器内边距 | 24px |
| 组件间距 | 16px |
| Section 间距 | 40px |
| 圆角 | `ROUND_FULL`，组件按 16/24/32px 分级 |

## 使用规则

1. 先按 PRD Screen ID 选择当前实现基准，不从标题相似的旧变体猜测。
2. `source.html` 保持原样；实现调整写入产品代码，不回写本目录。
3. 先统一 App Shell、Token 和共享组件，再还原具体页面。
4. HTML 中的远程图片使用 `asset-map.json` 对应的本地文件，不让产品代码依赖 Stitch 临时 URL。
5. 390px 视觉回归以批准后的本地全尺寸截图为基线，MCP 预览图只作辅助。
6. Stitch 中缺失的状态以 PRD 第 7 节为准继续补齐，只生成家长端界面。

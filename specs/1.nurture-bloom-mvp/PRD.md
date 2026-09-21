# 育爱成长（Nurture & Bloom）V1 产品需求文档

## 0. 文档信息

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v2.0 |
| 文档状态 | 待产品审阅 |
| 更新日期 | 2026-07-31 |
| 产品形态 | H5 移动端优先 Web 应用 |
| 目标用户 | 宝宝的父母及主要照护者 |
| 设计工具 | Google Stitch |
| 设计基准 | 390px 宽移动画板，H5 自适应 |
| 开发流程 | TC Flow N1–N8 |
| 当前基线 | 直接升级现有 V1，不另建 V2 产品 |

### 0.1 决策优先级

发生冲突时按以下顺序处理：

1. 本 PRD 已纳入的课程前后端作业要求。
2. 本 PRD 已冻结的产品决策。
3. Stitch 设计系统与导出的 HTML/CSS。
4. 当前仓库实现。
5. 历史需求、演示数据和占位文案。

### 0.2 已冻结决策

- 只设计家长使用的产品界面。
- 产品与课程作业不拆成两条产品线，课程要求在同一项目内完成。
- GitHub 作业使用同一应用内的隐藏开发路由，不进入家长导航，也不生成 Stitch 产品屏。
- 加入最小注册、登录、退出和首次宝宝建档流程。
- MVP 使用单账号、单家庭、单宝宝模型。
- 演示宝宝统一为“金金，6个月15天”，基准生日为 2026-01-16。
- 直接修改现有 V1 页面和组件，不复制一套 V2 产品。
- 所有页面必须完成 H5 自适应。
- 图片必须通过后端服务处理，不允许前端直接依赖本机绝对路径。
- 本 PRD 范围内课程要求优先：先完成 Hono + Drizzle 隐藏实验闭环，再把该数据链迁移到 Go。
- 所有家长端业务 API 的最终实现统一使用 Go；Hono 只保留开发环境课程验收入口。
- 未来 AWS 接入使用稳定接口预留；本阶段使用 Mock 或本地适配器，不实施 AWS 基础设施。

## 1. 产品概述

“育爱成长”是一款帮助家长记录宝宝成长、整理家庭时光并获取可信育儿科普的 H5 应用。产品以温暖、低压力的视觉语言降低记录负担，让家长可以在一个入口内完成日常数据记录、照片回顾、里程碑管理、疫苗提醒和知识查询。

本项目同时承载课程规定的前后端实践，但课程能力必须服务于真实产品边界。Hono、Drizzle、Go 和 GitHub API 等技术不会作为家长可见的产品概念出现。

### 1.1 需求澄清结论

| 澄清问题 | 冻结答案 | 完成证据 |
| --- | --- | --- |
| 谁使用？ | 宝宝的父母和主要照护者；课程实验页只供开发者验收 | 家长端 Screen Manifest、隐藏路由测试 |
| 最关键的一个任务是什么？ | 在成长首页用不超过 1 分钟完成一次成长记录，并在刷新后仍可读取 | AC-004、AC-005、AC-023 |
| 哪些行为明确不做？ | 不做医疗诊断、复杂家庭权限、公开分享、收费云盘、AWS 实施、AI、游戏和 3D | 第 17 节非目标审查 |
| 数据从哪里来？ | 家长输入宝宝/记录/照片；产品维护科普内容；GitHub 实验只读取固定官方 API；Mock 与真实 API 共用 Contract | API 契约、来源字段、Mock Contract 测试 |
| 谁能修改？ | 当前登录用户只能修改自己 Baby 下的数据；科普正文只由受控种子/后台数据更新；课程实验只修改 GitHubProfile 白名单字段 | AC-011、数据库外键/唯一键、权限测试 |
| 失败时用户看见什么？ | 字段错误就地显示；可恢复系统错误提供重试；离线、无结果、会话过期和媒体失败使用专用状态；不展示内部堆栈 | Screen/State Manifest、错误映射测试 |
| 什么证据判定完成？ | Given/When/Then AC、自动化测试退出码、数据库效果、Backstop 差异、关键截图和脱敏 Review/RunResult | `docs/qa/<feature>/` 与 `.tc-flow/` 产物 |

### 1.2 数据来源与修改权

| 数据 | 来源 | 可修改者 | 失败时界面 |
| --- | --- | --- | --- |
| 账号与会话 | 用户注册、Go 身份服务 | 当前账号；会话仅服务端管理 | 通用凭证错误、限流、会话过期 |
| 宝宝档案 | 家长输入 | 资源所有者 | 字段错误、保存失败、重试 |
| 成长记录 | 家长输入 | 资源所有者 | 校验错误、保存失败、幂等重试 |
| 里程碑 | 产品模板 + 家长记录 | 资源所有者 | 空态、保存失败、重试 |
| 疫苗日程 | 有来源的种子数据 + 家长提醒状态 | 家长只修改完成/提醒状态 | 来源提示、加载失败、免责声明 |
| 家庭照片 | 家长选择，Go 媒体服务处理 | 资源所有者 | 取消、损坏、超限、处理失败、重试 |
| 百科正文 | 受控内容种子 | 家长只修改收藏 | 无结果、加载失败、来源/免责声明 |
| GitHubProfile | `https://api.github.com/user` | 课程实验服务写入白名单字段 | 400/401/403/404/429/502/504 |

## 2. 产品目标与成功标准

### 2.1 产品目标

- 家长能在 1 分钟内完成一次常用成长记录。
- 家长能按时间回顾宝宝的照片和成长事件。
- 家长能快速找到有来源、有更新时间和免责声明的育儿科普。
- 家长能维护宝宝档案、提醒和基本隐私设置。
- 数据、照片和健康相关内容具有清晰的隐私与安全边界。

### 2.2 课程目标

- 完成 React/Tailwind H5 页面与 Stitch HTML/CSS 的可验证还原。
- 使用 Hono 提供可调用 API、可访问页面、健康检查、输入校验和结构化错误。
- 使用 Drizzle 和 PostgreSQL 完成真实持久化及字段新增、删除和回滚。
- 使用 GitHub Fine-grained personal access token 完成课程规定的数据查询表单，且不持久化 Token。
- 使用 Go 迁移一条完整数据链，并证明迁移前后契约、约束、错误语义和测试一致。
- 所有 Feature 通过 TC Flow Contract、Task Review、QA 和 RunResult 门禁。

### 2.3 可验证成功标准

- 注册、登录、建档、成长记录、时光、百科和资料编辑的关键路径均可完成。
- 320px 及以上常见 H5/桌面视口内无主要内容横向溢出、导航遮挡或不可点击控件。
- 390px 视觉回归达到已批准基线；360px、430px、768px、1280px 冒烟检查通过。
- Hono 课程实验 API、Go 家长端 API、真实数据库集成、前后端契约、Migration 和 Go 等价性测试通过。
- 真实 Token、家庭照片、儿童 PII、定位信息和密钥不进入仓库、日志、Review Bundle 或 Stitch。

## 3. 用户与使用假设

### 3.1 主要用户

宝宝的父母或主要照护者。他们可能在碎片时间、单手持机、弱网或夜间环境中使用产品，需要大点击区域、低认知负担和明确反馈。

### 3.2 MVP 假设

- 一个账号只管理一个家庭和一个宝宝。
- 登录使用最小邮箱凭证流程；支持注册、登录和退出，不做第三方登录、找回密码和复杂账号安全中心。
- 家庭成员功能只提供列表和邀请占位，不发送真实邀请，不实现多角色权限。
- 产品不提供医疗诊断、健康评分或个性化治疗建议。
- 本地与测试环境可使用安全演示数据；不得使用真实儿童资料作为公共夹具。

## 4. 信息架构

### 4.1 家长端一级导航

| 顺序 | 导航 | 默认路由 | 目的 |
| --- | --- | --- | --- |
| 1 | 成长 | `/growth` | 查看概览并快速记录 |
| 2 | 时光 | `/moments` | 回顾和新增家庭照片记录 |
| 3 | 百科 | `/guide` | 搜索和阅读育儿科普 |
| 4 | 我的 | `/me` | 管理宝宝资料、提醒和隐私 |

首次访问根据会话状态进入：

```text
未登录 → 登录或注册
已登录但无宝宝档案 → 首次建档
已登录且档案完整 → 成长首页
```

### 4.2 非家长导航路由

`/labs/github-profile` 用于完成课程 GitHub 数据表单作业：

- 不出现在顶部栏、底部导航、设置菜单或 Stitch 产品屏中。
- 仅在开发/课程验收构建中启用。
- 生产构建默认关闭。
- 它属于同一代码项目，但不是家长端产品功能。

## 5. 全局应用壳

### 5.1 顶部栏

- 品牌 Logo 与“育爱成长”名称。
- 通知按钮保留视觉入口，本阶段点击显示“功能准备中”非阻塞提示。
- 头像进入“我的”；未登录页面不显示产品顶部栏。

### 5.2 底部导航

- 固定展示成长、时光、百科、我的。
- 当前项具有图标、文字和颜色三重选中信号。
- 页面内容必须为底部导航和设备安全区保留空间。
- 表单页、详情页可隐藏底部导航，使用明确返回按钮。

### 5.3 通用反馈

- 页面数据加载使用 Skeleton。
- 按钮提交使用局部 Spinner，并禁止重复提交。
- 字段错误显示在字段附近。
- 系统错误使用 Toast 或页面内错误块，不使用浏览器 `alert`。
- 表单有修改时返回，必须确认是否放弃未保存内容。

## 6. 核心用户流程

### 6.0 可测试功能需求

| ID | 功能需求 | 对应 Flow/Section | 验收 |
| --- | --- | --- | --- |
| FR-001 | 用户可以注册、登录、退出并恢复有效会话 | F-00 | AC-001、AC-010、AC-012 |
| FR-002 | 首次登录用户可以创建唯一宝宝档案 | F-00 | AC-002 |
| FR-003 | 家长可以查看当前宝宝的成长概览 | F-01 | AC-003 |
| FR-004 | 家长可以新增、读取、编辑和删除四类成长记录 | F-02 | AC-004、AC-005 |
| FR-005 | 家长可以记录里程碑并更新状态 | F-03 | AC-006 |
| FR-006 | 家长可以查看疫苗日程和修改提醒状态 | F-03 | AC-006 |
| FR-007 | 家长可以通过后端服务安全处理照片 | F-04、11.4 | AC-007、AC-008、AC-014 |
| FR-008 | 家长可以创建、查看、编辑和收藏家庭时光 | F-04 | AC-007、AC-008 |
| FR-009 | 家长可以搜索、筛选、阅读和收藏育儿文章 | F-05 | AC-009 |
| FR-010 | 家长可以编辑资料、提醒并查看隐私/关于信息 | F-06 | AC-010 |
| FR-011 | 所有资源操作必须校验当前账号的对象所有权 | 11.5 | AC-011、AC-014 |
| FR-012 | Hono + Drizzle 必须完成课程页面、API 和 Migration 闭环 | 11.2、12.7 | AC-015、AC-016、AC-018 |
| FR-013 | Hono 课程数据链必须迁移到 Go 且契约等价 | 11.3 | AC-017 |
| FR-014 | 所有家长端业务 API 最终统一由 Go 提供 | 11.3、12.1 | AC-001–AC-014 |
| FR-015 | 家长端必须在常见 H5 视口和辅助输入方式下可用 | 第 9 节 | AC-019–AC-023 |

### F-00 注册、登录与首次建档

**前置条件：** 用户未登录，或已登录但没有宝宝资料。

```text
登录页
→ 新用户切换到注册
→ 输入邮箱、密码和确认密码
→ 注册并建立会话
→ 已有用户输入邮箱和密码登录
→ 本地校验
→ 提交中
→ 登录或注册成功
→ 判断是否存在宝宝档案
→ 无档案：首次建档
→ 填写宝宝昵称、生日、性别
→ 保存
→ 成长首页
```

必须覆盖：

- 空字段、邮箱格式错误、密码强度、确认密码不一致和登录密码错误。
- 注册/登录中、邮箱已存在、登录失败和网络错误。
- 建档字段错误和未保存退出。
- 已登录用户访问登录页时重定向到成长首页。

### F-01 查看成长概览

```text
成长首页
→ 查看宝宝问候和年龄
→ 查看身高、体重及最近记录时间
→ 横向浏览里程碑
→ 查看下一次疫苗提醒
→ 查看今日记录
```

首页只展示可解释的事实，不输出“偏轻”“发育落后”等医疗判断。指标状态只允许使用“已记录”“待更新”等中性文案。

### F-02 新增成长记录

```text
成长首页
→ 点击添加记录
→ 选择喂奶、睡眠、身高或体重
→ 填写对应字段
→ 校验
→ 保存中
→ 保存成功
→ 新记录置顶
→ 可进入记录详情
```

记录详情支持编辑与删除：

```text
记录详情
→ 编辑
→ 修改并保存
→ 详情和列表同步更新

记录详情
→ 删除
→ 二次确认
→ 删除成功
→ 返回列表并移除该记录
```

取消时：

```text
未修改 → 直接关闭
已修改 → 确认放弃 → 关闭或继续编辑
```

### F-03 里程碑与疫苗

里程碑：

```text
成长首页
→ 查看全部里程碑
→ 按已完成/待记录浏览
→ 记录新技能
→ 保存
→ 列表状态更新
```

疫苗：

```text
成长首页
→ 点击下一次疫苗
→ 查看疫苗日程
→ 查看已完成/待提醒状态
→ 开关本地提醒
```

所有疫苗页面必须显示“仅作日程记录与科普参考，请以医生和当地免疫计划为准”。

### F-04 家庭时光

```text
时光列表或空状态
→ 点击添加时光
→ 选择照片
→ 后端校验与生成预览
→ 填写标题、日期、描述和标签
→ 保存中
→ 保存成功
→ 相册详情
```

详情支持：

- 查看封面和成员照片。
- 左右切换。
- 收藏或取消收藏。
- 编辑标题、日期、描述、标签和封面。

本阶段不做公开分享和永久删除。删除入口不展示，避免在缺少恢复机制时误导用户。

普通文件选择必须覆盖取消选择、文件损坏、格式不支持和文件过大。只有用户选择相机拍摄时才请求相机权限，并覆盖拒绝授权状态。

### F-05 育儿百科

```text
百科首页
→ 浏览精选文章或分类
→ 输入关键词或选择分类
→ 查看结果
→ 无结果时修改搜索
→ 进入文章详情
→ 查看正文、来源、更新时间、适龄阶段和免责声明
```

支持喂养、护理、疫苗、早教四类。文章收藏只保存状态，不单独设计收藏夹页面。

### F-06 我的与隐私

```text
我的
→ 查看家长和宝宝摘要
→ 编辑宝宝资料
→ 查看成长勋章
→ 设置消息提醒
→ 查看家庭成员占位
→ 查看数据与隐私
→ 查看关于
→ 退出登录
```

现有“家庭时光云盘”“升级容量”和会员相关模块从 V1 删除，避免承诺尚不存在的云存储和收费能力。

退出登录必须撤销当前会话并返回登录页；会话过期时保留当前只读页面提示，用户确认后进入登录页，不保留未提交的敏感表单数据。

### 6.7 关键失败合同

这些场景必须直接导出自动化测试，不允许实现阶段重新解释：

| ID | Given | When | Then |
| --- | --- | --- | --- |
| FC-001 | 用户已登录且成长表单合法 | 保存请求超时后客户端重试 | 使用同一幂等键；数据库只有一条记录；页面最终显示该记录 |
| FC-002 | 用户已登录且修改了表单 | 点击返回或关闭 | 显示放弃确认；选择继续编辑时字段不丢失 |
| FC-003 | 用户已选择合法照片 | 临时上传成功但 Moment 保存失败 | 文件保持临时状态且仅当前用户可见；允许重试；24 小时后可清理 |
| FC-004 | 用户 A 已登录 | 使用用户 B 的任意资源 ID 请求读写 | 返回 404；数据库和文件无变化；日志不泄露资源内容 |
| FC-005 | 用户会话已过期 | 提交资料或记录 | 返回 401；页面提示重新登录；不得把未提交敏感内容写入浏览器持久化 |
| FC-006 | 百科请求失败 | 用户点击重试 | 保留搜索条件并重新请求；不得把错误页当作零结果 |
| FC-007 | GitHub Token 无效或被限流 | 提交课程表单 | 显示映射后的安全错误；Token 不进入 URL、存储或日志 |
| FC-008 | Hono 与 Go 都可运行 | 对同一固定夹具执行契约测试 | 状态码、白名单字段、数据库效果和错误码一致 |

## 7. 页面与状态清单

### 7.1 Stitch 家长端屏幕

Stitch 项目 `1860491822987812698` 最新同步版本为 `2026-07-31T05:52:49.662094Z`。逻辑 Screen ID 用于 PRD 和自动化测试；Stitch Screen ID 用于下载原始 HTML、参考图和资产。`—` 表示该状态仍需在 Stitch 补齐。

| Screen ID | 页面/状态 | Stitch Screen ID |
| --- | --- | --- |
| A-01 | 登录 / 默认 | `857ce99404f747f5a7414512b142c6db` |
| A-02 | 注册 / 默认 | `62c99f92271245a5a9dd5511ef24e83a` |
| A-03 | 注册与登录 / 校验错误 | `639c500d71184a99ae7043fd2f567ef4` |
| A-04 | 注册与登录 / 提交中与失败 | — |
| A-05 | 首次宝宝建档 / 默认 | `443b99e7b66b40cc9aea7e0334b49ca7` |
| A-06 | 首次宝宝建档 / 错误与保存中 | — |
| G-01 | 成长首页 / 默认 | `4710e9e4a0f444d3bbc410a20ad10595` |
| G-02 | 成长首页 / Loading | `2923757fb47648d2bdab565c213e7a71` |
| G-03 | 成长首页 / Empty | — |
| G-04 | 添加记录 / 类型选择 | `60bd7ed78f4b4e118f0357404fced79a` |
| G-05 | 添加记录 / 表单 | — |
| G-06 | 添加记录 / 校验错误 | — |
| G-07 | 成长首页 / 保存成功 | — |
| G-08 | 成长记录列表 | `e314fd8328a445278c9bfe01784c7ee0` |
| G-09 | 记录详情 | — |
| G-10 | 编辑记录 / 默认、错误与保存中 | — |
| G-11 | 删除记录 / 二次确认与删除后列表 | `155127d171104700822eacad23c79e8e` |
| L-01 | 里程碑列表 | — |
| L-02 | 记录新技能 | — |
| V-01 | 疫苗日程 | `8a2a8f5198e64590a96d2c4ed6db5e18` |
| M-01 | 时光 / 默认 | `87ce13cb3737405cb7cfdc9837b2c4a4` |
| M-02 | 时光 / 空状态 | — |
| M-03 | 选择照片 / 取消、相机权限与文件错误 | — |
| M-04 | 照片预览与资料表单 | — |
| M-05 | 图片处理中 / 上传失败 | — |
| M-06 | 相册详情 | `6f82c6c5d425423dac0a13a98c15cbb8` |
| K-01 | 百科 / 默认 | `07b5aa11ee6c40248e708ac2cc209b4e` |
| K-02 | 百科 / 分类与搜索结果 | — |
| K-03 | 百科 / 无结果与错误 | — |
| K-04 | 文章详情 | `182be4d86f1043f4bd6ae3ef9b687fb0` |
| P-01 | 我的 / 默认 | `845bfde9821c445192a25a9cf4aca74f` |
| P-02 | 宝宝资料编辑 | `239daf75eb2242a59aa17a70bd8e9e76` |
| P-03 | 数据与隐私 | — |
| P-04 | 关于 | — |
| P-05 | 提醒与家庭成员占位 | — |
| P-06 | 退出确认与会话过期 | `cd6a7ad7beb643e2b5e80c85bb8b78ca` |

Stitch 不生成 `/labs/github-profile`。

### 7.2 页面/数据状态矩阵

每个包含远程或持久化数据的页面必须定义：

- `default`
- `loading`
- `empty`
- `error`
- `offline`
- `success`

列表搜索额外定义 `no-result`；照片额外定义 `camera-permission-denied`、`selection-cancelled`、`invalid-file`、`corrupt-file`、`too-large`、`processing` 和 `retryable-failure`。

### 7.3 组件与表单状态

- 所有交互控件：`default`、`hover`（支持鼠标时）、`focus-visible`、`pressed`、`disabled`。
- 表单：`pristine`、`dirty`、`validating`、`invalid`、`submitting`、`submit-success`、`submit-error`。
- Modal/Sheet：`closed`、`opening`、`open`、`closing`。
- 组件状态不要求复制成每个页面的独立 Stitch 屏，但必须进入组件清单和前端验收。

## 8. 字段与校验

### 8.1 登录

| 字段 | 规则 |
| --- | --- |
| 邮箱 | 必填，合法邮箱格式，最大 254 字符 |
| 密码 | 必填，8–72 字符；注册时必须同时包含字母和数字 |
| 确认密码 | 仅注册时必填，必须与密码一致 |

### 8.2 宝宝档案

| 字段 | 规则 |
| --- | --- |
| 昵称 | 必填，1–20 个可见字符 |
| 生日 | 必填，不得晚于当前日期 |
| 性别 | 必填：女、男、暂不填写 |
| 血型 | 可选：A、B、AB、O、未知 |
| 头像 | 可选；首次建档使用安全占位头像，资料页更换时必须通过后端文件服务校验并绑定 |

年龄由生日计算，不允许多个页面分别写死。

首次建档不因头像上传而阻塞；宝宝基础资料完成后，资料页通过 `PUT /api/baby/avatar` 提交临时 `uploadId`，由服务端原子完成 Media 正式化与头像绑定。

演示数据以 2026-07-31 为基准日期，`birthDate` 固定为 `2026-01-16`；页面不得保存“6个月15天”这类派生文本。

### 8.3 成长记录

通用字段：

- `recordedAt`：必填；按用户设备的 IANA 时区输入，提交为带偏移时间，服务端统一保存为 UTC，不得晚于当前时间。
- `note`：可选，最大 300 字符。
- 使用客户端生成的 `idempotencyKey` 防止重复提交；同一次逻辑操作的重试必须复用原 Key，新操作必须生成新 Key。

类型字段：

| 类型 | 字段与规则 |
| --- | --- |
| 喂奶 | 奶量 1–1000 ml；方式可选 |
| 睡眠 | 开始和结束时间必填；允许跨午夜，结束必须晚于开始，总时长不得超过 24 小时 |
| 身高 | 20–250 cm，允许 1 位小数 |
| 体重 | 0.5–300 kg，允许 2 位小数 |

上述范围用于防止明显输入错误，不构成健康判断。

### 8.4 时光

| 字段 | 规则 |
| --- | --- |
| 照片 | 至少 1 张，最多 20 张 |
| 格式 | JPEG、PNG、WebP |
| 单文件大小 | 最大 10 MB |
| 标题 | 必填，1–40 字符 |
| 日期 | 必填，不得晚于当前日期 |
| 描述 | 可选，最大 1000 字符 |
| 标签 | 可选，最多 5 个，每个最多 12 字符 |

时光日期是用户当地日历日期，使用 `YYYY-MM-DD` 保存，不做 UTC 换日。成长记录时间与时光日期不得使用同一种字段语义。

### 8.5 百科搜索

- 关键词去除首尾空格后最大 50 字符。
- 搜索标题、摘要和标签。
- 分类和关键词可以组合。
- 零结果必须提供清空搜索或切换分类操作。

## 9. H5 自适应与可访问性

### 9.1 响应式

| 宽度 | 布局 |
| --- | --- |
| 320–359px | 紧凑单列，缩减外边距，不缩小点击热区 |
| 360–430px | 标准移动单列，以 390px 为设计基准 |
| 431–767px | 流式单列，内容宽度随视口增长 |
| 768px 及以上 | 最大 768px 单列居中，不改为桌面多栏；超宽屏继续保持居中 |

必须验证：

- `env(safe-area-inset-top)` 和 `env(safe-area-inset-bottom)`。
- iOS/Android 软键盘弹起后的表单可见性。
- 竖屏为主，横屏仍可操作。
- 底部导航不遮挡最后一项内容和提交按钮。
- 图片保持比例，不导致布局抖动或横向溢出。

### 9.2 可访问性

- 主要点击区域至少 44×44px。
- 所有图标按钮具有可访问名称。
- 键盘焦点清晰可见。
- 文本和重要控件满足 WCAG AA 对比度。
- 表单错误通过文字和语义关联表达，不能只依赖颜色。
- Modal/Sheet 具有对话框语义、焦点管理和 Esc 关闭能力。
- 尊重 `prefers-reduced-motion`。

## 10. 视觉系统与 Stitch 交付

### 10.1 视觉规则

- 背景：暖奶油色 `#FBF9F1`。
- 卡片：白色 `#FFFFFF`。
- 主操作：珊瑚橙/暖棕色体系。
- 辅助色：婴儿蓝、薄荷绿、柔粉。
- 字体：Quicksand + 苹方/微软雅黑 UI/系统中文字体。
- 8px 间距基线。
- 16/24/32px 圆角层级。
- 低透明度暖色环境阴影。
- 半透明模糊顶部栏和底部导航。

### 10.2 Stitch 使用方式

采用 MCP 与原始下载结合：

- MCP 用于读取项目、设计系统、Screen ID、生成屏幕和获取下载地址。
- 每屏保存原始 HTML、参考 PNG、远程资产和 Screen ID。
- 浏览器只用于视觉检查和人工微调。
- 不以浏览器手工复制代码作为唯一来源。

### 10.3 设计资产安全

- Stitch 只使用安全占位宝宝和家庭照片。
- 不上传真实家庭照片、儿童 PII、EXIF 定位信息或本机绝对路径。
- 生成稿中的所有演示人物和数据必须明确为虚构内容。

## 11. 前后端架构

### 11.1 阶段 A：UI 与 Mock

- React/Tailwind 页面使用类型化 Mock Adapter。
- Mock 的字段、成功响应和错误响应必须与后续 API Contract 一致。
- 所有交互状态先在 H5 与 Stitch 中完成验证。

### 11.2 阶段 B：课程要求的 Hono + Drizzle 实验闭环

Hono 不承载家长端最终业务 API，只完成同一项目内、开发环境可见的课程纵向切片：

```text
GET  /labs/github-profile
POST /api/labs/github-profile/fetch
GET  /api/labs/github-profile/:login
GET  /api/labs/health
```

- `GET /labs/github-profile` 由 Hono 直接返回可访问的课程页面。
- 页面接受临时 Fine-grained Token，服务端只请求 `https://api.github.com/user`。
- Drizzle 连接 PostgreSQL，持久化白名单账户字段。
- 完成 `bio` 新增、`company` 删除、前进 Migration 和回滚演练。
- Repository/Service 隔离 GitHub 调用和数据库访问。
- Hono 实验入口只在开发/课程验收构建启用，最终生产构建关闭。

### 11.3 阶段 C：Go 数据链迁移与最终业务后端

先按课程要求，把 GitHub 个人资料纵向切片从 Hono 迁移到 Go：

```text
课程页面
→ 固定 API Contract
→ Go Handler
→ Go Service
→ GitHub Client / Go Repository
→ PostgreSQL
```

迁移验收必须证明：

- 请求与响应契约一致。
- 白名单持久化字段和数据库约束一致。
- GitHub 错误映射和超时语义一致。
- Token 安全边界一致。
- Hono 和 Go 使用同一组契约测试。
- 页面切换实现不需要重写。

完成课程迁移后，所有家长端业务 API 直接使用 Go 实现：

```text
React 家长端
→ 共享 API Contract
→ Go Handler
→ Go Service
→ Go Repository / Media Service
→ PostgreSQL / 本地私有文件存储
```

Hono 只保留为开发环境课程证据，不参与家长端生产请求。家长端路由最终所有者见 12.1 的所有权矩阵。

### 11.4 图片后端服务与生命周期

图片选择后必须发送到后端文件服务：

```text
前端选择文件
→ 后端校验类型、大小和数量
→ 清理不需要的元数据
→ 创建归属于当前用户的临时上传
→ 返回 uploadId 和受控预览
→ 保存相册时在同一业务操作中完成绑定
→ 转为正式 Media
```

规则：

- 临时上传默认 24 小时过期，未绑定文件由可重复执行的本地清理任务删除。
- `POST /api/moments` 成功时将上传与 Moment 绑定；失败时保持临时状态供同一表单重试。
- `uploadId`、Baby 头像绑定、Moment 创建和前端重试都必须使用幂等键。
- Media 永久绑定 `ownerUserId`，不得仅凭 Media ID 访问。
- `PUT /api/baby/avatar` 只接受当前用户拥有、尚未过期且未绑定的 `uploadId`；服务端在一个业务事务中正式化 Media 并更新 `Baby.avatarMediaId`。
- 更换头像成功后，旧头像解除引用并进入可重复执行的延迟清理队列；事务失败时继续保留旧头像和临时上传，不出现半绑定状态。
- 本地文件只能通过鉴权内容接口读取；未来 AWS 实现可在鉴权后签发最长 5 分钟的短期 URL。
- 本阶段使用本地私有存储适配器，预留未来 AWS 对象存储实现，但不创建、部署或配置 AWS 资源。

### 11.5 身份、会话与对象级授权

- 密码使用 Argon2id 哈希。
- 邮箱去除首尾空格并生成小写 `emailNormalized`，该字段全局唯一。
- 无论邮箱是否存在，登录失败都返回相同的凭证错误，避免账号枚举。
- 登录和注册按 IP 与规范化邮箱限流：15 分钟内最多 5 次失败尝试。
- 会话使用服务端状态与 `HttpOnly`、`Secure`、`SameSite=Lax` Cookie；空闲 7 天、最长 30 天。
- 登录成功、权限变化时轮换会话；退出时服务端撤销会话。
- 注册/登录前先调用 `GET /api/security/csrf`，服务端设置 10 分钟有效的 `__Host-csrf-bootstrap` Cookie，并在 JSON 中返回一次性 Token；页面只把 Token 保存在内存。
- 注册/登录必须同时提交 `X-CSRF-Token` 和严格匹配的同源 `Origin`。登录成功后立即撤销启动 Token并轮换为与 Session 绑定的 CSRF Token。
- 其他非 GET/HEAD 请求校验允许的 `Origin`，并使用与会话绑定的 `X-CSRF-Token`。
- 每个 Repository 查询必须同时包含当前 `userId`；资源 ID 不是授权凭据。
- 对不属于当前用户的 Baby、GrowthRecord、Moment、Media、Milestone 和 Vaccine 一律返回 404，避免确认资源是否存在。
- 未登录返回 401；已登录但缺少全局操作权限时返回 403；对象归属失败返回 404。
- 必须使用两个独立账号执行跨账号读取、修改、删除和媒体访问拒绝测试。

### 11.6 数据库与迁移所有权

- 使用同一个 PostgreSQL 实例，但划分两个 Schema。
- `course_lab` 只包含 GitHubProfile 课程表，由 Drizzle Migration 管理。
- `app` 包含家长端 User、Session、Preference、Baby、记录、媒体、百科等表，由 Go SQL Migration 管理。
- Go 产品服务使用 `pgx` + `sqlc` 访问 `app`；不得运行 Drizzle 修改 `app`。
- Hono 课程服务只读写 `course_lab`；不得访问 `app`。
- Go 的 GitHub 迁移实验可读写 `course_lab`，但与 Hono 不能同时作为写入所有者。
- 测试使用临时 PostgreSQL 同时创建两个 Schema，并验证各自 Migration 前进与回滚。

## 12. 最小 API 契约

### 12.1 路由所有权与切换

| 路由范围 | UI/Mock 阶段 | 课程 Hono 阶段 | 最终实现 |
| --- | --- | --- | --- |
| `/api/auth/*` | 类型化 Mock | 不实现 | Go |
| `/api/baby*`、`/api/growth-records*` | 类型化 Mock | 不实现 | Go |
| `/api/milestones*`、`/api/vaccines*` | 类型化 Mock | 不实现 | Go |
| `/api/moments*`、`/api/media*` | 类型化 Mock | 不实现 | Go |
| `/api/articles*` | 类型化 Mock | 不实现 | Go |
| `/labs/github-profile`、`/api/labs/github-profile*` | GitHub 响应 Mock | Hono + Drizzle | Go 等价实现；Hono 保留为 dev-only 证据 |

任何路由在同一运行环境中只能有一个所有者。切换通过配置选择实现，不允许 Hono 和 Go 同时写同一业务数据。

### 12.2 系统与会话

- `GET /api/health`
- `GET /api/security/csrf`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/session`

### 12.3 宝宝与成长

- `GET /api/baby`
- `POST /api/baby`
- `PATCH /api/baby`
- `PUT /api/baby/avatar`
- `GET /api/growth-records`
- `POST /api/growth-records`
- `GET /api/growth-records/:id`
- `PATCH /api/growth-records/:id`
- `DELETE /api/growth-records/:id`

### 12.4 里程碑、疫苗与百科

- `GET /api/milestones`
- `POST /api/milestones`
- `PATCH /api/milestones/:id`
- `GET /api/vaccines`
- `PATCH /api/vaccines/:id`
- `GET /api/articles`
- `GET /api/articles/:id`
- `PATCH /api/articles/:id/favorite`

### 12.5 时光

- `GET /api/moments`
- `POST /api/media/uploads`
- `GET /api/media/uploads/:uploadId/preview`
- `GET /api/media/:id/content`
- `POST /api/moments`
- `GET /api/moments/:id`
- `PATCH /api/moments/:id`
- `PATCH /api/moments/:id/favorite`

`POST /api/moments` 只接受属于当前用户、尚未过期且未绑定的 `uploadId[]`。

### 12.6 偏好设置

- `GET /api/preferences`
- `PATCH /api/preferences`

### 12.7 GitHub 课程实验

#### 页面与请求

- `GET /labs/github-profile`：Hono 直接返回课程页面。
- `POST /api/labs/github-profile/fetch`
  - 请求头：`Cache-Control: no-store`
  - 请求体：`{ "token": "临时 Fine-grained Token" }`
  - 服务端只允许请求固定上游 `https://api.github.com/user`，不得接受任意 URL。
- `GET /api/labs/github-profile/:login`：读取已持久化的白名单账户资料，不返回 Token。

#### 白名单响应

```json
{
  "login": "octocat",
  "displayName": "The Octocat",
  "avatarUrl": "https://avatars.githubusercontent.com/...",
  "profileUrl": "https://github.com/octocat",
  "bio": "A short public bio",
  "fetchedAt": "2026-07-31T12:00:00Z",
  "introduction": "The Octocat（@octocat）— A short public bio"
}
```

`introduction` 使用固定模板从白名单字段生成，不调用模型，不推断私人身份。Token 只存在于当前请求内存；响应后清空输入，页面不保存到 Local Storage、Session Storage、Cookie 或 URL。

#### GitHub 错误映射

| 场景 | 应用状态 |
| --- | --- |
| Token 缺失或格式无效 | 400 `VALIDATION_ERROR` |
| GitHub 拒绝 Token | 401 `GITHUB_AUTH_FAILED` |
| Token 权限不足 | 403 `GITHUB_SCOPE_INSUFFICIENT` |
| 资源不存在 | 404 `GITHUB_PROFILE_NOT_FOUND` |
| GitHub 限流 | 429 `GITHUB_RATE_LIMITED`，返回安全的 `retryAfter` |
| 上游错误 | 502 `GITHUB_UPSTREAM_ERROR` |
| 10 秒内未响应 | 504 `GITHUB_TIMEOUT` |

日志、Trace、错误文本和 Review Bundle 必须统一把 Token 替换为 `[REDACTED]`。

### 12.8 统一错误结构

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "面向用户的安全提示",
    "fieldErrors": {
      "title": "请输入标题"
    },
    "requestId": "req_xxx"
  }
}
```

禁止向前端返回堆栈、数据库连接、绝对路径、Token 或内部服务地址。

### 12.9 家长端 Contract 约定

OpenAPI 3.1 是 Mock、React 客户端和 Go 服务的唯一接口事实源。以下约定必须写入 OpenAPI 并由契约测试验证。

#### 通用规则

- JSON 使用 UTF-8；时间戳使用 RFC 3339 UTC；日历日期使用 `YYYY-MM-DD`。
- 列表响应统一为 `{ "items": [], "nextCursor": "..." }`。
- `limit` 默认 20、最小 1、最大 50；`cursor` 为服务端生成的不透明字符串。
- 创建 GrowthRecord、Milestone、MediaUpload、Moment 和更换 Baby 头像时必须提交 `Idempotency-Key` 请求头。
- 同一所有者和同一操作范围内重复 Key 返回原资源与 200；首次创建返回 201；Key 相同但请求体不同返回 409 `IDEMPOTENCY_CONFLICT`。
- `PATCH` 使用 `application/merge-patch+json`：缺失字段保持不变，只有 Schema 明确可空的字段才允许 `null`。
- 成功读取/修改返回 200；成功删除或退出返回 204。
- 资源不存在或不属于当前用户统一返回 404。
- 语法错误返回 400，语义校验错误返回 422，不支持的媒体类型返回 415，过大返回 413，限流返回 429。

#### 会话

| 接口 | 请求 | 成功响应 |
| --- | --- | --- |
| `GET /api/security/csrf` | 无 | 200 `{ csrfToken, expiresAt }` + 启动 Cookie |
| `POST /api/auth/register` | `{ email, password, confirmPassword }` + `X-CSRF-Token` | 201 `{ user: { id, email }, csrfToken }` + Session Cookie |
| `POST /api/auth/login` | `{ email, password }` + `X-CSRF-Token` | 200 `{ user: { id, email }, csrfToken }` + Session Cookie |
| `GET /api/session` | Session Cookie | 200 `{ user, babyProfileComplete, csrfToken }` |
| `POST /api/auth/logout` | Session Cookie + `X-CSRF-Token` | 204，并撤销服务端 Session |

#### Baby

- `GET /api/baby`：返回当前用户唯一 Baby；不存在时返回 404 `BABY_NOT_FOUND`。
- `POST /api/baby`：请求 `{ nickname, birthDate, gender, bloodType? }`；已有 Baby 时返回 409 `BABY_ALREADY_EXISTS`。
- `PATCH /api/baby`：只允许修改 `nickname`、`birthDate`、`gender` 和 `bloodType`。
- `PUT /api/baby/avatar`：请求 `{ uploadId }` + `Idempotency-Key`；原子完成临时上传正式化和头像替换，返回更新后的 Baby；不得直接接受 `mediaId` 或文件路径。
- 响应统一包含 `{ id, nickname, birthDate, gender, bloodType, avatarMediaId, ageDisplay, updatedAt }`；未设置头像时 `avatarMediaId` 为 `null`，`ageDisplay` 由服务端基于日期计算，不持久化。

#### GrowthRecord

- `GET /api/growth-records?type=&from=&to=&cursor=&limit=`：按 `recordedAt DESC, id DESC` 排序。
- `POST /api/growth-records`：请求 `{ recordedAt, note?, payload: GrowthPayload }`。
- `GET /api/growth-records/:id`：返回单条完整记录。
- `PATCH /api/growth-records/:id`：允许修改 `recordedAt`、`note` 和完整 `payload`；`payload.type` 不允许改变，变更类型必须删除后新建。
- `DELETE /api/growth-records/:id`：成功返回 204。

#### Milestone、Vaccine 与 Article

- `GET /api/milestones?status=&cursor=&limit=`：`achieved` 按 `achievedAt DESC, id DESC`，`planned` 按 `createdAt DESC, id DESC`。
- `POST /api/milestones`：请求 `{ title, achievedAt?, status, note? }`。
- `PATCH /api/milestones/:id`：允许修改标题、达成日期、状态和备注。
- `GET /api/vaccines?status=&cursor=&limit=`：按 `scheduledDate ASC, id ASC`；`status` 为 `upcoming | completed`。
- `PATCH /api/vaccines/:id`：请求 `{ completedAt?, reminderEnabled? }`；`completedAt: null` 表示撤销完成。
- `GET /api/articles?keyword=&category=&favorite=&cursor=&limit=`：关键词与分类同时生效，按 `reviewedAt DESC, id DESC`。
- `GET /api/articles/:id`：返回正文、来源、更新时间、适龄阶段和免责声明。
- `PATCH /api/articles/:id/favorite`：请求 `{ favorite: boolean }`，返回 `{ articleId, favorite }`。

#### Moment 与 Preference

- `GET /api/moments?favorite=&cursor=&limit=`：按 `capturedDate DESC, createdAt DESC, id DESC`。
- `POST /api/moments`：请求 `{ title, capturedDate, description?, tags?, uploadIds, coverUploadId }`；封面必须属于 `uploadIds`。
- `PATCH /api/moments/:id`：允许修改标题、日期、描述、标签和封面，不允许跨 Moment 复用 Media。
- `PATCH /api/moments/:id/favorite`：请求 `{ favorite: boolean }`。
- `GET /api/preferences`：返回 `{ messageReminderEnabled }`。
- `PATCH /api/preferences`：请求 `{ messageReminderEnabled: boolean }`，刷新后必须保持。

### 12.10 媒体上传与预览 Contract

`POST /api/media/uploads`：

- Content-Type 为 `multipart/form-data`，文件字段名为 `file`。
- 必须包含 `Idempotency-Key`、Session Cookie 和 `X-CSRF-Token`。
- 服务端先验证文件签名字节，再完整解码；扩展名和浏览器 MIME 只作提示。
- 只接受静态 JPEG、PNG、WebP；拒绝动画、多帧、无法完整解码或带异常尾部数据的文件。
- 最大边长 12,000px，最大总像素 40MP，单文件最大 10MB。
- 解码后重新编码为安全的 JPEG/PNG/WebP 工作副本，清除 GPS 和非必要 EXIF；原始上传不作为可公开访问文件。
- 成功返回 201：

```json
{
  "uploadId": "upl_xxx",
  "previewUrl": "/api/media/uploads/upl_xxx/preview",
  "expiresAt": "2026-08-01T12:00:00Z",
  "width": 1600,
  "height": 1200,
  "mimeType": "image/jpeg",
  "size": 245000
}
```

`GET /api/media/uploads/:uploadId/preview`：

- 只允许上传所有者访问，过期返回 410 `UPLOAD_EXPIRED`，非所有者返回 404。
- 返回 `Cache-Control: private, no-store`、`X-Content-Type-Options: nosniff` 和受控 `Content-Type`。
- 只读取重新编码的工作副本，不读取原文件路径。

`GET /api/media/:id/content`：

- 只允许 Media 所有者访问；响应头不得包含 `storageKey` 或服务器路径。
- 本地实现返回鉴权后的图片内容；未来 AWS Adapter 可改为最长 5 分钟短期 URL，但响应 Schema 保持兼容。

## 13. 核心数据模型

### User

- `id`
- `email`
- `emailNormalized`（唯一）
- `passwordHash`
- `createdAt`
- `updatedAt`

### Session

- `id`
- `userId`
- `csrfSecret`
- `expiresAt`
- `lastSeenAt`
- `revokedAt`

### IdempotencyRecord

- `id`
- `ownerUserId`
- `operationScope`：例如 `growth-record:create`、`milestone:create`、`media-upload:create`、`baby-avatar:replace`、`moment:create`
- `key`
- `requestHash`
- `status`：`pending | completed`
- `resourceType`
- `resourceId`
- `responseStatus`
- `responseBody`（JSONB，仅保存可安全重放的响应）
- `expiresAt`
- `createdAt`
- `updatedAt`

`(ownerUserId, operationScope, key)` 必须唯一。服务端对规范化 JSON 计算 SHA-256；Multipart 请求使用规范化字段加文件内容 SHA-256。相同 Key 和相同 Hash 在 `completed` 状态返回已保存的状态码与响应；相同 Key 但 Hash 不同返回 409 `IDEMPOTENCY_CONFLICT`；相同请求仍为 `pending` 时返回 409 `IDEMPOTENCY_IN_PROGRESS` 和 `Retry-After: 1`。

处理分为两个受控阶段：预留事务先插入并提交 `pending` 记录，随后执行业务处理；业务资源写入与记录更新为 `completed` 必须位于同一数据库事务。文件先写入不可访问的暂存位置，业务事务成功后才可被受控预览或正式 Media 引用。已完成记录至少保留 24 小时；超时的 `pending` 记录由恢复任务确认没有已提交资源后回滚暂存文件和预留记录，不得直接当作新请求执行。

### UserPreference

- `userId`（唯一）
- `messageReminderEnabled`
- `updatedAt`

### Baby

- `id`
- `userId`（唯一，冻结单宝宝约束）
- `nickname`
- `birthDate`
- `gender`
- `bloodType`
- `avatarMediaId`
- `createdAt`
- `updatedAt`

### GrowthRecord

- `id`
- `babyId`
- `type`：`feeding | sleep | height | weight`
- `recordedAt`
- `payload`：按 `type` 校验的 JSONB 判别联合
- `note`
- `createdAt`
- `updatedAt`

创建幂等性由 `IdempotencyRecord` 统一管理。`payload` 只允许以下结构：

```ts
type GrowthPayload =
  | { type: "feeding"; amountMl: number; method?: "bottle" | "breast" | "mixed" }
  | { type: "sleep"; startedAt: string; endedAt: string }
  | { type: "height"; heightCm: number }
  | { type: "weight"; weightKg: number };
```

API、Mock、Hono/Go 契约测试和数据库写入前校验必须使用相同的判别规则。

### Milestone

- `id`
- `babyId`
- `title`
- `achievedAt`
- `status`：`planned | achieved`
- `note`
- `createdAt`
- `updatedAt`

### VaccineSchedule

- `id`
- `babyId`
- `vaccineName`
- `doseLabel`
- `scheduledDate`
- `completedAt`
- `reminderEnabled`
- `sourceName`
- `sourceUrl`
- `updatedAt`

### Moment / Media

- `Moment`：`id`、`babyId`、`title`、`capturedDate`、`description`、`tags`、`coverMediaId`、`favorite`、`createdAt`、`updatedAt`
- `MediaUpload`：`id`、`ownerUserId`、`storageKey`、`status`（`temporary | finalized | expired`）、`expiresAt`、`createdAt`
- `Media`：`id`、`ownerUserId`、`storageKey`、`mimeType`、`size`、`width`、`height`、`createdAt`
- `MomentMedia`：`momentId`、`mediaId`、`sortOrder`，联合唯一键为 `(momentId, mediaId)`

`Media.storageKey` 和本机路径只允许出现在服务端，API 永远返回受控 Media ID 或鉴权内容 URL。

### KnowledgeArticle

- `id`
- `category`
- `title`
- `summary`
- `body`
- `sourceName`
- `sourceUrl`
- `reviewedAt`
- `ageRange`
- `disclaimer`

### ArticleFavorite

- `userId`
- `articleId`
- `createdAt`

`(userId, articleId)` 必须唯一。

### GitHubProfile（课程验收数据）

该表只保存 GitHub 公共白名单字段，不保存 Token。

| 阶段 | 字段 |
| --- | --- |
| 初始 | `id`、`githubLogin`（唯一）、`displayName`、`avatarUrl`、`profileUrl`、`company`、`fetchedAt` |
| 新增字段后 | 初始字段 + `bio` |
| 最终 | `id`、`githubLogin`（唯一）、`displayName`、`avatarUrl`、`profileUrl`、`bio`、`fetchedAt` |

Migration 演练使用本地/测试数据库完成：

1. 创建不含 `bio` 的初始表。
2. 新增可空 `bio` 字段并验证旧数据兼容。
3. 删除可空 `company` 字段并验证读取契约同步更新。
4. 分别验证前进、回滚和重新应用；不得在未备份的生产数据上演练删列。

## 14. 课程作业映射

| 课程要求 | 本项目落点 | 是否生成 Stitch |
| --- | --- | --- |
| Hono API + 页面 | Hono 直接提供 `/labs/github-profile` 及对应 API/健康检查 | 否 |
| 输入校验、结构化错误、测试 | Hono 课程实验与全部 Go 家长端 API | 只生成家长端错误状态 |
| GitHub Token 查询表单 | Hono→Go 迁移的 `/labs/github-profile` | 否 |
| Drizzle 字段新增与删除 | `GitHubProfile.bio` 新增、`GitHubProfile.company` 删除及 Migration/rollback | 否 |
| Go 数据链迁移 | GitHubProfile 页面→API→Service→Repository→PostgreSQL 完整链 | 否 |
| GitHub 用户名个人介绍前端 | 隐藏课程路由复用查询结果 | 否 |
| 最终业务后端使用 Go | 所有家长端 API、媒体服务和数据访问 | 产品页面复用现有设计 |

GitHub 实验要求：

- Token 只存在于当前请求生命周期。
- Token 不进入数据库、Local Storage、日志、错误文本或 Review Bundle。
- 服务端只持久化课程要求的白名单账户字段。
- 当前 UI 开发阶段可使用 Mock；课程最终验收必须使用用户主动提供的 Fine-grained Token 完成真实请求。
- 预留未来 AWS 运行环境接口，但本阶段不实现 AWS。

## 15. TC Flow Feature 切分

现有 `nurture-bloom-ui-foundation` 视为已完成基线，不重复开发。以下切分是 PRD 级蓝图；生成 `tasks.md` 时如果任何 Task 无法在 30 分钟内独立完成，必须继续拆分 Feature。

| ID | Feature | 目标 | 依赖 | 预估 Task |
| --- | --- | --- | --- | ---: |
| FT-01 | `stitch-v1-screen-ingestion` | 下载屏幕、HTML、PNG、资产、ID 与 Token | - | 6 |
| FT-02 | `h5-shell-and-shared-states` | App Shell、H5 断点、安全区、表单和状态组件 | FT-01 | 7 |
| FT-03 | `hono-github-profile-lab` | Hono 页面、GitHub 请求、错误映射和测试 | - | 7 |
| FT-04 | `drizzle-profile-migrations` | PostgreSQL、初始表、加列、删列和回滚 | FT-03 | 6 |
| FT-05 | `go-github-chain-migration` | Go 等价链、共享契约和切换验证 | FT-04 | 8 |
| FT-06 | `go-api-contract-foundation` | Go Router、OpenAPI、错误、数据库连接和健康检查 | FT-05 | 6 |
| FT-07 | `go-session-persistence` | User/Session Schema、密码哈希、注册登录和撤销 | FT-06 | 8 |
| FT-08 | `go-idempotency-persistence` | IdempotencyRecord Schema、预留、哈希、重放、冲突和恢复 | FT-07 | 6 |
| FT-09 | `go-csrf-abuse-protection` | CSRF 启动/轮换、Origin、限流和安全测试 | FT-07 | 7 |
| FT-10 | `family-auth-h5-integration` | 注册、登录、退出和会话过期 H5 联调 | FT-02、FT-09 | 7 |
| FT-11 | `baby-onboarding-profile` | 无头像阻塞的首次建档、基础资料读取/编辑和对象授权 | FT-10 | 7 |
| FT-12 | `growth-record-api-core` | 判别 Payload、CRUD、列表、幂等和跨账号测试 | FT-08、FT-11 | 8 |
| FT-13 | `feeding-sleep-record-flows` | 喂奶/睡眠表单、详情、编辑和失败恢复 | FT-02、FT-12 | 7 |
| FT-14 | `milestones` | 列表、新技能、状态切换和对象授权 | FT-02、FT-08、FT-11 | 6 |
| FT-15 | `vaccines` | 日程、完成/提醒、来源和免责声明 | FT-02、FT-06、FT-11 | 6 |
| FT-16 | `body-metrics-overview-flows` | 身高/体重表单、汇总成长/里程碑/疫苗的首页和快速记录计时 | FT-02、FT-12、FT-14、FT-15 | 8 |
| FT-17 | `private-media-validation-preview` | 上传、签名/解码校验、重编码和临时预览 | FT-02、FT-08、FT-09 | 8 |
| FT-18 | `private-media-finalize-delivery` | 宝宝头像/Moment 绑定、鉴权读取、幂等接入、过期和清理 | FT-11、FT-17 | 8 |
| FT-19 | `moments-gallery` | 相册元数据、列表、详情、编辑和收藏 | FT-11、FT-18 | 8 |
| FT-20 | `parenting-guide` | 搜索、分页、文章详情、收藏和错误状态 | FT-02、FT-09 | 7 |
| FT-21 | `profile-settings-privacy` | 摘要、头像更换、提醒持久化、家庭占位、退出和隐私 | FT-02、FT-09、FT-11、FT-18 | 8 |

依赖图定义为有向无环图 \(G=(V,E)\)：

- \(V=\{\text{FT-01},\ldots,\text{FT-21}\}\)。
- 若 Feature B 的“依赖”列包含 Feature A，则 \((A,B)\in E\)。
- 只有所有前置节点完成的 Feature 才进入 Ready 队列。
- Ready 不代表必须并行；写入同一文件、共享未冻结 Contract 或需要同一测试环境的 Feature 必须串行。
- 同一仓库默认最多 2 个写入型 Worker 并行；只有 Contract、文件白名单和合并边界均不重叠时才可提高并行度。

每个 Feature 必须：

- 包含 4–8 个 Task。
- 每个 Task 是“功能 × 层”的最小可验证切片，预估不超过 30 分钟。
- 冻结 Goal、Context、Allowed Tools、Acceptance Criteria 和 Contract Hash。
- 通过 Worker 自检、独立 Review、Feature QA 和 RunResult。
- 自带测试与验收，不另建无法独立交付的“统一 QA Feature”。

### 15.1 Task 合同模板

每个可交给 Worker 的 Task 必须在 `tasks.md` 中完整声明：

```markdown
### T-XXX：单一、可验证的目标

- 目标：本 Task 只完成什么
- 输入与上下文：相关 FR/AC、接口、数据模型和已有实现
- 允许修改：精确文件或模块白名单
- 禁止触碰：明确排除的目录、接口、行为和生产资源
- 前置依赖：已完成的 Task/Feature ID
- 完成条件：可观察的代码、界面、数据库或契约结果
- 验证命令：必须实际执行的最小测试/检查命令
- 证据：退出码、测试结果、截图、数据库效果或脱敏 Diff
- 风险：low / medium / high / extreme 及原因
- 预计时间：5min / 15min / 30min
```

Task 约束：

- 一个 Task 只允许一个主要目标。
- 修改超出文件白名单、扩大权限或引入新外部服务时立即停止，返回 Contract 重新确认。
- 测试、截图或日志不是附加项，而是完成条件的一部分。
- Worker 自检发现 P0 时立即阻断，不进入外部 Review。
- 外部 Review 只接收脱敏的 Contract、Diff、测试和风险证据。
- 只有独立 Review 为 `allow` 的 Task 才能标记完成并解锁后继节点。

## 16. 验收标准

### 16.1 流程追踪

| Flow | 主要 Screen | 最终 API 所有者 | 验收 |
| --- | --- | --- | --- |
| F-00 注册/登录/建档 | A-01–A-06 | Go | AC-001、AC-002 |
| F-01 成长概览 | G-01–G-03 | Go | AC-003 |
| F-02 成长记录 CRUD | G-04–G-11 | Go | AC-004、AC-005 |
| F-03 里程碑/疫苗 | L-01–L-02、V-01 | Go | AC-006 |
| F-04 家庭时光 | M-01–M-06 | Go | AC-007、AC-008 |
| F-05 育儿百科 | K-01–K-04 | Go | AC-009 |
| F-06 我的/退出 | P-01–P-06 | Go | AC-010 |
| GitHub 课程实验 | 不生成 Stitch | Hono 后迁移到 Go | AC-015–AC-017 |

### 16.2 家长端 Given/When/Then

- [ ] **AC-001 注册与会话**：给定未注册邮箱，当用户提交合法邮箱和密码时，服务端创建唯一用户和会话 Cookie，响应不含凭据；刷新页面后仍处于登录状态。
- [ ] **AC-002 首次建档**：给定已登录但没有 Baby 的用户，当提交合法宝宝资料时，数据库只创建一条归属于该用户的 Baby，随后访问 `/growth` 显示由生日计算的年龄。
- [ ] **AC-003 成长概览**：给定已有记录，当打开 `/growth` 时，页面显示当前 Baby 的最新身高、体重、里程碑、疫苗和今日记录；加载失败显示可重试错误，不显示其他账号数据。
- [ ] **AC-004 记录 CRUD**：给定已登录用户，当新增、刷新、编辑和删除四类记录时，每一步均反映到列表、详情和 PostgreSQL；取消删除时数据不变。
- [ ] **AC-005 幂等重试**：给定同一 `idempotencyKey`，当客户端因超时重复提交时，数据库只存在一条记录，响应返回同一资源 ID。
- [ ] **AC-006 里程碑与疫苗**：给定当前 Baby，当记录里程碑或切换提醒时，刷新后状态保持；疫苗页面始终显示来源和固定免责声明。
- [ ] **AC-007 媒体闭环**：给定合法照片，当创建临时上传并保存 Moment 或更换宝宝头像时，上传原子转为正式 Media、相册或头像刷新后可见，文件只能由所有者读取；替换头像失败时旧头像保持不变。
- [ ] **AC-008 媒体失败恢复**：给定损坏、超限或处理中断文件，系统返回对应错误；Moment 保存失败时临时上传可用原幂等键重试，过期后清理任务可删除孤儿文件。
- [ ] **AC-009 百科闭环**：给定关键词和分类，当搜索时结果匹配二者；零结果可清空条件；文章详情显示来源、更新时间、适龄阶段和免责声明，收藏刷新后保持。
- [ ] **AC-010 资料与退出**：给定已登录用户，当编辑宝宝资料、更换头像、切换提醒或退出时，刷新后资料、头像和提醒保持，退出后的旧 Cookie 无法继续访问受保护 API。

### 16.3 安全与跨账号

- [ ] **AC-011 对象授权**：给定账号 A 和 B 及各自数据，当 A 使用 B 的 Baby、Record、Moment、Media、Milestone 或 Vaccine ID 读取、修改或删除时，服务端返回 404，数据库和文件均不改变。
- [ ] **AC-012 认证防护**：连续错误登录触发限流；账号不存在和密码错误返回相同错误；缺失/错误 CSRF Token 的写请求被拒绝；退出后 Session 标记撤销。
- [ ] **AC-013 敏感数据扫描**：公开夹具、Stitch、日志、Git Diff 和 Review Bundle 中不存在真实儿童资料、照片、Token、密码、连接串、定位信息、本地存储路径或用户主目录绝对路径。
- [ ] **AC-014 媒体访问**：未登录请求 Media 内容返回 401；非所有者返回 404；所有者响应不暴露 `storageKey`，未来短期 URL 的有效期不超过 5 分钟。

### 16.4 课程前后端子集

- [ ] **AC-015 Hono 页面与 API**：启动 Hono 实验服务后，`GET /labs/github-profile` 返回可访问页面，`GET /api/labs/health` 返回 200；无效输入、上游错误和超时符合 12.7。
- [ ] **AC-016 Drizzle Migration**：在空库和含旧数据的测试库中依次运行初始建表、增加 `bio`、删除 `company`、回滚和重新应用；每一步 Schema 与读写测试符合对应阶段。
- [ ] **AC-017 Go 迁移等价性**：同一套契约测试分别指向 Hono 与 Go，白名单字段、数据库效果和 400/401/403/404/429/502/504 语义一致；切换后课程页面无需修改。
- [ ] **AC-018 Token 安全**：真实 GitHub 请求只在用户主动输入 Fine-grained Token 后执行；Token 不出现在数据库、浏览器存储、URL、日志、错误、Trace 或 Review Bundle。

本 PRD 只验收课程的前端、后端、数据库和 Go 迁移子集，不代表 AWS、云部署、消息、AI、游戏或 3D 作业已经完成。

### 16.5 前端、H5 与交付证据

- [ ] **AC-019 Stitch 清单**：每个产品屏具有唯一 Screen ID，并保存原始 HTML、PNG、资产、用途和 Token 版本。
- [ ] **AC-020 视觉回归**：390px BackstopJS 与批准基线无未批准差异；人工批准必须记录差异截图、原因、批准人和日期。
- [ ] **AC-021 H5 自适应**：360px、390px、430px、768px、1280px 的自动截图中无横向滚动、导航遮挡、提交按钮不可见或图片比例破坏；320px 人工冒烟通过。
- [ ] **AC-022 可访问性**：键盘可完成主要流程；焦点可见；Modal 焦点不逃逸；表单错误可被辅助技术关联；Reduced Motion 生效。
- [ ] **AC-023 快速记录目标**：在已登录且首页加载完成的 390px 环境中，5 次从点击“添加记录”到成功反馈的测试，中位时间不超过 60 秒，且无校验错误。

每个 Feature 的证据保存到 `docs/qa/<feature>/`，至少包含测试命令与退出码、关键截图、契约/数据库结果和已知限制。

## 17. 非目标

- AWS 网络、部署、IAM、CI/CD 和生产环境。
- SNS、SQS、DLQ、Canary 和 AIOps。
- RAG、Agent、模型微调和 LangGraph/Mastra。
- 游戏、Three.js、Babylon.js、Phaser、Cocos 和 3D。
- 多宝宝切换、复杂家庭权限和真实邀请发送。
- 公开相册分享、收费会员和云盘容量销售。
- 医疗诊断、健康风险评分和个性化治疗建议。

## 18. 风险与处理

| 风险 | 处理 |
| --- | --- |
| Stitch 页面之间宝宝资料不一致 | 使用单一演示档案，年龄从生日计算 |
| Hono 与 Go 重复实现 | 先冻结 Contract，再用同一契约测试验证迁移 |
| 照片和儿童数据泄露 | 占位资产、后端校验、元数据清理、Review 脱敏 |
| 健康内容被误解为医疗建议 | 来源、更新时间、适龄阶段和固定免责声明 |
| Mock 与真实 API 漂移 | Mock、Hono、Go 共用 Schema/Contract |
| H5 软键盘或安全区遮挡 | 设备宽度矩阵、真实浏览器 E2E 和视觉回归 |
| GitHub Token 泄露 | 请求期内存使用、日志过滤、持久化白名单和安全测试 |

## 19. 后续产物

本 PRD 批准后按顺序生成：

1. `specs/PLAN.md`
2. 每个 Feature 的 `requirements.md`
3. 每个 Feature 的 `design.md`
4. 每个 Feature 的 `tasks.md`
5. Stitch 屏幕生成提示与 Screen/State Manifest
6. Stitch HTML、PNG、资产和 Token 下载清单
7. TC Flow Contract 与 N1–N8 执行记录

在用户批准本 PRD 前，不生成 Stitch 新页面，不修改产品代码，不执行 TC Flow N1–N8。

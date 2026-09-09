# Dashboard 航海 Hero 与技术能力图谱集成设计

日期：2026-09-09  
状态：用户已确认设计方向，待实现计划评审  
目标仓库：`fullstack-showcase`  
目标页面：`/dashboard`

## 1. 目标

将已验证方向的“船驶向海平面”视觉原型生产化，并将 Dashboard 当前静态核心能力列表升级为可探索的技术能力图谱。

最终页面应同时满足：

- 顶部具有明确的个人技术品牌叙事，而不是通用模板 Hero。
- 个人简历仍是 Banner 后的第一个内容模块。
- 技术能力以中心身份、能力域、技术节点、项目与 Evidence 的关系展示，不退化为 Logo 墙。
- 保留 Dashboard 已批准的水墨、撕纸玻璃、藏青、朱红视觉语言。
- SSR、无 JavaScript、低性能设备、移动端和减少动态偏好下仍可阅读和导航。
- 不复制参考站点的品牌、文案、源码或素材。

## 2. 页面信息架构

页面顺序固定为：

1. 作品集主导航
2. 航海 Hero
3. 个人简历
4. 技术能力图谱
5. 分组项目列表
6. 开源社区共建
7. 性能观测与成本控制
8. 页脚

航海 Hero 负责建立个人品牌和视觉记忆；个人简历负责招聘语义；技术能力图谱负责说明能力之间的关系；项目与 Evidence 负责提供事实证明。四者不能互相替代。

## 3. 方案选择

采用“单 Babylon 航海场景 + 轻量 DOM 技术图谱”。

不采用以下方案：

- 不以 iframe 嵌入 throwaway prototype。iframe 会割裂路由、主题、SSR、无障碍和状态管理。
- 不同时运行两个 Babylon/WebGL 场景。第二个场景会增加显存、主线程和移动端稳定性成本。
- 不把技术能力做成不可访问的纯 Canvas。核心文字、链接和状态必须存在于 SSR DOM。

## 4. 组件边界

### 4.1 `PortfolioVoyageHero`

职责：渲染首屏文案、操作入口、静态回退层和 Babylon Canvas 容器。

接口：

- `title`：个人品牌主标题。
- `summary`：工程方向摘要。
- `primaryAction`：滚动到技术能力图谱。
- `secondaryAction`：暂停或恢复动态。
- `sceneEnabled`：运行时能力探测结果。

该组件只负责 React/DOM 生命周期，不直接包含 Babylon 场景细节。

### 4.2 `VoyageSceneController`

职责：封装 Babylon Engine、Scene、Camera、Shader、船模加载、航迹粒子和销毁逻辑。

必须保留原型中已经验证的物理一致性：

- 天空、太阳、海面高光和船体共享同一世界坐标太阳方向。
- GPU 海浪 Shader 与 CPU `waveHeight` 使用同一组波浪公式。
- 船体沿航线位置计算航向，并以船头、船尾、左舷、右舷浪高计算升沉、俯仰和横摇。
- 相机拖动和缩放范围受限，不能穿出场景。
- 起止段淡入淡出，航迹粒子保持低密度。

控制器提供 `start()`、`pause()`、`resume()`、`resize()`、`dispose()`，不暴露 Babylon 对象给页面其他模块。

### 4.3 `TechnologyCapabilityMap`

职责：渲染中心身份、四个能力域、二十四个技术节点、关系线和详情面板。

实现采用 React DOM、SVG 连线、CSS 3D 和项目已有 `motion`。拖动只改变图谱的观察偏移和景深，不创建第二个 WebGL 上下文。

中心节点：

- 徐天成
- 全栈 · AI Agent · Web3 工程师
- Build · Connect · Verify · Deliver

能力域：

| 能力域 | 技术节点 |
| --- | --- |
| AI / Agent | Qwen3 / QLoRA、RAG / Rerank、Agent Runtime、Tool Calling、MCP / Memory、Evaluation |
| 全栈产品 | React / TanStack、TypeScript、Hono / Go、Node Runtime、PostgreSQL / SQLite、Edge SSR / Hydration |
| Web3 / 可信交付 | Solidity / EVM、Sepolia、Wagmi / Viem、Wallet / Auth、LangGraph DAG、On-chain Evidence |
| Cloud / Engineering | Cloudflare Pages / Workers、AWS Serverless / ECS、GitHub OIDC、CI/CD / Preview、性能观测、TC Flow / Quality Gate |

### 4.4 `CapabilityDetailPanel`

职责：在节点被选中后展示：

- 技术名称和能力说明。
- 对应项目。
- 已验证状态边界。
- 项目主页与 Evidence 链接。

关闭详情后恢复完整图谱。桌面端使用侧边玻璃抽屉；移动端使用文档流内的展开卡，避免遮挡和焦点陷阱。

## 5. 数据模型

技术图谱使用独立、只读的展示模型，不从 DOM 文案反向推导关系。

```ts
type CapabilityDomain = {
  id: "ai" | "fullstack" | "web3" | "engineering";
  label: string;
  summary: string;
  accent: string;
  technologies: TechnologyNode[];
};

type TechnologyNode = {
  id: string;
  label: string;
  icon: string;
  description: string;
  projectIds: string[];
  evidenceHref?: string;
  verification: "verified-production" | "verified-local" | "pending";
};
```

项目名称、主页和 Evidence URL 继续以现有 Portfolio Project 数据为权威来源。技术图谱只保存 `projectIds`，不复制项目状态账本。

## 6. 图标与素材

- 技术图标必须作为本地 SVG 资源构建，不运行时热链 CDN。
- 优先使用许可证清晰的 Simple Icons 或项目自有图标；新增第三方资源必须登记来源和许可证。
- 图标保留品牌识别色，但外框、玻璃、连线和状态色遵循 Dashboard 主题。
- 航海船模继续使用 `SS Minnow III`，保留 CC BY 4.0 作者署名和 `THIRD_PARTY_NOTICES.md`。
- 不复制京程一灯页面的 Logo、星空背景、粒子素材或代码。

## 7. 视觉与动效

### 7.1 航海 Hero

- 水平线位于首屏中上部，船从近景驶向海平面。
- 文案与主要操作保持高对比，不叠在高亮太阳或船体上。
- 水墨页面与海面场景之间使用纸纹遮罩过渡，避免黑色矩形 Canvas 生硬切入。
- 主导航维持现有浅色水墨玻璃，不改品牌章和导航信息结构。

### 7.2 技术能力图谱

- 背景继承水墨纸色，以淡藏青轨道、朱红关键点、青绿 Cloud、紫灰 Web3 区分能力域。
- 中心节点使用撕纸玻璃与内发光，不采用纯黑科技面板。
- 图标节点具有轻微深度、漂移和视差；视觉运动必须克制，不持续抢夺正文注意力。
- 悬停或键盘聚焦节点时，高亮所属能力域、关系线和对应项目；其他节点降低对比度但不消失。
- 点击节点打开详情；点击中心节点或按 `Escape` 恢复全图。

### 7.3 动效节奏

- 入场顺序：中心身份 -> 四个能力域 -> 技术节点 -> 连线。
- 动画只在模块首次进入视口时执行一次。
- 航海场景、图谱漂移和视差均提供显式暂停入口。
- `prefers-reduced-motion` 下禁用持续运动、视差和自动航行，只保留即时状态变化。

## 8. SSR、加载与失败降级

- 服务端输出 Hero 标题、摘要、操作链接、完整能力域、技术节点和 Evidence 链接。
- Babylon 通过动态 import 分离为独立 chunk，不进入 Dashboard 初始同步包。
- Canvas 接近视口且浏览器空闲后才初始化。
- 初始化前展示主题一致的静态海平面回退层，避免布局跳动。
- WebGL、Shader、模型或动态 import 失败时保留静态 Hero，并显示“动态场景不可用”；不能白屏或隐藏正文。
- 页面离开 Hero 视口后暂停 render loop，重新进入后恢复。
- 页面卸载时释放 Engine、Scene、Texture、事件监听和 ResizeObserver。

## 9. 响应式策略

### 桌面 `>= 1024px`

- 航海 Hero 使用完整 Babylon 场景。
- 技术图谱使用中心放射布局、SVG 连线、拖动视差与侧边详情抽屉。

### 平板 `768px–1023px`

- 航海场景降低设备像素比和粒子数量。
- 技术图谱缩短半径，能力域采用两列布局。

### 手机 `< 768px`

- 默认使用静态航海回退；只有通过性能能力探测后才允许启动动态场景。
- 技术图谱变为“中心身份 -> 能力域 -> 技术节点”的纵向能力树。
- 不保留自由拖动；点击能力域展开节点，详情位于文档流。
- 页面必须无横向溢出。

## 10. 性能预算

- Babylon 与 loader 必须懒加载并形成独立 chunk。
- Hero 的 SSR/静态回退不得依赖 Babylon 下载完成。
- 3D 场景 DPR 上限桌面为 `1.5`，移动端为 `1.0`。
- 航迹粒子使用固定上限，不随运行时间增长。
- GLB 在生产构建中只保留实际使用的网格、材质和纹理；目标传输体积不超过 1.5 MB。
- 技术图谱不得创建第二个 WebGL 上下文。
- Hero 离屏后帧循环必须停止，不能仅降低透明度。
- 新增初始同步 JavaScript 目标不超过 20 KB gzip；Babylon 和船模不计入初始同步包，但必须按需加载。

## 11. 可访问性

- Canvas 提供描述性替代文本，不能承载唯一信息。
- 所有技术节点均为真实按钮，项目与 Evidence 使用真实链接。
- 拖动、悬停和滚轮功能必须有键盘等价操作。
- 选中状态使用 `aria-pressed` 或等价可感知属性。
- 详情区域使用合适标题层级和 `aria-live="polite"`，但不在每帧播报动态。
- 暂停按钮文字明确反映当前状态。
- 颜色不是能力域和验证状态的唯一标识。

## 12. 测试与验收

### 功能合同

- Hero 静态内容在 SSR HTML 中存在。
- 技术能力域、二十四个节点和链接在 SSR HTML 中存在。
- Babylon 失败时仍可阅读并访问全部内容。
- 节点选择、详情关闭、能力域聚焦、暂停和恢复可操作。
- 项目与 Evidence 链接来自权威项目数据。

### 浏览器验收

- `375 / 390 / 430 / 1440` 四个视口。
- HTTP 正常、Hydration 无错误、`pageerror=[]`。
- 根级横向溢出不超过 1 px。
- Hero 离屏后渲染循环停止。
- `prefers-reduced-motion` 下无持续动画。
- WebGL 禁用和船模加载失败时静态回退正常。

### 视觉回归

- 使用仓库既有 BackstopJS 固定路由、数据、浏览器和字体环境。
- 保存 baseline 后人工检查 candidate，禁止盲目批准 reference。
- 单独覆盖桌面完整场景、手机静态降级、节点选中、详情打开四类状态。

### 性能验收

- 检查初始 chunk 未包含 Babylon。
- 检查 Canvas 初始化时机、DPR 上限、离屏暂停和资源销毁。
- 使用 Chrome Performance 对比改造前后主线程、GPU、内存和 Core Web Vitals。
- 视觉完成不能替代性能 Gate。

## 13. 交付顺序

1. 固化能力图谱数据模型和 SSR 合同测试。
2. 实现静态 Hero、技术能力图谱和移动端能力树。
3. 将 throwaway prototype 的场景控制器生产化并接入懒加载边界。
4. 接入本地图标、船模与许可证。
5. 完成功能、SSR、响应式、视觉和性能 Gate。
6. 启动本地预览，由用户确认视觉效果。
7. 用户明确批准后再提交功能代码、推送、PR、Preview、合并和 Production。

## 14. 非目标与状态边界

- 本阶段不修改 AWS、Cloudflare Runtime、性能采集管线或项目 Evidence 事实。
- 技术图谱不宣称技能认证等级，只展示已实现项目能够支持的能力关系。
- `pending` 状态不得通过颜色或文案包装成已验证。
- 原型当前仍是视觉参考；只有完成本设计的生产实现和验收后，才能进入 Dashboard 发布流程。

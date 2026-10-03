export type SharingNoteDraft = { insight: string; practice: string };

// Source-based drafts for the article directory. Personal deep reading is still pending.
export const sharingNoteDrafts: Record<string, SharingNoteDraft> = {
  "v8/sparkplug": {
    insight: "Sparkplug 直接将 Ignition 字节码编译为机器码，不先构造复杂的中间表示。它减少解释器分派开销，同时保持与解释器兼容的栈帧，以较低编译成本取得中间层性能。",
    practice: "机器码不等于充分优化。评价这一级编译器要同时看启动、编译耗时与热代码执行时间，尤其不能把长跑基准直接套到短生命周期脚本。",
  },
  "v8/maglev": {
    insight: "Maglev 位于 Sparkplug 和 TurboFan 之间，利用运行反馈构造控制流图与 SSA。分支汇合的 Phi 选择实际路径产生的值；猜测失效时，反优化恢复可继续运行的状态。",
    practice: "分层 JIT 要在编译成本与优化收益间取舍。排查性能时应关注代码是否稳定、是否反复去优化，而不只记住编译器名称。",
  },
  "v8/leaving-the-sea-of-nodes": {
    insight: "文章解释 Turboshaft 的控制流图表示为何逐步承担部分 Sea of Nodes 的工作：更清楚地组织控制流与数据依赖，便于优化和维护。这是编译器内部 IR 的工程迁移。",
    practice: "区分语言语义、优化 IR 和后端代码生成。内部表示改变并不自动证明所有 JavaScript 程序都会更快，仍需看覆盖范围和基准。",
  },
  "v8/fast-properties": {
    insight: "V8 分开处理对象的命名属性和索引元素，HiddenClass 描述对象形状。形状稳定有利于共享访问路径，动态增删属性可能改变存储方式。",
    practice: "热路径中可先保持对象初始化方式一致，再用 profile 判断属性访问是否真是瓶颈。不要把引擎机制变成禁止正常修改对象的教条。",
  },
  "v8/elements-kinds": {
    insight: "数组的元素类型与是否有空洞影响内部表示和优化路径。混合元素或产生稀疏数组可能让后续访问需要更多检查。",
    practice: "处理大数组热循环时观察类型混用与空洞，但先保证业务语义，再用实际输入的基准证明微优化收益。",
  },
  "v8/json-stringify": {
    insight: "V8 为符合条件、可确定序列化过程没有用户代码副作用的对象建立快路径，并优化字符串与输出缓冲区处理。文章中的提速有特定工作负载边界。",
    practice: "如果序列化是瓶颈，应按真实数据形状、字符集及 getter、toJSON 等特性测量。快路径没有改变 JSON.stringify 的对外语义。",
  },
  "v8/trash-talk": {
    insight: "Orinoco 通过增量、并行和并发回收缩短或分摊主线程停顿。增量是拆分工作，并行是一起处理，并发是与应用执行重叠，三者不能混为一谈。",
    practice: "排查卡顿要看停顿阶段、分配速率和对象生命周期，不只看是否发生 GC；先减少不必要分配，再考虑底层参数。",
  },
  "v8/pointer-compression": {
    insight: "压缩堆内指针能降低内存占用，但读取时需解压和地址计算。省内存、缓存收益与额外指令之间存在取舍。",
    practice: "把内存更小与执行更快分开验证，结合真实堆规模、缓存行为和 CPU profile 判断是否有收益。",
  },
  "v8/sandbox": {
    insight: "V8 Sandbox 旨在限制堆内存破坏向进程其他内存扩散。这是进程内的一层隔离，不等于漏洞消失，也不同于浏览器进程沙箱。",
    practice: "安全能力应按威胁模型分层说明：引擎内部隔离、进程隔离和站点权限不能相互替代，还需注明启用条件与剩余攻击面。",
  },
  "overreacted/what-is-javascript-made-of": {
    insight: "文章用值、类型、变量、函数、对象和相等性搭起 JavaScript 心智模型。变量绑定与值的类型是不同层次，对象引用与原始值的相等性也不同。",
    practice: "遇到奇怪表达式，逐步标出每个值、类型和引用关系，比背诵零散的“JS 怪异规则”更稳妥。",
  },
  "overreacted/why-do-we-write-super-props": {
    insight: "派生类必须先调用 super 才能使用 this。将 props 传给 React.Component 的构造函数，可让构造期间的 this.props 立即可用。",
    practice: "把 JavaScript 的类初始化规则与 React 的 props 注入分开理解，不要只记 super(props) 模板。",
  },
  "overreacted/how-does-react-tell-a-class-from-a-function": {
    insight: "React 必须区分组件应当普通调用，还是用 new 创建实例。class 的 this 与构造语义不同，不能靠试调用安全判断。",
    practice: "阅读框架机制时，先找它要区分的运行时行为，再看采用什么标记或约定；这不是单纯的代码风格问题。",
  },
  "overreacted/the-elements-of-ui-engineering": {
    insight: "UI 工程不只是把设计稿转成组件，还涉及一致性、反馈、加载、错误、可访问性和变化时的韧性；这些约束互相影响。",
    practice: "评审页面时按加载、空状态、失败、重试和键盘操作逐项检查，记录具体取舍，不只评价视觉完成度。",
  },
  "overreacted/react-as-a-ui-runtime": {
    insight: "React 元素描述目标 UI，不是已创建的 DOM。渲染器管理宿主实例，协调过程决定如何更新，组件则是运行时模型中的一层抽象。",
    practice: "调试界面更新时，区分 render 产出的描述与 commit 对宿主环境的真实修改。",
  },
  "overreacted/how-does-setstate-know-what-to-do": {
    insight: "setState 本身不直接修改 DOM；实际更新能力由渲染器提供。React 核心与 React DOM 等宿主渲染器各有职责。",
    practice: "读跨平台 API 时不要把浏览器实现当作核心抽象，先定位能力由谁注入、由谁消费。",
  },
  "overreacted/why-do-react-elements-have-typeof-property": {
    insight: "React 元素的 $$typeof 是识别元素结构的标记；Symbol 有助于避免把不可信 JSON 对象误认成可渲染元素。",
    practice: "数据结构相似不代表信任级别相同。跨边界反序列化时要验证类型与可执行能力，而不只检查字段。",
  },
  "overreacted/why-do-hooks-rely-on-call-order": {
    insight: "Hooks 依赖稳定的调用顺序，将每次渲染的调用与状态槽位对应；条件调用会让后续状态错位。",
    practice: "条件放在 Hook 内部或组件分支，不要条件调用 Hook。出错时画出两次渲染各自的调用序列。",
  },
  "overreacted/how-are-function-components-different-from-classes": {
    insight: "函数组件的回调捕获一次渲染里的 props 和 state，类组件方法则可能从可变的 this 读取较新的值。核心差异是值与时间。",
    practice: "异步回调读到旧值时，先确认它属于哪次渲染；确实需要最新值时，明确使用 ref 或重建订阅。",
  },
  "overreacted/a-complete-guide-to-useeffect": {
    insight: "Effect 用来同步某次渲染与外部系统，不是类生命周期方法的替身。依赖说明同步使用的响应式值，清理撤销上一轮连接。",
    practice: "写 Effect 前先问是否真的在同步外部系统；能在 render 中推导的值通常不需要 Effect。",
  },
  "overreacted/making-setinterval-declarative-with-react-hooks": {
    insight: "setInterval 会保留创建时的回调，React 重渲染却产生新闭包。文章用 ref 保持最新回调，用 Effect 管理定时器。",
    practice: "封装 useInterval 时考虑暂停、间隔变化和卸载清理，并检查不会重复注册。",
  },
  "overreacted/why-isnt-x-a-hook": {
    insight: "不是每种 React 能力都适合 Hook 化。是否便于组合、局部理解与调试，比 API 外形统一更重要。",
    practice: "先划清职责，再选择函数、Hook、组件或 Provider，避免为了统一形式制造隐式依赖。",
  },
  "overreacted/writing-resilient-components": {
    insight: "有韧性的组件能承受重复渲染、输入变化和重挂载；它不截断数据流，也不把一次挂载当成永久状态。",
    practice: "在真实页面中检查 prop 变化、重挂载和错误恢复，比只看首次渲染更能发现脆弱假设。",
  },
  "overreacted/before-you-memo": {
    insight: "memo 不是所有重复渲染的起点。状态放得过高会放大更新范围，而组件组合与 children 常能先隔离无关更新。",
    practice: "先用 profiler 找瓶颈，再调整状态与组件边界；最后才考虑 memo 及其比较成本。",
  },
  "overreacted/my-wishlist-for-hot-reloading": {
    insight: "理想热更新不仅快，还应在可预测条件下保留组件状态，无法安全保留时明确重置，并能从错误中恢复。",
    practice: "评价开发工具时分别观察代码变更、模块边界变化和运行错误后的状态，而不只看页面是否自动刷新。",
  },
  "overreacted/what-are-the-react-team-principles": {
    insight: "文章归纳从 UI 场景出发、由框架承接复杂性、支持局部推理与渐进复杂度等设计取向。原则是取舍方向，不是机械规则。",
    practice: "评价抽象时看开发者能否解释界面的数据流与失败路径，而不仅看调用代码是否短。",
  },
  "overreacted/optimized-for-change": {
    insight: "API 不应只优化初次编写，还要考虑未来的移动、复制、拆分和调试；少写几行未必降低长期修改成本。",
    practice: "设计组件接口时模拟新增状态和迁移位置，数清要改动的层数，比单次 demo 更能检验抽象。",
  },
  "overreacted/the-bug-o-notation": {
    insight: "作者用复杂度类比定位 bug 的成本：一个值错了，要跨多少层才能追到来源？隐藏数据流会扩大排查范围。",
    practice: "把可追踪性纳入 API 设计，确保日志、类型边界和数据流能帮助缩小搜索空间。",
  },
  "overreacted/goodbye-clean-code": {
    insight: "过早去重可能把本应独立变化的业务分支绑在一起，最终在共享抽象里堆积条件。",
    practice: "先观察相似代码的真实变化模式；在证据不足时，适度重复可能比强行抽象更清楚。",
  },
  "overreacted/the-wet-codebase": {
    insight: "DRY 不是绝对目标。相似代码若属于不同上下文，强制复用会带来间接耦合；适度重复保留独立演进空间。",
    practice: "抽取前确认语义、生命周期和维护者是否一致。抽象应降低总复杂度，不只是降低重复行数。",
  },
  "overreacted/npm-audit-broken-by-design": {
    insight: "作者批评默认依赖告警缺乏运行环境、可达性与利用条件的上下文，容易制造告警疲劳。",
    practice: "处理告警时标出受影响包、调用路径、部署环境和修复代价；既不按数量恐慌，也不因噪声多而全部忽略。",
  },
  "overreacted/how-does-the-development-mode-work": {
    insight: "开发模式允许运行额外警告和检查，生产模式则通常移除这些开销；关键在清晰的构建期边界。",
    practice: "检查构建配置，确认调试分支和敏感诊断信息未进入生产包，不把开发警告误认为线上语义。",
  },
  "overreacted/suppressions-of-suppressions": {
    insight: "一次规则豁免可能有理由，但为豁免反复再加豁免，会逐渐掩盖最初要守住的约束。",
    practice: "为 lint、类型与安全规则的抑制记录原因和清理条件，新增第二层例外时重新评估设计。",
  },
  "overreacted/how-to-fix-any-bug": {
    insight: "修复问题先缩小可复现范围：从现象出发逐步删掉无关条件，直到能支持明确的因果判断。",
    practice: "保留失败输入和最小复现，每次实验只改变一个变量，避免在根因未知时叠加猜测性补丁。",
  },
  "overreacted/a-chain-reaction": {
    insight: "页面从代码与数据出发，经编译、服务端执行、传输和浏览器执行等阶段才成为界面；每一阶段都有可用信息边界。",
    practice: "理解 RSC 先画清每段计算发生在哪台机器和哪个阶段，再讨论组件边界。",
  },
  "overreacted/the-two-reacts": {
    insight: "同一 UI 可以跨服务端与客户端协作运行。关键不是 SSR 或 CSR 二选一，而是计算怎样切分、传递与接管。",
    practice: "明确哪些代码需要私有数据、哪些需要浏览器状态，再确定序列化和水合边界。",
  },
  "overreacted/react-for-two-computers": {
    insight: "把服务器和浏览器看作两台计算机，能看清组件树不必整体在一处运行。跨端传递的是可解释结果与引用，不是任意对象。",
    practice: "提前标记不可序列化值、私有凭据和浏览器 API，避免在跨端边界上产生含糊依赖。",
  },
  "overreacted/jsx-over-the-wire": {
    insight: "沿网络传递 UI 描述，能更贴近组件组织取数与展示；但传输边界仍有序列化、版本和安全问题。",
    practice: "比较 REST 与 UI 协议时关注往返、缓存和错误恢复，不把“传 JSX”误解为发送可直接执行的源码。",
  },
  "overreacted/impossible-components": {
    insight: "同时要求服务端文件读取和浏览器本地状态的组件，无法作为单一环境中的普通函数执行；拆分 Server 与 Client Components 才能明确责任。",
    practice: "按数据拥有者与交互责任拆组件，不靠运行时条件判断掩盖跨端边界。",
  },
  "overreacted/what-does-use-client-do": {
    insight: "use client 标记模块图中的客户端入口与跨端引用边界，不是简单的“这个文件只在浏览器渲染”开关。",
    practice: "沿 import 图追踪边界传播，确认服务端秘密和客户端能力没有越界。",
  },
  "overreacted/functional-html": {
    insight: "文章从 HTML 逐步加入函数、组合和异步能力，以另一条路径说明服务端准备内容、客户端负责交互的模型。",
    practice: "把它当教学模型，不把 HTML 直接等同于 RSC 协议；实现还需考虑缓存、身份与错误边界。",
  },
  "overreacted/rsc-for-astro-developers": {
    insight: "Astro 的预处理与交互 Island 分工有助理解 RSC，但两者的组件模型、数据协议和更新方式并不完全相同。",
    practice: "迁移概念时同时写出共同点与差异：哪里预处理、哪里接管交互、导航后哪些计算重做。",
  },
  "overreacted/static-as-a-server": {
    insight: "Server Component 的 server 指执行环境，不要求常驻服务；构建期也能执行并输出静态资产。",
    practice: "分别确认构建期、请求期和客户端数据的新鲜度，不把静态输出误认为实时服务器读取。",
  },
  "overreacted/one-roundtrip-per-navigation": {
    insight: "就近声明取数有利于组件组合，但逐层等待会造成瀑布。文章比较不同数据接口如何兼顾导航往返成本。",
    practice: "画请求依赖图，区分串行等待与并行取数，同时考虑缓存、失败和无数据反馈。",
  },
  "overreacted/why-does-rsc-integrate-with-a-bundler": {
    insight: "RSC 不只传数据，还要传客户端代码引用，让接收方知道加载哪个模块，因此与模块图和 bundler 的协作不可缺。",
    practice: "跨端边界变化后检查 chunk、引用版本与加载失败路径，不能只验证服务端输出文本。",
  },
  "overreacted/progressive-json": {
    insight: "普通 JSON 常要等整个对象完成才能使用；渐进式协议先交付可用部分，再填充慢数据，改变的是阻塞关系。",
    practice: "设计流式 UI 时标出可独立展示与必须等待的部分，并处理分块错误、取消和乱序完成。",
  },
  "overreacted/rsc-for-lisp-developers": {
    insight: "文章借 Lisp 的代码与数据关系说明 UI 元素可先作为描述传递，再由另一端解释；这只是有边界的类比。",
    practice: "使用类比时写出失效点，尤其不能略过模块引用、序列化限制和执行权限。",
  },
  "overreacted/how-imports-work-in-rsc": {
    insight: "RSC 利用 import/export 组织跨环境程序；边界标记影响模块怎样被引用和执行，不只是函数返回值。",
    practice: "从入口沿依赖图检查服务端模块是否流入客户端，以及客户端引用是否有对应构建产物。",
  },
  "overreacted/introducing-rsc-explorer": {
    insight: "RSC Explorer 用可观察样例展示组件树的传输与接续。演示中的内部格式有助学习，但并非稳定公开 API。",
    practice: "用工具构造最小实验观察流式输出与客户端引用；生产代码依赖公开契约，不依赖内部编码。",
  },
  "overreacted/open-social": {
    insight: "开放社交不只是开源客户端，更关乎身份、关系与内容能否跨产品延续，避免用户完全被单一平台锁定。",
    practice: "本次未能完整获取该原文，以上依据已有目录摘要，待本人对照原文复核；评估开放性还需分别检查身份迁移、数据导出与第三方接入。",
  },
  "overreacted/where-its-at": {
    insight: "at:// 将稳定身份、记录集合和记录键组织在一起；handle 帮助发现身份，再定位数据托管位置。",
    practice: "设计联邦链接时区分人类可读名字、稳定标识与当前服务器地址，并考虑迁移后的缓存更新。",
  },
  "overreacted/a-social-filesystem": {
    insight: "文章把社交内容看作用户拥有的记录、集合和链接，不同应用可以在共享数据层上提供不同视图。",
    practice: "本次未能完整获取该原文，以上依据已有目录摘要，待本人对照原文复核；落地还要评估授权、删除传播与索引一致性。",
  },
  "overreacted/there-are-no-instances-in-atproto": {
    insight: "atproto 的身份、托管与应用分属不同层次，不能直接套用 Mastodon 的实例模型。",
    practice: "比较联邦协议时分别画出身份解析、数据托管和应用展示链路，再谈迁移能力与故障边界。",
  },
  "overreacted/algebraic-effects-for-the-rest-of-us": {
    insight: "代数效应把“需要什么效果”与“外层如何处理”分开；它可帮助类比某些 React 控制流，但 JS 并未因此原生拥有完整代数效应。",
    practice: "区分教学类比与真实语言能力，重点看暂停、恢复和处理者各自承担的责任。",
  },
  "overreacted/the-math-is-haunted": {
    insight: "Lean 将命题与证明写成可由机器检查的构造；形式化证明与日常直觉之间仍有表达鸿沟。",
    practice: "先写清前提与目标，逐步检查推理；机器检查通过也不保证最初形式化的命题就是现实中想证明的问题。",
  },
  "overreacted/beyond-booleans": {
    insight: "true/false 只给结论；命题作为类型、证明作为该类型的值，还能保留可组合的理由。",
    practice: "在业务代码中也可借鉴：重要判断用带原因的判别联合表达结果，而非只返回布尔值。",
  },
  "overreacted/a-lean-syntax-primer": {
    insight: "文章梳理 Lean 的定义、类型、函数、命名空间与证明脚本，是进入交互式证明环境的入门地图，不是完整规范。",
    practice: "从可运行的最小命题练习，逐项观察类型与剩余目标，不一次照搬大型证明。",
  },
  "overreacted/how-i-vibed-a-proof-of-conways-conjecture": {
    insight: "作者记录 AI 辅助探索 Lean 证明的选题、失败、实验和核查。AI 候选推理不能替代形式系统的验证。",
    practice: "分别核查证明是否通过、形式化命题是否对应原问题，以及依赖库是否可信。",
  },
  "overreacted/things-i-dont-know-as-of-2018": {
    insight: "作者公开知识盲区，以抵消影响力带来的“什么都懂”错觉；专业能力与不知道某些主题可以同时成立。",
    practice: "技术介绍中分清亲自实现、读过资料与仍在学习的内容，明确边界比堆术语更可信。",
  },
  "overreacted/fix-like-no-ones-watching": {
    insight: "持续改进常始于低风险的小修复；过高的协调成本会让人放弃顺手解决的问题。",
    practice: "降低复现、测试和提交小修复的摩擦，同时保留必要审查，让质量改进持续发生。",
  },
  "overreacted/coping-with-feedback": {
    insight: "发布后的反馈混合事实问题、个人偏好与情绪噪声；既不能被即时反应吞没，也不能忽略可行动信息。",
    practice: "按可复现 bug、设计建议和主观评价分类，再决定修复、记录或不处理。",
  },
  "overreacted/name-it-and-they-will-come": {
    insight: "准确命名一个痛点有助于识别、讨论与检验它；名字组织观察，但不能替代现象证据。",
    practice: "提出新术语时附上可复现场景与反例，避免一句口号压过真实工程问题。",
  },
  "overreacted/preparing-for-tech-talk-part-1-motivation": {
    insight: "准备技术演讲先确定为何要讲、讲给谁听、听众能带走什么；动机不明时材料越多越易失焦。",
    practice: "做幻灯片前写出目标听众与核心改变，删去不服务于目标的素材。",
  },
  "overreacted/preparing-for-tech-talk-part-2-what-why-and-how": {
    insight: "演讲内容应回答 What、Why、How：主张是什么、为什么重要、怎样理解或采用。",
    practice: "为每节写一句承上启下的话，检查例子是否真正解释主张，而非只展示工作量。",
  },
  "overreacted/preparing-for-tech-talk-part-3-content": {
    insight: "先自上而下搭骨架，再自下而上打磨有力片段，通过多轮试讲调整节奏与信息密度。",
    practice: "预留试讲与删减时间；没有听众反馈的完整幻灯片还不能算准备完成。",
  },
  "overreacted/my-decade-in-review": {
    insight: "作者回看学习、工作和开源经历，能看到机会、协作与偶然性对路径的影响；不能把回顾误读成成功公式。",
    practice: "整理个人经历时分开当时的决策依据与事后解释，给项目贡献留下可核验证据。",
  },
  "overreacted/im-doing-a-little-consulting": {
    insight: "这篇说明作者阶段性咨询计划、背景与合作范围，是职业选择介绍，不是技术成果报告。",
    practice: "借鉴表达方式时如实限定能解决的问题，不把学习方向写成已交付服务。",
  },
  "overreacted/hire-me-in-japan": {
    insight: "作者概述 React、React Native 与开源经历，并明确赴日工作的条件；这是一份针对特定机会的求职说明。",
    practice: "求职材料应按目标岗位挑选证据，明确地域与合作条件，不必堆上所有读过的技术。",
  },
};

export type CapabilityNode = {
  id: string;
  iconSlug: string;
  label: string;
  aliases: string[];
  summary: string;
  plainLanguage: string;
  interviewAngle: string;
  projectIds: string[];
  evidence: string;
  featured?: boolean;
  linkLabel?: string;
};

export type CapabilityTone = "violet" | "blue" | "vermilion" | "jade";

export type CapabilityDomain = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  label: string;
  subtitle: string;
  tone: CapabilityTone;
  nodes: CapabilityNode[];
};

const projectLinks = {
  agentMarket: "https://agent-market.baby2b.online/",
  personalAgent: "https://personal-ai-agent.baby2b.online/",
  babySteps: "https://babysteps.baby2b.online/",
  dashboard: "https://baby2b.online/dashboard/",
  profileStudio: "https://github.com/Tiancheng-Xu/github-profile-studio",
  cocos: "https://github.com/Tiancheng-Xu/cocos-mini-game",
  portfolioSync: "https://baby2b.online/evidence/portfolio-sync",
  tcFlow: "https://baby2b.online/evidence/tc-workflow",
} as const;

const node = (
  value: Omit<CapabilityNode, "aliases" | "featured"> & {
    aliases?: string[];
    featured?: boolean;
  },
): CapabilityNode => ({
  aliases: [],
  featured: false,
  ...value,
});

export const CAPABILITY_DOMAINS: CapabilityDomain[] = [
  {
    id: "ai-agent",
    eyebrow: "AI / AGENT",
    title: "AI / Agent",
    summary: "从模型、检索到多 Agent 编排与评测闭环",
    label: "AI / Agent",
    subtitle: "从模型、检索到多 Agent 编排与评测闭环",
    tone: "violet",
    nodes: [
      node({ id: "qwen3-qlora", iconSlug: "huggingface", label: "Qwen3 / QLoRA", aliases: ["LlamaFactory", "NF4", "LoRA"], summary: "领域微调、量化与版本门禁", plainLanguage: "调整部分参数来学习稳定行为；变化的业务事实仍优先从知识库检索。", interviewAngle: "展开历史训练与量化链，解释 v3 未晋级；bigram F1 不替代语义质量或 RAG 评测。", projectIds: ["personal-ai-agent"], evidence: projectLinks.personalAgent, featured: true }),
      node({ id: "rag-rerank", iconSlug: "langchain", label: "RAG / Rerank", aliases: ["Embedding", "Vector Search", "Qwen Embedding"], summary: "混合召回、重排与来源边界", plainLanguage: "关键词与向量先找资料，再融合重排；引用 ID 存在不代表资料支持答案。", interviewAngle: "讲 BM25、RRF 和服务失效回退；当前是 Mastra / Ollama 相关度评分，不自动称 cross-encoder。", projectIds: ["personal-ai-agent", "agent-market"], evidence: projectLinks.personalAgent, featured: true }),
      node({ id: "langgraph-dag", iconSlug: "langchain", label: "LangGraph DAG", aliases: ["StateGraph", "Checkpoint", "Human in the loop"], summary: "明确状态与终态的 Agent 工作流", plainLanguage: "流程可以暂停和继续，但保存进度不能自动保证外部动作只执行一次。", interviewAngle: "讲条件边、有限修复与审批恢复，再区分 Checkpoint、操作账本和未知结果核对。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "react-planning", iconSlug: "anthropic", label: "ReAct / Planning", aliases: ["Reason + Act", "Planner / Executor"], summary: "推理、行动与计划执行", plainLanguage: "让 Agent 边思考边调用工具，并根据结果修正下一步。", interviewAngle: "区分规划器、执行器和验证器，解释如何限制循环与成本。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "tool-calling", iconSlug: "bruno", label: "Tool Calling", aliases: ["Function Calling", "Structured Tool"], summary: "参数、权限与副作用分层", plainLanguage: "模型提出工具调用，程序决定是否允许；参数格式正确不代表有业务权限。", interviewAngle: "讲 Schema、审批绑定、幂等和未知结果；标准 MCP 业务链仍待补证，不把 HTTP reader 当协议证明。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "agent-runtime", iconSlug: "anthropic", label: "Agent Runtime", aliases: ["Orchestrator", "Execution Runtime"], summary: "任务身份、授权与受控执行", plainLanguage: "把任务版本、权限、退出条件和执行记录管起来，不让模型自行授权或无限重试。", interviewAngle: "用 scope、revision、fingerprint 和操作账本讲边界；当前分支与已发布能力分开。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "multi-agent", iconSlug: "anthropic", label: "Multi-Agent", aliases: ["Agent Collaboration", "Supervisor"], summary: "多角色协作与任务分发", plainLanguage: "让不同擅长方向的 Agent 分工，并由调度器汇总结果。", interviewAngle: "说明角色边界、候选选择、并行执行、冲突处理和结果聚合。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket }),
      node({ id: "evaluation", iconSlug: "jest", label: "LLM Evaluation", aliases: ["LLM-as-Judge", "Golden Set", "Regression Eval"], summary: "历史模型门禁与 RAG 分层评测设计", plainLanguage: "没搜到、引用不支持和答错是不同问题，不能用一个漂亮分数代替。", interviewAngle: "历史冻结集与待补 RAG 评测分开；讲 Recall@K、语义支持、拒答分母和人工抽检。", projectIds: ["personal-ai-agent", "agent-market"], evidence: projectLinks.personalAgent }),
      node({ id: "intent-routing", iconSlug: "anthropic", label: "Intent Routing", aliases: ["Intent Classification", "BERT Routing"], summary: "咨询链路分流的方案理解", plainLanguage: "按问题类型选择处理通道；意图识别不能代替业务权限或人工审批。", interviewAngle: "按设计题讲阈值、误判成本与弃权；没有对应实现证据不说已交付完整路由。", projectIds: ["personal-ai-agent"], evidence: projectLinks.personalAgent }),
      node({ id: "embedding-knowledge", iconSlug: "langchain", label: "Knowledge Graph", aliases: ["Embedding Retrieval", "Graph RAG"], summary: "已有向量检索与知识图谱扩展方案", plainLanguage: "向量检索找意思接近的内容；知识图谱还需要可核验的实体和关系，不能从 RAG 自动推定。", interviewAngle: "先讲已有语义检索，再讲图谱扩展、更新和访问边界，设计与实作分开。", projectIds: ["personal-ai-agent"], evidence: projectLinks.personalAgent }),
      node({ id: "structured-fallback", iconSlug: "bruno", label: "Structured Fallback", aliases: ["JSON Schema", "Guardrail", "Human Handoff"], summary: "规则拒答、服务回退与人工方案", plainLanguage: "无证据时拒答，检索服务出错时回退；模型 Reviewer 不是人工审核。", interviewAngle: "区分已有引用规则、检索回退和待补人工接管；规则通过不证明答案语义真实。", projectIds: ["personal-ai-agent", "agent-market"], evidence: projectLinks.personalAgent }),
    ],
  },
  {
    id: "full-stack-data",
    eyebrow: "FULL STACK / DATA",
    title: "Full Stack / Data",
    summary: "多运行时产品、接口、数据与渲染工程",
    label: "Full Stack / Data",
    subtitle: "多运行时产品、接口、数据与渲染工程",
    tone: "blue",
    nodes: [
      node({ id: "react-tanstack", iconSlug: "react", label: "React / TanStack", aliases: ["Router", "Query"], summary: "组件化前端与数据路由", plainLanguage: "把页面、路由、请求缓存和交互状态组织成可维护的产品。", interviewAngle: "可讲服务端状态、客户端状态、路由边界和组件组合。", projectIds: ["babysteps", "github-profile-studio", "fullstack-showcase"], evidence: projectLinks.babySteps, featured: true }),
      node({ id: "typescript", iconSlug: "typescript", label: "TypeScript", aliases: ["Type Contract", "Schema Inference"], summary: "跨前后端类型契约", plainLanguage: "让数据结构和接口错误尽量在开发阶段暴露，而不是线上才发现。", interviewAngle: "强调判别联合、运行时校验和生成类型的边界。", projectIds: ["agent-market", "babysteps", "fullstack-showcase"], evidence: projectLinks.dashboard, featured: true }),
      node({ id: "runtime-api", iconSlug: "go", label: "Node / Hono / Go / Python", aliases: ["FastAPI", "Lambda Runtime", "Service Runtime"], summary: "按职责拆分多运行时服务", plainLanguage: "不同服务选最合适的语言和运行环境，但保持统一接口契约。", interviewAngle: "说明 Node/Hono API、Python Agent 编排和 Go 执行器的职责边界。", projectIds: ["agent-market", "github-profile-studio"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "rest-graphql", iconSlug: "bruno", label: "REST / GraphQL", aliases: ["API Contract", "Resolver"], summary: "面向页面与编排的接口设计", plainLanguage: "REST 适合稳定资源操作，GraphQL 适合一次组合页面所需数据。", interviewAngle: "可讲 Schema 演进、N+1、鉴权、缓存和错误模型。", projectIds: ["agent-market", "github-profile-studio"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "postgres-sqlite", iconSlug: "postgresql", label: "PostgreSQL / SQLite", aliases: ["SQL", "Checkpoint Store"], summary: "事务数据与本地优先存储", plainLanguage: "线上用 PostgreSQL 承载并发事务，本地工具用 SQLite 简化部署。", interviewAngle: "说明事务、索引、迁移、并发与检查点持久化。", projectIds: ["agent-market", "github-profile-studio"], evidence: projectLinks.profileStudio, featured: true }),
      node({ id: "edge-ssr", iconSlug: "cloudflare-workers", label: "Edge SSR / Hydration", aliases: ["Static First", "Selective Hydration"], summary: "服务端首屏与客户端能力激活", plainLanguage: "先快速返回可读 HTML，再在浏览器里逐步接管交互和重型 3D。", interviewAngle: "讲 SSR/SSG/CSR 边界、水合一致性和客户端专属依赖延迟加载。", projectIds: ["babysteps", "fullstack-showcase", "agent-market"], evidence: projectLinks.dashboard, featured: true }),
      node({ id: "api-contract", iconSlug: "bruno", label: "API Contract", aliases: ["OpenAPI", "Schema Validation"], summary: "前后端可验证接口契约", plainLanguage: "把请求、响应和错误格式写成机器可检查的协议。", interviewAngle: "讲契约测试、版本兼容、运行时校验和错误码语义。", projectIds: ["github-profile-studio", "agent-market"], evidence: projectLinks.profileStudio }),
      node({ id: "async-jobs", iconSlug: "redis", label: "Async Jobs", aliases: ["Worker", "Queue Consumer", "Background Task"], summary: "长任务异步执行与状态回传", plainLanguage: "把耗时工作放到后台执行，页面只订阅进度和最终结果。", interviewAngle: "讲任务租约、重试、重复消费、进度事件和取消。", projectIds: ["agent-market", "portfolio-sync"], evidence: projectLinks.agentMarket }),
      node({ id: "csr-fallback", iconSlug: "react", label: "CSR Fallback", aliases: ["Client Render", "Fatal Remount"], summary: "初始化前提与受控客户端回退", plainLanguage: "先核对路径、版本和 DOM；可恢复错误记日志，不是每个错误都整页重来。", interviewAngle: "区分无合法水合前提、recoverable 与 uncaught / 同步异常，说明一次性回退边界。", projectIds: ["babysteps", "fullstack-showcase"], evidence: projectLinks.babySteps }),
      node({ id: "functional-programming", iconSlug: "haskell", label: "函数式编程", aliases: ["Functional Programming", "Pure Function", "Immutability", "Composition", "Higher-order Function", "Algebraic Data Type"], summary: "纯函数、不可变数据与可组合逻辑", plainLanguage: "用纯函数和不可变数据减少隐藏状态，再通过函数组合把复杂流程拆成可推理、可测试的小步骤。", interviewAngle: "可结合 TypeScript / React 状态建模、LangGraph 节点组合与错误结果类型，说明纯函数边界、副作用隔离、高阶函数和代数数据类型的工程取舍。", projectIds: ["agent-market", "babysteps", "fullstack-showcase"], evidence: projectLinks.dashboard }),
      node({ id: "elf-linking", iconSlug: "linux", label: "ELF / Linking", aliases: ["Executable and Linkable Format", "Section / Segment", ".text / .data / .bss", "Relocation", "GOT / PLT"], summary: "编译、链接、装载与进程内存布局", plainLanguage: "能从目标文件和可执行文件的结构解释代码、已初始化数据、零初始化数据、符号与动态库如何进入内存并运行。", interviewAngle: "可按预处理、编译、汇编、链接、装载、运行展开，并说明 Section 与 Segment、.data 与 .bss、重定位及 GOT / PLT 的职责边界。", projectIds: ["fullstack-showcase"], evidence: projectLinks.dashboard }),
    ],
  },
  {
    id: "cloud-reliability",
    eyebrow: "CLOUD / RELIABILITY",
    title: "Cloud / Reliability",
    summary: "云边交付、异步系统与可恢复运行",
    label: "Cloud / Reliability",
    subtitle: "云边交付、异步系统与可恢复运行",
    tone: "jade",
    nodes: [
      node({ id: "cloudflare", iconSlug: "cloudflare-workers", label: "Pages / Workers", aliases: ["Edge Runtime", "KV", "D1", "R2"], summary: "边缘计算与静态/动态交付", plainLanguage: "把页面和轻量后端部署到离用户更近的边缘节点。", interviewAngle: "说明 Pages、Workers、KV/D1/R2 的职责和一致性取舍。", projectIds: ["fullstack-showcase", "agent-market", "babysteps"], evidence: projectLinks.dashboard, featured: true }),
      node({ id: "docker", iconSlug: "github", label: "Docker / Runtime", aliases: ["Container", "Image", "Multi-stage Build"], summary: "可移植运行环境与构建产物", plainLanguage: "把应用和依赖装进统一容器，减少环境不一致。", interviewAngle: "讲镜像分层、非 root、健康检查、体积和启动时间。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "cicd-preview", iconSlug: "github", label: "CI/CD / Preview", aliases: ["GitHub Actions", "Preview Deployment"], summary: "自动检查、预览与发布流水线", plainLanguage: "每次改代码先自动检查并生成预览，确认后再进入发布。", interviewAngle: "说明门禁顺序、缓存、并发取消、环境隔离和回滚。", projectIds: ["fullstack-showcase", "babysteps", "agent-market"], evidence: projectLinks.dashboard, featured: true }),
      node({ id: "checkpoint-state", iconSlug: "postgresql", label: "Checkpoint / State", aliases: ["State Machine", "Resume", "Durable State"], summary: "流程进度持久化与恢复边界", plainLanguage: "内存对象和闭包随进程消失；检查点保存明确数据，却不替代外部执行账本。", interviewAngle: "讲状态版本、恢复前后校验，以及外部动作与写检查点之间的未知窗口。", projectIds: ["agent-market", "tc-flow"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "retry-idempotency", iconSlug: "git", label: "Retry / Idempotency", aliases: ["Backoff", "Idempotency Key"], summary: "操作认领与不确定结果核对", plainLanguage: "超时只说明没收到结果，不能直接判断没执行；重复请求先看同一操作的记录。", interviewAngle: "讲 operation key、payload hash、原子认领和 uncertain；不承诺跨系统 exactly-once。", projectIds: ["agent-market", "portfolio-sync"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "queue-dlq", iconSlug: "redis", label: "Queue / DLQ", aliases: ["SQS", "Event Bus", "Dead Letter Queue"], summary: "异步解耦、削峰与失败隔离", plainLanguage: "把任务排队慢慢处理，连续失败的任务单独隔离等待排查。", interviewAngle: "讲可见性超时、重复投递、死信队列和消费速率。", projectIds: ["agent-market", "portfolio-sync"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "observability", iconSlug: "webgpu", label: "Observability", aliases: ["Logs", "Metrics", "Tracing"], summary: "事件身份、样本与链路定位", plainLanguage: "把请求、节点和版本关联起来；历史快照、没样本和无法采集不能混成实时指标。", interviewAngle: "讲关联 ID、脱敏和失败状态；日志存在不等于已完成端到端 Trace 或质量测量。", projectIds: ["babysteps", "fullstack-showcase"], evidence: projectLinks.dashboard }),
      node({ id: "performance-cost", iconSlug: "webgpu", label: "Performance / Cost", aliases: ["Core Web Vitals", "Budget", "Profiling"], summary: "真实测量、预算与成本边界", plainLanguage: "没有测到的 token、耗时和成本就标未知，占位数字不算优化成绩。", interviewAngle: "讲环境、版本、样本量与 p95；单样本历史记录不冒充生产趋势或提升百分比。", projectIds: ["babysteps", "fullstack-showcase"], evidence: projectLinks.dashboard }),
      node({ id: "tc-flow", iconSlug: "git", label: "TC Flow", aliases: ["N1-N8", "Checkpoint", "Review Gate"], summary: "可恢复、可审查的工程交付流程", plainLanguage: "把大任务拆成小任务，每一步都留下状态、审查结果和恢复点。", interviewAngle: "讲 Contract、Task Review、Feature QA、Stop Hook 和多仓协作。", projectIds: ["tc-flow"], evidence: projectLinks.tcFlow }),
    ],
  },
  {
    id: "trust-auth",
    eyebrow: "TRUST / AUTH",
    title: "Trust / Auth",
    summary: "身份认证、授权、凭据隔离与审计",
    label: "Trust / Auth",
    subtitle: "身份认证、授权、凭据隔离与审计",
    tone: "vermilion",
    nodes: [
      node({ id: "authn-authz", iconSlug: "chainlink", label: "AuthN / AuthZ", aliases: ["Authentication", "Authorization"], summary: "确认你是谁，以及你能做什么", plainLanguage: "认证负责验明身份，授权负责限制身份可访问的资源和动作。", interviewAngle: "先区分 AuthN/AuthZ，再讲策略位置、默认拒绝和越权防护。", projectIds: ["babysteps", "github-profile-studio", "agent-market"], evidence: projectLinks.babySteps, featured: true }),
      node({ id: "session-jwt", iconSlug: "chainlink", label: "Session / JWT", aliases: ["Cookie Session", "Access Token", "Refresh Token"], summary: "浏览器会话与无状态令牌", plainLanguage: "Session 由服务端记登录状态，JWT 把可验证声明放进令牌。", interviewAngle: "比较撤销、过期、轮换、Cookie 属性和 XSS/CSRF 风险。", projectIds: ["babysteps", "agent-market"], evidence: projectLinks.babySteps, featured: true }),
      node({ id: "oauth-oidc", iconSlug: "github", label: "OAuth 2.0 / OIDC", aliases: ["Authorization Code", "PKCE", "ID Token"], summary: "第三方授权与统一登录身份层", plainLanguage: "OAuth 解决代用户授权，OIDC 在它上面补充可验证的登录身份。", interviewAngle: "讲授权码 + PKCE、state/nonce、回调白名单和令牌受众。", projectIds: ["github-profile-studio", "babysteps"], evidence: projectLinks.profileStudio, featured: true }),
      node({ id: "github-app-oidc", iconSlug: "github", label: "GitHub App / OIDC", aliases: ["Installation Token", "Workload Identity"], summary: "短期机器身份与仓库权限", plainLanguage: "自动化任务不用长期密码，按仓库和时间申请最小权限令牌。", interviewAngle: "说明 GitHub App 安装权限、OIDC 信任条件和短期凭据。", projectIds: ["portfolio-sync", "fullstack-showcase"], evidence: projectLinks.portfolioSync, featured: true }),
      node({ id: "hmac-api-token", iconSlug: "chainlink", label: "HMAC / API Token", aliases: ["Webhook Signature", "Bearer Token"], summary: "请求验签与服务间凭据", plainLanguage: "API Token 表示调用身份，HMAC 还能证明消息内容没有被篡改。", interviewAngle: "讲常量时间比较、时间窗、原始请求体、轮换和作用域。", projectIds: ["portfolio-sync", "github-profile-studio"], evidence: projectLinks.portfolioSync, featured: true }),
      node({ id: "least-privilege", iconSlug: "git", label: "Least Privilege", aliases: ["Deny by Default", "Scoped Permission"], summary: "默认拒绝与最小权限", plainLanguage: "账号、令牌和服务只拿完成当前任务真正需要的权限。", interviewAngle: "说明权限拆分、临时授权、权限审计和失败安全。", projectIds: ["portfolio-sync", "fullstack-showcase", "agent-market"], evidence: projectLinks.portfolioSync, featured: true }),
      node({ id: "secret-isolation", iconSlug: "chainlink", label: "Secret Isolation", aliases: ["Keychain", "Server-only Secret", "Environment Secret"], summary: "浏览器、服务端与本机凭据隔离", plainLanguage: "密钥不进前端包、不写仓库，按运行环境放到受控位置。", interviewAngle: "讲构建时/运行时变量、Keychain、Secret Store 和泄露响应。", projectIds: ["github-profile-studio", "portfolio-sync"], evidence: projectLinks.profileStudio }),
      node({ id: "wallet-signature", iconSlug: "ethereum", label: "Wallet Signature", aliases: ["SIWE", "EIP-712", "Message Signature"], summary: "钱包持有证明与结构化签名", plainLanguage: "不交出私钥，通过签名证明自己控制某个钱包地址。", interviewAngle: "说明 SIWE/EIP-712、域分离、链 ID 和签名用途边界。", projectIds: ["agent-market", "babysteps"], evidence: projectLinks.agentMarket }),
      node({ id: "nonce-replay", iconSlug: "ethereum", label: "Nonce / Replay", aliases: ["Replay Protection", "Timestamp Window"], summary: "一次性挑战与重放攻击防护", plainLanguage: "每次登录或敏感操作用新的随机数，旧签名不能再次利用。", interviewAngle: "讲 nonce 生命周期、原子消费、过期时间和跨域重放。", projectIds: ["agent-market", "babysteps"], evidence: projectLinks.agentMarket }),
      node({ id: "rbac", iconSlug: "chainlink", label: "RBAC / Policy", aliases: ["Role-based Access Control", "Resource Policy"], summary: "角色、资源与动作授权", plainLanguage: "按角色定义能对哪些资源做哪些操作，特殊场景再叠加资源规则。", interviewAngle: "讲角色爆炸、资源归属、服务端强制校验和策略测试。", projectIds: ["agent-market", "babysteps"], evidence: projectLinks.agentMarket }),
      node({ id: "audit-log", iconSlug: "git", label: "Audit Log", aliases: ["Security Event", "Traceable Action"], summary: "关键操作留痕与责任追踪", plainLanguage: "记录谁在什么时间对什么资源做了什么，方便排查和追责。", interviewAngle: "说明不可变字段、脱敏、保留周期、关联 ID 和查询权限。", projectIds: ["agent-market", "portfolio-sync"], evidence: projectLinks.agentMarket }),
      node({ id: "evidence-integrity", iconSlug: "solidity", label: "Integrity / Trust", aliases: ["Hash", "On-chain Anchor", "Tamper Evidence"], summary: "哈希校验与可篡改性控制", plainLanguage: "用哈希或链上锚点证明某份结果在某个时间后没有被悄悄改动。", interviewAngle: "区分内容真实性、完整性、时间证明和链上存储成本。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket }),
    ],
  },
];

export const getCapabilityNode = (nodeId: string) =>
  CAPABILITY_DOMAINS.flatMap((domain) => domain.nodes).find((item) => item.id === nodeId);

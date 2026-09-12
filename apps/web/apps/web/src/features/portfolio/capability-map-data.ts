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
      node({ id: "qwen3-qlora", iconSlug: "huggingface", label: "Qwen3 / QLoRA", aliases: ["LlamaFactory", "NF4", "LoRA"], summary: "领域模型微调与私有化交付", plainLanguage: "用少量领域数据低成本训练大模型，让它更懂具体业务。", interviewAngle: "可展开数据审计、双卡训练、Adapter 合并、量化与离线验收链路。", projectIds: ["personal-ai-agent"], evidence: projectLinks.personalAgent, featured: true }),
      node({ id: "rag-rerank", iconSlug: "langchain", label: "RAG / Rerank", aliases: ["Embedding", "Vector Search", "Qwen Embedding"], summary: "检索增强生成与候选重排", plainLanguage: "先从知识库找准资料，再让模型基于资料回答，减少胡编。", interviewAngle: "说明切分、召回、重排、引用和无答案降级如何组成闭环。", projectIds: ["personal-ai-agent", "agent-market"], evidence: projectLinks.personalAgent, featured: true }),
      node({ id: "langgraph-dag", iconSlug: "langchain", label: "LangGraph DAG", aliases: ["StateGraph", "Checkpoint", "Human in the loop"], summary: "有状态多阶段 Agent 工作流", plainLanguage: "把复杂任务拆成可暂停、可恢复、可人工介入的一组步骤。", interviewAngle: "重点讲状态机、条件边、检查点、失败恢复和人工审批。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "react-planning", iconSlug: "anthropic", label: "ReAct / Planning", aliases: ["Reason + Act", "Planner / Executor"], summary: "推理、行动与计划执行", plainLanguage: "让 Agent 边思考边调用工具，并根据结果修正下一步。", interviewAngle: "区分规划器、执行器和验证器，解释如何限制循环与成本。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "tool-calling", iconSlug: "bruno", label: "Tool Calling", aliases: ["Function Calling", "Structured Tool"], summary: "受约束的工具选择与执行", plainLanguage: "模型只负责决定调用什么，真实操作由有权限边界的程序执行。", interviewAngle: "可讲 Schema 校验、权限白名单、超时、幂等和工具结果回灌。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "agent-runtime", iconSlug: "anthropic", label: "Agent Runtime", aliases: ["Orchestrator", "Execution Runtime"], summary: "任务状态、权限与执行证据约束", plainLanguage: "负责真正跑 Agent，并管住状态、权限、重试和退出条件。", interviewAngle: "从任务生命周期、租约、恢复和资源上限解释生产运行边界。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "multi-agent", iconSlug: "anthropic", label: "Multi-Agent", aliases: ["Agent Collaboration", "Supervisor"], summary: "多角色协作与任务分发", plainLanguage: "让不同擅长方向的 Agent 分工，并由调度器汇总结果。", interviewAngle: "说明角色边界、候选选择、并行执行、冲突处理和结果聚合。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket }),
      node({ id: "mcp-memory", iconSlug: "redis", label: "MCP / Memory", aliases: ["Model Context Protocol", "Short / Long-term Memory"], summary: "工具协议与分层记忆", plainLanguage: "用统一协议接工具，并区分当前对话、任务状态和长期知识。", interviewAngle: "讲清上下文裁剪、记忆检索、隔离范围和敏感信息过滤。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket }),
      node({ id: "evaluation", iconSlug: "jest", label: "LLM Evaluation", aliases: ["LLM-as-Judge", "Golden Set", "Regression Eval"], summary: "相关性、完整性与业务一致性评测", plainLanguage: "用固定题集和多维评分判断模型升级后到底有没有变好。", interviewAngle: "区分确定性指标、模型裁判、人工抽检和回归门槛。", projectIds: ["personal-ai-agent", "agent-market"], evidence: projectLinks.personalAgent }),
      node({ id: "intent-routing", iconSlug: "anthropic", label: "Intent Routing", aliases: ["Intent Classification", "BERT Routing"], summary: "咨询意图识别与处理链路分流", plainLanguage: "先判断用户在问什么，再送到售前、售后、技术或人工通道。", interviewAngle: "可讲多标签分类、置信度阈值、误判成本和人工兜底。", projectIds: ["personal-ai-agent"], evidence: projectLinks.personalAgent }),
      node({ id: "embedding-knowledge", iconSlug: "langchain", label: "Knowledge Graph", aliases: ["Embedding Retrieval", "Graph RAG"], summary: "语义检索与结构化知识关联", plainLanguage: "既按语义找相似内容，也利用实体关系补足上下文。", interviewAngle: "说明向量召回与图关系的互补，以及更新和去重策略。", projectIds: ["personal-ai-agent"], evidence: projectLinks.personalAgent }),
      node({ id: "structured-fallback", iconSlug: "bruno", label: "Structured Fallback", aliases: ["JSON Schema", "Guardrail", "Human Handoff"], summary: "结构化输出、降级与转人工", plainLanguage: "模型不确定、格式错误或遇到敏感问题时，不硬答，自动降级或转人工。", interviewAngle: "讲 Schema 重试、低置信阈值、敏感规则和人工接管上下文。", projectIds: ["personal-ai-agent", "agent-market"], evidence: projectLinks.personalAgent }),
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
      node({ id: "redis-cache", iconSlug: "redis", label: "Redis / Cache", aliases: ["TTL", "Distributed Cache"], summary: "热点数据缓存与过期治理", plainLanguage: "把频繁读取的数据临时放在更快的位置，降低数据库压力。", interviewAngle: "说明缓存穿透、击穿、雪崩、一致性与失效策略。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket }),
      node({ id: "api-contract", iconSlug: "bruno", label: "API Contract", aliases: ["OpenAPI", "Schema Validation"], summary: "前后端可验证接口契约", plainLanguage: "把请求、响应和错误格式写成机器可检查的协议。", interviewAngle: "讲契约测试、版本兼容、运行时校验和错误码语义。", projectIds: ["github-profile-studio", "agent-market"], evidence: projectLinks.profileStudio }),
      node({ id: "sse-streaming", iconSlug: "react", label: "SSE / Streaming UI", aliases: ["Server-Sent Events", "Token Stream"], summary: "增量响应与流式界面", plainLanguage: "答案生成到哪就展示到哪，不让用户一直等完整结果。", interviewAngle: "说明断线恢复、取消、背压、乱序和流式状态管理。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket }),
      node({ id: "async-jobs", iconSlug: "redis", label: "Async Jobs", aliases: ["Worker", "Queue Consumer", "Background Task"], summary: "长任务异步执行与状态回传", plainLanguage: "把耗时工作放到后台执行，页面只订阅进度和最终结果。", interviewAngle: "讲任务租约、重试、重复消费、进度事件和取消。", projectIds: ["agent-market", "portfolio-sync"], evidence: projectLinks.agentMarket }),
      node({ id: "cocos", iconSlug: "cocos", label: "Cocos Creator", aliases: ["Mini Game", "Scene / Component"], summary: "小游戏场景、组件与资源工程", plainLanguage: "用组件和场景系统实现可交互的轻量游戏产品。", interviewAngle: "说明资源生命周期、场景切换、性能预算和多端适配。", projectIds: ["cocos-mini-game"], evidence: projectLinks.cocos }),
      node({ id: "csr-fallback", iconSlug: "react", label: "CSR Fallback", aliases: ["Client Render", "Fatal Remount"], summary: "水合失败时的一次性客户端降级", plainLanguage: "服务端页面接管失败时，用受控方式重新客户端渲染，避免无限重试。", interviewAngle: "强调只允许一次降级、错误观测和状态清理。", projectIds: ["babysteps", "fullstack-showcase"], evidence: projectLinks.babySteps }),
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
      node({ id: "checkpoint-state", iconSlug: "postgresql", label: "Checkpoint / State", aliases: ["State Machine", "Resume", "Durable State"], summary: "长流程检查点与恢复", plainLanguage: "每完成一步就保存状态，服务中断后可以从正确位置继续。", interviewAngle: "讲状态版本、原子更新、恢复边界和过期任务处理。", projectIds: ["agent-market", "tc-flow"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "retry-idempotency", iconSlug: "git", label: "Retry / Idempotency", aliases: ["Backoff", "Idempotency Key"], summary: "安全重试与重复请求去重", plainLanguage: "失败可以重试，但同一任务不会因此重复扣款或重复执行。", interviewAngle: "说明幂等键、指数退避、可重试错误和业务去重表。", projectIds: ["agent-market", "portfolio-sync"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "queue-dlq", iconSlug: "redis", label: "Queue / DLQ", aliases: ["SQS", "Event Bus", "Dead Letter Queue"], summary: "异步解耦、削峰与失败隔离", plainLanguage: "把任务排队慢慢处理，连续失败的任务单独隔离等待排查。", interviewAngle: "讲可见性超时、重复投递、死信队列和消费速率。", projectIds: ["agent-market", "portfolio-sync"], evidence: projectLinks.agentMarket, featured: true }),
      node({ id: "observability", iconSlug: "webgpu", label: "Observability", aliases: ["Logs", "Metrics", "Tracing"], summary: "日志、指标与链路定位", plainLanguage: "不仅知道系统坏了，还能定位哪一步、哪个请求、为什么坏。", interviewAngle: "说明关联 ID、结构化日志、关键指标和告警降噪。", projectIds: ["babysteps", "fullstack-showcase"], evidence: projectLinks.dashboard }),
      node({ id: "performance-cost", iconSlug: "webgpu", label: "Performance / Cost", aliases: ["Core Web Vitals", "Budget", "Profiling"], summary: "性能预算与资源成本控制", plainLanguage: "同时控制用户等待时间和云资源账单，避免只快不省或只省不卡用。", interviewAngle: "讲真实用户指标、性能预算、采样可信度和成本护栏。", projectIds: ["babysteps", "fullstack-showcase"], evidence: projectLinks.dashboard }),
      node({ id: "localstack", iconSlug: "cloudflare-workers", label: "LocalStack / Local Dev", aliases: ["Cloud Emulator", "Integration Environment"], summary: "本地模拟云服务与集成链路", plainLanguage: "没有真实云账号时，先在本地模拟队列、对象存储和函数调用。", interviewAngle: "说明模拟环境的价值、差异和上线前真实环境补验。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket }),
      node({ id: "tc-flow", iconSlug: "git", label: "TC Flow", aliases: ["N1-N8", "Checkpoint", "Review Gate"], summary: "可恢复、可审查的工程交付流程", plainLanguage: "把大任务拆成小任务，每一步都留下状态、审查结果和恢复点。", interviewAngle: "讲 Contract、Task Review、Feature QA、Stop Hook 和多仓协作。", projectIds: ["tc-flow"], evidence: projectLinks.tcFlow }),
      node({ id: "compensation", iconSlug: "git", label: "Compensation", aliases: ["Saga", "Rollback Action"], summary: "跨服务失败后的补偿动作", plainLanguage: "多步操作中途失败时，不强求数据库大事务，而是执行反向动作恢复业务。", interviewAngle: "说明 Saga、补偿幂等、人工介入和不可逆步骤。", projectIds: ["agent-market"], evidence: projectLinks.agentMarket }),
      node({ id: "model-degradation", iconSlug: "anthropic", label: "Model Degradation", aliases: ["Fallback Model", "Circuit Breaker", "Rate Limit"], summary: "模型故障与限流时的服务降级", plainLanguage: "主模型超时或太贵时，切换备用模型、规则结果或转人工。", interviewAngle: "讲熔断、限流、路由策略、质量底线和成本上限。", projectIds: ["agent-market", "personal-ai-agent"], evidence: projectLinks.agentMarket }),
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

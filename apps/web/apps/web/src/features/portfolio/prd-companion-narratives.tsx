const narratives = [
	{
		"id": "service-agent-workbench",
		"title": "售后 Agent 工作台",
		"desc": "用工单、处理提案、权限审批与效果核对串起售后流程，让版本、责任和未知结果可追踪。",
		"points": [
			"机制：MCP 工具边界、批准绑定版本与角色；独立动作账本处理重复提交和结果未知，先核对原操作再决定下一步。",
			"版本：既有产品与当前产品化迭代分开；本地模型提案、最新界面与整品验收按对应范围说明，不写成新增生产效果。"
		]
	},
	{
		"id": "hono-github-profile",
		"title": "Hono GitHub 资料云服务",
		"desc": "围绕外部资料读取、白名单映射与幂等存储组织全栈流程，与 Profile Studio 的本地产品分开。",
		"points": [
			"机制：令牌仅用于请求，可信字段经过校验后存储；稳定错误与幂等迁移连接 API、数据库和页面。",
			"云方案：Serverless、私网数据库、短期身份及预览隔离有明确设计边界；真实 AWS / 数据库闭环不凭方案或 Studio 证据宣称。"
		]
	},
	{
		"id": "wechat-intent-hud",
		"title": "WeChat Intent HUD",
		"desc": "用户主动触发的本机意图与表达辅助工具，只读可见输入并旁路提供候选，不替用户发送消息。",
		"points": [
			"机制：选区与受限 OCR 来源分开；会话修订、取消和超时作废迟到结果，不读取完整聊天数据库。",
			"增强设计：真实模型效果与系统权限逐项核验；OCR 范围预览和确认按待接入方案说明，不以固定判断器证明模型质量。"
		]
	},
	{
		"id": "codex-translate",
		"title": "Codex Translate",
		"desc": "划词后结合中文含义、技术缩写与带来源资料检索解释，需要深入时再由用户主动调用 AI。",
		"points": [
			"机制：本地优先，按语境区分缩写；SQLite FTS5 检索保留来源行号，索引更新与安全导航有边界。",
			"交付与方案：本机应用安装与具体源版本分账；主动 AI 深挖、取消、语言包和签名权限按各自验证范围说明，不承诺永久免授权。"
		]
	},
	{
		"id": "knowledge-evidence-pipeline",
		"title": "知识整理与证据管线",
		"desc": "把官方文字与获准媒体整理成带来源、质量层级和复习入口的知识系统，公开展示只接收合格摘要。",
		"points": [
			"机制：原文、ASR 转录、复核总结与本人掌握分别记账；来源覆盖、时间定位和审核 Gate 支持可追溯整理。",
			"同步边界：知识库与网站各有交接和发布验收；未复核转录不升级为最终笔记，本轮不发布待处理媒体或私人原件。",
			"解析核心设计：短 PDF / 扫描图提取保留原页区域，提供质量报告；默认临时、显式保存、取消清理与节点审计分层，尚无 OCR 实现或性能实测。"
		]
	},
	{
		"id": "codex-mascot",
		"title": "Codex Mascot / BaoBao Puff",
		"desc": "以角色、动画状态、方向与透明图集契约组织可审阅的本机宠物资产交付，与 Hatch Pet 生成流程设计分开。",
		"points": [
			"机制：图集和 manifest 做确定性校验，动作语义、角色身份与方向连续性独立视觉审核；资产交付不等于生成服务。",
			"轮换设计：按时段选择角色、保持同槽位幂等且不覆盖用户新选择；客户端轮换与消息框主题按实际接入范围说明。"
		]
	}
];

export function PrdCompanionNarratives() {
	return (
		<div className="space-y-5" data-prd-companions>
			{narratives.map((item) => (
				<article key={item.id} className="space-y-2 border-t border-current/15 pt-4">
					<h4 className="text-lg font-semibold">{item.title}</h4>
					<p>{item.desc}</p>
					<ul className="list-disc space-y-1 pl-5">
						{item.points.map((point) => <li key={point}>{point}</li>)}
					</ul>
				</article>
			))}
		</div>
	);
}

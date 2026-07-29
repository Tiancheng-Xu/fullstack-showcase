# nurture-bloom-mvp — 技术设计

## 设计来源

- Stitch 素材：`/Users/shier/Downloads/stitch_.zip`
- 视觉规范：`stitch_/nurture_bloom/DESIGN.md`
- 相关学习参考：`/Users/shier/Desktop/育婴记录系统/specs/`

## 技术方向

- 以 Better-T-Stack 生成的全栈项目为基础。
- Web 层使用 React、TypeScript、Tailwind 和项目默认路由/查询方案。
- 服务端使用项目默认类型安全 RPC 与 Hono 边界；如脚手架版本有差异，以稳定可运行方案为准。
- 数据访问使用 Drizzle，先选择适合本地快速验证的数据库配置。
- 具体目录、依赖和任务拆分由 TC Flow Contract 阶段冻结。

## 功能边界

首版优先完成 Stitch UI 的成长首页、时光、百科、我的四个入口，以及本地数据交互。真实云部署、认证、媒体上传和 AI 功能不作为首轮阻塞条件，但必须避免设计成无法扩展的结构。

## 视觉约束

- 暖奶油背景和白色卡片。
- 橙色作为主操作色，蓝色/薄荷色作为信息和状态辅助色。
- 8px 间距基线，16–32px 圆角，低透明度柔和阴影。
- 移动端优先，底部导航不遮挡主要操作。
- 公共颜色、字体、间距、圆角、阴影和焦点状态集中管理。

## 学习约束

实现过程按实践关卡推进：先 UI，再类型安全 API，再 Drizzle，再 GitHub API，再 AWS SAM。每个关卡应留下可复现命令和学习记录，避免只生成无法解释的代码。

# Apps

应用边界位于独立子目录，但只有包含 `package.json` 的应用才进入安装、测试和
部署流程。

- `apps/web` 是当前可运行、可测试和可部署的 React + Vite 前端。
- `apps/api` 是 documentation-only 的未来后端边界，目前不包含
  `package.json`，也不会参与工作区命令或部署。

在仓库根目录使用 `pnpm dev`、`pnpm test`、`pnpm typecheck` 和 `pnpm build`。

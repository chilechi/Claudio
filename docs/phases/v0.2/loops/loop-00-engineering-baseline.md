# Loop 00：v0.2 工程迁移与技术基线

目标：把 v0.1 的原生页面工程升级成 v0.2 可维护工程基线。

计划：

- 引入 Vite + React + TypeScript 前端。
- 引入 Node + TypeScript + Fastify 后端。
- 保留 v0.1 功能作为迁移参考，不直接删除可用能力。
- 建立 `apps/web`、`apps/server`、`packages/shared` 或等价结构。

产物：

- 前后端工程结构
- TypeScript 配置
- npm scripts
- shared 类型定义
- v0.1 迁移说明

配置：

- 保留 `.env.example`
- 不提交 `.env`

测试：

- `npm install`
- `npm run build`
- `npm run dev`
- 健康检查接口可用

验收：

- 前端和后端能同时启动。
- 类型检查通过。
- v0.1 页面能力没有被直接弄丢。
- GitHub 已中文提交并推送。

提交：

```powershell
git add .
git commit -m "工程：建立 v0.2 技术基线"
git push origin main
```

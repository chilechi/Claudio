# Loop 03：迁移 NestJS 后端骨架

目标：建立 `apps/server` 的 NestJS + Fastify adapter 后端骨架，并保持 v0.2 API 路径兼容。

## 计划

- 搭建 NestJS 应用入口。
- 建立基础模块：
  - `ConfigModule`
  - `HealthModule`
  - `SettingsModule`
- 接入 Fastify adapter。
- 保留旧 `server.js`。

## 改代码

- 新增 `apps/server/src/main.ts`。
- 新增模块目录。
- 把 `/api/health`、`/api/settings/diagnostics` 迁到新服务。

## 配置

- 更新 `package.json` scripts：
  - `dev:server`
  - `build:server`
  - `start:server`
- 默认 `npm start` 暂不切换，直到 Loop 10。

## 修复

- 配置读取统一到 config service。
- provider status 不泄露 `.env` 原文。

## 测试

- 新服务临时端口启动。
- `/api/health` 返回 `0.3.x` 或 v0.3 标识。
- `/api/settings/diagnostics` 字段符合 shared schema。

## 严格验收

- 旧 `server.js` 仍可启动。
- 新 Nest 服务也可启动。
- 两边 health/settings 行为一致。
- 浏览器页面仍能用旧服务打开。
- 验收文档写入 `docs/phases/v0.3/validation/loop-03-nest-server-shell.md`。

## 提交

```powershell
git add apps/server package.json docs/phases/v0.3/validation
git commit -m "工程：建立 NestJS 后端骨架"
git push origin main
```

# Loop 03 验收：NestJS 后端骨架

日期：2026-06-20

## 计划

- 建立 `apps/server` 的 NestJS + Fastify adapter 后端骨架。
- 建立基础模块：`ConfigModule`、`HealthModule`、`SettingsModule`。
- 迁移 `/api/health` 和 `/api/settings/diagnostics`。
- 保留旧 `server.js` 默认入口，避免破坏 v0.2。

## 改代码

- 新增 `apps/server/src/main.ts`。
- 新增 `apps/server/src/modules/app.module.ts`。
- 新增 `apps/server/src/modules/config/*`。
- 新增 `apps/server/src/modules/health/*`。
- 新增 `apps/server/src/modules/settings/*`。
- 删除旧的手写 Fastify `apps/server/src/index.ts` 和 `apps/server/src/config.ts`。
- 更新 `apps/server/tsconfig.json`，开启 Nest 装饰器支持。
- 更新 `package.json`：`start:server`、`start:compiled`、`dev:server`、`build:shared`、`build:server`。
- 安装 Nest/Fastify 运行依赖。

## 配置

- 没有新增 `.env` 项。
- 新 `ConfigService` 会读取本地 `.env` 和 `process.env`，且 `process.env` 优先级更高。
- 设置诊断只返回变量名、状态和文档路径，不返回密钥值。

## 修复

- 新 Nest 运行时 schema 从 `packages/shared/dist` 读取，避免引用 `src/index.js`。
- `toad-cache` 钉到 `3.7.0`，避开 `3.7.1` 缺失 CJS 文件的问题。

## 测试

### 类型和构建

```powershell
npm run typecheck
npm run build
```

结果：全部通过。

### 新 Nest 服务启动

命令：

```powershell
$env:PORT='18115'
npm run start:server
```

结果：未通过。当前本机 `node_modules/fast-json-stringify` 包内容不完整，运行时报错：

```text
Cannot find module 'D:\workspace\Claudio\node_modules\fast-json-stringify\index.js'
```

处理：

- 已按要求停止继续追装依赖。
- 缺口已写入 `docs/phases/v0.2/missing-inputs.md`。
- 后续建议清理 `node_modules` 后重新 `npm install`。

### 旧 v0.2 服务启动

目标：`http://127.0.0.1:18116`

结果：

```json
{
  "ok": true,
  "name": "Claudio",
  "version": "0.2.0"
}
```

### 浏览器验收

目标：`http://127.0.0.1:18116/`

结果：

- 页面标题为 `Claudio`。
- 页面能显示 `播放器`、`队列`、`配置诊断`。
- 页面能显示网易云元数据模式提示。
- 控制台 error 数量：0。
- 旧页面仍存在队列栏显示 `0 首` 的已知问题，继续进入播放器阶段修复。

## 严格验收

- 旧 `server.js` 仍可启动。
- 新 Nest 代码可构建。
- 新 Nest 服务运行被本地依赖文件缺失阻塞，已记录缺口。
- 诊断响应使用 shared schema 解析。
- 浏览器页面仍可用。
- 未提交 `.env`、Cookie、API key。
- 未提交运行状态文件。

## 后续 Loop 入口

Loop 04 迁移音乐源和状态服务前，建议先处理本地依赖缺口：

```powershell
Remove-Item node_modules -Recurse -Force
npm install
npm run build
npm run start:server
```

如果依赖缺口暂时不处理，Loop 04 可以继续迁移代码和构建验证，但新 Nest 服务运行验收仍会被同一问题阻塞。

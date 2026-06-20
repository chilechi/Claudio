# Loop 01 验收：shared 类型和 Schema

日期：2026-06-20

## 计划

- 将 Loop 00 的 API 合同落到 `packages/shared`。
- 建立可运行的 Zod schema 和由 schema 推导的 TypeScript 类型。
- 覆盖 `Track`、`MusicSource`、`QueuePlan`、`ProviderStatus`、`TasteProfile`、`PlayerEvent`、`ChatRequest`、`ChatResponse`。
- 验证非法 plan、空 queue、未知 provider state 会失败。
- 验证真实 v0.2 API 响应能通过 shared schema。

## 改代码

- 新增 `packages/shared/src/schemas.ts`。
- 重建 `packages/shared/src/types.ts`，类型由 Zod schema 推导。
- 更新 `packages/shared/src/index.ts`，同时导出 schema 和类型。
- 调整 `packages/shared/tsconfig.json`，让 shared 构建产出可运行 JS，后续 server 可以运行时复用 schema。
- 更新 `.gitignore`，忽略 TypeScript 构建缓存 `*.tsbuildinfo`。
- 修正 v0.2 输出字段：
  - `server.js` 对静态曲库 track 做规范化，补齐 `source`、`playable`、`durationText`。
  - `radio/routines.js` 的口味画像输出从 `score` 规范为 `count`。
  - `public/app.js` 兼容展示 `count`，保留旧 `score` fallback。

## 配置

- 没有新增 `.env` 项。
- 使用临时端口 `PORT=18111` 启动 v0.2 服务验证。

## 修复

- 修复 API track 字段与合同不一致的问题：网易云元数据 track 现在明确 `playable=false`，不会伪装为可播放。
- 修复口味画像字段漂移：`topTags/topArtists` 使用合同字段 `count`。
- 仍保留待修复问题：页面队列栏显示 `0 首`，但当前曲目存在。该问题进入 Loop 06/07 播放器一致性验收。

## 测试

### 类型和构建

```powershell
npm run typecheck
npm run build:server
npm run build:web
```

结果：全部通过。

### shared schema 正反例

执行内容：

- `activeLibrarySchema` 解析合法网易云元数据曲库。
- `queuePlanSchema` 解析合法队列计划。
- `chatRequestSchema` 拒绝空白输入。
- `deepSeekPlanSchema` 解析合法 DeepSeek plan。
- `deepSeekPlanSchema` 拒绝空 `queueIds`。
- `diagnosticsResponseSchema` 拒绝未知 provider state。
- `playerEventSchema` 接受合法音量事件。
- `playerEventSchema` 拒绝 `volume > 1`。

结果：

```json
{
  "pass": true
}
```

### 真实 API schema 校验

使用 `packages/shared/dist/index.js` 校验临时服务真实响应。

| API | 状态 | Schema |
| --- | --- | --- |
| `GET /api/music/active-library` | 200 | 通过 `activeLibrarySchema` |
| `GET /api/plan/today` | 200 | 通过 `queuePlanSchema` |
| `GET /api/taste/profile` | 200 | 通过 `tasteProfileResponseSchema` |
| `GET /api/settings/diagnostics` | 200 | 通过 `diagnosticsResponseSchema` |
| `GET /api/state` | 200 | 通过 `stateSchema` |
| `POST /api/chat` 空输入 | 400 | 通过 `apiErrorSchema` |

### 浏览器验收

目标：`http://127.0.0.1:18111/`

结果：

- 页面标题为 `Claudio`。
- 页面能显示 `播放器`、`队列`、`配置诊断`。
- 页面能显示网易云元数据模式提示。
- 控制台 error 数量：0。
- 未发现本 Loop 改动导致的新页面错误。

## 严格验收

- shared 不依赖 DOM。
- shared 不读取 `.env`。
- shared 可以被 server 构建引用：`npm run build:server` 通过。
- shared 可以被 web 构建引用：`npm run build:web` 通过。
- schema 覆盖 DeepSeek plan 的非法 JSON 后结构校验场景：空 `queueIds` 会失败。
- 未提交 `.env`、Cookie、API key。
- 未提交运行状态文件。

## 后续 Loop 入口

Loop 02 可以基于这些 schema 建立 `packages/core`：

- active library 选择逻辑。
- plan 修复逻辑。
- queue 与 track ID 一致性检查。
- taste profile 纯函数。

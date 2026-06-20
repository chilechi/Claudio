# Loop 00 验收：v0.3 工程边界和 API 合同

日期：2026-06-20

## 计划

- 读取 v0.3 技术计划、严格验收标准和 v0.2 缺口清单。
- 盘点 v0.2 当前 API。
- 定义 Web、mobile、server、shared、core、audio-worker 的边界。
- 新增 API contract 初稿，标注必须兼容字段、错误态和不能伪造的能力。
- 启动 v0.2 服务做接口和页面验收。

## 改代码

本 Loop 不迁移业务代码，只新增合同和验收文档：

- `docs/phases/v0.3/contracts/boundaries.md`
- `docs/phases/v0.3/contracts/api-contract.md`
- `docs/phases/v0.3/validation/loop-00-contracts.md`

## 配置

- 没有新增 `.env` 项。
- 使用临时端口 `PORT=18110` 启动 v0.2 服务，避免占用默认 8080。
- 当前本机配置下，音乐源选择为网易云元数据模式；本地音乐目录也可以扫描到真实音频。

## 修复

- 本 Loop 未修复业务代码。
- 发现并记录一个后续必须修复的 v0.2 表现：页面可显示当前曲目，但队列栏显示 `0 首`。这属于播放器/状态一致性问题，纳入后续 Loop 06/07 验收。

## 测试

### 类型检查

```powershell
npm run typecheck
```

结果：通过。

### 服务启动

```powershell
$env:PORT='18110'
node server.js
```

结果：服务可启动，`GET /api/health` 返回 `200`。

### API 实测摘要

| API | 状态 | 摘要 |
| --- | --- | --- |
| `GET /api/health` | 200 | `ok=true`，`name=Claudio`，`version=0.2.0` |
| `GET /api/music/active-library` | 200 | `source.type=netease`，`selected=netease`，`tracks=13`，存在 fallback 说明 |
| `GET /api/plan/today` | 200 | 返回 `mode`、`queue`、`reply`、`reason`、`aiProvider`，队列 4 首 |
| `POST /api/chat` | 200 | 输入有效时返回结构化 plan，队列 3 首 |
| `GET /api/radio/today` | 200 | 返回 `mode`、`queue`、`profile`、`reason`、`reply` |
| `GET /api/taste/profile` | 200 | 返回 active source 和口味画像字段 |
| `GET /api/settings/diagnostics` | 200 | 9 个 provider，summary 为 ready/fallback/missing |
| `GET /api/music/local/scan` | 200 | 本机配置下 `configured=true`，可扫描到 16 首本地音频 |
| `GET /api/music/netease/status` | 200 | 本机配置下已配置歌单 ID |
| `GET /api/state` | 200 | 返回当前曲目、队列、收藏、跳过和最近提示词 |

### 浏览器验收

目标：`http://127.0.0.1:18110/`

结果：

- 页面标题为 `Claudio`。
- 页面能显示 `播放器`、`队列`、`配置诊断`。
- 页面能显示网易云元数据模式提示，未伪装为全部可直接播放。
- 控制台 error 数量：0。
- 已记录待修复问题：页面队列栏显示 `0 首`，但当前曲目区域有曲目信息。

## 严格验收

- API 请求和响应结构已写入 `contracts/api-contract.md`。
- Web/mobile 都需要的字段已标注。
- 合同没有包含浏览器 DOM 状态。
- 缺配置和 fallback 规则已写入合同。
- 未提交 `.env`、Cookie、API key 或运行状态文件。

## 后续 Loop 入口

Loop 01 需要把本文 API 合同落到 `packages/shared`：

- shared 类型补齐 `detail`、`envVars`、`docs`、`source`、`diagnostics`、`state`。
- 使用 Zod schema 校验核心 API 响应。
- 确认 shared 不依赖 DOM、HTTP、Node 进程环境。

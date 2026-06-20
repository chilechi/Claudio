# Loop 05 验收：AI DJ 和口味电台服务

日期：2026-06-20

## 计划

- 建立 `AiModule`。
- 建立 `RadioModule`。
- 建立 `TasteModule`。
- 使用 shared schema 校验 DeepSeek 返回。
- 将 `/api/chat`、`/api/plan/today`、`/api/radio/today`、`/api/taste/profile` 接入 Nest service。
- 保留旧 `server.js` fallback，并继续做真实接口/浏览器验收。

## 改代码

- 新增 `apps/server/src/modules/ai/*`。
- 新增 `apps/server/src/modules/radio/*`。
- 新增 `apps/server/src/modules/taste/*`。
- 更新 `apps/server/src/modules/app.module.ts`，接入 Ai/Radio/Taste。
- 修正 `packages/core/src/plan.ts` 的中文模式识别、回复和 reason。
- 修正 `packages/core/src/radio.ts` 的中文时段文案。

## 配置

- 没有新增 `.env` 项。
- DeepSeek key 仍从 `.env` 读取。
- `AI_PROVIDER=deepseek` 且有 key 时尝试 DeepSeek；失败时回退本地规则脑。
- `AI_PROVIDER=local` 时只使用本地规则脑。

## 修复

- DeepSeek 返回非法结构、请求失败、超时或未知 track id 时，不让 UI 空白。
- DeepSeek 返回未知 track id 时，使用 core `repairDeepSeekPlan` 过滤并补足。
- active library 为空时只返回空队列和明确 reason，不伪造歌曲。
- AI 回复继续保持 Claudio persona：温柔克制，不主动称呼用户。

## 测试

### 类型和构建

```powershell
npm run test:core
npm run typecheck
npm run build
```

结果：全部通过。

### 新 Nest service 逻辑校验

直接调用编译后的 service 类，不经 HTTP。

结果：

```json
{
  "local": {
    "schema": true,
    "provider": "local",
    "queue": 5
  },
  "repaired": {
    "provider": "deepseek",
    "firstKnown": true,
    "queue": 4,
    "noMissing": true
  },
  "empty": {
    "schema": true,
    "queue": 0,
    "reason": "active library 为空，无法生成真实队列。"
  },
  "errorFallback": {
    "schema": true,
    "provider": "local",
    "queue": 5
  },
  "taste": {
    "schema": true,
    "source": "netease"
  },
  "radio": {
    "mode": "evening",
    "queue": 6,
    "source": "netease"
  },
  "deepseekReady": {
    "configured": true,
    "provider": "deepseek",
    "queue": 5
  }
}
```

覆盖点：

- 本地规则脑可生成非空队列。
- DeepSeek ready 场景可生成 `deepseek` plan。
- DeepSeek 请求错误会回退到本地规则脑。
- DeepSeek plan 未知 ID 会被过滤，队列补足。
- 空 library 不伪造歌曲，并返回明确 reason。
- taste/radio 使用同一个 active library source。

### 新 Nest HTTP 启动

命令：

```powershell
$env:PORT='19161'
npm run start:server
```

结果：未通过，仍为 Loop 03/04 已记录的本地依赖缺口：

```text
Cannot find module 'D:\workspace\Claudio\node_modules\fast-json-stringify\index.js'
```

处理：不继续追装依赖；缺口已在 `docs/phases/v0.2/missing-inputs.md` 记录。

### 旧 fallback 服务 API 验收

目标：旧 `server.js`，`MUSIC_SOURCE=netease`。

结果：

```json
{
  "plan": {
    "provider": "deepseek",
    "queue": 4,
    "firstSource": "netease"
  },
  "chat": {
    "provider": "deepseek",
    "queue": 4,
    "firstSource": "netease",
    "hasReply": true
  },
  "radio": {
    "mode": "evening",
    "queue": 6,
    "firstSource": "netease"
  },
  "taste": {
    "source": "netease",
    "tags": 8
  }
}
```

### 浏览器验收

目标：旧 fallback 服务 `http://127.0.0.1:19160/`。

结果：

- 页面标题为 `Claudio`。
- 页面能显示播放器、Claudio 回复、今日计划、口味。
- 页面显示网易云元数据模式提示。
- 控制台 error 数量：0。
- 旧页面仍存在队列栏显示 `0 首` 的已知问题，继续进入播放器交互阶段修复。

## 严格验收

- `/api/chat` 不返回空 queue，除非 active library 真实为空并带明确 reason。
- AI plan 的 queue id 必须存在于 active library。
- DeepSeek ready、missing/local、错误回退、未知 ID、空 library 都有验收。
- UI 不因 AI 错误空白。
- 新 Nest service 逻辑符合 shared schema。
- 新 Nest HTTP 启动仍被本地依赖缺口阻塞，已记录。
- 旧 `server.js` fallback 未破坏。
- 未提交 `.env`、Cookie、API key。
- 未提交运行状态文件。

## 后续 Loop 入口

Loop 06 迁移 React Web 前端时需要：

- 接入 v0.3 API 合同。
- 解决队列栏显示 `0 首` 但当前曲目存在的问题。
- 保持中文界面、网易云 fallback 提示和设置诊断。

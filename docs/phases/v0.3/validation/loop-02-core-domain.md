# Loop 02 验收：core 业务逻辑包

日期：2026-06-20

## 计划

- 新增 `packages/core`，放置不依赖 HTTP、DOM、Node 进程环境的业务逻辑。
- 抽出推荐、AI plan 修复、口味画像、时段电台、音乐源选择策略。
- 保留旧 `brain/`、`radio/` 作为 v0.2 fallback，不在本 Loop 强行切换默认业务入口。
- 增加 core 测试脚本，覆盖空曲库、全 skipped、未知 AI track id、音乐源策略。

## 改代码

- 新增 `packages/core/src/plan.ts`
  - `inferMode`
  - `recommendTracks`
  - `buildLocalPlan`
  - `repairDeepSeekPlan`
- 新增 `packages/core/src/taste.ts`
  - `buildTasteProfile`
- 新增 `packages/core/src/radio.ts`
  - `routineForHour`
  - `buildRadioPlan`
- 新增 `packages/core/src/music-source.ts`
  - `selectActiveLibrary`
- 新增 `packages/core/src/index.ts` 和 `packages/core/tsconfig.json`。
- 新增 `scripts/test-core.mjs`。
- 更新根 `tsconfig.json`，加入 `packages/core` project reference。
- 更新 `package.json`：
  - `build:core`
  - `test:core`
  - `build` 先构建 core，再构建 server/web。
- 修正 `server.js` 静态网易云曲库规范化：默认 track source 为 `netease`，并保持 `playable=false`。

## 配置

- 没有新增 `.env` 项。
- 没有新增外部依赖。
- 使用临时端口 `PORT=18114` 验证 v0.2 服务。

## 修复

- `repairDeepSeekPlan` 会过滤未知 track id，并用本地推荐补足队列。
- `recommendTracks` 在全部歌曲都被 skipped 时仍稳定返回候选，避免 UI 空白。
- `selectActiveLibrary` 明确 `auto/local/netease` 三种策略：
  - `auto` 优先本地真实音频。
  - `local` 只返回本地结果，缺失时给 fallback reason。
  - `netease` 只返回网易云元数据，并提示不保证直接播放。

## 测试

### core 单元测试

```powershell
npm run test:core
```

结果：

```json
{
  "pass": true,
  "checks": 13
}
```

覆盖点：

- 不同输入推导不同 mode。
- liked 会影响推荐排序。
- skipped 会从推荐中避开。
- 全部 skipped 时仍返回稳定队列。
- 空 library 返回本地 fallback plan，不伪造歌曲。
- DeepSeek plan 中未知 ID 会被过滤并补足。
- 口味画像输出 `count`。
- 时段电台会避开 skipped。
- `MUSIC_SOURCE=auto/local/netease` 策略可区分。

### 类型和构建

```powershell
npm run typecheck
npm run build
```

结果：全部通过。

### core 纯度检查

```powershell
rg "fetch|window|document|process\.env" packages\core -n
```

结果：无匹配。

### v0.2 服务 smoke

目标：`http://127.0.0.1:18114`

接口摘要：

```json
{
  "activeStatus": "ok",
  "sourceType": "netease",
  "firstTrackSource": "netease",
  "firstTrackPlayable": false,
  "trackCount": 13,
  "planQueue": 4,
  "diagnosticsProviders": 9
}
```

### 浏览器验收

目标：`http://127.0.0.1:18114/`

结果：

- 页面标题为 `Claudio`。
- 页面能显示 `播放器`、`队列`、`配置诊断`。
- 页面能显示网易云元数据模式提示。
- 控制台 error 数量：0。
- 未发现本 Loop 改动导致的新页面错误。

## 严格验收

- core 不依赖 `fetch`。
- core 不依赖 `window`。
- core 不依赖 `document`。
- core 不读取 `process.env`。
- core 对空 library、空 queue、全 skipped 都有稳定返回。
- AI 返回未知 track id 时可过滤并补足。
- v0.2 默认服务仍可启动并返回核心 API。
- 未提交 `.env`、Cookie、API key。
- 未提交运行状态文件。

## 后续 Loop 入口

Loop 03 可以迁移 NestJS server shell：

- 先接入 shared schema 和 core 纯函数。
- 继续保留 `server.js` fallback。
- 新 server 未覆盖完整 v0.2 前，不替换 `npm start`。

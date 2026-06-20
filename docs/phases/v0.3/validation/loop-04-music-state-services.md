# Loop 04 验收：音乐源和状态服务

日期：2026-06-20

## 计划

- 建立 `MusicModule`。
- 建立 `StateModule`。
- 迁移本地音乐扫描和 stream。
- 迁移网易云元数据读取。
- 迁移 `MUSIC_SOURCE=auto/local/netease` 策略。
- 迁移播放器事件写状态。
- 保留旧 `server.js` fallback，并继续做真实接口/浏览器验收。

## 改代码

- 新增 `apps/server/src/modules/state/state.module.ts`。
- 新增 `apps/server/src/modules/state/state.service.ts`。
- 新增 `apps/server/src/modules/music/music.module.ts`。
- 新增 `apps/server/src/modules/music/music.controller.ts`。
- 新增 `apps/server/src/modules/music/music.service.ts`。
- 新增 `apps/server/src/modules/music/providers/local-music.provider.ts`。
- 新增 `apps/server/src/modules/music/providers/netease.provider.ts`。
- 更新 `apps/server/src/modules/app.module.ts`，接入 Music/State。
- 更新 `apps/server/src/modules/config/config.service.ts`，修正设置诊断中文文案。
- 更新 `packages/shared/src/schemas.ts`，让 state 支持 `hidden` 列表。
- 更新 `package.json`，让 `build:server` 先构建 core，确保 Nest 可运行时代码能引用 core dist。

## 配置

- 没有新增 `.env` 项。
- `MUSIC_SOURCE` 继续支持 `auto`、`local`、`netease`。
- 本地目录、网易云 Cookie、DeepSeek key 不写入日志或响应。

## 修复

- 新 Nest service 中 `MUSIC_SOURCE=netease` 只返回网易云元数据，`playable=false`，并带 fallback 提示。
- 新 Nest service 中 `MUSIC_SOURCE=local` 使用本地扫描结果；目录不可用时返回空 tracks 和原因。
- 播放器事件支持写入当前曲目、收藏、跳过、隐藏。
- 设置诊断中文文案修正为可读文本。

## 测试

### 类型和构建

```powershell
npm run typecheck
npm run build
```

结果：全部通过。

### 新 Nest service 逻辑校验

直接调用编译后的 Nest service 类，不经 HTTP。

结果：

```json
{
  "results": [
    {
      "source": "auto",
      "schema": true,
      "activeType": "local",
      "selected": "auto",
      "tracks": 16,
      "fallback": false
    },
    {
      "source": "local",
      "schema": true,
      "activeType": "local",
      "selected": "local",
      "tracks": 16,
      "fallback": false
    },
    {
      "source": "netease",
      "schema": true,
      "activeType": "netease",
      "selected": "netease",
      "tracks": 13,
      "fallback": true
    }
  ],
  "stateSchema": true,
  "eventCurrentTrack": "local-1b575677073a0ad0"
}
```

### 新 Nest HTTP 启动

命令：

```powershell
$env:PORT='19140'
npm run start:server
```

结果：未通过，仍为 Loop 03 已记录的本地依赖缺口：

```text
Cannot find module 'D:\workspace\Claudio\node_modules\fast-json-stringify\index.js'
```

处理：不继续追装依赖；缺口已在 `docs/phases/v0.2/missing-inputs.md` 记录。

### 旧 fallback 服务三种音乐源验收

使用旧 `server.js` 分别启动 `MUSIC_SOURCE=auto/local/netease`。

结果：

```json
{
  "sources": [
    {
      "source": "auto",
      "activeType": "local",
      "selected": "auto",
      "activeTracks": 16,
      "fallback": false,
      "planQueue": 4,
      "planFirstSource": "local",
      "tasteSource": "local"
    },
    {
      "source": "local",
      "activeType": "local",
      "selected": "local",
      "activeTracks": 16,
      "fallback": false,
      "planQueue": 3,
      "planFirstSource": "local",
      "tasteSource": "local"
    },
    {
      "source": "netease",
      "activeType": "netease",
      "selected": "netease",
      "activeTracks": 13,
      "fallback": true,
      "planQueue": 4,
      "planFirstSource": "netease",
      "tasteSource": "netease"
    }
  ],
  "stream": {
    "statusLine": "HTTP/1.1 200 OK",
    "contentType": "audio/mpeg",
    "trackId": "local-1b575677073a0ad0"
  },
  "eventCurrentTrack": "local-1b575677073a0ad0"
}
```

### 浏览器验收

目标：旧 fallback 服务 `http://127.0.0.1:19150/`，`MUSIC_SOURCE=netease`。

结果：

- 页面标题为 `Claudio`。
- 页面能显示 `播放器`、`队列`、`配置诊断`。
- 页面显示 `网易云 · 网易云歌单`。
- 页面显示网易云元数据模式提示。
- 控制台 error 数量：0。
- 旧页面仍存在队列栏显示 `0 首` 的已知问题，继续进入播放器交互阶段修复。

## 严格验收

- `/api/music/active-library`、`/api/plan/today`、`/api/taste/profile` 在三种音乐源下使用同一 source。
- 本地 stream 返回 `audio/mpeg`，不是假播放。
- 网易云模式明确 fallback，不伪装为可直接播放。
- 播放器事件能写入状态。
- 新 Nest service 逻辑符合 shared schema。
- 新 Nest HTTP 启动仍被本地依赖缺口阻塞，已记录。
- 旧 `server.js` fallback 未破坏。
- 未提交 `.env`、Cookie、API key。
- 未提交运行状态文件。

## 后续 Loop 入口

Loop 05 迁移 AI DJ 服务时需要：

- 将 `plan/today` 和 `chat` 接入 core 的 AI plan 修复逻辑。
- DeepSeek 不可用、非法 JSON、未知 track id、空队列都必须回退。
- 继续保持 active library 与 plan/taste 一致。

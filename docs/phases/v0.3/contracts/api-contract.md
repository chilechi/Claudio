# Claudio v0.3 API 合同初稿

本文档冻结 v0.2 当前可用 API，并标注 v0.3 迁移时必须保持兼容的字段。后续 shared schema 以本文为基准落地到 `packages/shared`。

## 通用规则

- 所有 JSON 响应使用 `Content-Type: application/json; charset=utf-8`。
- 所有错误响应必须稳定为 `{ "error": string, "code"?: string, "detail"?: unknown }`。
- 所有 provider 诊断只返回变量名和状态，不能返回 `.env` 原文、Cookie、API key。
- `Track.id` 是跨端唯一主键，队列、当前曲目、收藏、跳过都引用该 ID。
- `source.type` 和 `track.source` 必须区分 `local`、`netease`、`imported`。
- `track.playable=false` 时，前端不能显示为真实可播放。

## 共享对象

### ProviderStatus

```ts
type ProviderStatus = {
  id: string;
  label: string;
  configured: boolean;
  state: "ready" | "missing" | "fallback" | "error";
  reason?: string;
  detail?: string;
  envVars?: string[];
  docs?: string;
};
```

### Track

```ts
type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number | null;
  durationText?: string | null;
  source: "local" | "netease" | "imported";
  playable: boolean;
  streamUrl?: string;
  tags: string[];
};
```

### QueuePlan

```ts
type QueuePlan = {
  mode: string;
  queue: Track[];
  reply: string;
  reason: string;
  aiProvider: "deepseek" | "local";
};
```

## API 列表

### `GET /api/health`

用途：健康检查。Web、mobile、server smoke test 都依赖。

兼容字段：

```json
{
  "ok": true,
  "name": "Claudio",
  "version": "0.2.0"
}
```

### `GET /api/music/active-library`

用途：返回当前 `MUSIC_SOURCE` 选择后的有效曲库。v0.3 前端、AI 计划、口味画像必须使用同一个 active library。

兼容字段：

```ts
type ActiveLibraryResponse = {
  source: {
    name: string;
    type: "local" | "netease" | "imported";
    selected: "auto" | "local" | "netease";
    playlistId?: string;
    note?: string;
  };
  tracks: Track[];
  fallbackReason?: string;
};
```

约束：

- `MUSIC_SOURCE=local` 且没有本地音频时，`tracks=[]`，必须带 `fallbackReason`。
- `MUSIC_SOURCE=netease` 时，允许返回网易云元数据，但 `track.playable` 不能伪装为 `true`。
- `MUSIC_SOURCE=auto` 时，本地可播放音频优先；没有本地音频时回退网易云元数据。

### `GET /api/plan/today`

用途：生成默认今日队列和 Claudio 回复。

兼容字段：`QueuePlan`

约束：

- `queue` 必须来自 active library。
- DeepSeek 不可用时必须回退 `aiProvider="local"`。
- 不允许返回空白 UI 所需的 plan；若 active library 为空，必须返回清晰的 fallback reply 和空队列原因。

### `POST /api/chat`

用途：用户向 Claudio 输入一句话，生成回复和队列。

请求：

```json
{ "input": "今晚想听安静一点，适合写代码的" }
```

成功响应：`QueuePlan`

错误响应：

```json
{ "error": "input is required" }
```

兼容约束：

- 空 `input` 返回 `400`。
- 成功时允许更新 state：`mode`、`queue`、`currentTrackId`、`recentPrompts`。
- DeepSeek 返回非法 JSON、未知歌曲 ID、空队列时必须修复或回退。

### `GET /api/radio/today`

用途：根据当前小时、日程和口味生成电台时段。

查询参数：

- `hour?: number`

兼容字段：

```ts
type RadioTodayResponse = {
  mode: string;
  slot?: unknown;
  queue: Track[];
  profile: unknown;
  calendar?: unknown;
  reason: string;
  reply: string;
};
```

### `GET /api/taste/profile`

用途：返回口味画像。

兼容字段：

```ts
type TasteProfileResponse = {
  source: ActiveLibraryResponse["source"];
  profile: {
    likedCount: number;
    skippedCount: number;
    topTags: Array<{ tag: string; count: number }> | string[];
    topArtists: Array<{ artist: string; count: number }> | string[];
    memories: string[];
  };
};
```

### `GET /api/settings/diagnostics`

用途：设置页和验收脚本读取 provider 状态。

兼容字段：

```ts
type DiagnosticsResponse = {
  providers: ProviderStatus[];
  summary: {
    ready: number;
    fallback: number;
    missing: number;
  };
  docs: string;
  secretPolicy: string;
};
```

约束：

- 只能展示变量名和状态。
- TTS、ASR 未配置时应为 `fallback`。
- 天气、日历、UPnP 未配置时应为 `missing`。

### `GET /api/music/local/scan`

用途：扫描本地音乐目录。

兼容字段：

```ts
type LocalScanResponse = {
  configured: boolean;
  reason?: string;
  tracks: Track[];
};
```

约束：

- 未配置 `LOCAL_MUSIC_DIR` 时返回 `configured=false` 和原因。
- 本地 track 必须 `playable=true` 且带 `streamUrl`。

### `GET /api/music/netease/status`

用途：显示网易云配置状态。

兼容字段：

```ts
type NeteaseStatusResponse = {
  configured: boolean;
  reason?: string;
  playlistId: string | null;
};
```

### `POST /api/music/netease/playlists/:playlistId/import`

用途：从网易云读取歌单元数据并导入本地数据库。当前不承诺真实播放地址。

兼容字段：

```ts
type NeteaseImportResponse = {
  configured: boolean;
  reason?: string;
  playlist?: { id: string; name: string; source: "netease" };
  tracks: Track[];
  imported: number;
  endpoint?: string;
};
```

### `GET /api/tracks/:trackId/stream`

用途：播放本地音频流。

响应：

- 成功：音频二进制流，`Content-Type` 根据文件扩展名设置。
- 失败：`404 { "error": "Track not found or LOCAL_MUSIC_DIR is not configured" }`

约束：

- 只服务 `LOCAL_MUSIC_DIR` 内解析到的本地 track。
- 不能为网易云元数据 track 返回假音频。

### `GET /api/state`

用途：读取持久状态。

兼容字段：

```ts
type StateResponse = {
  mode: string;
  currentTrackId?: string;
  queue: string[];
  liked: string[];
  skipped: string[];
  recentPrompts: Array<{ input: string; reply: string; at: string }>;
  memories: string[];
  updatedAt?: string;
};
```

### `POST /api/player/event`

用途：记录播放器事件。

请求：

```ts
type PlayerEventRequest = {
  type: "play" | "like" | "skip";
  trackId: string;
};
```

成功响应：`StateResponse`

v0.3 需要扩展：

- `pause`
- `next`
- `previous`
- `seek`
- `volume`
- `hide`

扩展前不得让前端假装这些状态已经持久化。

## Legacy 兼容接口

以下接口 v0.3 可保留为 alias，但新代码优先使用上面的稳定合同：

- `GET /api/library`
- `GET /api/config/status`
- `GET /api/providers/status`

## 前端/移动端依赖字段

桌面 Web 必须依赖：

- active library: `source`、`tracks`、`fallbackReason`
- plan/chat: `mode`、`queue`、`reply`、`reason`、`aiProvider`
- state: `currentTrackId`、`queue`、`liked`、`skipped`
- diagnostics: `providers`、`summary`

移动端后续必须能复用：

- 所有 `Track` 字段
- `QueuePlan`
- `DiagnosticsResponse`
- `StateResponse`

移动端不得依赖桌面 DOM、CSS class、浏览器 `Audio` 对象或 `speechSynthesis`。

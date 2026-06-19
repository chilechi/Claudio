# Claudio v0.2 技术选型

v0.2 的目标不是页面复刻，而是功能复刻：做成一个能直接使用的个人 AI 电台。缺账号、缺 key、缺本地资源的地方必须空着并写入待补清单，不允许用假数据冒充真实能力。

## 产品目标

Claudio v0.2 要复刻视频里的核心体验：

- 个人电台控制台
- 真实音乐源接入
- AI DJ/旁白
- 播放队列与时段推荐
- 语音输入与语音输出
- 当前播放、歌词/旁白时间线
- 喜欢、收藏、跳过、隐藏、音量
- Light/Dark 主题
- 后端连接 AI 与音乐 API
- 本地状态、长期口味、日程/时段规则

## 原则

- 不用假数据冒充真实接口。
- 没有凭据的功能显示“未配置”，并写入 `docs/phases/v0.2/missing-inputs.md`。
- 外部接口失败时允许本地降级，但必须标注为“本地降级”，不能标成真实服务。
- API Key、Cookie、Token、账号登录态只放 `.env` 或本机安全存储，不进 Git。
- 必要代码注释使用中文。
- 每个 Loop 完成后中文 commit 并 push GitHub。

## 前端

选型：

- Vite
- React
- TypeScript
- CSS Modules 或普通 CSS 变量
- Web Audio API
- Web Speech API 作为浏览器语音回退
- EventSource 或 WebSocket 接收后端流式状态

理由：

- 视频里的 Claudio 是一个状态密集型控制台，React 更适合拆播放器、队列、AI 消息、设置、状态灯等组件。
- TypeScript 可以把音乐、队列、AI plan、服务状态这些对象约束清楚。
- Vite 启动快，适合本地桌面项目。

第一阶段不使用大型 UI 框架。界面需要接近视频里的黑色点阵控制台，而不是通用后台模板。

## 后端

选型：

- Node.js
- TypeScript
- Fastify
- Zod
- SQLite
- better-sqlite3 或 sqlite
- WebSocket 或 Server-Sent Events

理由：

- Fastify 比原生 `http` 更适合继续扩 API、校验请求、维护 adapter。
- Zod 用来校验 AI 输出、用户配置、外部 API 响应。
- SQLite 适合本地桌面 MVP，能保存歌曲、播放历史、喜欢/跳过、记忆、计划和服务状态。
- WebSocket/SSE 用于前端实时显示播放状态、AI 旁白和任务进度。

## 真实服务 Adapter

后端按 adapter 拆分：

- `MusicProvider`：网易云/本地文件/后续其他音乐源
- `BrainProvider`：DeepSeek/Claude/OpenAI/本地规则脑
- `TtsProvider`：浏览器 TTS 回退/Fish Audio/Edge TTS/OpenAI TTS
- `AsrProvider`：浏览器语音识别/后续 Whisper
- `ScheduleProvider`：本地时段规则/后续日历
- `WeatherProvider`：OpenWeather 或其他天气服务

接口没配置时，adapter 必须返回明确状态：

```json
{
  "configured": false,
  "reason": "缺少 NETEASE_COOKIE"
}
```

## 音乐源策略

目标顺序：

1. 本地音乐目录：可立即真实播放，不依赖版权接口。
2. 网易云歌单元数据：读取真实歌单、歌名、歌手、专辑、封面。
3. 网易云播放：需要用户提供可用 Cookie 或可用 API 服务，版权/VIP 不保证。
4. 其他可配置音乐源：后续补。

v0.2 不允许只有 `library.json` 静态歌库就宣称“网易云已接入”。静态数据只能作为导入缓存或开发样例。

## AI 策略

DeepSeek 是默认 AI 大脑：

- 读取口味、时段、当前播放、历史偏好。
- 输出结构化 `Plan`。
- 生成温柔克制的 DJ 旁白。
- 失败时回退本地规则脑，并在 UI 标注 `local fallback`。

AI 输出必须使用 Zod 校验，不合格就回退。

## 语音策略

TTS：

- 第一可用：浏览器 TTS。
- 可配置：Fish Audio、Edge TTS、OpenAI TTS。
- 未配置真实 TTS 时，UI 显示“浏览器语音”或“未配置”，不能伪装成 Fish Audio。

ASR：

- 第一可用：浏览器 SpeechRecognition。
- 后续：Whisper 或其他 ASR。

## 数据库

SQLite 表建议：

- `tracks`
- `playlists`
- `playlist_tracks`
- `play_events`
- `preferences`
- `memories`
- `plans`
- `messages`
- `provider_status`
- `settings`

JSON 文件只保留：

- `.env.example`
- 导入/导出备份
- 人格 prompt 文档

运行状态迁移到 SQLite。

## 前端视图

必须包含：

- `PlayerView`：播放器和进度条
- `QueueView`：播放队列
- `DjConsole`：AI DJ 消息与输入
- `TimelineView`：歌词/旁白时间线
- `SettingsView`：Provider 配置状态
- `TasteView`：口味、时段规则、记忆
- `DiagnosticsView`：服务连通性、缺失配置

## 验收标准

v0.2 不能只验收“页面能打开”。必须证明：

- 至少一个真实音乐源可播放：本地文件目录或已配置的网易云可播放地址。
- AI 能生成结构化队列计划。
- TTS 能真实发声或明确显示未配置。
- 用户输入能改变队列。
- 喜欢/跳过会改变后续推荐。
- 服务缺失配置会显示在 UI 和 `docs/phases/v0.2/missing-inputs.md`。
- 无 key、无 cookie 时，系统仍能运行，但 UI 清楚标注哪些能力不可用。

# Claudio

Claudio 是一个电脑端本地个人 AI 电台。它读取本地音乐和网易云歌单元数据，用本地规则脑或 DeepSeek 生成播放队列，并让 Claudio 像电台主播一样自动解读当前歌曲。

## 当前版本

当前默认入口是 v0.7 前后端工程：

- NestJS 本地服务
- React + Vite 电脑端控制台
- PWA 安装入口和前端壳缓存
- 本地音乐真实播放
- 本地音频标签、封面和时长读取
- 网易云歌单元数据读取
- DeepSeek / 本地规则 AI DJ
- AI 电台旁白
- 电台运行内核：开播、停播、续播、切歌、事件流和简单意图路由
- 浏览器 TTS 回退，Fish Audio TTS 预留真实发声路径

## 快速启动

```powershell
cd D:\workspace\Claudio
Copy-Item .env.example .env
npm start
```

打开：

```text
http://localhost:8080
```

如果 8080 被占用，修改 `.env`：

```env
PORT=8090
```

## 配置

真实配置放在 `.env`，不要提交。

常用项：

```env
PORT=8080
MUSIC_SOURCE=auto
LOCAL_MUSIC_DIR=
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

`MUSIC_SOURCE` 可选：

- `auto`：有本地可播放音频时优先本地，否则使用网易云歌单元数据。
- `local`：只使用本地音乐目录。
- `netease`：使用网易云歌单元数据，当前不保证能直接播放网易云音频。

## 电台旁白与语音

v0.5 的语音不是录音输入，而是 Claudio 自己当电台主播：

- 点击播放时，Claudio 会为当前歌曲生成简短解读。
- 切到下一首时，Claudio 会生成过渡旁白。
- 未配置真实 TTS 时，前端使用浏览器 `speechSynthesis` 回退。
- 配置 Fish Audio 后，`/api/voice/speak` 会返回真实 TTS 音频。
- 真实 TTS 音频会缓存到 `data/cache/tts/`，相同旁白不会重复请求。
- v0.5 不做 ASR，不请求麦克风权限。

## 电台运行内核

v0.7 参考 Claudio-FM 的运行方式，但保留 Nest + React 结构：

- 顶部“开播 / 停播”会启动或停止电台运行态。
- 页面通过 `GET /api/events` 订阅电台事件。
- 输入“下一首”“暂停”“继续”“大声一点”“小声一点”会优先被识别为播放控制。
- 普通文字仍会让 Claudio 重新组织或续写电台节目。
- 当前运行态是单实例内存态，重启后会重新开始。

## PWA

Claudio 可以作为 PWA 安装到桌面：

- 生产构建会注册 `/sw.js`。
- `manifest.webmanifest` 提供应用名称、主题色、图标和启动地址。
- service worker 只缓存前端应用壳和静态资源。
- `/api/*`、本地音乐流、状态和歌库数据不做离线缓存，避免显示过期播放状态。
- 浏览器出现安装条件时，顶部会显示“安装”按钮。

Fish Audio 配置：

```env
TTS_PROVIDER=fish
FISH_AUDIO_API_KEY=
FISH_AUDIO_VOICE_ID=
FISH_AUDIO_MODEL=s2-pro
FISH_AUDIO_BASE_URL=https://api.fish.audio
```

## API

- `GET /api/health`：健康检查
- `GET /api/music/active-library`：当前音乐源和曲库
- `GET /api/music/local/scan`：本地歌库扫描和统计
- `GET /api/state`：本地播放状态
- `GET /api/plan/today`：今日默认队列
- `POST /api/chat`：根据文字输入生成回复和队列
- `GET /api/events`：电台事件流
- `GET /api/runtime/status`：当前电台运行态
- `GET /api/now`：当前曲目和最近旁白
- `POST /api/runtime/start`：开播
- `POST /api/runtime/stop`：停播
- `POST /api/runtime/refill`：续写队列
- `POST /api/runtime/next`：切到下一首
- `POST /api/runtime/request`：带意图路由的电台请求
- `POST /api/player/event`：记录播放、喜欢、跳过、隐藏等事件
- `POST /api/host/intro`：为当前歌曲生成开场旁白
- `POST /api/host/between-tracks`：为切歌生成过渡旁白
- `GET /api/voice/status`：真实 TTS / 浏览器回退状态
- `POST /api/voice/speak`：真实 TTS 可用时返回音频，否则提示前端回退
- `GET /api/voice/cache/:filename`：读取已缓存的 TTS 音频
- `GET /manifest.webmanifest`：PWA manifest
- `GET /sw.js`：PWA service worker

示例：

```powershell
$body = @{ trackId = "local-example" } | ConvertTo-Json
Invoke-RestMethod http://localhost:8080/api/host/intro -Method Post -ContentType "application/json" -Body $body
```

## 目录结构

- `apps/server/`：NestJS 后端
- `apps/web/`：React + Vite 桌面端前端
- `apps/mobile/`：后续移动端复用入口和 API client
- `packages/shared/`：跨端类型和 schema
- `packages/core/`：推荐、口味、音乐源选择等纯业务函数
- `data/`：本地歌库、缓存和运行状态
- `docs/`：阶段清单、验收记录和缺口说明

## 本地歌库整理

`MUSIC_SOURCE=local` 时，Claudio 会扫描 `LOCAL_MUSIC_DIR`：

- 优先读取音频标签里的歌名、歌手、专辑、时长。
- 有内嵌封面时导出到 `data/cache/covers/` 并在播放器显示。
- 读不到标签时清洗文件名兜底，避免大面积显示 `obj_...`。
- `data/local-library-cache.json` 是运行缓存，可以删除，启动后会重建。

## 验收命令

```powershell
npm run build
npm run test:core
npm run typecheck:mobile
```

## 注意

- `.env`、`data/state.json`、`data/local-library-cache.json`、`data/cache/` 都是本地运行文件，不提交。
- 网易云真实播放仍受登录、版权、VIP、地区和播放地址限制影响，当前只承诺元数据读取。
- 没有真实 TTS key 时不能显示“Fish Audio 已连接”，只能显示浏览器语音回退。

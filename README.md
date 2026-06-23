# Claudio

电脑端本地个人 AI 电台。读取本地音乐和网易云歌单元数据，用 DeepSeek 或本地规则生成播放队列，并以电台主播形式自动解读当前歌曲。

## 功能特性

- **AI DJ**：DeepSeek 智能选歌，无 API Key 时自动回退到本地规则脑
- **电台旁白**：为每首歌曲生成开场解读和切歌过渡旁白
- **Edge TTS 语音**：微软神经网络语音合成，免费无需 API Key，浏览器 speechSynthesis 回退
- **本地音乐播放**：扫描本地音频目录，读取标签、封面、时长，支持 Range 请求流式播放
- **网易云歌单**：读取网易云歌单元数据作为曲库和口味来源
- **电台运行内核**：开播/停播/续播/切歌，SSE 事件流，简单意图路由（"下一首""暂停""大声一点"）
- **PWA 安装**：可安装到桌面，离线缓存前端壳，API 和媒体流不缓存

## 技术栈

| 层 | 技术 |
|---|---|
| 后端 | NestJS 11 + Fastify 5 |
| 前端 | React 19 + Vite 8 |
| 类型校验 | Zod 4（全链路 Schema 校验） |
| 音频元数据 | music-metadata |
| TTS | Edge TTS（WebSocket + SSML） |
| AI | DeepSeek API |
| 运行环境 | Node.js >= 20 |

## 前置条件

- **Node.js >= 20**（推荐 v24+）
- **npm >= 10**
- 本地音乐目录（可选，但推荐配置以获得真实播放体验）
- DeepSeek API Key（可选，无 Key 时回退到本地规则脑）

## 快速开始

### 1. 克隆并安装依赖

```powershell
git clone <repo-url> Claudio
cd Claudio
npm install
```

### 2. 创建环境配置

```powershell
Copy-Item .env.example .env
```

编辑 `.env`，至少配置以下项：

```env
# 必填：本地音乐目录（路径不需要加引号）
LOCAL_MUSIC_DIR=D:\music

# 推荐：AI DJ（不配置时回退到本地规则脑）
DEEPSEEK_API_KEY=sk-your-key-here

# 默认已启用 Edge TTS，无需额外配置
TTS_PROVIDER=edge
EDGE_TTS_VOICE=zh-CN-XiaoxiaoNeural
```

### 3. 构建并启动

```powershell
npm start
```

`npm start` 会先执行全量构建（shared → core → server → web），然后启动服务。

### 4. 打开控制台

```
http://localhost:8080
```

如果 8080 被占用，修改 `.env` 中的 `PORT` 后重新启动。

## 配置说明

所有配置放在 `.env` 文件中，参考 `.env.example`。以下为完整配置项：

### 基础

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `8080` | 服务端口 |
| `MUSIC_SOURCE` | `auto` | 音乐源：`auto`（本地优先）/ `local` / `netease` |
| `LOCAL_MUSIC_DIR` | — | 本地音乐目录路径 |

### 网易云歌单（可选）

| 变量 | 说明 |
|---|---|
| `NETEASE_PLAYLIST_ID` | 歌单 ID，仅读取元数据 |
| `NETEASE_COOKIE` | 登录 Cookie（访问私密歌单时需要） |
| `NETEASE_API_BASE_URL` | API 地址（默认使用官方） |

### AI DJ（可选）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `AI_PROVIDER` | `deepseek` | AI 提供商 |
| `DEEPSEEK_API_KEY` | — | API Key，不配置时回退到本地规则脑 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 模型名称 |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | API 地址 |

### TTS 语音（默认已启用）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `TTS_PROVIDER` | — | 设为 `edge` 启用 Edge TTS，留空则浏览器语音回退 |
| `EDGE_TTS_VOICE` | `zh-CN-XiaoxiaoNeural` | 语音名称 |

常用语音：

- `zh-CN-XiaoxiaoNeural`：晓晓，女声（默认）
- `zh-CN-YunxiNeural`：云希，男声
- `zh-CN-XiaoyiNeural`：晓伊，女声

## 项目结构

```
apps/
  server/          NestJS 后端（API + SSE + 静态资源托管）
  web/             React + Vite 桌面端前端（PWA）
  mobile/          移动端复用入口和 API client
packages/
  shared/          跨端 Zod Schema 和类型定义
  core/            推荐、口味、音乐源选择等纯业务函数
data/
  library.json              网易云歌单导入数据（提交）
  state.json                运行状态（不提交，自动生成）
  local-library-cache.json  本地音乐扫描缓存（不提交）
  cache/                    封面和 TTS 音频缓存（不提交）
docs/              阶段清单、验收记录和缺口说明
```

## API 参考

### 基础

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查 |
| GET | `/api/state` | 本地播放状态 |
| GET | `/api/settings/diagnostics` | 配置诊断 |

### 音乐

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/music/active-library` | 当前音乐源和曲库 |
| GET | `/api/music/local/scan` | 本地歌库扫描和统计 |
| GET | `/api/tracks/:trackId/stream` | 音频流（支持 Range） |
| GET | `/api/assets/covers/:coverKey` | 封面图片 |
| POST | `/api/player/event` | 记录播放/喜欢/跳过/隐藏事件 |

### AI 与电台

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/plan/today` | 今日默认队列 |
| POST | `/api/chat` | 根据文字输入生成回复和队列 |
| GET | `/api/radio/today` | 今日电台计划 |
| GET | `/api/taste/profile` | 口味画像 |

### 电台运行内核

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/events` | 电台事件流（SSE） |
| GET | `/api/runtime/status` | 当前电台运行态 |
| GET | `/api/now` | 当前曲目和最近旁白 |
| POST | `/api/runtime/start` | 开播 |
| POST | `/api/runtime/stop` | 停播 |
| POST | `/api/runtime/refill` | 续写队列 |
| POST | `/api/runtime/next` | 切到下一首 |
| POST | `/api/runtime/request` | 带意图路由的电台请求 |

### 旁白与语音

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/host/intro` | 为当前歌曲生成开场旁白 |
| POST | `/api/host/between-tracks` | 为切歌生成过渡旁白 |
| GET | `/api/voice/status` | TTS 状态 |
| POST | `/api/voice/speak` | 语音合成，返回 MP3 音频 |
| GET | `/api/voice/cache/:filename` | 读取已缓存的 TTS 音频 |

### PWA

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/manifest.webmanifest` | PWA manifest |
| GET | `/sw.js` | Service Worker |

## 开发指南

### 开发模式（前后端热更新）

需要开两个终端：

```powershell
# 终端 1：后端（watch 模式）
npm run dev:server

# 终端 2：前端（Vite HMR）
npm run dev:web
```

前端开发服务器运行在 `http://127.0.0.1:5173`，API 请求自动代理到后端 `127.0.0.1:8080`。

### 构建命令

| 命令 | 说明 |
|---|---|
| `npm run build` | 全量构建（shared → core → server → web） |
| `npm run build:server` | 仅构建后端 |
| `npm run build:web` | 仅构建前端 |
| `npm run test:core` | 运行核心业务逻辑测试 |
| `npm run typecheck` | 全量类型检查 |
| `npm run typecheck:mobile` | 移动端类型检查 |

### 本地歌库

`MUSIC_SOURCE=local` 或 `auto` 时，Claudio 会扫描 `LOCAL_MUSIC_DIR`：

- 支持格式：mp3、flac、wav、m4a、aac、ogg、opus
- 优先读取音频标签（歌名、歌手、专辑、时长）
- 有内嵌封面时导出到 `data/cache/covers/`
- 读不到标签时清洗文件名兜底
- `data/local-library-cache.json` 是运行缓存，可删除后自动重建

## 注意事项

- `.env`、`data/state.json`、`data/local-library-cache.json`、`data/cache/`、`dist/`、`*.tsbuildinfo` 均为本地运行文件，已在 `.gitignore` 中忽略
- 网易云真实播放受登录、版权、VIP、地区限制，当前只承诺元数据读取
- 电台运行态为单实例内存态，重启后重新开始
- 未配置 `TTS_PROVIDER=edge` 时使用浏览器语音回退

## 许可证

MIT

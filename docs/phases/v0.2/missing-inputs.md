# Claudio v0.2 待补配置与缺口

本文档记录真实功能复刻所需的外部配置、账号、素材和本地资源。没有补齐前，项目里对应功能必须显示“未配置”或“本地回退”，不能用假数据冒充。

## 必填

### DeepSeek

状态：待补

需要：

```env
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

用途：

- AI DJ 旁白
- 播放队列规划
- 场景/情绪判断

### 真实音乐源

状态：待选

至少选择一种：

```env
LOCAL_MUSIC_DIR=
```

或：

```env
NETEASE_COOKIE=
NETEASE_PLAYLIST_ID=
NETEASE_API_BASE_URL=
```

说明：

- 本地音乐目录最稳，可以真实播放。
- 网易云歌单可以先读元数据。
- 网易云真实播放受登录、版权、VIP、地区限制影响。

## 可选

### TTS

状态：待选

浏览器 TTS 可作为默认回退。真实拟人声音需要选择一个服务：

```env
TTS_PROVIDER=
FISH_AUDIO_API_KEY=
FISH_AUDIO_VOICE_ID=
EDGE_TTS_VOICE=
OPENAI_API_KEY=
OPENAI_TTS_MODEL=
```

### ASR

状态：待选

浏览器语音识别可作为回退。更稳定方案需要：

```env
ASR_PROVIDER=
WHISPER_API_KEY=
```

### 天气

状态：待补

```env
WEATHER_PROVIDER=openweather
OPENWEATHER_API_KEY=
WEATHER_CITY=
```

### 日历/日程

状态：待定

需要决定接入方式：

- 本地日程 JSON
- Google Calendar
- 飞书日历
- 其他

### UPnP/家庭音响

状态：待定

需要：

```env
UPNP_ENABLED=
UPNP_DEVICE_NAME=
```

## 素材

### Claudio 头像

状态：待补

需要提供：

- 头像图片
- 或生成头像的文字描述

### 视觉参考

状态：已有部分截图

已有：

- 黑色点阵控制台
- Player/Queue/Claudio 消息面板
- Light/Dark 切换
- 时间大屏
- 音乐时段计划终端图

仍建议补充：

- 完整播放器页面截图
- 设置页截图
- 移动端或桌面端目标优先级

## 不允许伪造的能力

- 不允许把静态 `library.json` 当成“网易云已接入”。
- 不允许没有真实音频时显示“正在播放真实歌曲”。
- 不允许没有真实 TTS key 时显示“Fish Audio 已连接”。
- 不允许没有日历 key 时显示“已读取日程”。
- 不允许没有天气 key 时显示“已接天气”。

## 当前建议

先补：

1. `LOCAL_MUSIC_DIR`，确保能真实播放。
2. `DEEPSEEK_API_KEY`，确保 AI DJ 可用。
3. 真实 TTS 暂时使用浏览器 TTS 回退。
4. 网易云先做歌单元数据，不承诺全部可播放。

## 本地依赖安装缺口

状态：待用户本地补装

Loop 00 执行时，后端运行依赖安装成功，但前端/开发依赖安装多次网络超时。`package.json` 和 `package-lock.json` 已写入依赖声明，`node_modules` 里仍缺部分包。

缺失项：

- `react`
- `react-dom`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `concurrently`

建议后续在网络稳定时执行：

```powershell
npm install
```

或单独执行：

```powershell
npm install -D react react-dom @types/node @types/react @types/react-dom concurrently
```

补装前，以下命令可能无法完整通过：

```powershell
npm run build
npm run dev:web
```

## 诊断页映射

`/api/settings/diagnostics` 和前端 PROVIDERS 区只展示配置项名称，不展示任何 `.env` 原文或密钥值。

- 本地音乐目录：`LOCAL_MUSIC_DIR`
- DeepSeek AI DJ：`DEEPSEEK_API_KEY`、`DEEPSEEK_MODEL`、`DEEPSEEK_BASE_URL`
- 网易云歌单：`NETEASE_PLAYLIST_ID`、`NETEASE_COOKIE`、`NETEASE_API_BASE_URL`
- 真实 TTS：`TTS_PROVIDER`、`FISH_AUDIO_API_KEY`、`FISH_AUDIO_VOICE_ID`
- 语音输入：`ASR_PROVIDER`、`WHISPER_API_KEY`
- 天气：`WEATHER_PROVIDER`、`OPENWEATHER_API_KEY`、`WEATHER_CITY`
- 日历/日程：`CALENDAR_PROVIDER`
- 家庭音响/UPnP：`UPNP_ENABLED`、`UPNP_DEVICE_NAME`

## 播放器权限缺口

状态：需要真实浏览器复测

即使 `LOCAL_MUSIC_DIR` 已配置，浏览器仍可能因为媒体播放权限拦截 `audio.play()`，表现为页面提示 `NotAllowedError`。这不是歌库缺失，也不是网易云元数据问题。

排查顺序：

1. 确认当前歌曲有 `streamUrl`。
2. 确认 `/api/tracks/:id/stream` 返回 `Content-Length`、`Accept-Ranges`，Range 请求返回 `206`。
3. 在普通浏览器里手动点击播放按钮。
4. 如果普通浏览器也失败，再检查浏览器站点权限、静音策略和音频文件格式。

## v0.3 本地依赖排查说明

状态：已通过定向重装修复一次

Loop 03 曾遇到 `fast-json-stringify` 包内容不完整的问题：`package.json` 指向 `index.js`，但实际目录缺少该文件，导致新 Nest 服务运行时报错。Loop 10 已通过删除损坏的单包目录并重新安装 `fast-json-stringify@6.4.0` 修复。

如果后续再次出现同类问题，建议执行：

```powershell
Remove-Item node_modules\fast-json-stringify -Recurse -Force
npm install fast-json-stringify@6.4.0
```

如果仍失败，再做干净重装：

```powershell
Remove-Item node_modules -Recurse -Force
npm install
npm run build
npm run start:server
```

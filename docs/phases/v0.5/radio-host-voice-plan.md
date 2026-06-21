# Claudio v0.5 AI 电台旁白与主播语音验收

## 目标

让 Claudio 不只在用户发消息时回复，而是在播放本地音乐时像电台主播一样自动思考、自动解读、自动朗读。v0.5 不做录音输入，不请求麦克风权限，不接 ASR。

## 已实现

- 新增 `/api/host/intro`，为当前歌曲生成开场旁白。
- 新增 `/api/host/between-tracks`，为切歌生成过渡旁白。
- DeepSeek 可用时由 DeepSeek 生成旁白；不可用时使用本地模板兜底。
- 新增 `/api/voice/status`，返回真实 TTS / 浏览器回退状态，不泄露密钥。
- 新增 `/api/voice/speak`，Fish Audio 配置齐全时返回 TTS 音频；否则前端使用浏览器 TTS。
- React Web 新增“电台旁白”开关。
- 播放器显示最近一条 Claudio 旁白文本。
- 播放、切歌、聊天回复会触发旁白朗读；关闭开关后不朗读。
- `.env.example` 明确 v0.5 不做录音输入，ASR 只为后续阶段预留。

## 验收记录

执行命令：

```powershell
npm run build
npm run test:core
npm run typecheck:mobile
```

结果：

- `npm run build`：通过。
- `npm run test:core`：通过，13 项检查。
- `npm run typecheck:mobile`：通过。

接口验收：

- `/api/voice/status`：未配置真实 TTS 时返回 `provider=browser`、`state=fallback`、`audioSupported=false`，不返回密钥原文。
- `/api/host/intro`：DeepSeek 可用时返回与当前歌曲相关的中文旁白，示例曲目 `Everywhere We Go`。
- `/api/host/intro`：`AI_PROVIDER=local` 时返回本地模板旁白，`source=local`。
- `/api/host/between-tracks`：返回切歌过渡旁白。
- `/api/voice/speak`：未配置真实 TTS 时返回 JSON 回退提示，前端继续使用浏览器 TTS。

浏览器验收：

- 页面显示“电台旁白”开关，聊天区按钮显示“旁白”，不再显示“语音输入”。
- 点击播放后，播放器旁白文本从默认提示变成歌曲解读。
- 点击下一首后，当前曲目变化，旁白文本同步变化。
- 关闭“电台旁白”后，再切歌时旁白文本保持不变。
- 页面没有“麦克风 / 录音 / 语音输入”文案，也没有触发麦克风权限。
- in-app browser 中音频播放被浏览器策略拦截为 `NotAllowedError`，页面保持真实失败提示，不伪装播放；旁白生成不依赖播放权限。

## 仍保留的缺口

- 第一版不做复杂 ducking，不自动压低音乐音量。
- 第一版不做 ASR，不做录音输入。
- Fish Audio 真实音色效果需要用户配置可用 key 和 voice id 后再验收。
- 后续可以把旁白历史写入 SQLite，形成长期电台记忆。

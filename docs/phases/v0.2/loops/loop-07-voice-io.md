# Loop 07：TTS/ASR 语音能力

目标：实现真实语音输出和可选语音输入。

计划：

- TTS 默认使用浏览器 TTS。
- 抽象 TTS provider，预留 Fish Audio/Edge/OpenAI。
- ASR 默认使用浏览器 SpeechRecognition。
- 未配置真实服务时显示当前 provider。

产物：

- `TtsProvider`
- `BrowserTtsProvider`
- `AsrProvider`
- `BrowserAsrProvider`
- 前端麦克风按钮
- 语音 provider 状态

配置：

```env
TTS_PROVIDER=
FISH_AUDIO_API_KEY=
FISH_AUDIO_VOICE_ID=
ASR_PROVIDER=
```

测试：

- 浏览器 TTS 能朗读。
- 关闭语音后不朗读。
- 浏览器不支持时显示不可用。
- 麦克风输入可用或明确显示不支持。

验收：

- 语音能力真实可用或明确未配置。
- 不伪装 Fish Audio 已连接。
- 语音输入不会在未授权时自动开启。

提交：

```powershell
git add .
git commit -m "功能：添加真实语音输入输出"
git push origin main
```

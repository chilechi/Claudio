# Claudio

Claudio 是一个电脑端本地个人 AI 电台。第一版目标是：用网易云歌单口味作为音乐来源，用 DeepSeek 作为 AI 大脑，用浏览器 TTS 作为语音回应，并在本地保存状态记忆。

当前项目按 Loop Engine 推进。自动执行入口见：

```text
docs/loop-engine-checklist.md
```

具体任务拆分在：

```text
docs/loops/
```

## 运行目标

- 电脑端本地网页
- Node 本地服务
- 网易云初始歌单数据
- 本地规则脑回退
- DeepSeek AI 规划
- 浏览器语音回应
- 本地状态记忆

## 配置

复制配置模板：

```powershell
Copy-Item .env.example .env
```

DeepSeek Key 只写入本地 `.env`，不要提交到 GitHub。

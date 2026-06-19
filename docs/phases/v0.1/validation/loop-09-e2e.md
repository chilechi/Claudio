# Loop 09 端到端验收记录

验收时间：2026-06-19

## 验收范围

- 本地服务启动
- 健康检查接口
- 桌面端页面
- 歌单加载
- 本地规则脑
- DeepSeek 失败回退
- 浏览器语音代码路径
- 喜欢、跳过、最近输入状态持久化
- GitHub 推送状态

## 自动接口验收

结果：

- `GET /api/health` 返回 `ok: true`
- `GET /` 返回 Claudio 页面
- `GET /api/library` 返回 13 首初始歌曲
- `GET /api/plan/today` 返回 5 首队列
- `POST /api/chat` 对“有点 emo 但别太丧”返回 `emo` 模式和 5 首队列
- `POST /api/player/event` 可记录喜欢和跳过

## DeepSeek 回退验收

使用错误的 DeepSeek 地址和假 key 测试：

- `AI_PROVIDER=deepseek`
- `DEEPSEEK_API_KEY=bad-key`
- `DEEPSEEK_BASE_URL=http://127.0.0.1:9`

结果：

- 接口不崩溃
- 自动回退为 `local`
- “适合写代码的”返回 `coding` 模式和 5 首队列

## 浏览器验收

在浏览器打开：

```text
http://localhost:8080
```

结果：

- 页面标题为 `Claudio`
- `h1` 为 `Claudio`
- 队列显示 5 首歌
- 输入框存在
- 播放、上一首、下一首、喜欢、跳过、发送、场景按钮存在
- 语音开关存在
- 控制台无错误

交互测试：

- 输入“适合写代码的”
- 点击“发送”
- 模式更新为 `coding`
- 队列首歌更新为《每一面都美》
- 回复为温柔克制中文
- 控制台无错误

## 修复项

发现 Windows PowerShell 写回 `data/state.json` 时可能带 UTF-8 BOM，导致 `JSON.parse` 失败。

已修复：

- `server.js` 的 JSON 读取会剥离 UTF-8 BOM。

## 结论

Claudio v0.1 桌面 MVP 端到端验收通过。

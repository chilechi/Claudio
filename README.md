# Claudio

Claudio 是一个电脑端本地个人 AI 电台。它从网易云歌单口味出发，用本地规则脑或 DeepSeek 生成播放队列，用浏览器 TTS 朗读温柔克制的电台回应，并在本地保存喜欢、跳过、最近输入和当前模式。

## 当前版本

`v0.1` 桌面 MVP：

- Node 本地服务
- 电脑端网页控制台
- 网易云初始歌单数据
- 本地规则脑回退
- DeepSeek AI 规划脑
- 浏览器语音回应
- 本地状态记忆

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

健康检查：

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

## 配置

`.env.example` 是配置模板。真实配置放在 `.env`，不要提交。

```env
PORT=8080
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

如果 `DEEPSEEK_API_KEY` 为空，Claudio 会自动使用本地规则脑。DeepSeek 请求失败时也会回退，不阻塞电台使用。

## 代理

如果 GitHub 或 DeepSeek 需要本地代理，可以在当前 PowerShell 会话里设置：

```powershell
$env:HTTP_PROXY="http://127.0.0.1:7897"
$env:HTTPS_PROXY="http://127.0.0.1:7897"
```

Git 代理：

```powershell
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
```

取消 Git 代理：

```powershell
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## API

- `GET /api/health`：健康检查
- `GET /api/library`：读取初始歌库
- `GET /api/state`：读取本地状态
- `GET /api/plan/today`：生成今日默认队列
- `POST /api/chat`：根据输入生成回复和队列
- `POST /api/player/event`：记录播放、喜欢、跳过

`POST /api/chat` 示例：

```powershell
$body = @{ input = "今晚想听安静一点" } | ConvertTo-Json
Invoke-RestMethod http://localhost:8080/api/chat -Method Post -ContentType "application/json" -Body $body
```

## 数据文件

- `data/library.json`：初始歌库
- `data/taste.md`：口味档案
- `data/routines.md`：场景规则
- `data/state.json`：本地状态记忆

## 开发清单

Loop Engine 入口：

```text
docs/loop-engine-checklist.md
```

每个 Loop 的独立任务清单在：

```text
docs/loops/
```

## 常见问题

### 没有 DeepSeek Key 能不能用？

可以。Claudio 会使用本地规则脑，根据输入和歌曲标签生成队列。

### 为什么不直接播放网易云音乐？

网易云真实播放涉及登录、版权、VIP、地区和播放地址限制。v0.1 先把歌单作为口味和队列来源，真实播放后续用适配器接入。

### 端口 8080 被占用怎么办？

修改 `.env`：

```env
PORT=8090
```

然后重新运行：

```powershell
npm start
```

### 会不会把 Key 提交到 GitHub？

不会。`.env` 已经在 `.gitignore` 中，Key 只放本地 `.env`。

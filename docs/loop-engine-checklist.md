# Claudio Loop Engine 执行清单

本文档是 Claudio 项目的自动执行清单。后续使用 goal 跑项目时，按本文档逐个 Loop 推进。

每个 Loop 都必须遵守同一个闭环：

```text
计划 -> 改代码 -> 配置 -> 修复 -> 测试 -> 验收 -> commit -> push GitHub
```

## 全局规则

- 工作目录：`D:\workspace\Claudio`
- GitHub 仓库：`https://github.com/chilechi/Claudio.git`
- 每完成一个可验收 Loop，必须提交并推送到 GitHub。
- 必要代码注释使用中文，尤其是业务规则、AI prompt、推荐逻辑、配置回退逻辑。
- 不把 API Key、Cookie、Token、网易云登录态写进仓库。
- DeepSeek Key 只放本地 `.env`。
- 先做电脑端本地网页，后续再扩展手机 PWA。
- 如果某个真实外部接口暂时不可用，必须提供本地回退，不让项目整体卡死。
- 每轮结束都要记录：本轮做了什么、如何测试、验收结果、commit hash、push 结果。

## 产品设定

Claudio 是一个个人 AI 电台：

- 名字：Claudio
- 音乐来源：网易云音乐歌单
- AI 大脑：DeepSeek
- 语音：先用浏览器 TTS，后续可替换 Fish Audio 等服务
- 端：电脑端本地网页
- 性格：温柔克制
- 称呼：不主动称呼用户
- 口味：华语流行、独立流行、Live、雨天、夜晚、轻 R&B、细腻情绪

Claudio 的语言风格：

- 简短
- 克制
- 不像客服
- 不装心理咨询师
- 不频繁追问
- 不说“我完全理解你”
- 低落时不强行打鸡血
- 推荐歌曲时只给一句理由

## Loop 0：仓库与运行基线

目标：让 `D:\workspace\Claudio` 成为干净、可提交、可推送的项目根目录。

计划：

- 确认当前目录就是 Git 仓库根目录。
- 确认 remote 指向 `chilechi/Claudio.git`。
- 创建基础项目说明与配置模板。

产物：

- `.gitignore`
- `README.md`
- `.env.example`
- `docs/loop-engine-checklist.md`

配置：

- Git 代理如需要使用 `http://127.0.0.1:7897`。
- `.env.example` 提供端口与 DeepSeek 配置位。

测试：

```powershell
git -C D:\workspace\Claudio status --short --branch
git -C D:\workspace\Claudio remote -v
```

验收：

- 仓库根目录正确。
- remote 正确。
- 没有无关嵌套仓库。
- 基础文档存在。

提交：

```powershell
git add .
git commit -m "chore: initialize Claudio planning docs"
git push origin main
```

## Loop 1：本地服务骨架

目标：启动一个不依赖第三方包的 Node 本地服务。

计划：

- 使用 Node 内置 `http` 模块。
- 先提供健康检查与静态文件服务。
- 保持依赖最少，避免第一轮被 npm 安装卡住。

产物：

- `package.json`
- `server.js`
- `public/index.html`
- `/api/health`

配置：

- 默认端口：`8080`
- 支持 `.env` 中的 `PORT`

测试：

```powershell
npm start
curl http://localhost:8080/api/health
```

验收：

- 服务能启动。
- `/api/health` 返回正常状态。
- 浏览器打开 `http://localhost:8080` 有页面。

提交：

```powershell
git add .
git commit -m "feat: add local server baseline"
git push origin main
```

## Loop 2：电脑端 Claudio 界面

目标：做出桌面端本地电台控制台。

计划：

- 参考用户提供的 Claudio 施工图风格。
- 第一屏直接是可用的电台界面，不做营销落地页。
- 保持电脑端优先，后续再响应式适配手机。

产物：

- `public/index.html`
- `public/style.css`
- `public/app.js`

界面区域：

- 播放器区：当前歌曲、播放、上一首、下一首、喜欢、跳过
- 对话区：用户输入、Claudio 回复、快捷场景按钮
- 队列区：当前播放队列
- 今日计划区：模式、推荐理由、口味标签、语音开关

设计要求：

- 黑底
- 施工图/本地控制台气质
- 不做大圆角卡片堆叠
- 不用营销 hero
- 不让文本溢出按钮或面板

测试：

```powershell
npm start
```

手动验收：

- 打开 `http://localhost:8080`
- 页面无控制台错误
- 电脑端布局清晰
- 主要按钮可点击

提交：

```powershell
git add .
git commit -m "feat: add desktop radio interface"
git push origin main
```

## Loop 3：歌单与口味档案

目标：把用户截图里的网易云歌曲变成初始音乐库和口味档案。

计划：

- 先用截图转写的歌曲建立本地 library。
- 网易云真实播放能力后续作为 adapter 做，不阻塞 MVP。
- 给歌曲打标签，用于本地推荐和 AI 选择。

产物：

- `data/library.json`
- `data/taste.md`
- `data/routines.md`

初始歌曲：

- 慢慢喜欢你 (Live at EasON AIR) - 陈奕迅
- 雨虹 - 曹方
- 我有 - 曾淑勤
- 那些你很冒险的梦 (JJ20版) - 林俊杰
- 每一面都美 - 陶喆
- 情歌 (Live) - 范本桐
- 困在你的雨季 - 唐俗救世Vulgar Savior
- 南柯 (dating on the pillow) - 就是哈比
- 一日 (The Day You Left Me) - 丁世光
- 吃掉我 - 金玟岐
- 我只能离开（陷在这漩涡之间）- 颜人中
- 与海无关 - 告五人
- 偶尔也有风 - 吴炳文

标签体系：

- `night`
- `rain`
- `emo`
- `coding`
- `bedtime`
- `rnb`
- `live`
- `indie`
- `soft`

测试：

- 页面能读取 `library.json`。
- 队列能显示歌曲标题、歌手、时长。
- 初始队列符合夜晚/安静口味。

验收：

- 歌单数据可被前端消费。
- 口味档案是中文可读文档。
- 数据结构便于后续接网易云真实接口。

提交：

```powershell
git add .
git commit -m "feat: add initial NetEase taste library"
git push origin main
```

## Loop 4：本地规则脑

目标：没有 DeepSeek Key 时，Claudio 也能工作。

计划：

- 根据用户输入识别场景。
- 用标签匹配生成队列。
- 用温柔克制模板生成回复。

产物：

- `brain/recommender.js`
- `/api/chat`
- `/api/plan/today`

场景识别：

- 写代码：`coding`
- 夜晚：`night`
- 低落：`emo`
- 睡前：`bedtime`
- 清醒：`clear`

测试输入：

```text
今晚想听安静一点
适合写代码的
有点 emo 但别太丧
睡前听一点轻的
```

验收：

- 每个输入都能返回 `mode`、`reply`、`queue`、`reason`。
- 回复短，不主动称呼用户。
- 推荐结果和模式相关。

提交：

```powershell
git add .
git commit -m "feat: add local recommendation brain"
git push origin main
```

## Loop 5：DeepSeek AI 大脑

目标：配置 DeepSeek Key 后，Claudio 使用真实 AI 生成回应和队列。

计划：

- 使用 DeepSeek OpenAI-compatible Chat Completions 接口。
- AI 必须返回结构化 JSON。
- AI 异常时回退本地规则脑。

产物：

- `brain/deepseek.js`
- `brain/persona.md`
- `.env.example` 增加 DeepSeek 配置

配置：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

测试：

- 无 Key：本地规则脑可用。
- 有 Key：DeepSeek 返回队列和回复。
- Key 错误：不崩溃，回退本地规则脑。

验收：

- `.env` 不进 Git。
- DeepSeek 输出限制为可解析 JSON。
- Claudio 人格规则生效。

提交：

```powershell
git add .
git commit -m "feat: add DeepSeek planning brain"
git push origin main
```

## Loop 6：语音回应

目标：Claudio 的文字回复可以朗读。

计划：

- 第一版使用浏览器 `SpeechSynthesisUtterance`。
- 设置中文、较慢语速、较低音调。
- 提供语音开关。
- 后续预留 Fish Audio 或其他 TTS adapter。

产物：

- 前端 TTS 函数
- 语音开关 UI

测试：

- 点击快捷模式后自动朗读。
- 手动输入后自动朗读。
- 关闭开关后不朗读。

验收：

- 语音不影响无声使用。
- 浏览器不支持 TTS 时不报错。

提交：

```powershell
git add .
git commit -m "feat: add browser voice replies"
git push origin main
```

## Loop 7：状态记忆

目标：Claudio 能记住喜欢、跳过、最近输入和当前模式。

计划：

- 用本地 JSON 存状态。
- 喜欢提高推荐权重。
- 跳过降低或暂时屏蔽推荐。
- 重启服务后状态保留。

产物：

- `data/state.json`
- `/api/state`
- `/api/player/event`

状态字段：

- `mode`
- `currentTrackId`
- `queue`
- `liked`
- `skipped`
- `recentPrompts`
- `memories`

测试：

- 点喜欢后状态文件更新。
- 点跳过后状态文件更新。
- 重启服务后状态仍存在。

验收：

- 状态持久化。
- 推荐逻辑读取状态。
- 不把隐私数据上传到第三方，除非用户明确配置 AI。

提交：

```powershell
git add .
git commit -m "feat: persist Claudio listening state"
git push origin main
```

## Loop 8：配置与开发体验

目标：让用户可以从零启动项目。

计划：

- 完善中文 README。
- 写清楚代理、端口、DeepSeek Key、启动步骤。
- 提供常见问题。

产物：

- `README.md`
- `.env.example`
- npm scripts

测试：

```powershell
Copy-Item .env.example .env
npm start
```

验收：

- 按 README 能启动。
- 无 Key 也能跑。
- 有 Key 可切 DeepSeek。

提交：

```powershell
git add .
git commit -m "docs: add setup and operation guide"
git push origin main
```

## Loop 9：端到端验收

目标：确认 Claudio 已经是可自动运行的电脑端 MVP。

计划：

- 从干净状态启动服务。
- 验证页面、API、推荐、语音、状态、DeepSeek 回退。
- 修复发现的问题。

验收清单：

- `npm start` 可启动。
- `http://localhost:8080` 可打开。
- `/api/health` 正常。
- 歌单可加载。
- 输入一句话可生成队列。
- 无 DeepSeek Key 可用。
- 有 DeepSeek Key 可用。
- DeepSeek 失败会回退。
- Claudio 回复可朗读。
- 喜欢/跳过可持久化。
- README 足够让用户运行。
- 所有已完成内容已 push 到 GitHub。

最终提交：

```powershell
git add .
git commit -m "chore: verify desktop MVP"
git push origin main
```

可选打标：

```powershell
git tag v0.1.0
git push origin v0.1.0
```

## Goal 使用方式

后续可以直接开 goal：

```text
按照 D:\workspace\Claudio\docs\loop-engine-checklist.md 自动完成 Claudio。
每个 Loop 按计划、改代码、配置、修复、测试、验收、commit、push GitHub 的闭环执行。
每个 Loop 完成后继续下一个，直到 Loop 9 验收完成。
```

执行时不要跳过测试和 push。遇到外部接口不可用时，先实现本地回退并记录限制。

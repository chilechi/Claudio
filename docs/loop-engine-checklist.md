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

## 执行顺序

每个任务拆成一个独立清单文件。执行 goal 时，必须按下面顺序逐个打开、逐个完成、逐个提交并推送。

- [Loop 00：仓库与运行基线](loops/loop-00-repository-baseline.md)
- [Loop 01：本地服务骨架](loops/loop-01-local-server.md)
- [Loop 02：电脑端 Claudio 界面](loops/loop-02-desktop-ui.md)
- [Loop 03：歌单与口味档案](loops/loop-03-taste-library.md)
- [Loop 04：本地规则脑](loops/loop-04-local-brain.md)
- [Loop 05：DeepSeek AI 大脑](loops/loop-05-deepseek-brain.md)
- [Loop 06：语音回应](loops/loop-06-voice-replies.md)
- [Loop 07：状态记忆](loops/loop-07-state-memory.md)
- [Loop 08：配置与开发体验](loops/loop-08-developer-experience.md)
- [Loop 09：端到端验收](loops/loop-09-e2e-acceptance.md)

## Goal 使用方式

后续可以直接开 goal。执行时先读本入口，再按上面的链接逐个读取 Loop 文件：

```text
按照 D:\workspace\Claudio\docs\loop-engine-checklist.md 自动完成 Claudio。每个 Loop 的具体清单在 docs/loops/ 下，逐个读取并执行。
每个 Loop 按计划、改代码、配置、修复、测试、验收、commit、push GitHub 的闭环执行。
每个 Loop 完成后继续下一个，直到 Loop 9 验收完成。
```

执行时不要跳过测试和 push。遇到外部接口不可用时，先实现本地回退并记录限制。

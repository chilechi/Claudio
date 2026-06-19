# Claudio v0.2 功能复刻 Loop Engine

本文档是 Claudio v0.2 的自动执行入口。v0.2 的目标是功能复刻，不是页面复刻。

执行前必须先阅读：

- `docs/phases/v0.2/technical-selection.md`
- `docs/phases/v0.2/missing-inputs.md`

每个 Loop 必须遵守：

```text
计划 -> 改代码 -> 配置 -> 修复 -> 测试 -> 验收 -> 中文 commit -> push GitHub
```

## v0.2 总原则

- 做能直接使用的真实功能。
- 不用假数据冒充真实接口。
- 缺 key、缺 cookie、缺本地资源时，UI 和接口都必须显示“未配置”。
- 缺口同步写入 `docs/phases/v0.2/missing-inputs.md`。
- 每个 Loop 完成后必须中文提交并推送 GitHub。
- 不提交 `.env`、API Key、Cookie、Token、账号登录态。

## 执行顺序

- [Loop 00：v0.2 工程迁移与技术基线](loops/loop-00-engineering-baseline.md)
- [Loop 01：配置中心与缺口诊断](loops/loop-01-config-diagnostics.md)
- [Loop 02：SQLite 数据层与状态迁移](loops/loop-02-sqlite-state.md)
- [Loop 03：真实本地音乐源与播放](loops/loop-03-local-music-playback.md)
- [Loop 04：网易云歌单元数据接入](loops/loop-04-netease-metadata.md)
- [Loop 05：播放器与队列控制台复刻](loops/loop-05-player-console.md)
- [Loop 06：DeepSeek AI DJ 规划](loops/loop-06-deepseek-dj.md)
- [Loop 07：TTS/ASR 语音能力](loops/loop-07-voice-io.md)
- [Loop 08：时段电台与长期口味](loops/loop-08-radio-routines.md)
- [Loop 09：诊断页、设置页与未配置状态](loops/loop-09-settings-diagnostics.md)
- [Loop 10：端到端真实可用验收](loops/loop-10-real-e2e-acceptance.md)

## Goal 描述建议

```text
按照 D:\workspace\Claudio\docs\phases\v0.2\checklist.md 自动完成 Claudio v0.2 功能复刻版。
先阅读技术选型和待补配置清单，再按 docs/phases/v0.2/loops/ 下的 Loop 00 到 Loop 10 顺序执行。
每个 Loop 都必须按计划、改代码、配置、修复、测试、验收、中文 commit、push GitHub 的闭环完成。
不允许用假数据冒充真实功能；缺配置的地方必须显示未配置，并同步写入 docs/phases/v0.2/missing-inputs.md。
```

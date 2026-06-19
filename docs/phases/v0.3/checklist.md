# Claudio v0.3 Loop Engine

v0.3 目标：把 Claudio 从可运行 demo 迁成完整前后端工程，为后续移动端复用打基础。

执行前必须先阅读：

- `docs/phases/v0.3/technical-plan.md`
- `docs/phases/v0.3/strict-acceptance.md`
- `docs/phases/v0.2/missing-inputs.md`

每个 Loop 必须遵守：

```text
计划 -> 改代码 -> 配置 -> 修复 -> 测试 -> 严格验收 -> 中文 commit -> push GitHub
```

## 总原则

- 不用假数据冒充真实能力。
- 迁移期间保留 v0.2 可运行 fallback。
- 每个阶段都要证明没有功能退化。
- UI 交互测试必须覆盖真实点击，不只测接口。
- 播放器、AI、音乐源、设置诊断必须有失败场景验收。
- 每个 Loop 的 validation 文档写到 `docs/phases/v0.3/validation/`。
- 不提交 `.env`、Cookie、API key、运行状态污染。

## 执行顺序

- [Loop 00：v0.3 工程边界和 API 合同](loops/loop-00-contracts.md)
- [Loop 01：建立 shared 类型和 schema](loops/loop-01-shared-schemas.md)
- [Loop 02：建立 core 业务逻辑包](loops/loop-02-core-domain.md)
- [Loop 03：迁移 NestJS 后端骨架](loops/loop-03-nest-server-shell.md)
- [Loop 04：迁移音乐源和状态服务](loops/loop-04-music-state-services.md)
- [Loop 05：迁移 AI DJ 和口味电台服务](loops/loop-05-ai-radio-services.md)
- [Loop 06：迁移 React Web 前端](loops/loop-06-react-web.md)
- [Loop 07：严格播放器交互验收](loops/loop-07-player-interactions.md)
- [Loop 08：设置诊断、错误态和中文界面验收](loops/loop-08-settings-errors-i18n.md)
- [Loop 09：移动端复用预留](loops/loop-09-mobile-readiness.md)
- [Loop 10：v0.3 全链路 E2E 和切换默认入口](loops/loop-10-v03-e2e-cutover.md)

## Goal 描述建议

```text
按照 D:\workspace\Claudio\docs\phases\v0.3\checklist.md 自动完成 Claudio v0.3 工程化迁移。
先阅读 v0.3 技术计划、严格验收标准和 v0.2 缺口清单，再按 docs/phases/v0.3/loops/ 下的 Loop 00 到 Loop 10 顺序执行。
每个 Loop 必须完成计划、改代码、配置、修复、测试、严格验收、中文 commit、push GitHub。
迁移期间不能破坏 v0.2 已跑通功能；播放器交互、AI 回退、音乐源切换、中文界面、设置诊断都必须做真实浏览器和接口验收。
不允许用假数据冒充真实功能；缺配置必须显示 missing/fallback，并写入对应 validation 文档。
```

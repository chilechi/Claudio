# Claudio v0.3 工程边界

Loop 00 先冻结边界，不迁移业务代码。v0.3 迁移期间，`server.js + public/` 继续作为 v0.2 fallback，直到 Loop 10 全链路验收通过后再切默认入口。

## 产品边界

Claudio 是个人 AI 电台，不是普通歌单播放器。v0.3 必须保留这些真实能力：

- 从真实音乐来源读取曲库：本地音乐目录可真实播放；网易云当前只作为歌单元数据和口味来源，不能伪装成可直接播放。
- 根据时间、口味、用户输入生成队列和 DJ 文案。
- 在 DeepSeek 不可用、返回非法 JSON、返回空队列或未知歌曲 ID 时回退到本地规则脑。
- 播放器要反映真实音频状态：播放、暂停、切歌、进度、音量、收藏、隐藏、跳过都必须可验证。
- 语音输出默认可使用浏览器 TTS fallback；没有真实 TTS provider 时必须显示 fallback。
- 设置诊断只展示配置项名称和状态，不能返回 `.env` 原文、Cookie 或 API key。

## 工程边界

```text
apps/web
  React + Vite + TypeScript。只负责桌面 Web / PWA 的界面、交互和浏览器音频能力。

apps/mobile
  后续 Expo / React Native。v0.3 只预留共享类型和 API 合同，不实现移动端 UI。

apps/server
  NestJS + Fastify adapter。只处理 HTTP 入参、认证/配置诊断响应、服务编排和 provider 调用。

packages/shared
  API DTO、Zod schema、共享类型、错误结构。不得依赖 DOM、Node 进程状态或具体前端框架。

packages/core
  纯业务逻辑：推荐、队列、口味画像、AI plan 修复、音乐源选择。不得依赖 HTTP、DOM、文件系统或 `.env`。

services/audio-worker
  后续可选 Python/FastAPI worker，只承接音频分析、ASR、TTS 或本地模型任务，不作为主后端。
```

## 兼容策略

- v0.3 新接口必须优先复用 v0.2 的 URL 和字段，除非合同明确标注为 legacy。
- `server.js + public/` 在迁移完成前必须能继续 `npm start` 跑通。
- 新 Nest 服务在未覆盖完整 v0.2 能力前，只能作为并行入口，不替换默认启动。
- 所有能力缺配置时都返回 `missing` 或 `fallback`，不能返回 `ready`。
- 所有提交只提交源码、文档、配置模板和测试；不提交 `.env`、Cookie、API key、运行状态污染。

## 数据所有权

- 曲库元数据由 music provider 读取，转换成 shared `Track`。
- 当前播放、收藏、跳过、最近提示词属于 state service。
- 队列计划属于 AI radio service，但 `queue` 必须引用真实 active library 里的 track。
- Web 只保存临时 UI 状态，不能把浏览器 DOM 状态写入 API contract。
- 移动端以后通过同一套 API 获取曲库、队列、诊断和对话结果。

## v0.3 必修复验证点

- 页面显示“播放中”时必须有真实音频状态支撑；没有可播放音频时显示不可播放提示。
- 队列数量、当前曲目、队列高亮、播放器卡片必须来自同一个 active library 和同一个 state。
- 用户播放中切歌后应继续播放；暂停中切歌后保持暂停。
- 网易云元数据模式必须持续提示“不保证直接播放”。
- 设置诊断不得泄露密钥值，只能展示变量名和状态。

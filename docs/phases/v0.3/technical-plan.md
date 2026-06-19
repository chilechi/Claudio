# Claudio v0.3 技术计划

v0.3 的目标不是继续堆 demo，而是把 Claudio 迁成可以长期维护、可以复用到移动端的完整前后端项目。

## 长期架构

```text
apps/
  web/                 # React + Vite + TypeScript，桌面 Web / PWA
  mobile/              # 后续 Expo / React Native
  server/              # NestJS + Fastify adapter

packages/
  shared/              # 共享类型、Zod schema、API DTO
  core/                # 纯业务逻辑：推荐、口味、队列、时段电台、音乐源选择
  config/              # env schema、provider 状态

services/
  audio-worker/        # 后续可选：Python/FastAPI，本地 Whisper、音频分析等
```

## 技术选型

- 主后端：`NestJS + Fastify adapter + TypeScript`
- Web 前端：`React + Vite + TypeScript`
- 移动端预留：`Expo / React Native`
- 共享校验：`Zod`
- 状态存储：先保留 JSON/SQLite 能力，后续统一到 SQLite service
- Python：不做主后端，只在确实需要音频/本地模型能力时作为 worker

## 为什么这样选

- Claudio 长期会有音乐源、播放器、AI DJ、口味、语音、设置、日程等模块，NestJS 的模块边界更稳定。
- Web 和移动端都在 TypeScript/React 生态，方便共享 API 类型和业务逻辑。
- Python 的优势在音频处理和模型生态，但不适合承担整个产品主后端。
- 保持 API 合同稳定，可以先替换内部工程结构，再改界面和移动端。

## 迁移原则

- 不破坏 v0.2 已经跑通的真实功能。
- 每次迁移只改变一个边界：类型、core、server、web、测试。
- 旧 `server.js + public/` 在 v0.3 完成前作为 fallback 保留。
- 新旧接口必须并行验收，直到新栈通过严格 E2E。
- 不用假数据冒充真实能力，缺配置就显示缺配置。

## 严格验收底线

每个 Loop 都必须至少包含：

- 类型检查或语法检查。
- API 合同检查。
- 真实服务启动检查。
- 浏览器 UI 检查。
- 交互检查。
- 错误/缺配置检查。
- 验收文档。
- 中文 commit 和 push。

涉及播放器的 Loop 必须额外检查：

- 点击播放后按钮状态、音频状态、当前曲目同步。
- 点击暂停后音频确实暂停。
- 切换上一首/下一首后当前曲目、队列高亮、播放器信息同步。
- 切歌后的自动播放策略明确：如果用户之前在播放，则切歌后继续播放；如果用户之前暂停，则切歌后保持暂停。
- 无可播放音频时不能显示正在真实播放。
- 网易云元数据模式下必须提示“当前不保证直接播放”。

涉及 AI 的 Loop 必须额外检查：

- DeepSeek 返回非法 JSON 时能回退。
- DeepSeek 返回不存在的歌曲 ID 时能回退或修复队列。
- AI 队列为空时不能让 UI 空白。
- 本地规则脑和 DeepSeek 脑都能跑通。

涉及移动端预留的 Loop 必须额外检查：

- API 返回不依赖桌面 DOM。
- shared schema 可被 web/mobile/server 同时导入。
- 不把浏览器专属能力写进 core。

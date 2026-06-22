# Claudio v0.7：电台运行内核

## 目标

参考 Claudio-FM 的思路，但保留当前 Nest + React + TypeScript 技术栈。重点不是照搬目录，而是补齐“电台会自己运行”的能力：开播、续播、切歌、旁白、事件推送、TTS 缓存和简单意图路由。

## 已完成

- 新增后端运行态模块 `RuntimeModule`。
- 新增事件流 `GET /api/events`，用 SSE 推送电台状态、当前曲目、旁白、控制事件和任务状态。
- 新增运行态接口：
  - `GET /api/runtime/status`
  - `GET /api/now`
  - `POST /api/runtime/start`
  - `POST /api/runtime/stop`
  - `POST /api/runtime/refill`
  - `POST /api/runtime/next`
  - `POST /api/runtime/request`
- 新增轻量意图路由：
  - “下一首 / 跳过”会切歌。
  - “暂停 / 继续”会发送控制事件。
  - “大声 / 小声”会发送音量调整事件。
  - 普通描述会组织或续写电台节目。
- TTS 增加本地缓存目录 `data/cache/tts/`，同一段真实 TTS 旁白不重复请求。
- 前端新增“开播 / 停播”入口，订阅后端事件，并展示当前电台运行状态。

## 保留差异

- 不使用 Claudio-FM 的 Express 单文件结构。
- 不新增 WebSocket 依赖，第一版使用 SSE，够用且更轻。
- 不引入 SQLite；当前仍沿用 JSON 状态文件和本地缓存。之后如果状态复杂化，再迁移数据库。
- 不照搬它的提示词和界面，只吸收结构思路。

## 下一步缺口

- 事件推送目前只做单实例内存态，重启后运行态会丢失。
- 自动 scheduler 只做整点轻声检查，没有完整早晚节目单。
- 还没有复杂音量 ducking，旁白和音乐可以同时存在。
- 移动端暂未接入 runtime API，只预留后续复用。

## 验收清单

- `npm run build`
- `npm run test:core`
- `npm run typecheck:mobile`
- 启动后访问 `/api/runtime/status` 返回运行态。
- 调用 `/api/runtime/start` 后返回队列和当前曲目。
- 调用 `/api/runtime/next` 后当前曲目变化，并生成新的旁白。
- 页面点击“开播”后能看到运行状态变化。
- 输入“下一首”“暂停”“继续”能走控制事件，不再只当普通聊天处理。

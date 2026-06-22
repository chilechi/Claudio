# Claudio 文档目录

文档按阶段归档，避免清单、验收记录和缺口说明混在一起。

## 阶段

- `phases/v0.1/`：第一版本地电台原型。
- `phases/v0.2/`：真实功能复刻版，包含技术选型、缺口清单和真实 E2E。
- `phases/v0.3/`：完整前后端工程化迁移，包含严格验收标准。
- `phases/v0.4/`：本地歌库整理，包含音频标签、缓存、封面和验收记录。
- `phases/v0.5/`：AI 电台旁白与主播语音，包含 host/voice 接口和验收记录。
- `phases/v0.6/`：PWA 安装体验，包含 manifest、service worker 和验收记录。

## 运行代码

- `apps/server/`：NestJS 服务端，默认入口。
- `apps/web/`：React + Vite 桌面端。
- `apps/mobile/`：移动端复用入口和 API client。
- `packages/shared/`：跨端类型和 schema。
- `packages/core/`：推荐、口味、音乐源选择等纯业务函数。
- `data/`：本地歌库、缓存和运行状态。
- `scripts/`：数据库初始化和导入脚本。

v0.3 cutover 后，旧的 `server.js`、`public/`、`brain/`、`music/`、`radio/` 已删除，避免 React/Nest 与原生 HTML/Node 入口混用。

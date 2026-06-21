# Claudio 文档目录

文档按阶段归档，避免清单、验收记录和缺口说明混在一起。

## 阶段

- `phases/v0.1/`：第一版本地电台原型。
  - `checklist.md`：v0.1 总清单。
  - `loops/`：v0.1 每个开发 Loop。
  - `validation/`：v0.1 验收记录。
- `phases/v0.2/`：真实功能复刻版。
  - `checklist.md`：v0.2 总清单。
  - `technical-selection.md`：前后端技术选型。
  - `missing-inputs.md`：外部配置、素材、依赖缺口。
  - `loops/`：v0.2 每个开发 Loop。
  - `validation/`：v0.2 每轮验收和最终 E2E。
- `phases/v0.3/`：完整前后端工程化迁移。
  - `checklist.md`：v0.3 总清单。
  - `technical-plan.md`：长期架构和技术选型。
  - `strict-acceptance.md`：严格验收标准，包含播放器真实交互。
  - `loops/`：v0.3 每个开发 Loop。
  - `validation/`：v0.3 每轮验收记录。
- `phases/v0.4/`：本地歌库整理。
  - `local-library-plan.md`：本地标签读取、缓存、封面和验收记录。

## 运行代码

- `apps/server/`：NestJS 服务端，默认入口。
- `apps/web/`：React + Vite 桌面端。
- `apps/mobile/`：移动端复用入口和 API client。
- `packages/shared/`：跨端类型和 schema。
- `packages/core/`：推荐、口味、音乐源选择等纯业务函数。
- `data/`：本地歌库和运行状态。
- `db/`：SQLite schema。
- `scripts/`：数据库初始化和导入脚本。

v0.3 cutover 后，旧 `server.js`、`public/`、`brain/`、`music/`、`radio/` 已删除，避免 React/Nest 与原生 HTML/Node 入口混用。

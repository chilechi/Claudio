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

## 运行代码

- `server.js`：当前可直接运行的 v0.2 服务入口。
- `public/`：当前桌面端页面。
- `brain/`：AI DJ、本地推荐和结构化计划。
- `music/`：本地音乐、网易云元数据适配器。
- `radio/`：时段电台和长期口味。
- `data/`：本地歌库和运行状态。
- `db/`：SQLite schema。
- `scripts/`：数据库初始化和导入脚本。
- `apps/`、`packages/`：后续 Fastify/React/共享包工程化目录。

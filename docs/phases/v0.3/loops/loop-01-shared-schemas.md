# Loop 01：建立 shared 类型和 schema

目标：建立 `packages/shared`，让 web、mobile、server 使用同一套类型和 Zod schema。

## 计划

- 定义共享实体：
  - `Track`
  - `MusicSource`
  - `Plan`
  - `ProviderStatus`
  - `TasteProfile`
  - `PlayerEvent`
  - `ChatRequest`
  - `ChatResponse`
- 建立 schema 和类型导出。

## 改代码

- 新增 `packages/shared/src/`。
- 把 `brain/plan-schema.js` 的结构迁成 TypeScript/Zod。
- 暂不删除旧 JS schema。

## 配置

- 调整 `tsconfig.json` paths。
- 确认 server/web 能导入 shared。

## 修复

- 修复字段命名不一致。
- 所有 API 返回字段以 shared schema 为准。

## 测试

- `npm run typecheck`
- shared schema 单独 parse 示例数据。
- 验证非法 plan、空 queue、未知 provider state 会失败。

## 严格验收

- shared 不依赖 DOM。
- shared 不读取 `.env`。
- shared 可被 server 和 web 同时 import。
- schema 覆盖 DeepSeek plan 的非法 JSON 场景。
- 验收文档写入 `docs/phases/v0.3/validation/loop-01-shared-schemas.md`。

## 提交

```powershell
git add packages/shared docs/phases/v0.3/validation
git commit -m "工程：建立共享类型和 Schema"
git push origin main
```

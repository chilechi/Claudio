# Loop 00：v0.3 工程边界和 API 合同

目标：先冻结 Claudio 的产品边界和 API 合同，再开始迁移。避免边写边猜。

## 计划

- 盘点 v0.2 现有 API。
- 定义桌面 Web、移动端、后端、core 的边界。
- 写出 API contract 初稿。
- 标记哪些接口必须保持兼容。

## 改代码

- 暂不迁移业务代码。
- 新增 contract 文档。
- 必要时新增 API 示例 JSON。

## 配置

- 不新增 `.env`。
- 确认现有 `.env.example` 包含 v0.3 需要保留的配置项。

## 修复

- 如果发现现有接口文档和实际返回不一致，先修文档。
- 不在本 Loop 大改实现。

## 测试

- 启动 v0.2 服务。
- 请求所有现有 API：
  - `/api/health`
  - `/api/music/active-library`
  - `/api/plan/today`
  - `/api/chat`
  - `/api/radio/today`
  - `/api/taste/profile`
  - `/api/settings/diagnostics`
- 保存响应结构摘要。

## 严格验收

- 每个 API 都有请求、响应、错误态说明。
- API contract 中标出 web/mobile 都需要的字段。
- 没有把浏览器 DOM 状态写进 API contract。
- 验收文档写入 `docs/phases/v0.3/validation/loop-00-contracts.md`。

## 提交

```powershell
git add docs/phases/v0.3
git commit -m "文档：定义 v0.3 工程边界和 API 合同"
git push origin main
```

# Loop 06：迁移 React Web 前端

目标：把 `public/` 原生页面迁移为 `apps/web` 的 React + Vite + TypeScript 应用。

## 计划

- 拆分组件：
  - `PlayerPanel`
  - `ChatPanel`
  - `QueuePanel`
  - `TodayPlanPanel`
  - `TastePanel`
  - `DiagnosticsPanel`
- 建立 API client。
- 建立播放器状态 hook。

## 改代码

- 使用 shared 类型。
- 保持当前桌面布局和中文文案。
- 旧 `public/` 暂时保留。

## 配置

- Vite dev proxy 指向 server。
- 构建产物由 server 静态托管或独立运行，先写清楚。

## 修复

- 统一 loading、empty、error 状态。
- 页面不再依赖散落的 DOM 查询。

## 测试

- `npm run build:web`
- React 页面能打开。
- 页面能读取 active library。
- 页面能发送 chat。
- 页面能渲染诊断。

## 严格验收

- 控制台无 error。
- 主要文案中文。
- 没有 UI 重叠和明显溢出。
- 网易云元数据模式下不会显示“可直接播放”。
- 验收文档写入 `docs/phases/v0.3/validation/loop-06-react-web.md`。

## 提交

```powershell
git add apps/web packages/shared docs/phases/v0.3/validation
git commit -m "工程：迁移 React Web 前端"
git push origin main
```

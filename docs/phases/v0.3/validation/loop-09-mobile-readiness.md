# Loop 09 移动端复用预留验收

## 范围

- 新增 `apps/mobile` 占位结构。
- 不做完整移动端 UI。
- 证明移动端可以复用 shared 类型、schema 和 core 纯函数。
- 明确移动端访问本地 server 的方式。

## 新增内容

- `apps/mobile/src/api-client.ts`
  - 移动端 API client。
  - 只依赖 `fetch`，可以由 React Native / Expo 注入 `fetchImpl`。
  - 覆盖歌库、状态、今日计划、口味、诊断、聊天 API。
- `apps/mobile/src/readiness.ts`
  - 导入 `packages/shared` schema 和 `packages/core` 纯函数。
  - 用 `activeLibrarySchema`、`queuePlanSchema`、`diagnosticsResponseSchema` 做类型/合同验证。
  - 用 `buildLocalPlan` 和 `buildTasteProfile` 证明移动端无需复制后端业务逻辑。
- `apps/mobile/README.md`
  - 说明真机和模拟器如何连接电脑本地 server。
  - 说明后续页面拆分。
- `npm run typecheck:mobile`
  - 专门验证移动端入口可类型检查。

## 验收结果

- `npm run typecheck:mobile`：通过。
- `packages/core/src` 和 `packages/shared/src` 未发现 `node:`、`fs`、`path`、`process`、`window`、`document` 等运行时依赖。
- `apps/mobile/src/api-client.ts` 中的 `path` 命中只是 API path 变量名，不是 Node `path` 模块。
- 移动端无需复制 AI、音乐源、状态持久化、网易云、本地扫描等后端逻辑。
- 移动端可复用 `Track`、`QueuePlan`、`ProviderStatus`、`DiagnosticsResponse` 等类型和 schema。

## 后续移动端页面拆分

- `PlayerScreen`：当前曲目、播放控制、队列入口。
- `ChatScreen`：Claudio 对话、语音输入、快捷场景。
- `QueueScreen`：播放队列、喜欢、跳过、隐藏。
- `SettingsScreen`：配置诊断、缺口提示、服务状态。
- `TasteScreen`：长期口味画像和标签。

## 注意

- 真机不能用 `localhost` 访问电脑服务；需要电脑局域网 IP。
- 移动端不保存 API key、Cookie 或真实 provider 密钥。
- 移动端只消费后端提供的诊断状态和变量名。

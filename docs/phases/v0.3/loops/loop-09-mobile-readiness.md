# Loop 09：移动端复用预留

目标：不急着做移动端界面，但要证明 v0.3 的类型、API、core 能被移动端复用。

## 计划

- 建立 `apps/mobile` 占位结构或文档。
- 设计移动端需要的 API 使用路径。
- 检查 core/shared 是否可被 React Native 导入。

## 改代码

- 可选新增 Expo app shell。
- 或先只新增 mobile readiness 文档和 package 配置。
- 不做完整移动端 UI。

## 配置

- 明确移动端连接本地 server 的配置方式。
- 明确手机真机访问电脑局域网 IP 的方式。

## 修复

- 清理 shared/core 中浏览器专属依赖。
- 清理 Node 专属依赖进入移动端 bundle 的风险。

## 测试

- shared 在 mobile tsconfig 中 typecheck。
- core 纯函数可在 mobile 环境导入。
- API client 不依赖 DOM。

## 严格验收

- 移动端无需复制后端业务逻辑。
- 移动端能复用 Track/Plan/ProviderStatus schema。
- 文档写清后续移动端页面拆分。
- 验收文档写入 `docs/phases/v0.3/validation/loop-09-mobile-readiness.md`。

## 提交

```powershell
git add apps/mobile packages docs/phases/v0.3/validation
git commit -m "工程：预留移动端复用入口"
git push origin main
```

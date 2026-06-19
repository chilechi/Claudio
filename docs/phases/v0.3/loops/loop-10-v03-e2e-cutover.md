# Loop 10：v0.3 全链路 E2E 和切换默认入口

目标：只有新前后端全链路通过严格验收后，才把默认入口切到 v0.3。

## 计划

- 跑完整 E2E。
- 对比 v0.2 fallback。
- 切换 `npm start` 到新 server。
- 明确旧入口保留或归档策略。

## 改代码

- 更新 `package.json` scripts。
- 更新 README。
- 更新 docs。
- 必要时归档旧 `server.js/public`。

## 配置

- `.env.example` 保持最新。
- 生产/本地/移动端访问方式写清楚。

## 修复

- 修复 E2E 中发现的所有 blocker。
- 如果发现依赖安装问题，按用户要求记录，不反复安装。

## 测试

- 无 `.env`。
- `MUSIC_SOURCE=local`。
- `MUSIC_SOURCE=netease`。
- DeepSeek ready。
- DeepSeek missing。
- 播放器真实音频。
- 网易云元数据。
- UI 点击播放/暂停/切歌/聊天/诊断。

## 严格验收

- 新 server 和新 web 是默认入口。
- 浏览器控制台无 error。
- 播放器交互逐项通过。
- AI 和音乐源逐项通过。
- v0.2 fallback 入口仍可找到，或有明确迁移说明。
- 验收文档写入 `docs/phases/v0.3/validation/v0.3-real-e2e.md`。
- 可选打 tag：`v0.3.0`。

## 提交

```powershell
git add .
git commit -m "验证：完成 v0.3 工程化迁移验收"
git push origin main
git tag v0.3.0
git push origin v0.3.0
```

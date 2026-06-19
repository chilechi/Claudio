# Loop 09：端到端验收

目标：确认 Claudio 已经是可自动运行的电脑端 MVP。

计划：

- 从干净状态启动服务。
- 验证页面、API、推荐、语音、状态、DeepSeek 回退。
- 修复发现的问题。

产物：

- 端到端验收记录。
- 必要的修复提交。
- 可选版本标签 `v0.1.0`。

测试：

- 启动本地服务。
- 打开桌面端页面。
- 调用健康检查接口。
- 验证无 Key、本地回退、DeepSeek 回退、语音与状态持久化。

验收清单：

- `npm start` 可启动。
- `http://localhost:8080` 可打开。
- `/api/health` 正常。
- 歌单可加载。
- 输入一句话可生成队列。
- 无 DeepSeek Key 可用。
- 有 DeepSeek Key 可用。
- DeepSeek 失败会回退。
- Claudio 回复可朗读。
- 喜欢/跳过可持久化。
- README 足够让用户运行。
- 所有已完成内容已 push 到 GitHub。

提交：

```powershell
git add .
git commit -m "chore: verify desktop MVP"
git push origin main
```

可选打标：

```powershell
git tag v0.1.0
git push origin v0.1.0
```

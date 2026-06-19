# Loop 07：状态记忆

目标：Claudio 能记住喜欢、跳过、最近输入和当前模式。

计划：

- 用本地 JSON 存状态。
- 喜欢提高推荐权重。
- 跳过降低或暂时屏蔽推荐。
- 重启服务后状态保留。

产物：

- `data/state.json`
- `/api/state`
- `/api/player/event`

状态字段：

- `mode`
- `currentTrackId`
- `queue`
- `liked`
- `skipped`
- `recentPrompts`
- `memories`

测试：

- 点喜欢后状态文件更新。
- 点跳过后状态文件更新。
- 重启服务后状态仍存在。

验收：

- 状态持久化。
- 推荐逻辑读取状态。
- 不把隐私数据上传到第三方，除非用户明确配置 AI。

提交：

```powershell
git add .
git commit -m "feat: persist Claudio listening state"
git push origin main
```

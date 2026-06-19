# Loop 08：时段电台与长期口味

目标：复刻视频里按时间、任务、情绪生成歌单的能力。

计划：

- 建立时段规则：上午、午休、会议间歇、运动、晚间冥想、夜尾。
- 从播放事件学习喜欢/跳过。
- AI 和本地规则都读取长期口味。
- 生成今日电台计划。

产物：

- `RoutineService`
- `TasteProfileService`
- `/api/radio/today`
- `/api/taste/profile`
- 前端今日计划视图

配置：

- 可选日程 provider 暂留空。

测试：

- 不同时段返回不同计划。
- 喜欢/跳过影响后续推荐。
- 没有日历配置时只用本地时段规则。

验收：

- 推荐不是随机列表。
- 推荐理由来自真实口味/时段/历史。
- 缺日历时明确显示未连接日历。

提交：

```powershell
git add .
git commit -m "功能：添加时段电台与长期口味"
git push origin main
```

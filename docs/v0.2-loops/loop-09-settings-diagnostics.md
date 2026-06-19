# Loop 09：诊断页、设置页与未配置状态

目标：让用户清楚知道哪些能力可用、哪些还缺配置。

计划：

- 实现设置页。
- 实现诊断页。
- 显示 DeepSeek、音乐源、TTS、ASR、天气、日历、UPnP 状态。
- 提供 `.env` 配置指引，不在 UI 收集敏感 key。

产物：

- `SettingsView`
- `DiagnosticsView`
- `/api/providers/status`
- 缺口说明链接

配置：

- 无新增配置。

测试：

- 无 key 时各 provider 显示未配置。
- 配置本地音乐目录后音乐源显示可用。
- 配置错误时显示错误原因。

验收：

- 用户不需要看日志就知道缺什么。
- UI 不展示敏感 key 原文。
- 待补清单与诊断项一致。

提交：

```powershell
git add .
git commit -m "功能：添加设置与诊断页"
git push origin main
```

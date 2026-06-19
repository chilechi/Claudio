# Loop 01：配置中心与缺口诊断

目标：建立真实配置中心，所有外部服务缺什么都能被系统明确识别。

计划：

- 用 Zod 校验 `.env`。
- 后端提供 `/api/config/status`。
- 前端显示 provider 配置状态。
- 缺配置时同步维护 `docs/v0.2-missing-inputs.md`。

产物：

- 配置 schema
- Provider 状态模型
- `/api/config/status`
- 前端诊断区域

配置：

- `DEEPSEEK_API_KEY`
- `LOCAL_MUSIC_DIR`
- `NETEASE_COOKIE`
- `NETEASE_PLAYLIST_ID`
- `TTS_PROVIDER`
- `ASR_PROVIDER`

测试：

- 无 `.env` 时服务可启动。
- 缺 key 时接口返回 `configured: false`。
- 有本地配置时返回 `configured: true`。

验收：

- 不再静默假装服务已连接。
- UI 能显示未配置项。
- 缺口写入待补清单。

提交：

```powershell
git add .
git commit -m "功能：添加配置中心与缺口诊断"
git push origin main
```

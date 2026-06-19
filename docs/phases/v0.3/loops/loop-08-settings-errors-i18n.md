# Loop 08：设置诊断、错误态和中文界面验收

目标：让用户不用看日志就知道当前哪里能用、哪里缺配置、哪里只是回退。

## 计划

- 完善设置诊断页。
- 完善错误态。
- 清理英文残留。
- 对缺配置、接口失败、空队列做 UI。

## 改代码

- 诊断页显示：
  - 音乐源选择
  - DeepSeek
  - 本地音乐
  - 网易云
  - TTS/ASR
  - 天气/日历/UPnP
- 不显示 key 原文。

## 配置

- 更新 `.env.example`。
- 更新 missing inputs。

## 修复

- 英文状态如 `ready/fallback/missing` 改中文。
- 空队列时给出下一步建议。
- API 失败时显示原因。

## 测试

- 无 `.env`。
- 只有 DeepSeek。
- 只有本地音乐。
- `MUSIC_SOURCE=netease`。
- 网易云 Cookie 失效。
- TTS/ASR 未配置。

## 严格验收

- 页面主文案中文。
- 缺配置不伪装成功。
- Cookie/key 不出现在 UI、日志、validation。
- 验收文档写入 `docs/phases/v0.3/validation/loop-08-settings-errors-i18n.md`。

## 提交

```powershell
git add apps/web apps/server docs/phases/v0.3/validation docs/phases/v0.2/missing-inputs.md
git commit -m "完善：设置诊断错误态和中文界面"
git push origin main
```

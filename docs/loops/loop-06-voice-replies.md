# Loop 06：语音回应

目标：Claudio 的文字回复可以朗读。

计划：

- 第一版使用浏览器 `SpeechSynthesisUtterance`。
- 设置中文、较慢语速、较低音调。
- 提供语音开关。
- 后续预留 Fish Audio 或其他 TTS adapter。

产物：

- 前端 TTS 函数
- 语音开关 UI

测试：

- 点击快捷模式后自动朗读。
- 手动输入后自动朗读。
- 关闭开关后不朗读。

验收：

- 语音不影响无声使用。
- 浏览器不支持 TTS 时不报错。

提交：

```powershell
git add .
git commit -m "feat: add browser voice replies"
git push origin main
```

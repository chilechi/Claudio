# Loop 06：DeepSeek AI DJ 规划

目标：让 Claudio 用 DeepSeek 生成真实队列计划和 DJ 旁白。

计划：

- 用当前播放、可用歌曲、时段、偏好、历史事件构建 prompt。
- DeepSeek 输出结构化 Plan。
- 用 Zod 校验输出。
- 失败时回退本地规则脑，并显示 `local fallback`。

产物：

- `BrainProvider`
- `DeepSeekBrainProvider`
- `LocalFallbackBrainProvider`
- `Plan` schema
- AI 消息时间线

配置：

```env
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

测试：

- 无 key 回退本地规则脑。
- 有 key 时生成真实 AI 计划。
- AI 输出非法 JSON 时回退。
- 用户输入能改变队列。

验收：

- AI 不再只是前端模板。
- 计划中的歌曲必须来自真实可用曲库。
- 回复保持温柔克制，不主动称呼用户。

提交：

```powershell
git add .
git commit -m "功能：接入 DeepSeek AI DJ"
git push origin main
```

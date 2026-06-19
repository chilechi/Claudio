# Loop 05：DeepSeek AI 大脑

目标：配置 DeepSeek Key 后，Claudio 使用真实 AI 生成回应和队列。

计划：

- 使用 DeepSeek OpenAI-compatible Chat Completions 接口。
- AI 必须返回结构化 JSON。
- AI 异常时回退本地规则脑。

产物：

- `brain/deepseek.js`
- `brain/persona.md`
- `.env.example` 增加 DeepSeek 配置

配置：

```env
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

测试：

- 无 Key：本地规则脑可用。
- 有 Key：DeepSeek 返回队列和回复。
- Key 错误：不崩溃，回退本地规则脑。

验收：

- `.env` 不进 Git。
- DeepSeek 输出限制为可解析 JSON。
- Claudio 人格规则生效。

提交：

```powershell
git add .
git commit -m "feat: add DeepSeek planning brain"
git push origin main
```

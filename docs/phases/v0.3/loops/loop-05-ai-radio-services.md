# Loop 05：迁移 AI DJ 和口味电台服务

目标：把 DeepSeek、本地规则脑、口味画像、时段电台迁移到 Nest service。

## 计划

- 建立 `AiModule`。
- 建立 `RadioModule`。
- 建立 `TasteModule`。
- 使用 shared plan schema 校验 DeepSeek 返回。

## 改代码

- 迁移：
  - `brain/deepseek.js`
  - `brain/persona.md`
  - `brain/plan-schema.js`
  - `brain/recommender.js`
  - `radio/routines.js`
- 保持 API：
  - `/api/chat`
  - `/api/plan/today`
  - `/api/radio/today`
  - `/api/taste/profile`

## 配置

- DeepSeek key 仍从 `.env` 读取。
- AI provider 仍支持 `local/deepseek`。

## 修复

- DeepSeek 返回非法结构时必须回退。
- DeepSeek 返回空队列时必须补足。
- 回复必须保持 Claudio persona。

## 测试

- DeepSeek ready 场景。
- DeepSeek missing 场景。
- DeepSeek timeout/mock error 场景。
- 本地规则脑场景。
- 空 library 场景。

## 严格验收

- `/api/chat` 不会返回空 queue，除非 active library 真的为空，并且必须有明确 reason。
- AI plan 的 queue id 必须存在于 active library。
- UI 不能因为 AI 错误显示空白。
- 验收文档写入 `docs/phases/v0.3/validation/loop-05-ai-radio-services.md`。

## 提交

```powershell
git add apps/server packages docs/phases/v0.3/validation
git commit -m "工程：迁移 AI DJ 和口味电台服务"
git push origin main
```

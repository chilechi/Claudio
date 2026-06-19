# Loop 10：端到端真实可用验收

目标：证明 Claudio v0.2 是真实可用的功能复刻版。

计划：

- 从干净环境启动。
- 按配置缺失和配置齐全两种场景验收。
- 使用真实本地音乐目录或真实网易云元数据。
- 使用 DeepSeek 或验证本地回退。
- 记录所有仍需用户补齐的项目。

产物：

- `docs/phases/v0.2/validation/v0.2-real-e2e.md`
- 必要修复提交
- 可选标签 `v0.2.0`

配置：

- 按 `docs/phases/v0.2/missing-inputs.md` 提供。

测试：

- 无 `.env`：服务启动，UI 显示未配置。
- 有 `LOCAL_MUSIC_DIR`：真实播放本地音频。
- 有 `DEEPSEEK_API_KEY`：AI 生成结构化计划。
- 无 DeepSeek key：本地回退明确显示。
- TTS 可朗读或明确显示不可用。

验收：

- 至少一个真实音乐源能播放。
- 用户输入能改变真实队列。
- 喜欢/跳过影响后续推荐。
- 未配置服务不伪装成功。
- 前端无控制台错误。
- 后端测试通过。
- 所有 Loop 已中文提交并 push。

提交：

```powershell
git add .
git commit -m "验证：完成 v0.2 真实功能验收"
git push origin main
```

可选打标：

```powershell
git tag v0.2.0
git push origin v0.2.0
```

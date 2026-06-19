# Loop 00：仓库与运行基线

目标：让 `D:\workspace\Claudio` 成为干净、可提交、可推送的项目根目录。

计划：

- 确认当前目录就是 Git 仓库根目录。
- 确认 remote 指向 `chilechi/Claudio.git`。
- 创建基础项目说明与配置模板。

产物：

- `.gitignore`
- `README.md`
- `.env.example`
- `docs/loop-engine-checklist.md`

配置：

- Git 代理如需要使用 `http://127.0.0.1:7897`。
- `.env.example` 提供端口与 DeepSeek 配置位。

测试：

```powershell
git -C D:\workspace\Claudio status --short --branch
git -C D:\workspace\Claudio remote -v
```

验收：

- 仓库根目录正确。
- remote 正确。
- 没有无关嵌套仓库。
- 基础文档存在。

提交：

```powershell
git add .
git commit -m "chore: initialize Claudio planning docs"
git push origin main
```

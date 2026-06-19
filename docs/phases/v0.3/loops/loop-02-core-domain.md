# Loop 02：建立 core 业务逻辑包

目标：把不依赖 HTTP、DOM、Node 进程环境的业务逻辑放到 `packages/core`。

## 计划

- 抽出推荐逻辑。
- 抽出口味画像逻辑。
- 抽出时段电台逻辑。
- 抽出音乐源选择策略。
- 保留旧 `brain/`、`radio/` 作为 fallback，直到新栈完全通过。

## 改代码

- 新增 `packages/core/src/`。
- 迁移：
  - `brain/recommender.js`
  - `radio/routines.js`
  - 音乐源选择逻辑
- 使用 shared 类型。

## 配置

- 更新 workspace/tsconfig。
- 增加 core 测试脚本。

## 修复

- 解决 v0.2 里 AI 返回未知 track id 导致队列变空的问题。
- 队列为空时必须回退到可用推荐。

## 测试

- 输入不同场景生成不同 queue。
- liked/skipped 影响推荐排序。
- `MUSIC_SOURCE=auto/local/netease` 策略单元测试。
- DeepSeek plan 中未知 ID 会被过滤并补足。

## 严格验收

- core 不依赖 `fetch`、`window`、`document`、`process.env`。
- core 对空 library、空 queue、全 skipped 都有稳定返回。
- 验收文档写入 `docs/phases/v0.3/validation/loop-02-core-domain.md`。

## 提交

```powershell
git add packages/core docs/phases/v0.3/validation
git commit -m "工程：抽取核心业务逻辑"
git push origin main
```

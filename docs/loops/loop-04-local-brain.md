# Loop 04：本地规则脑

目标：没有 DeepSeek Key 时，Claudio 也能工作。

计划：

- 根据用户输入识别场景。
- 用标签匹配生成队列。
- 用温柔克制模板生成回复。

产物：

- `brain/recommender.js`
- `/api/chat`
- `/api/plan/today`

场景识别：

- 写代码：`coding`
- 夜晚：`night`
- 低落：`emo`
- 睡前：`bedtime`
- 清醒：`clear`

测试输入：

```text
今晚想听安静一点
适合写代码的
有点 emo 但别太丧
睡前听一点轻的
```

验收：

- 每个输入都能返回 `mode`、`reply`、`queue`、`reason`。
- 回复短，不主动称呼用户。
- 推荐结果和模式相关。

提交：

```powershell
git add .
git commit -m "功能：添加本地推荐脑"
git push origin main
```

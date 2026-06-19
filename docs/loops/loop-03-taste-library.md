# Loop 03：歌单与口味档案

目标：把用户截图里的网易云歌曲变成初始音乐库和口味档案。

计划：

- 先用截图转写的歌曲建立本地 library。
- 网易云真实播放能力后续作为 adapter 做，不阻塞 MVP。
- 给歌曲打标签，用于本地推荐和 AI 选择。

产物：

- `data/library.json`
- `data/taste.md`
- `data/routines.md`

初始歌曲：

- 慢慢喜欢你 (Live at EasON AIR) - 陈奕迅
- 雨虹 - 曹方
- 我有 - 曾淑勤
- 那些你很冒险的梦 (JJ20版) - 林俊杰
- 每一面都美 - 陶喆
- 情歌 (Live) - 范本桐
- 困在你的雨季 - 唐俗救世Vulgar Savior
- 南柯 (dating on the pillow) - 就是哈比
- 一日 (The Day You Left Me) - 丁世光
- 吃掉我 - 金玟岐
- 我只能离开（陷在这漩涡之间）- 颜人中
- 与海无关 - 告五人
- 偶尔也有风 - 吴炳文

标签体系：

- `night`
- `rain`
- `emo`
- `coding`
- `bedtime`
- `rnb`
- `live`
- `indie`
- `soft`

测试：

- 页面能读取 `library.json`。
- 队列能显示歌曲标题、歌手、时长。
- 初始队列符合夜晚/安静口味。

验收：

- 歌单数据可被前端消费。
- 口味档案是中文可读文档。
- 数据结构便于后续接网易云真实接口。

提交：

```powershell
git add .
git commit -m "feat: add initial NetEase taste library"
git push origin main
```

# Loop 02：电脑端 Claudio 界面

目标：做出桌面端本地电台控制台。

计划：

- 参考用户提供的 Claudio 施工图风格。
- 第一屏直接是可用的电台界面，不做营销落地页。
- 保持电脑端优先，后续再响应式适配手机。

产物：

- `public/index.html`
- `public/style.css`
- `public/app.js`

界面区域：

- 播放器区：当前歌曲、播放、上一首、下一首、喜欢、跳过
- 对话区：用户输入、Claudio 回复、快捷场景按钮
- 队列区：当前播放队列
- 今日计划区：模式、推荐理由、口味标签、语音开关

设计要求：

- 黑底
- 施工图/本地控制台气质
- 不做大圆角卡片堆叠
- 不用营销 hero
- 不让文本溢出按钮或面板

测试：

```powershell
npm start
```

手动验收：

- 打开 `http://localhost:8080`
- 页面无控制台错误
- 电脑端布局清晰
- 主要按钮可点击

提交：

```powershell
git add .
git commit -m "功能：添加电脑端电台界面"
git push origin main
```

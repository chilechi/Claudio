# Loop 05：播放器与队列控制台复刻

目标：复刻视频中的 Claudio 控制台，并绑定真实播放状态。

计划：

- 实现黑色点阵控制台。
- 实现大时间、ON AIR 状态、播放条、队列、音量、收藏、隐藏、Light/Dark。
- 队列来自真实 provider，不写死。
- 播放器控制真实音频。

产物：

- `PlayerView`
- `QueueView`
- `ThemeToggle`
- `NowPlayingBar`
- `WaveformMeter`

配置：

- 无新增配置。

测试：

- 真实音频播放时进度条变化。
- 暂停/继续/下一首/喜欢/隐藏有效。
- Light/Dark 切换有效。

验收：

- UI 接近视频控制台。
- 所有按钮至少有真实状态变化或显示未配置。
- 不再只做静态展示。

提交：

```powershell
git add .
git commit -m "功能：复刻播放器控制台"
git push origin main
```

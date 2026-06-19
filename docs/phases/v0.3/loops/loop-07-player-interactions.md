# Loop 07：严格播放器交互验收

目标：专门修播放器交互，不允许只看页面渲染。必须覆盖真实点击和音频状态。

## 计划

- 建立浏览器自动化播放器测试。
- 覆盖播放、暂停、切歌、进度、音量、收藏、隐藏、跳过。
- 明确切歌后的自动播放策略。

## 改代码

- 修复发现的播放器 bug。
- 必要时拆出 `usePlayerController`。
- 必要时补充测试专用本地音频 fixture。

## 配置

- 测试使用临时 `LOCAL_MUSIC_DIR`。
- 不依赖用户真实音乐目录。

## 修复

- 点击暂停没有效果。
- 点击播放按钮 UI 和 audio 状态不同步。
- 切歌后不会按策略自动播放。
- 队列高亮和当前曲目不同步。
- 拖进度条无效。
- 无音频时仍显示播放中。

## 测试

- 浏览器真实点击：
  - 播放。
  - 暂停。
  - 下一首。
  - 上一首。
  - 拖动进度。
  - 调整音量。
  - 收藏。
  - 隐藏。
  - 跳过。
- 检查：
  - `audio.paused`
  - `audio.currentSrc`
  - `audio.currentTime`
  - 当前标题
  - 队列高亮
  - 按钮文案

## 严格验收

- 播放状态下切歌，切歌后继续播放。
- 暂停状态下切歌，切歌后保持暂停。
- 没有真实音频时不会伪装播放。
- 所有交互结果写入 validation。
- 验收文档写入 `docs/phases/v0.3/validation/loop-07-player-interactions.md`。

## 提交

```powershell
git add apps/web apps/server packages docs/phases/v0.3/validation
git commit -m "修复：完善播放器真实交互"
git push origin main
```

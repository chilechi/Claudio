# Loop 07 播放器交互验收

## 范围

- 使用临时 `LOCAL_MUSIC_DIR` 生成两首 4 秒 WAV fixture，不依赖用户真实音乐目录。
- 验收 React 播放器按钮、队列高亮、音频流响应、收藏、隐藏、跳过和不可播放失败态。
- 同步修复 v0.2 fallback server 的本地音频流和隐藏事件。

## 已完成修复

- 播放器切歌统一走 `selectTrack`，队列点击、上一首、下一首、跳过使用同一套状态策略。
- 聊天换队列时只在原本播放中且新曲目有 `streamUrl` 时继续播放，避免发消息后突然开播。
- 跳过按钮改为记录当前曲目，再移动到下一首。
- fallback server 支持 `hide` 事件写入 `state.hidden`。
- 本地音频流增加 `Content-Length`、`Accept-Ranges`、`Content-Range` 和 Range 206 支持。
- Nest 本地音频流接口同步增加 Range 支持。
- 播放失败时显示错误类型，例如 `NotAllowedError`，不再泛化为缺少本地目录。

## 命令验收

- `npm run typecheck`：通过。
- `npm run build:web`：通过。
- `npm run build`：通过。
- `curl -H "Range: bytes=0-127" http://127.0.0.1:8080/api/tracks/local-6f64ee913c00b067/stream`：
  - 返回 `206 Partial Content`。
  - 返回 `Content-Type: audio/wav`。
  - 返回 `Content-Length: 128`。
  - 返回 `Content-Range: bytes 0-127/352844`。
  - 返回 `Accept-Ranges: bytes`。

## 浏览器验收

- 页面读取临时本地音乐库：通过，显示 `本地 · 本地音乐`。
- 队列读取：通过，显示 `2 首`。
- 队列高亮和当前曲目：通过，`loop-07-one` / `loop-07-two` 可同步切换。
- 暂停状态下切歌：通过，切到下一首后仍为 `待命`，按钮仍为 `播放`。
- 没有真实可授权播放时不会伪装播放：通过，浏览器返回 `NotAllowedError` 后页面保持 `待命`，按钮保持 `播放`。
- 喜欢：通过，`state.liked` 写入当前曲目。
- 隐藏：通过，`state.hidden` 写入当前曲目。
- 跳过：通过，`state.skipped` 写入点击前的当前曲目，随后切到下一首。
- 控制台：当前页面未发现来自 `127.0.0.1:5173` 的 error。

## 未完全通过项

- 自动化浏览器中的真实音频播放未能进入 `audio.paused=false`。
- 失败原因：内置浏览器点击 `播放` 后，`audio.play()` 返回 `NotAllowedError`，属于浏览器媒体播放权限限制。
- 已确认音频文件可被浏览器识别：`duration=4`，`readyState=4`，并且服务端 Range 响应正常。
- 因为播放被浏览器权限阻止，以下两项尚未获得自动化通过证明：
  - 播放状态下切歌，切歌后继续播放。
  - 播放状态下拖动进度条后 `audio.currentTime` 实际跳转。

## 后续要求

- 后续 Loop 10 做最终 E2E 时，需要在普通浏览器手动点击或可授予媒体播放权限的自动化环境中复测播放态。
- 如果仍失败，再优先查前端 `audio.play()` 调用链；如果普通浏览器通过，则保留当前 `NotAllowedError` 失败态作为自动化环境限制。

# Claudio v0.4 本地歌库整理验收

## 目标

让本地音乐源优先显示真实歌名、歌手、专辑、时长和封面；缺少标签时使用清洗后的文件名兜底，不再大面积显示 `obj_...`。

## 已实现

- 新增 `music-metadata`，本地扫描会读取音频标签。
- `Track` 增加 `coverUrl`、`relativePath`、`metadataQuality`。
- 新增本地缓存 `data/local-library-cache.json`，按相对路径、文件大小、修改时间失效。
- 新增封面缓存 `data/cache/covers/`，通过 `/api/assets/covers/:coverKey` 访问。
- `/api/music/local/scan` 返回 `trackCount`、`playableCount`、`taggedCount`、`fallbackFilenameCount`。
- React Web 播放器优先显示封面；无封面时继续显示默认封面。
- React Web 新增“本地歌库”信息面板，显示本地曲库统计。
- 队列长标题会截断，避免撑破布局。

## 验收记录

执行命令：

```powershell
npm run build
npm run test:core
npm run typecheck:mobile
```

结果：

- `npm run build`：通过。
- `npm run test:core`：通过，13 项检查。
- `npm run typecheck:mobile`：通过。

接口验收：

- `MUSIC_SOURCE=local`，`/api/music/active-library` 返回 `source.type=local`、`selected=local`。
- 本机曲库返回 16 首本地音频。
- 首曲示例：`Everywhere We Go` / `陈冠希` / `三角度`，`metadataQuality=tag`。
- 队列标题中 `obj_...` 数量为 0。
- `/api/music/local/scan` 返回：
  - `trackCount=16`
  - `playableCount=16`
  - `taggedCount=6`
  - `fallbackFilenameCount=10`
- Range 音频流返回 `206`、`Accept-Ranges=bytes`、`Content-Type=audio/mpeg`。
- 封面接口返回 `200`、`Content-Type=image/jpeg`。

浏览器验收：

- 页面显示 `本地 · 本地音乐`。
- 播放器显示真实标题和歌手，例如 `The Tide` / `植地雅哉`。
- 队列显示真实标签标题，例如 `The Tide`、`Heartache`、`偏偏`、`Everywhere We Go`。
- 队列不再大面积显示 `obj_...`。
- 播放器封面使用 `/api/assets/covers/:coverKey`。
- “本地歌库”面板显示 `16 首本地音频，16 首可播放`、`标签识别 6`、`文件名兜底 10`。
- 当前页面 console error 为 0。

## 仍保留的缺口

- 第一版没有做手动编辑器；需要用户手动修正歌名/歌手时，后续再做本地覆盖文件或编辑界面。
- 读不到标签的文件仍只能从文件名清洗得到较粗略标题。
- 网易云真实播放不在本阶段范围内，仍保持元数据模式。

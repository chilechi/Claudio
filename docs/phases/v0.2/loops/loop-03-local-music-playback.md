# Loop 03：真实本地音乐源与播放

目标：接入一个可真实播放的音乐源，优先使用本地音乐目录。

计划：

- 读取 `LOCAL_MUSIC_DIR`。
- 扫描音频文件。
- 提取基础元数据。
- 后端提供安全的音频流接口。
- 前端使用 `<audio>` 或 Web Audio API 播放真实文件。

产物：

- `LocalMusicProvider`
- 音频扫描器
- `/api/music/local/scan`
- `/api/tracks/:id/stream`
- 前端真实播放控制

配置：

```env
LOCAL_MUSIC_DIR=
```

测试：

- 未配置目录时显示未配置。
- 配置目录后能扫描曲目。
- 至少一首本地音频能播放、暂停、下一首。

验收：

- Claudio 至少有一个真实可播放音乐源。
- 没有本地目录时不造假。
- 播放状态进入数据库。

提交：

```powershell
git add .
git commit -m "功能：接入本地音乐真实播放"
git push origin main
```

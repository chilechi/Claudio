# Loop 04：网易云歌单元数据接入

目标：接入网易云真实歌单元数据，不承诺所有歌曲都可播放。

计划：

- 读取 `NETEASE_PLAYLIST_ID`。
- 如果需要 Cookie，读取 `NETEASE_COOKIE`。
- 通过可配置 API 或网页解析获取歌单元数据。
- 保存歌名、歌手、专辑、封面、网易云 id、可播放状态。

产物：

- `NeteaseMusicProvider`
- `/api/music/netease/playlists/:id/import`
- provider 状态诊断
- 数据库导入逻辑

配置：

```env
NETEASE_PLAYLIST_ID=
NETEASE_COOKIE=
NETEASE_API_BASE_URL=
```

测试：

- 无配置时显示未配置。
- 有 playlist id 时能读取元数据或明确报错。
- 版权/VIP/不可播放状态要保存为真实状态。

验收：

- 不再把静态 `library.json` 说成网易云已接入。
- 元数据成功导入数据库。
- 不可播放歌曲在 UI 明确标记。

提交：

```powershell
git add .
git commit -m "功能：接入网易云歌单元数据"
git push origin main
```

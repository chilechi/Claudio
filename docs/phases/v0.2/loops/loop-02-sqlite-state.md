# Loop 02：SQLite 数据层与状态迁移

目标：把长期运行状态从 JSON 迁移到 SQLite。

计划：

- 建立 SQLite 数据库。
- 设计 tracks、playlists、events、preferences、memories、plans、messages、provider_status、settings 表。
- 写迁移脚本，把 v0.1 的 `data/state.json` 和 `data/library.json` 导入数据库。

产物：

- 数据库初始化脚本
- schema/migrations
- repository 层
- 导入脚本

配置：

```env
DATABASE_PATH=
```

测试：

- 初始化数据库。
- 导入当前歌库。
- 写入喜欢、跳过、最近输入。
- 重启后数据仍在。

验收：

- 状态不再依赖长期手改 JSON。
- v0.1 数据能迁移。
- 数据库文件不误提交，schema 和迁移脚本提交。

提交：

```powershell
git add .
git commit -m "功能：添加 SQLite 数据层"
git push origin main
```

# Loop 04：迁移音乐源和状态服务

目标：把本地音乐、网易云元数据、音乐源选择、播放器状态迁入 Nest service。

## 计划

- 建立 `MusicModule`。
- 建立 `StateModule`。
- 迁移本地音乐扫描和 stream。
- 迁移网易云元数据读取。
- 迁移 `MUSIC_SOURCE` 策略。

## 改代码

- 新增：
  - `music.controller.ts`
  - `music.service.ts`
  - `local-music.provider.ts`
  - `netease.provider.ts`
  - `state.service.ts`
- 保持 API：
  - `/api/music/active-library`
  - `/api/music/local/scan`
  - `/api/music/netease/status`
  - `/api/tracks/:id/stream`
  - `/api/player/event`

## 配置

- `MUSIC_SOURCE` 继续支持 `auto/local/netease`。
- 本地目录和网易云 Cookie 不输出到日志。

## 修复

- `MUSIC_SOURCE=netease` 时，页面和 AI 必须使用网易云 active library。
- `MUSIC_SOURCE=local` 且目录不可用时，明确返回空队列和原因。

## 测试

- 三种 `MUSIC_SOURCE` 都跑 API。
- 本地音频 stream 返回正确 content-type。
- 网易云元数据接口失败时返回明确错误。
- 播放事件写入状态。

## 严格验收

- 切换音乐源后：
  - `/api/music/active-library`
  - `/api/plan/today`
  - `/api/taste/profile`
  必须使用同一个 source。
- 不允许本地和网易云在页面上显示不一致。
- 验收文档写入 `docs/phases/v0.3/validation/loop-04-music-state-services.md`。

## 提交

```powershell
git add apps/server packages docs/phases/v0.3/validation
git commit -m "工程：迁移音乐源和状态服务"
git push origin main
```

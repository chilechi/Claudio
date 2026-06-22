# Claudio v0.6 PWA 安装体验验收

## 目标

让 Claudio 可以被浏览器识别为 PWA，并在桌面端安装成一个本地电台应用。v0.6 只做前端壳缓存，不缓存 API、音乐流、播放状态或本地歌库数据。

## 已实现

- `apps/web/index.html` 增加 `manifest`、图标、主题色和描述。
- 新增 `apps/web/public/manifest.webmanifest`。
- 新增 `apps/web/public/sw.js`。
- 新增 `apps/web/public/icons/claudio-icon.svg`。
- React 生产环境注册 service worker。
- 支持 `beforeinstallprompt`，满足浏览器安装条件时显示“安装”按钮。
- service worker 缓存应用壳、manifest、图标和静态资源。
- `/api/*` 不进入 service worker 缓存，音乐流和状态继续实时读取后端。

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

接口和产物验收：

- `apps/web/dist/manifest.webmanifest` 存在，可被 JSON 解析。
- `apps/web/dist/sw.js` 存在。
- `apps/web/dist/icons/claudio-icon.svg` 存在。
- `/manifest.webmanifest` 返回 `name=Claudio`、`display=standalone`、`start_url=/`。
- `/sw.js` 返回 200，且明确绕过 `/api/*`。
- `/` 的 HTML 包含 `manifest.webmanifest`、`theme-color` 和 PWA 图标链接。

浏览器验收：

- 本轮浏览器自动化工具连接层出现环境元数据错误，未完成真实安装按钮截图验收。
- 已通过构建产物和 HTTP 验收确认 PWA 必要文件可访问。
- 安装按钮依赖浏览器触发 `beforeinstallprompt`；满足安装条件时才显示。

## 仍保留的缺口

- 暂未做离线歌单或离线歌曲缓存。
- 暂未做 mobile-first PWA 布局。
- 暂未做通知、后台同步或媒体会话控制。

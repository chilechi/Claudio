# Claudio v0.3 严格验收标准

v0.3 每个阶段都必须先证明“没有退化”，再允许验收。只写完代码不算完成。

## 通用验收

- `npm install` 如有依赖问题，记录到本阶段 validation，不无限重试。
- `npm run typecheck` 或对应包的类型检查必须执行。
- 服务必须能在临时端口启动。
- 核心 API 必须返回符合 shared schema 的结构。
- 页面必须能打开，浏览器控制台不能有 error。
- `.env` 缺项必须显示 missing/fallback，不能假装 ready。
- 不提交 `.env`、Cookie、API key、运行状态污染。

## 播放器验收

播放器相关阶段必须逐项检查：

- 初始加载：
  - 能显示当前音乐源。
  - 能显示队列数量。
  - 能显示当前曲目信息。
- 播放：
  - 点击播放后，按钮状态变为暂停。
  - 有真实音频时，`audio.paused === false`。
  - 没有真实音频时，给出明确提示。
- 暂停：
  - 点击暂停后，按钮状态变为播放。
  - `audio.paused === true`。
- 切歌：
  - 下一首/上一首会改变当前曲目。
  - 队列高亮跟随当前曲目。
  - 歌名、歌手、封面首字母同步。
  - 用户处于播放状态时切歌，切换后继续播放。
  - 用户处于暂停状态时切歌，切换后保持暂停。
- 进度：
  - 播放时进度条更新。
  - 拖动进度条会改变 `audio.currentTime`。
- 音量：
  - 调整音量滑块会改变 `audio.volume`。
- 收藏/隐藏/跳过：
  - 请求成功。
  - 状态文件或状态 service 有记录。
  - 后续推荐能受到影响。

## AI DJ 验收

- DeepSeek 配置存在时，能生成结构化 plan。
- DeepSeek 未配置时，本地规则脑能生成 plan。
- DeepSeek 超时、非法 JSON、空队列、未知 track id 都不能让 UI 空白。
- AI 回复必须符合 Claudio persona：温柔克制，不主动称呼用户。
- plan.queue 必须对应真实 library tracks。

## 音乐源验收

- `MUSIC_SOURCE=auto`：本地有可播放音频时走本地，否则走网易云元数据。
- `MUSIC_SOURCE=local`：只走本地；本地不可用时明确提示。
- `MUSIC_SOURCE=netease`：只走网易云元数据；不伪装为可直接播放。
- 音乐源切换后，页面队列、口味画像、AI 计划使用同一个 active library。

## 前端验收

- 所有主要界面文案为中文。
- 页面没有明显英文残留，除品牌、模型名、技术名以外。
- 页面在桌面宽度下不重叠、不溢出。
- 关键按钮有可理解的中文文本或 title。
- Loading、empty、error 三种状态都可见。

## 后端验收

- Controller 只处理 HTTP 入参和响应。
- Service 承担业务编排。
- Provider 只封装外部能力。
- Core 函数不依赖 HTTP、DOM、Node 进程环境。
- API 错误响应有稳定结构。

## 移动端预留验收

- shared 类型不引用浏览器 DOM。
- core 不引用浏览器 API。
- API 合同足够移动端实现播放器、队列、聊天、设置诊断。
- 移动端暂不实现时，也要在文档写明复用入口。

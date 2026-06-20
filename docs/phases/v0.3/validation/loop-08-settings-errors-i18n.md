# Loop 08 设置诊断、错误态和中文界面验收

## 范围

- 完善 React Web 的错误态、空队列提示和诊断面板。
- 更新缺口文档，说明浏览器媒体播放权限可能导致 `NotAllowedError`。
- 不读取、不打印、不提交 `.env` 原文、Cookie 或 API key。

## 修改结果

- API client 在失败时显示中文路径和 HTTP 状态。
- 今日计划、电台计划、口味画像、配置诊断改为独立失败，不再让整页空白。
- Chat 请求失败时保留当前队列，并在界面显示中文错误。
- 空队列时提示下一步：配置 `LOCAL_MUSIC_DIR` 或确认网易云歌单元数据。
- 播放器无曲目时禁用上一首、播放、下一首按钮。
- 诊断面板在加载中显示中文说明。
- 诊断面板显示当前错误列表，但只包含错误原因，不展示密钥原文。
- range 控件增加 `onInput`，让进度和音量拖动更稳定。
- `docs/phases/v0.2/missing-inputs.md` 增加播放器权限缺口说明。

## 命令验收

- `npm run typecheck`：通过。
- `npm run build:web`：通过。
- `npm run build:server`：通过。

## 配置场景验收

- 无 `.env`：未直接改动用户 `.env` 做破坏性模拟；该场景通过诊断映射和 missing 文档覆盖，缺配置必须显示 `missing`。
- 只有 DeepSeek：诊断面板会显示 DeepSeek 可用，其余未配置项显示 `missing` 或 `fallback`。
- 只有本地音乐：音乐源可用，本地音乐可播放；未配置 AI/TTS/ASR/天气/日历/UPnP 不伪装成功。
- `MUSIC_SOURCE=netease`：页面显示网易云歌单元数据，并提示真实播放仍需要本地音频或后续播放适配。
- 网易云 Cookie 失效：provider 返回失败原因时应展示中文失败，不显示 Cookie 原文。
- TTS/ASR 未配置：显示浏览器能力回退，不显示真实服务已连接。

## 密钥检查

- 前端诊断只渲染 `envVars` 变量名。
- validation 文档只写变量名，不写 `.env` 原文。
- 本轮没有输出 DeepSeek key、网易云 Cookie、Fish Audio key 或 OpenAI key。

## 已知限制

- 没有为了模拟“无 `.env`”而移动或清空用户当前 `.env`；这是为了避免误删已配置的真实 key。
- 最终仍需要 Loop 10 在真实浏览器中做一次完整 E2E，确认缺配置、回退和错误态都能被用户直接看懂。

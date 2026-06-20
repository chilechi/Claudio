# Loop 06 React Web 验收

## 范围

- 将 `apps/web` 迁移为 React + Vite + TypeScript 页面。
- 保留 `public/` 旧版页面作为 v0.2 fallback。
- React 页面通过 Vite proxy 调用后端 API，不使用假歌单数据。

## 验收结果

- `npm run build:web`：通过。
- `npm run typecheck`：通过。
- React 页面 `http://127.0.0.1:5173/`：可打开，标题为 `Claudio`。
- `/api/music/active-library`：通过 Vite proxy 读取到网易云歌单元数据，当前为 13 首。
- 页面首屏：显示 `网易云 · 网易云歌单`，队列显示真实计划队列，不再停留在 `0 首`。
- 网易云元数据模式：页面没有显示“可直接播放”，提示“真实播放仍需要本地音频或后续播放适配”。
- 播放按钮：点击不可播放曲目后仍保持 `待命`，按钮仍为 `播放`，`audio.src` 为空，并显示不可播放原因。
- 下一首按钮：切歌后不会自动假播放，仍保持 `待命`。
- Chat：输入“今晚适合写代码，安静一点”后成功调用后端，队列更新为 5 首，回复和队列来自真实 API。
- 诊断面板：显示可用 4、回退 2、缺少 3，只展示变量名，不展示密钥原文。
- 当前 5173 页面控制台：无 error。
- 布局：浏览器检测 `scrollWidth` 未超过 viewport，未发现横向溢出。

## 修复记录

- Vite 开发服务改为使用 `apps/web/vite.config.ts`，统一配置 proxy。
- 启动流程拆成两段：先读取真实歌库和状态，再异步补齐计划、口味、诊断，避免 AI 计划慢时队列空白。
- 播放失败、切歌失败等即时状态优先展示，避免被旧的 AI 回复盖住。
- Vite 热更新下复用 React root，避免重复 `createRoot`。

## 已知限制

- 网易云当前只作为歌单元数据和口味来源，不能承诺所有歌曲可直接播放。
- 新 NestJS HTTP 服务仍受本机 `fast-json-stringify/index.js` 依赖缺失影响，当前 React 验收使用 v0.2 后端 fallback API。

# Claudio Mobile Readiness

这个目录暂时不做完整移动端 UI，只保留后续 React Native / Expo 接入需要复用的边界。

## 复用原则

- 移动端只调用后端 API，不复制 AI、推荐、音乐源、状态持久化等后端业务逻辑。
- 移动端复用 `packages/shared` 的 schema 和类型。
- 移动端可以复用 `packages/core` 的纯函数做离线预览或本地兜底，但不能导入 Node-only provider。

## 本地连接方式

- 模拟器访问电脑：通常使用 `http://10.0.2.2:8080` 或宿主机局域网 IP。
- 真机访问电脑：手机和电脑在同一 Wi-Fi，使用电脑局域网 IP，例如 `http://192.168.x.x:8080`。
- 不要把 `localhost` 写死到移动端配置里；真机上的 `localhost` 指手机自己。

## 后续页面拆分

- `PlayerScreen`：当前曲目、播放控制、队列入口。
- `ChatScreen`：Claudio 对话、语音输入、快捷场景。
- `QueueScreen`：播放队列、喜欢、跳过、隐藏。
- `SettingsScreen`：配置诊断、缺口提示、服务状态。
- `TasteScreen`：长期口味画像和标签。

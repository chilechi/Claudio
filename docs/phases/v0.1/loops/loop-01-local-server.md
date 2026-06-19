# Loop 01：本地服务骨架

目标：启动一个不依赖第三方包的 Node 本地服务。

计划：

- 使用 Node 内置 `http` 模块。
- 先提供健康检查与静态文件服务。
- 保持依赖最少，避免第一轮被 npm 安装卡住。

产物：

- `package.json`
- `server.js`
- `public/index.html`
- `/api/health`

配置：

- 默认端口：`8080`
- 支持 `.env` 中的 `PORT`

测试：

```powershell
npm start
curl http://localhost:8080/api/health
```

验收：

- 服务能启动。
- `/api/health` 返回正常状态。
- 浏览器打开 `http://localhost:8080` 有页面。

提交：

```powershell
git add .
git commit -m "功能：添加本地服务基线"
git push origin main
```

# Loop 08：配置与开发体验

目标：让用户可以从零启动项目。

计划：

- 完善中文 README。
- 写清楚代理、端口、DeepSeek Key、启动步骤。
- 提供常见问题。

产物：

- `README.md`
- `.env.example`
- npm scripts

测试：

```powershell
Copy-Item .env.example .env
npm start
```

验收：

- 按 README 能启动。
- 无 Key 也能跑。
- 有 Key 可切 DeepSeek。

提交：

```powershell
git add .
git commit -m "文档：添加配置与运行说明"
git push origin main
```

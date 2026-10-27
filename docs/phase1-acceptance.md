# Phase 1 验收记录

验收环境：Windows PowerShell，Node.js 24.22.1，npm 10.9.4。验收日期：2026-10-27。

## npm 环境诊断

- 项目目录：Windows 本地工作区。项目目录 ACL 对当前用户授予 Modify；`npm ci`、TypeScript、测试与构建均成功写入工作区。
- 执行环境原本没有 `npm` 命令在 PATH 中；Node.js 24.22.1 和 pnpm 11.25.0 可用。使用官方 npm 10.9.4 CLI 复核时，registry 为 `https://registry.npmjs.org/`。
- npm cache 位于当前用户的本地 AppData 目录，Windows ACL 显示当前用户 FullControl。默认沙箱中 npm 无法在该工作区外的 cache 目录写日志；这不是项目目录权限失败。
- 默认沙箱下 `npm view react@18.3.1 version --fetch-retries=0 --fetch-timeout=5000` 实际报 `npm error code EACCES`，失败在 GET `https://registry.npmjs.org/react` 的网络 socket 请求。独立 PowerShell 网络探测返回 Windows Socket `10013`（操作系统禁止该 socket 访问）。
- 在受审批的网络执行权限下，官方 registry 请求成功；`npm ci` 与全部验证随后完成。没有改 registry、关闭安全策略或修改全局权限。

## 已实际执行

- `npm ci --no-audit --no-fund`：成功，从 `package-lock.json` 安装 248 个包。唯一提示为 jsdom 间接依赖 `whatwg-encoding` 弃用提示。
- `npm test`：通过，1 个测试文件、9 项测试。
- `npm run typecheck`：通过，应用源码和 Vite 配置均完成 TypeScript 检查。
- `npm run build`：通过，Vite 5.4.21 生成生产静态资源。
- 页面在 Codex In-app Browser 的 600px 窄屏视口中实际打开：首页、课程地图、Hash 导航和每日打卡可用；小蘑菇 SVG 显示正确；深色模式可切换；在隔离的本地测试源上打卡后刷新，仍显示已打卡且累计/连续天数为 1。
- 课程页面实际显示五个模块和 U01–U28，所有单元均标记“计划中”；未发布单元无法被误标为完成。

## 自动化覆盖

`src/test/learning.test.tsx` 覆盖已发布课程统计、学习状态转换、重复打卡去重、连续与累计天数、当地日历日期及跨年边界、IndexedDB 写入与异常、28 单元状态元数据和 Hash 路由导航。

## 验收状态与部署事项

- 桌面视口验证：用户已在本机桌面浏览器完成验收，并确认界面没有问题。该结论由用户实际验证，本执行环境未自行复现 1366×768 与 1440×900 两种尺寸。
- GitHub Pages 线上部署尚未进行：仓库尚无 Git remote，不能推送或验证线上站点。
- Phase 1 本地功能和 UI 人工验收通过；GitHub Pages 线上部署仍待仓库配置与推送。
- 本次验收时 Git 分支为 `master`，无 remote；没有创建仓库或部署。

# 小蘑菇AI Builder 研究院

Little Mushroom · AI Builder Academy 是面向个人职业转型的本地优先 AI 学习平台。当前交付 Phase 1 框架：课程地图、学习状态、打卡日历、主题切换和 IndexedDB 存储。28 个单元均标记为计划中，不包含占位课程正文。

## 本地运行

需要 Node.js 20 或兼容的 npm。执行 `npm ci`、`npm run dev` 启动开发服务器；执行 `npm test`、`npm run typecheck`、`npm run build` 验证。锁文件使用 npm `package-lock.json`，`.npmrc` 固定了与该锁文件一致的 peer dependency 解析策略。

## 数据模型与存储

`src/domain/types.ts` 定义课程、学习状态、掌握度、打卡及偏好模型；`src/storage/db.ts` 集中管理 IndexedDB（数据库 `little-mushroom-academy`，版本 1，含 courses、progress、checkins、preferences stores）。学习状态与掌握度独立保存；数据库升级通过版本号和 `upgrade` 回调完成。浏览器本地数据可能因用户清理或设备变化而丢失；JSON 备份导入导出留待后续阶段。不得在浏览器存储或源码保存 API Key。

## GitHub Pages

`.github/workflows/deploy.yml` 在 `main` 或 `master` 更新时以及手动触发时构建并通过官方 Pages artifact/deploy 流程发布。仓库设置中启用 GitHub Pages，并将 Build and deployment 来源设为 **GitHub Actions**。Vite 从 Actions 提供的 `GITHUB_REPOSITORY` 自动选取项目站点子路径。部署完成后在仓库 **Settings → Pages** 查看实际访问地址。首次推送后检查 Actions 运行结果；工作流存在本身不代表部署成功。

官方说明：[Vite 静态部署](https://vite.dev/guide/static-deploy.html)、[GitHub Pages 发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## Phase 1 验收清单

- [x] 五模块、28 单元地图，均自由访问且未发布内容清晰标记。
- [x] 首页使用真实本地数据；初始已发布/完成数量为零，不虚构进度。
- [x] 学习状态与掌握度分开，掌握度初始为未评估。
- [x] 本地日期打卡、月历、去重、连续及累计统计。
- [x] IndexedDB 版本化存储及数据库错误反馈。
- [x] 正式名称、奶油白/小鸡黄/红色蘑菇视觉、SVG 品牌标识及深浅色和响应式布局。
- [x] Hash 路由与 GitHub Pages 工作流。
- [x] 移动窄屏界面与交互浏览器验证；桌面界面由用户在本机浏览器验收通过。
- [ ] GitHub Pages 真实线上部署（尚未配置远程仓库）。

当前环境已完成移动窄屏生产预览与打卡刷新检查；用户已确认桌面 UI 人工验收通过。验收证据及范围见 [Phase 1 验收记录](docs/phase1-acceptance.md)。

## 后续阶段

课程批次按 U01–U04、U05–U08、U09–U12、U13–U16、U17–U20、U21–U24、U25–U28 独立审核、测试、构建并提交。本阶段未生成课程正文、实验、练习或答案解析。

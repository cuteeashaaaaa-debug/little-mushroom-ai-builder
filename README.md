# 小蘑菇AI Builder 研究院

Little Mushroom · AI Builder Academy 是面向个人职业转型的本地优先 AI 学习平台。当前包含 Phase 1 基础框架，以及已发布的 U01–U08 正式课程、交互实验和本地评测。U09–U28 保持计划中，不含占位正文。

## 本地运行

需要 Node.js 20 或兼容的 npm。执行 `npm ci`、`npm run dev` 启动开发服务器；执行 `npm test`、`npm run typecheck`、`npm run build` 验证。锁文件使用 npm `package-lock.json`，`.npmrc` 固定了与该锁文件一致的 peer dependency 解析策略。

## 已发布课程

- U01：LLM 基础与 AI 应用架构（BI 助手架构搭建实验）
- U02：Token 与上下文窗口（明确标注估算的预算模拟器）
- U03：Prompt 设计与版本对比（明确标注预设样本的对比实验）
- U04：生成参数与输出控制（固定玩具概率分布的可重复采样模拟）
- U05：结构化输出与 JSON Schema（三层本地验证器，使用明确标注的 Schema 子集）
- U06：模型 API、流式输出与错误处理（本地请求/SSE/错误/取消模拟，不联网）
- U07：Function Calling 与模型选型（逐步参数、权限与虚构只读 BI 执行模拟）
- U08：RAG 原理与完整链路（虚构 PDF 片段的关键词检索和引用支持检查）

实验均在浏览器本地运行，不调用远程 AI 服务。客观题按选项自动判分；场景题由学习者作答并按 Rubric 自评，不做关键词语义评分。学习完成状态和知识掌握度分开保存；自评或阅读不会自动通过能力验收。课程内容审核记录见 [U01–U04 内容审计](docs/curriculum-audit-u01-u04.md) 与 [U05–U08 内容审计](docs/curriculum-audit-u05-u08.md)。

## 数据模型与存储

`src/domain/types.ts` 定义课程、学习状态、掌握度、打卡、练习、高亮及偏好模型；`src/storage/db.ts` 集中管理 IndexedDB（数据库 `little-mushroom-academy`，版本 3，含 courses、progress、checkins、preferences、exercises、highlights stores）。升级只为缺失的 store 建结构，不删除已有 store 或记录。高亮以课程 ID、稳定段落 ID、原段落全文、选区文本与字符偏移定位；正文变化或定位校验失败时跳过显示并保留原记录。学习状态、掌握度与正文高亮独立保存；浏览器本地数据可能因用户清理或设备变化而丢失；JSON 备份导入导出留待后续阶段。不得在浏览器存储或源码保存 API Key。

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

课程批次按 U09–U12、U13–U16、U17–U20、U21–U24、U25–U28 独立审核、测试、构建并提交。

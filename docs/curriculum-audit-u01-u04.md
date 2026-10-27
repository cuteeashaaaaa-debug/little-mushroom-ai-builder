# U01–U04 内容审核记录

审核日期：2026-10-27  
审核范围：本次发布的 U01–U04 正文、课程元数据、实验计算和评分流程。  
审核结论：**内容结构与技术边界审核通过；发布验收仍以本轮自动化、生产构建、桌面/移动浏览器及线上部署检查完成为准。**

## 单元审核

| 单元 | 审核重点 | 结论 |
| --- | --- | --- |
| U01 | Token 预测、训练/推理、Transformer/Attention、模型与应用职责、BI 案例权限与确定性查询 | 通过。Attention 不描述为因果解释；指标查询/权限/算术明确由程序控制。 |
| U02 | Token 与字符区别、上下文/输出预算、超限处理、PDF 检索、缓存边界 | 通过。实验估算仅为教学启发式；产品实际计数必须使用目标模型匹配的官方计数器。缓存命中不保证。 |
| U03 | Prompt 组成、Zero/Few-shot、版本评测、注入风险、知识卡片案例 | 通过。三个比较样本均标为作者预设，不调用模型；标签/JSON 均未描述为安全或事实正确性保证。 |
| U04 | Temperature、Top-p、输出上限、模型差异、控制变量实验 | 通过。概率实验按显式温度变换、累计 Top-p 截断与重归一规则采样，固定种子可重复；不伪装真实模型结果。 |

## 统一质量门禁

- 四节均含学习目标、前置知识、分节解释、流程图、虚构/脱敏案例、PM 与工程视角、误区、官方主题链接及能力验收标准。
- 每节至少 3 道客观题，按选项索引判分并提供逐题解释；不做关键词语义评分。
- 每节场景题含参考答案、3 项 Rubric 和常见错误；Rubric 是学习者自评，不自动验证能力。
- 完成状态和掌握状态独立写入 IndexedDB。自评只可选未评估、需要复习、基本理解；无正式证据不允许设置已通过验收。
- U05–U28 仍显示计划中，无正文、链接或可操作的虚假入口。
- 示例业务数值和文档均为虚构；未读取或复制公司内部材料。

## 官方资料核验

审核时打开并核验了下列官方页面的主题与课程对应关系；参数和行为按供应商/API 限定，不把一家的语义推广为通用保证。

- OpenAI [Token counting](https://developers.openai.com/api/docs/guides/token-counting)：请求级精确计数、消息结构及本地纯文本 Tokenizer 的限制。
- OpenAI [Tokenizer](https://platform.openai.com/tokenizer) 与 [tiktoken](https://github.com/openai/tiktoken)：交互式切分与实现说明。
- OpenAI [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) 与 [Agent Builder safety](https://developers.openai.com/api/docs/guides/agent-builder-safety)：提示结构、注入缓解思路；不是权限保证。
- OpenAI [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)：共享前缀与缓存条件；命中、保留和模型支持需看具体实现。
- OpenAI [Responses create reference](https://developers.openai.com/api/reference/resources/responses/methods/create)：`temperature`、`top_p`、`max_output_tokens` 的该 API 参数语义；文档建议通常一次调整一种采样参数。
- Anthropic [Token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting)、[Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)、[Messages API](https://platform.claude.com/docs/en/api/messages/create)：供应商特定计数、缓存及 `max_tokens` 说明。参数支持仍须按目标模型查其当前模型文档；课程没有宣称所有 Claude 模型均支持相同采样参数。
- Anthropic [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)：结构化提示及 XML 标签作为文本组织方法。
- Vaswani 等 [Attention Is All You Need](https://arxiv.org/abs/1706.03762)：Transformer/自注意力基础论文。
- MDN [HTTP messages](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Messages)、[JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)：HTTP 请求/响应、JSON 数据格式。

## 执行验收记录

| 检查项 | 结果 |
| --- | --- |
| 技术内容与直接官方资料 | 已核对；如上 |
| 自动化测试 | 通过：17 项测试全部通过；含课程结构、统计/状态、打卡、路由、评分、实验算法及 IndexedDB 读写/错误路径。 |
| TypeScript 检查 | 通过：`npm run typecheck`。 |
| 生产构建 | 通过：`npm run build`；Vite 输出 JS/CSS 资源。 |
| 桌面与移动端交互/溢出检查 | 通过：本机 Chrome 在 1366×768、1440×900、390×844 检查课程地图和四节实验；无横向溢出；U01 主题、判分与进度刷新恢复通过。 |
| 四项实验交互 | 通过：U01 移除验证节点显示风险并可重置；U02 缩小预算触发超限；U03 编辑后静态样本不变；U04 温度变化更新模拟并显示多次采样。 |
| Pages 部署与线上检查 | 待推送：本地 GitHub CLI 凭据当前无效，需重新完成 `gh auth login -h github.com` 后才能推送和验证。 |


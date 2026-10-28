# U05–U08 课程内容审计

审计范围：本次发布的 U05–U08 正文、案例、实验算法、练习题、答案解析及官方参考资料。所有案例数据均为课程虚构样本；实验不请求模型服务、公司系统或外部 API。

## 审查结果

| 单元 | 核心内容与边界 | 实验真实性 | 练习与验收 | 结果 |
|---|---|---|---|---|
| U05 结构化输出与 JSON Schema | 区分 JSON 语法、Schema 结构及业务/证据验证；覆盖必填、枚举、类型、附加字段、拒答与截断。Structured Outputs 的支持限定到具体端点/模型文档；结构正确不等于事实正确，不展示未经校准的关系概率。 | 本地执行 `JSON.parse`、明确列出的 Schema 子集和 RelateLens 业务规则；预置有效、语法错误、漏字段、错类型、错枚举及业务错误样本。明确不是完整 Draft 2020-12 验证器。 | 3 道选择题含逐题解析；场景题含字段设计、三层拒绝条件、证据安全 Rubric、参考答案与常见错项；验收要求能独立设计基础 Schema。 | 通过 |
| U06 模型 API、流式输出与错误处理 | 由 HTTP 请求基础讲起，说明客户端/服务端、请求组成、JSON、鉴权、SSE、超时/取消、错误分流、幂等、限流重试及前后端信任边界。强调具体请求/事件字段依端点；取消等待不保证服务器撤销操作。 | 本地规则模拟同步成功、分段流式、401、429（遵守 Retry-After）、503、超时和用户取消；使用虚构凭据标识，JSON 请求体先做真实语法解析，没有网络调用。没有自动重试；手动重试需满足错误类别及可重放条件，次数最多 2 次；503 模拟有上限指数退避。 | 3 道选择题含解释；知识卡片生成场景题覆盖加载、取消、限流和结果未知；Rubric、参考答案及常见错误齐全。 | 通过 |
| U07 Function Calling 与模型选型 | 区分模型提出调用、应用校验、身份/权限授权、工具执行、结果返回和模型组织回答；覆盖多步限制、风险确认、故障边界及公平模型比较。参数中自报角色不授予权限。 | 本地逐步模拟调用生命周期；严格校验期间、区域、指标白名单和模拟身份权限。执行的只读收入为虚构的 2026-09 数据；表格分值、延迟和成本单位均标为教学假设，不是模型价格或排行。 | 3 道选择题含解释；BI/Email Detective 场景题要求工作流、安全和评测方案；Rubric、参考答案与常见错误齐全。 | 通过 |
| U08 RAG 原理与完整链路 | 覆盖模型参数知识/长上下文/RAG 区别、文档导入解析、Chunk、Embedding、检索排序、上下文、证据生成、引用、无答案，以及检索和生成故障分层；把 Chunking/Embedding/混合检索细节留给后续单元。 | 使用带版本/页码的虚构行政 PDF 片段，在本地用字符二元组重叠排名，明确不是真实向量/Embedding 检索；固定示例答案与引用支持点不伪装实时生成。覆盖相关、多文档、无证据、不相关和错误引用场景。 | 3 道选择题含解释；PDF Reader Tools 场景题覆盖导入及在线链路、权限、引用和失败分支；Rubric、参考答案与常见错误齐全。 | 通过 |

## 参考资料核验

- U05： [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)；[JSON Schema 入门](https://json-schema.org/learn/getting-started-step-by-step)；[MDN JSON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON)。课程提醒 OpenAI 支持的是文档明确列出的能力子集，使用前应按目标模型/API 版本核验。
- U06： [OpenAI Streaming Responses](https://developers.openai.com/api/docs/guides/streaming-responses)；[MDN HTTP 状态码](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)；[MDN Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)；[MDN AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)。课程区分通用 SSE 事件 framing 与特定供应商的事件协议。
- U07： [OpenAI Function Calling](https://developers.openai.com/api/docs/guides/function-calling)；[OpenAI API 文档](https://developers.openai.com/api/docs/)。模型输出只作为应用处理的调用请求，不能作为授权或执行回执。
- U08： [OpenAI Retrieval](https://developers.openai.com/api/docs/guides/retrieval)；[OpenAI Prompt Engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)；Lewis 等人的 [Retrieval-Augmented Generation 论文](https://arxiv.org/abs/2005.11401)。托管 Retrieval 的产品做法没有被泛化为所有 RAG 架构。

上述官方页面于 2026-10-28 复核可访问；文档内容会更新，课程明确要求实际集成时再次核对端点与模型版本。自动化内容测试还逐一检查发布状态、课程结构、参考链接格式，以及段落强调语句是否与原文完全匹配。

## 自动审计证据

- 课程数据保留稳定 U01–U08 ID，总计 28 单元，模块分组为 7/5/5/5/6；仅 U01–U08 发布，其余 U09–U28 计划中。
- 测试覆盖 JSON 三层验证、API 错误与幂等重试判断、工具参数和权限、RAG 排名与引用校验，以及所有已发布课程的逐段强调标记。
- IndexedDB 数据库版本不变，不删除或重建任何 store。既有 progress、checkins、preferences、exercises、highlights 沿用稳定 unitId；迁移回归测试确认已有记录保留。

## 未纳入本审计的能力

本批没有真实模型 API、向量数据库、服务器端权限系统或企业文件接入。实验数据全部是静态、虚构和本地教学模拟，不能用来推断生产系统准确率或性能。

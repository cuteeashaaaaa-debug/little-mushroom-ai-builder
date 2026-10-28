# U01 深度课程 V2.0 内容与实现审计

审计范围：U01 六节微课、三个教学计算实验、数值与因果评测、IndexedDB v3→v4 迁移。只审计课程材料与本轮新增实现，不把开发者测试视为学习者教学效果证明。

## 结构审查

| 微课 | 机制与案例 | 检查方式 |
| --- | --- | --- |
| 01 文本如何成为数字 | Tokenizer、词表、ID、Embedding、位置/上下文表示；显式标记微型词表为教学数据 | 查表实验；Token ID 与 Embedding 概念题 |
| 02 Attention 如何利用上下文 | Q/K/V 投影、点积、√dₖ、Softmax、Value 汇总、因果遮罩与 Transformer 块 | 可编辑 Q/K/V 实验，显示全部中间值与维度缩放示意 |
| 03 Logits 与 Softmax | 输出头点积、Logit、指数、分母、稳定 Softmax、平移不变性与概率边界 | 可调 h/权重实验；独立数值题，按每项绝对误差 ≤0.02 判分 |
| 04 解码与连续生成 | 贪心、采样、Temperature、追加 Token、停止条件及实现差异 | 固定种子的本地伪随机教学采样；三题先预测再展示分析 |
| 05 训练如何改变预测 | 交叉熵、负对数似然、p−y、链式法则、学习率、训练/推理区别 | 可执行一步或最多十步的简化输出层更新；输入、梯度、权重、概率和损失均可查看 |
| 06 从模型局限到企业 AI 产品 | 幻觉、迎合、训练/后训练、上下文、检索及 BI 证据和权限边界 | 新订阅业务情境开放作答，六项诊断、自评 Rubric、参考分析与常见错误；不做关键词语义评分 |

六节都可由导航独立进入，微课位置、完成状态与练习答案使用微课 ID 单独保存。单元完成与掌握度仍由原有 U01 控件管理，不因读完微课而自动改变。

## 数值复核

连续主案例明确使用手设向量：q=[1,0]，k₁=k₂=[0,1]，所以原始分数 [0,0]；dₖ=2，缩放后仍为 [0,0]；Softmax 权重 [0.5,0.5]。取 v₁=[1,0]、v₂=[0.8,0.4]，加权汇总 h=[0.9,0.2]。计算函数和单元测试共同复核该值。

输出权重 [[2,0],[0,1.5],[-1,0]]、偏置 0 给出 Logits [1.8,0.3,-0.9]。稳定 Softmax 概率约为 [0.774992,0.172924,0.052084]，即 [77.50%,17.29%,5.21%]。改变 h=[0.2,0.9] 会重新计算 Logits [0.4,1.35,-0.2] 及概率，而非固定答案。

以“雨伞”为目标、η=0.1、固定 h，只更新三行输出权重：初始损失约 0.254902；p−y=[-0.225008,0.172924,0.052084]；更新后权重约 [[2.020251,0.004500],[-0.015563,1.496542],[-1.004688,-0.001042]]；新概率约 [0.780427,0.168345,0.051228]，目标概率约 78.04%，新损失约 0.247914。教学实验不是 Transformer 全量训练。

数值练习另用 h=[0.4,0.6] 和输出权重 [[1,0],[0,2],[-1,0]]，正确 Logits 为 [0.4,1.2,-0.4]，Softmax 约 [0.272118,0.605611,0.122271]。六项分别按绝对误差 0.02 容差判断。

## 内容准确性检查

- Token ID 是离散索引；Embedding 是查表得到的向量，编号大小不代表语义大小，向量维度不被直接等同于人类概念。
- Q/K/V 是输入表示通过不同参数投影的表示。缩放点积公式、示例 Softmax 与 Value 汇总已用计算测试复核。Attention 权重不是输出 Token 概率，也不是模型行为的完整因果解释。
- Logit 是未归一化分数。Softmax 保持排序；共同平移不改概率；减最大值用于数值稳定，并不修正语义错误。
- 解码规则影响选 Token；Temperature 接口行为因实现可能不同。固定种子实验是明确标注的教学伪随机模拟，不调用模型。
- 训练例只算 Softmax＋交叉熵下固定隐藏状态的线性输出层梯度，不能推广成每个真实网络步骤或评估指标必然单调改善。
- 幻觉和迎合分别讨论预训练目标、后训练、上下文、解码、检索和系统流程，未归结为随机采样或单一“预测下一个 Token”。产品案例把用户假设、查询事实、模型建议和已执行操作分开。
- 旧 U01 课程正文、段落原文及 passage ID 保留在可展开区域；新段落使用独立 ID。旧 U01 高亮只在原段落内容/偏移仍匹配时显示。

## 数据迁移审查

IndexedDB 从 v3 升到 v4，只新增 `microProgress` store 及 `by-unit` 索引。没有删除 store 或清空数据的迁移步骤。测试从真实 v3 store 布局打开 v4，并确认 U01 已完成状态、掌握状态、打卡、主题、练习答案和旧高亮均保留，新微课进度为空，不继承旧单元完成状态。

## 自动化与人工验收记录

自动化覆盖：向量运算、Attention 缩放/输出、Softmax 极值稳定与平移不变、交叉熵、梯度、权重更新、六课 ID 和语义强调完整性、微课进度恢复、数值判分、预测门禁、未发布 U20 禁止导航及数据库迁移。

浏览器验收、生产构建与线上发布结果以交付时的实际运行记录为准。课程能否让学习者独立掌握机制，仍需学习者试学确认。

## 核验参考资料

- [Attention Is All You Need](https://arxiv.org/abs/1706.03762)：Transformer、Scaled Dot-Product Attention 与 Multi-Head Attention。
- [Hugging Face Tokenizer 文档](https://huggingface.co/docs/transformers/main_classes/tokenizer)：文本到 Token 字符串与 ID 编码。
- [Hugging Face Generation Strategies](https://huggingface.co/docs/transformers/generation_strategies)：Greedy search 与 sampling。
- [PyTorch CrossEntropyLoss](https://docs.pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html)：分类交叉熵实现及输入/目标约定。
- [PyTorch Autograd](https://docs.pytorch.org/docs/stable/autograd.html)：基于可微计算图的梯度计算。
- [OpenAI Help：Does ChatGPT tell the truth?](https://help.openai.com/en/articles/8313428-does-chatgpt-tell-the-truth)：错误生成、核验与工具辅助准确性。

import type { ModuleMeta } from '../domain/types';
const modules: [string,string,string[]][] = [
['M01','AI 产品与基础认知',['AI时代与职业转型','生成式AI基础原理','大语言模型能力边界','AI产品经理的职责与能力','从问题发现到AI机会识别','AI产品需求分析']],
['M02','AI 产品设计与评估',['AI产品体验设计原则','提示词与上下文设计','AI功能评估指标','模型选择与成本权衡','AI产品原型与验证','安全、隐私与责任设计']],
['M03','AI 技术与解决方案',['检索增强生成 RAG','Embedding 与向量检索','工具调用与工作流','Agent 架构与适用边界','数据准备与知识库方案','AI解决方案架构']],
['M04','AI 应用工程实践',['Python与API应用基础','构建第一个AI应用','前端集成与流式交互','应用评测与调试','部署、监控与迭代','可靠性与生产化实践']],
['M05','FDE 与综合实战',['客户现场问题拆解','快速交付与技术沟通','端到端解决方案实战','作品集与职业发展']]
];
const firstObjectives:Record<string,string[]>={U01:['解释 LLM 的预测式生成原理及边界','区分模型、应用系统与确定性业务程序的职责','绘制包含数据、工具和验证层的 AI 应用架构'],U02:['区分 Token 与字符/词语并说明估算限制','估算并分配上下文窗口预算','解释分词、截断与 Prompt Caching 的适用边界'],U03:['使用目标、背景、约束、示例与格式编写 Prompt','比较 Prompt 版本并提出有证据的改进','识别 Prompt Injection 与模型能力边界'],U04:['解释 Temperature、Top-p 与最大输出长度','比较随机性、稳定性和输出控制效果','为不同业务风险设计可复现实验方案']};
const firstTitles:Record<string,string>={U01:'LLM 基础与 AI 应用架构',U02:'Token 与上下文窗口',U03:'Prompt 设计与版本对比',U04:'生成参数与输出控制'};
export const courseModules: ModuleMeta[] = modules.map(([id,title,units])=>({id,title,description:'建立可迁移的 AI Builder 实践能力。',units:units.map((name,i)=>{const n=String((+id.slice(1)-1)*6+i+1).padStart(2,'0'),unitId=`U${n}`;return {id:unitId,moduleId:id,title:firstTitles[unitId]??name,objectives:firstObjectives[unitId]??['理解核心概念并能结合实际业务进行判断'],prerequisites:unitId==='U01'?['无需编程基础；了解表格或 BI 查询场景即可']:unitId==='U02'?['U01：模型与应用系统的区别']:unitId==='U03'?['U01：模型输出边界']:unitId==='U04'?['U01：模型与业务规则的职责边界']:[],releaseStatus:'planned' as const}})}));
export const allUnits = courseModules.flatMap(m=>m.units);
for(const unit of allUnits){if(['U01','U02','U03','U04'].includes(unit.id))unit.releaseStatus='published'}

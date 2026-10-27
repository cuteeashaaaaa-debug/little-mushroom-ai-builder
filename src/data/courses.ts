import type { ModuleMeta } from '../domain/types';
const modules: [string,string,string[]][] = [
['M01','AI 产品与基础认知',['AI时代与职业转型','生成式AI基础原理','大语言模型能力边界','AI产品经理的职责与能力','从问题发现到AI机会识别','AI产品需求分析']],
['M02','AI 产品设计与评估',['AI产品体验设计原则','提示词与上下文设计','AI功能评估指标','模型选择与成本权衡','AI产品原型与验证','安全、隐私与责任设计']],
['M03','AI 技术与解决方案',['检索增强生成 RAG','Embedding 与向量检索','工具调用与工作流','Agent 架构与适用边界','数据准备与知识库方案','AI解决方案架构']],
['M04','AI 应用工程实践',['Python与API应用基础','构建第一个AI应用','前端集成与流式交互','应用评测与调试','部署、监控与迭代','可靠性与生产化实践']],
['M05','FDE 与综合实战',['客户现场问题拆解','快速交付与技术沟通','端到端解决方案实战','作品集与职业发展']]
];
export const courseModules: ModuleMeta[] = modules.map(([id,title,units])=>({id,title,description:'建立可迁移的 AI Builder 实践能力。',units:units.map((name,i)=>({id:`U${String((+id.slice(1)-1)*6+i+1).padStart(2,'0')}`,moduleId:id,title:name,objectives:['理解核心概念并能结合实际业务进行判断'],prerequisites:[],releaseStatus:'planned'}))}));
export const allUnits = courseModules.flatMap(m=>m.units);

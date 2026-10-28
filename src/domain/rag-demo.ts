export interface RagChunk { id: string; title: string; page: number; version: string; text: string; keywords: string[]; supports: string[] }
export interface RagScenario { id: string; label: string; query: string; answerClaim: string; citationIds: string[]; expectedSupport: string[] }

export const ragChunks: RagChunk[] = [
  { id: 'travel-12', title: '员工差旅制度', page: 12, version: '2026-04', text: '跨城出差应优先使用公共交通。出租车票据须记录行程日期、起止地点和业务事由，并在返程后十个工作日内提交。', keywords: ['跨城出差', '公共交通', '出租车票据', '行程日期', '十个工作日'], supports: ['报销时限', '票据字段'] },
  { id: 'expense-04', title: '报销流程', page: 4, version: '2026-05', text: '员工在费用系统选择差旅类别，上传发票及行程凭证；直属经理审批后由财务复核。材料不齐时退回补充。', keywords: ['费用系统', '差旅类别', '发票', '经理审批', '财务复核'], supports: ['提交流程', '审批角色'] },
  { id: 'equipment-08', title: '设备申领规范', page: 8, version: '2026-02', text: '设备申领需填写资产编号与用途，经部门负责人审批后登记领用。离职或设备损坏时应联系资产管理员。', keywords: ['设备申领', '资产编号', '部门负责人', '资产管理员'], supports: ['设备申领'] },
  { id: 'admin-03', title: '常见行政问题', page: 3, version: '2026-06', text: '差旅材料应通过费用系统提交。涉及跨部门项目时，项目负责人确认预算归属；本页未规定无票报销例外。', keywords: ['差旅材料', '费用系统', '项目预算', '无票'], supports: ['费用系统入口', '预算归属'] },
];

export const ragScenarios: RagScenario[] = [
  { id: 'relevant', label: '找到相关文档', query: '跨城出差出租车票据要记录什么？', answerClaim: '票据需记录日期、起止地点和业务事由。', citationIds: ['travel-12'], expectedSupport: ['票据字段'] },
  { id: 'multiple', label: '多份相关资料', query: '出租车票据应记录起止地点，几天内提交，上传发票后由谁审批？', answerClaim: '出租车票据需记起止地点，并在返程后十个工作日内提交；发票和行程凭证经直属经理审批、财务复核。', citationIds: ['travel-12', 'expense-04'], expectedSupport: ['票据字段', '报销时限', '审批角色'] },
  { id: 'no-evidence', label: '没有足够证据', query: 'quantum flux capacitor 7f9', answerClaim: '当前演示资料没有足够证据回答该规则。', citationIds: [], expectedSupport: ['虚拟币汇率'] },
  { id: 'irrelevant', label: '检索到主题相关但答非所问', query: '跨城出差出租车能否无票报销？', answerClaim: '系统无法从现有片段确认无票报销例外。', citationIds: ['travel-12'], expectedSupport: ['无票报销例外'] },
  { id: 'unsupported-citation', label: '引用不支持生成主张', query: '差旅出租车票据应在什么时候提交？', answerClaim: '所有票据必须在两天内提交。', citationIds: ['travel-12'], expectedSupport: ['两天内提交'] },
];

export function queryBigrams(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[\s\p{P}\p{S}]/gu, '');
  return Array.from({ length: Math.max(0, normalized.length - 1) }, (_, index) => normalized.slice(index, index + 2));
}

export function rankRagChunks(query: string, chunks: RagChunk[] = ragChunks) {
  const terms = new Set(queryBigrams(query));
  return chunks.map(chunk => {
    const documentTerms = new Set(queryBigrams(chunk.text + chunk.title));
    const overlap = [...terms].filter(term => documentTerms.has(term)).length;
    return { chunk, score: terms.size ? overlap / terms.size : 0 };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));
}

export function checkCitationSupport(scenario: RagScenario, retrievedIds: string[]) {
  const cited = ragChunks.filter(chunk => scenario.citationIds.includes(chunk.id));
  const sourcesRetrieved = scenario.citationIds.every(id => retrievedIds.includes(id));
  const claimIsSupported = scenario.expectedSupport.every(support => cited.some(chunk => chunk.supports.includes(support)));
  return { sourcesRetrieved, claimIsSupported, valid: sourcesRetrieved && claimIsSupported };
}

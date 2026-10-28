export interface ToolRequest { requestId: string; period: string; region: string; metric: string }
export interface ToolScenario { id: string; label: string; request: ToolRequest; toolFailure?: boolean }

export const toolScenarios: ToolScenario[] = [
  { id: 'normal', label: '正常：上月华东收入', request: { requestId: 'call_demo_01', period: '2026-09', region: '华东', metric: 'revenue' } },
  { id: 'forbidden', label: '权限不足：Analyst-B 查华东', request: { requestId: 'call_demo_02', period: '2026-09', region: '华东', metric: 'revenue' } },
  { id: 'bad-parameter', label: '参数错误：不在允许清单的指标', request: { requestId: 'call_demo_03', period: '2026-09', region: '华东', metric: 'secret_margin' } },
  { id: 'tool-failure', label: '工具异常：模拟查询超时', request: { requestId: 'call_demo_04', period: '2026-09', region: '华东', metric: 'revenue' }, toolFailure: true },
];

export const simulatedRevenue = { period: '2026-09', region: '华东', metric: 'revenue', current: 1240, previous: 1310, unit: '万元', updatedAt: '2026-10-01（虚构样本）' } as const;
export function validateToolRequest(request: ToolRequest): string[] {
  const errors: string[] = [];
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(request.period)) errors.push('period 必须为 YYYY-MM 且月份有效');
  if (!['华东', '华南', '华北'].includes(request.region)) errors.push('region 不在允许的区域枚举中');
  if (request.metric !== 'revenue') errors.push('metric 不是该只读工具允许的指标');
  return errors;
}

export function permissionDecision(role: 'Analyst-A' | 'Analyst-B' | 'Admin', region: string) {
  const allowed = role === 'Admin' || (role === 'Analyst-A' && region === '华东') || (role === 'Analyst-B' && region === '华南');
  return { allowed, message: allowed ? `${role} 可以读取 ${region} 的演示数据。` : `${role} 没有读取 ${region} 数据的权限，工具不会执行。` };
}

export interface ModelTeachingOption { name: string; quality: number; latencyMs: number; costUnits: number; note: string }
export const teachingModelOptions: ModelTeachingOption[] = [
  { name: '候选甲（教学假设）', quality: 4, latencyMs: 900, costUnits: 3, note: '质量分较高，延迟与单位成本也较高' },
  { name: '候选乙（教学假设）', quality: 3, latencyMs: 450, costUnits: 1, note: '质量分略低，但更快且假设成本较低' },
];

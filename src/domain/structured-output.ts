export type ValidationState = 'passed' | 'failed' | 'not-run';
export interface ValidationLayer { state: ValidationState; errors: string[] }
export interface StructuredValidation { syntax: ValidationLayer; schema: ValidationLayer; business: ValidationLayer }

export const relateLensSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    evidence_status: { type: 'string', enum: ['supported', 'insufficient', 'contradicted'] },
    evidence: { type: 'array', items: { type: 'string' } },
    uncertainties: { type: 'array', items: { type: 'string' } },
    missing_information: { type: 'array', items: { type: 'string' } },
    verify_next: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'evidence_status', 'evidence', 'uncertainties', 'missing_information', 'verify_next'],
  additionalProperties: false,
} as const;

export const structuredExamples = [
  { id: 'valid', label: '1 · 合法 JSON / Schema / 业务合理', value: { summary: '两段材料显示沟通间隔增加，但无法据此推断动机。', evidence_status: 'supported', evidence: ['src-14', 'src-19'], uncertainties: ['只有单方提供的两段材料'], missing_information: ['对方视角', '后续互动'], verify_next: ['补充时间范围', '直接澄清'], } },
  { id: 'syntax', label: '2 · JSON 语法错误', text: '{"summary":"少了结尾括号",}' },
  { id: 'required', label: '3 · 缺少必填字段', value: { summary: '只有摘要', evidence_status: 'insufficient', evidence: [], uncertainties: [], missing_information: [], } },
  { id: 'type', label: '4 · 字段类型不正确', value: { summary: 18, evidence_status: 'supported', evidence: ['src-14'], uncertainties: [], missing_information: [], verify_next: [], } },
  { id: 'enum', label: '5 · 枚举值不合法', value: { summary: '不能确认', evidence_status: 'likely', evidence: [], uncertainties: ['样本少'], missing_information: [], verify_next: [], } },
  { id: 'business', label: '6 · 结构合法但业务规则不满足', value: { summary: '已确认对方一定会回复。', evidence_status: 'supported', evidence: [], uncertainties: [], missing_information: [], verify_next: [], } },
] as const;

type SchemaNode = { type?: string; enum?: readonly unknown[]; properties?: Record<string, SchemaNode>; required?: readonly string[]; items?: SchemaNode; additionalProperties?: boolean };
function validateValue(value: unknown, schema: SchemaNode, path = '$'): string[] {
  const errors: string[] = [];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const validType = schema.type === actual || (schema.type === 'number' && actual === 'number' && Number.isFinite(value as number)) || (schema.type === 'integer' && typeof value === 'number' && Number.isInteger(value));
  if (schema.type && !validType) return [`${path} 应为 ${schema.type}，实际为 ${actual}`];
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path} 必须是 ${schema.enum.join(' / ')}`);
  if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const object = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in object)) errors.push(`${path}.${key} 缺少必填字段`);
    for (const [key, child] of Object.entries(schema.properties ?? {})) if (key in object) errors.push(...validateValue(object[key], child, `${path}.${key}`));
    if (schema.additionalProperties === false) for (const key of Object.keys(object)) if (!(key in (schema.properties ?? {}))) errors.push(`${path}.${key} 是未声明字段`);
  }
  if (schema.type === 'array' && Array.isArray(value) && schema.items) value.forEach((item, index) => errors.push(...validateValue(item, schema.items!, `${path}[${index}]`)));
  return errors;
}

export function validateRelateLensJson(text: string): StructuredValidation {
  let value: unknown;
  try { value = JSON.parse(text); }
  catch (error) {
    const message = error instanceof Error ? error.message : '无法解析 JSON';
    return { syntax: { state: 'failed', errors: [message] }, schema: { state: 'not-run', errors: [] }, business: { state: 'not-run', errors: [] } };
  }
  const syntax: ValidationLayer = { state: 'passed', errors: [] };
  const schemaErrors = validateValue(value, relateLensSchema as SchemaNode);
  const schema: ValidationLayer = { state: schemaErrors.length ? 'failed' : 'passed', errors: schemaErrors };
  if (schemaErrors.length || !value || typeof value !== 'object' || Array.isArray(value)) return { syntax, schema, business: { state: 'not-run', errors: [] } };
  const report = value as Record<string, unknown>;
  const errors: string[] = [];
  if (typeof report.summary === 'string' && !report.summary.trim()) errors.push('summary 不能是空白文本');
  if (report.evidence_status === 'supported' && Array.isArray(report.evidence) && report.evidence.length === 0) errors.push('evidence_status 为 supported 时至少需要一条可核验来源');
  if (report.evidence_status === 'insufficient' && Array.isArray(report.evidence) && report.evidence.length > 0 && !Array.isArray(report.uncertainties)) errors.push('insufficient 状态必须说明不确定性');
  if (typeof report.summary === 'string' && /\b(?:\d{1,3})\s*%/.test(report.summary)) errors.push('不得把未经校准的关系评估写成百分比概率');
  return { syntax, schema, business: { state: errors.length ? 'failed' : 'passed', errors } };
}

export function getStructuredExample(id: string) {
  const example = structuredExamples.find(item => item.id === id) ?? structuredExamples[0];
  return 'text' in example ? example.text : JSON.stringify(example.value, null, 2);
}

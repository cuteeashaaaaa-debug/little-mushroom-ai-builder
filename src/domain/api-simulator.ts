export type ApiScenarioId = 'success' | 'stream' | 'unauthorized' | 'rate-limit' | 'server-error' | 'timeout';
export interface ApiScenario { id: ApiScenarioId; label: string; status: number | null; response: string; chunks?: string[]; retryAfterSeconds?: number; simulatedDelayMs: number }

export const apiScenarios: ApiScenario[] = [
  { id: 'success', label: '正常同步成功', status: 200, response: '{"title":"反馈要具体","claim":"材料支持的观点","evidence":["原文片段"]}', simulatedDelayMs: 450 },
  { id: 'stream', label: 'SSE 分段返回', status: 200, response: '', chunks: ['{"title":"反馈', '要具体",', '"claim":"材料支持",', '"evidence":["片段"]}'], simulatedDelayMs: 120 },
  { id: 'unauthorized', label: '401 鉴权失败', status: 401, response: '{"error":"invalid_api_key"}', simulatedDelayMs: 260 },
  { id: 'rate-limit', label: '429 请求限流', status: 429, response: '{"error":"rate_limit_exceeded","retry_after_seconds":3}', retryAfterSeconds: 3, simulatedDelayMs: 260 },
  { id: 'server-error', label: '503 服务暂不可用', status: 503, response: '{"error":"upstream_unavailable"}', simulatedDelayMs: 260 },
  { id: 'timeout', label: '模拟客户端超时', status: null, response: '处理超过本地设定的等待上限。', simulatedDelayMs: 1800 },
];

export type RetryGuidance = { allowed: boolean; message: string };
export const MAX_MANUAL_RETRIES = 2;
export function retryDelayMs(retryNumber: number, baseMs = 500, maxMs = 8000) {
  return Math.min(maxMs, baseMs * 2 ** Math.max(0, retryNumber - 1));
}
export function retryGuidance(scenario: ApiScenario, requestIsIdempotent: boolean, manual = true, retryCount = 0): RetryGuidance {
  if (!manual) return { allowed: false, message: '实验不会自动重试；先分类并由调用方决定。' };
  if (retryCount >= MAX_MANUAL_RETRIES) return { allowed: false, message: `已达到本实验 ${MAX_MANUAL_RETRIES} 次手动重试上限。` };
  if (scenario.id === 'unauthorized') return { allowed: false, message: '修正服务端认证配置后再发起新请求；不要在浏览器暴露密钥。' };
  if (scenario.id === 'rate-limit') return { allowed: true, message: `等待 Retry-After ${scenario.retryAfterSeconds} 秒，之后再有限重试。` };
  if (scenario.id === 'server-error') return { allowed: requestIsIdempotent, message: requestIsIdempotent ? '请求可安全重放时，可由用户触发有限退避重试。' : '请求可能有副作用；先查询状态或使用幂等机制，不要直接重发。' };
  if (scenario.id === 'timeout') return { allowed: requestIsIdempotent, message: requestIsIdempotent ? '先确认客户端取消后的状态，再考虑有界重试。' : '结果可能未知；先查任务状态或幂等键，禁止盲目重复提交。' };
  return { allowed: false, message: '该结果没有需要重试的失败。' };
}

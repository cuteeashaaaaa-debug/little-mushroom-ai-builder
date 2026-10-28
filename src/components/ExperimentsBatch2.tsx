import { useEffect, useMemo, useRef, useState } from 'react';
import { apiScenarios, MAX_MANUAL_RETRIES, retryDelayMs, retryGuidance, type ApiScenarioId } from '../domain/api-simulator';
import { checkCitationSupport, ragScenarios, rankRagChunks } from '../domain/rag-demo';
import { getStructuredExample, validateRelateLensJson, structuredExamples } from '../domain/structured-output';
import { permissionDecision, simulatedRevenue, teachingModelOptions, toolScenarios, validateToolRequest } from '../domain/tool-calling';

function LayerResult({ title, state, errors }: { title: string; state: 'passed' | 'failed' | 'not-run'; errors: string[] }) {
  const label = state === 'passed' ? '通过' : state === 'failed' ? '未通过' : '未运行';
  return <div className={`validation-layer ${state}`}><b>{title} · {label}</b>{errors.length > 0 && <ul>{errors.map(error => <li key={error}>{error}</li>)}</ul>}</div>;
}

export function StructuredOutputLab() {
  const [example, setExample] = useState('valid');
  const [text, setText] = useState(getStructuredExample('valid'));
  const [result, setResult] = useState(() => validateRelateLensJson(getStructuredExample('valid')));
  const load = (id: string) => { setExample(id); const next = getStructuredExample(id); setText(next); setResult(validateRelateLensJson(next)); };
  const validate = () => setResult(validateRelateLensJson(text));
  return <div className="lab batch-lab">
    <div className="simulation-label">本地真实计算 · JSON.parse + 教学用 JSON Schema 子集 + RelateLens 业务规则</div>
    <p>此验证器<strong>不是完整 JSON Schema Draft 2020-12 实现</strong>，只支持本例的 object/string/array、required、enum、items 与 additionalProperties 关键字。不会调用模型。</p>
    <label className="field">验证案例<select value={example} onChange={event => load(event.target.value)}>{structuredExamples.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
    <label className="field">编辑 JSON<textarea className="code-editor" rows={14} spellCheck={false} value={text} onChange={event => setText(event.target.value)} /></label>
    <button className="button" onClick={validate}>运行三层验证</button>
    <div className="validation-grid" aria-live="polite">
      <LayerResult title="JSON 语法" {...result.syntax}/>
      <LayerResult title="Schema 结构" {...result.schema}/>
      <LayerResult title="业务语义" {...result.business}/>
    </div>
    <p>RelateLens 示例不会输出未经校准的预测概率；结构正确仍需核验来源授权、证据与不确定性。</p>
  </div>;
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('已取消', 'AbortError')); return; }
    const timer = window.setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('已取消', 'AbortError')); }, { once: true });
  });
}

export function ApiDebugLab() {
  const [scenarioId, setScenarioId] = useState<ApiScenarioId>('success');
  const [body, setBody] = useState('{\n  "task": "生成知识卡片",\n  "source_text": "反馈要具体且指出下一步。",\n  "format": "title, claim, evidence"\n}');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('尚未发送');
  const [timeline, setTimeline] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [safeToReplay, setSafeToReplay] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const scenario = apiScenarios.find(item => item.id === scenarioId)!;
  const guidance = retryGuidance(scenario, safeToReplay, true, retryCount);

  useEffect(() => {
    if (retrySeconds <= 0) return;
    const id = window.setInterval(() => setRetrySeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(id);
  }, [retrySeconds > 0]);
  useEffect(() => () => controller.current?.abort('unmount'), []);

  const run = async (isRetry = false, retryNumber = 0) => {
    try { JSON.parse(body); } catch (error) { setStatus('客户端拒绝发送：JSON 请求体语法错误'); setTimeline([error instanceof Error ? error.message : 'JSON 无法解析']); return; }
    const active = new AbortController(); controller.current = active; setRunning(true); setResponse(''); setStatus('发送模拟请求…');
    const event = (message: string) => setTimeline(items => [...items, `${new Date().toLocaleTimeString()} · ${message}`]);
    setTimeline([]); event('POST /demo/v1/responses；只在本地运行');
    try {
      if (!isRetry) setRetryCount(0);
      if (isRetry && scenarioId === 'server-error') { const delay = retryDelayMs(retryNumber); setStatus(`有限指数退避 · 等待 ${delay}ms`); event(`用户触发第 ${retryNumber} 次重试；指数退避 ${delay}ms`); await sleep(delay, active.signal); }
      if (scenarioId === 'stream') {
        setStatus('200 · 正在接收模拟 SSE 事件'); event('content-type: text/event-stream');
        for (const chunk of scenario.chunks ?? []) { await sleep(scenario.simulatedDelayMs, active.signal); setResponse(previous => previous + chunk); event(`data: ${chunk}`); }
        setStatus('200 · response.completed'); event('收到结束事件；完整输出可供下一步验证');
      } else if (scenarioId === 'timeout') {
        setStatus('等待中…客户端上限 800ms'); event('开始较长的模拟处理（1800ms）');
        const timeout = window.setTimeout(() => active.abort('timeout'), 800);
        try { await sleep(scenario.simulatedDelayMs, active.signal); }
        finally { window.clearTimeout(timeout); }
      } else {
        await sleep(scenario.simulatedDelayMs, active.signal);
        setResponse(scenario.response);
        setStatus(`${scenario.status} · ${scenario.label}`);
        event(`HTTP ${scenario.status}；模拟响应已返回`);
        if (scenario.retryAfterSeconds) { setRetrySeconds(scenario.retryAfterSeconds); event(`Retry-After: ${scenario.retryAfterSeconds} 秒；不会自动重试`); }
      }
    } catch {
      if (active.signal.reason === 'timeout') { setStatus('客户端超时 · 结果未知'); setResponse('服务端是否已完成无法由客户端超时判断；先查询任务状态，勿盲目重复副作用。'); event('本地等待超过 800ms；客户端停止等待'); }
      else { setStatus('用户已取消等待 · 服务端状态可能未知'); setResponse('本地 Fetch 等待已取消；这不代表服务端工作或副作用已回滚。'); event('AbortController.abort()；取消仅为模拟'); }
    } finally { setRunning(false); controller.current = null; }
  };
  const clear = () => { controller.current?.abort('user'); };
  const manualRetry = async () => { if (!guidance.allowed || retrySeconds > 0 || running) return; const next = retryCount + 1; setRetryCount(next); setTimeline(items => [...items, `用户手动发起第 ${next}/${MAX_MANUAL_RETRIES} 次重试；没有自动循环`]); await run(true, next); };

  return <div className="lab batch-lab">
    <div className="simulation-label">规则模拟 · 不连接真实模型、网络 API 或凭据</div>
    <div className="api-grid">
      <div>
        <label className="field">场景<select value={scenarioId} onChange={event => { setScenarioId(event.target.value as ApiScenarioId); setRetryCount(0); setRetrySeconds(0); }} disabled={running}>{apiScenarios.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
        <label className="field">模拟 JSON 请求体<textarea className="code-editor" rows={8} value={body} onChange={event => setBody(event.target.value)}/></label>
        <div className="api-meta"><b>POST</b> <code>/demo/v1/responses</code><span>Content-Type: application/json</span><span>Authorization: Bearer <code>demo_credential_not_real</code></span></div>
        <p className="small-note">上面的凭据标记是虚构文本；练习没有真实密钥，也不会发起联网调用。</p>
      </div>
      <div className="api-response"><div className="api-response-head"><b>请求状态</b><span>{status}</span></div><pre>{response || '响应内容将在本地模拟后显示。'}</pre>
        {scenarioId === 'server-error' || scenarioId === 'timeout' ? <label className="check"><input type="checkbox" checked={safeToReplay} onChange={event => setSafeToReplay(event.target.checked)} disabled={running}/> 我已确认该请求可安全重放/已有幂等保护</label> : null}
        <div className="api-actions"><button className="button" onClick={() => void run()} disabled={running || retrySeconds > 0}>发送模拟请求{retrySeconds > 0 ? `（限流等待 ${retrySeconds}s）` : ''}</button>{running && <button className="button secondary" onClick={clear}>取消等待</button>}{!running && ['rate-limit', 'server-error', 'timeout'].includes(scenarioId) && <button className="button secondary" onClick={() => void manualRetry()} disabled={!guidance.allowed || retrySeconds > 0}>手动安全重试（{retryCount}/{MAX_MANUAL_RETRIES}）</button>}</div>
        {scenarioId !== 'success' && scenarioId !== 'stream' && <p className="feedback warning">{guidance.message}{scenarioId === 'server-error' && retryCount < MAX_MANUAL_RETRIES ? ` 下一次手动重试等待 ${retryDelayMs(retryCount + 1)}ms。` : ''}{retrySeconds > 0 ? ` 当前遵守 Retry-After，等待 ${retrySeconds}s。` : ''}</p>}
      </div>
    </div>
    <div className="timeline"><b>事件时间线</b>{timeline.length ? <ol>{timeline.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol> : <p>请求发送后会显示模拟延迟与事件。</p>}</div>
    <p>429 尊重 Retry-After；401 修复认证配置后再调用；5xx 只在确认可重放时考虑有限重试；超时/取消可能留下结果未知。演示延迟和响应都是预设规则，不是模型生成。</p>
  </div>;
}

export function ToolCallingLab() {
  const [scenarioId, setScenarioId] = useState('normal');
  const [role, setRole] = useState<'Analyst-A' | 'Analyst-B' | 'Admin'>('Analyst-A');
  const [step, setStep] = useState('idle');
  const [message, setMessage] = useState('选择请求和模拟身份，然后逐步检查调用生命周期。');
  const scenario = toolScenarios.find(item => item.id === scenarioId)!;
  const errors = validateToolRequest(scenario.request);
  const permission = permissionDecision(role, scenario.request.region);
  useEffect(() => { setStep('idle'); setMessage('选择请求和模拟身份，然后逐步检查调用生命周期。'); }, [scenarioId, role]);
  const reset = () => { setStep('idle'); setMessage('选择请求和模拟身份，然后逐步检查调用生命周期。'); };
  const execute = () => {
    if (scenario.toolFailure) { setStep('failed'); setMessage('模拟查询超时：没有返回业务数据；不能编造执行成功。'); return; }
    setStep('executed'); setMessage(`只读模拟查询已执行：${simulatedRevenue.current} ${simulatedRevenue.unit}（上期 ${simulatedRevenue.previous} ${simulatedRevenue.unit}），更新时间 ${simulatedRevenue.updatedAt}。`);
  };
  return <div className="lab batch-lab">
    <div className="simulation-label">规则模拟 · 模型调用为预设请求；BI 数据为课程虚构样本</div>
    <div className="tool-controls">
      <label className="field">用户请求<select value={scenarioId} onChange={event => setScenarioId(event.target.value)}>{toolScenarios.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
      <label className="field">模拟身份<select value={role} onChange={event => setRole(event.target.value as typeof role)}><option>Analyst-A</option><option>Analyst-B</option><option>Admin</option></select></label>
    </div>
    <ol className="tool-lifecycle">
      <li className={step !== 'idle' ? 'current' : ''}><b>1 · 模型建议调用</b><code>lookup_monthly_revenue({JSON.stringify(scenario.request)})</code><button className="text-button" disabled={step !== 'idle'} onClick={() => { setStep('proposed'); setMessage('模型提出一个工具调用请求；还没有执行。'); }}>模拟模型提出调用</button></li>
      <li className={['validated', 'authorized', 'executed', 'returned', 'failed'].includes(step) ? 'current' : ''}><b>2 · 程序验证参数</b><span>{errors.length ? errors.join('；') : 'period、region、metric 通过本地参数规则。'}</span><button className="text-button" disabled={step !== 'proposed'} onClick={() => { setStep(errors.length ? 'rejected' : 'validated'); setMessage(errors.length ? '参数验证失败；工具未执行。' : '参数格式与白名单通过，下一步仍需权限检查。'); }}>检查参数</button></li>
      <li className={['authorized', 'executed', 'returned', 'failed'].includes(step) ? 'current' : ''}><b>3 · 程序检查权限</b><span>{permission.message}</span><button className="text-button" disabled={step !== 'validated'} onClick={() => { setStep(permission.allowed ? 'authorized' : 'rejected'); setMessage(permission.allowed ? '权限允许；请决定是否执行只读工具。' : '权限不足，工具被拒绝，未执行查询。'); }}>检查用户权限</button></li>
      <li className={['executed', 'returned', 'failed'].includes(step) ? 'current' : ''}><b>4 · 工具执行</b><span>在真实系统中只读查询需绑定授权身份、超时和行数限制。</span><div className="api-actions"><button className="text-button" disabled={step !== 'authorized'} onClick={execute}>决定执行工具</button><button className="text-button" disabled={step !== 'authorized'} onClick={() => { setStep('rejected'); setMessage('应用/用户拒绝执行；没有业务查询。'); }}>拒绝执行</button></div></li>
      <li className={step === 'returned' ? 'current' : ''}><b>5 · 结果回传并组织回答</b><span>{step === 'executed' ? message : step === 'returned' ? message : '必须等工具返回结果后，模型才能基于该结果组织回答。'}</span><button className="text-button" disabled={step !== 'executed'} onClick={() => { setStep('returned'); setMessage(`工具结果 call_id=${scenario.request.requestId} 返回模型。模拟回答：上月华东收入 ${simulatedRevenue.current} 万元，较上期减少 ${simulatedRevenue.previous - simulatedRevenue.current} 万元；这是本课程预设虚构数据。`); }}>将结果返回模型</button></li>
    </ol>
    <div className="feedback" role="status">当前状态：{message}</div>
    <button className="text-button" onClick={reset}>重置流程</button>
    <h3>轻量模型选型对比 · 教学假设</h3><p>以下数字纯属假设，不是厂商价格、测速或性能排行；生产选择需用同一评测集实测。</p>
    <div className="table-wrap"><table className="score-table"><thead><tr><th>假设候选</th><th>任务质量分（1–5）</th><th>延迟（假设 ms）</th><th>相对成本单位</th><th>权衡</th></tr></thead><tbody>{teachingModelOptions.map(item => <tr key={item.name}><td>{item.name}</td><td>{item.quality}</td><td>{item.latencyMs}</td><td>{item.costUnits}</td><td>{item.note}</td></tr>)}</tbody></table></div>
  </div>;
}

export function RagFlowLab() {
  const [scenarioId, setScenarioId] = useState('relevant');
  const [query, setQuery] = useState(ragScenarios[0].query);
  const [runResult, setRunResult] = useState<{ scenarioId: string; query: string } | null>(null);
  const scenario = ragScenarios.find(item => item.id === scenarioId)!;
  const submitted = runResult?.scenarioId === scenarioId && runResult.query === query;
  const ranked = useMemo(() => submitted ? rankRagChunks(query).slice(0, 3) : [], [query, submitted]);
  const chosen = ranked;
  const citation = checkCitationSupport(scenario, chosen.map(item => item.chunk.id));
  return <div className="lab batch-lab">
    <div className="simulation-label">本地关键词评分模拟 · 没有 Embedding、向量库、远程模型或企业文档</div>
    <p>演示检索通过字符二元组重叠打分排序，仅让你观察候选片段与来源。它不是语义向量检索；最终答案是本地预设示例。</p>
    <div className="tool-controls"><label className="field">检索场景<select value={scenarioId} onChange={event => { const next = ragScenarios.find(item => item.id === event.target.value)!; setScenarioId(next.id); setQuery(next.query); setRunResult(null); }}>{ragScenarios.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="field">用户问题<input value={query} onChange={event => { setQuery(event.target.value); setRunResult(null); }}/></label></div>
    <button className="button" onClick={() => setRunResult({ scenarioId, query })}>运行本地检索流程</button>
    <div className="rag-flow">
      <section><h3>1 · 文档集合</h3><p>4 份虚构行政资料；均带版本和页码。</p>{['员工差旅制度','报销流程','设备申领规范','常见行政问题'].map(title => <span className="rag-chip" key={title}>{title}</span>)}</section>
      <section><h3>2 · 候选片段与本地排名</h3>{!submitted ? <p>运行检索后显示候选。</p> : chosen.length ? chosen.map(({ chunk, score }) => <article className="rag-chunk" key={chunk.id}><b>{chunk.title} · 第 {chunk.page} 页 · {chunk.version}</b><p>{chunk.text}</p><small>关键词重叠分数 {score.toFixed(3)} · 来源 ID {chunk.id}</small></article>) : <p className="feedback warning">没有命中候选片段。不能要求模型猜测缺失制度。</p>}</section>
      <section><h3>3 · 上下文与预设示例答案</h3>{submitted ? <><p>送入上下文的候选数：{chosen.length}。此处答案是固定教学样本，不是模型实时生成。</p><blockquote>{scenario.answerClaim}</blockquote><p>预设引用：{scenario.citationIds.length ? scenario.citationIds.join(', ') : '无'}</p></> : <p>提交检索后查看候选上下文和明确标注的预设答案。</p>}</section>
      <section><h3>4 · 引用校验</h3>{submitted ? <div className={`feedback ${citation.valid ? 'success' : 'warning'}`} role="status">{citation.valid ? '引用来源可在本次候选中找到，且示例主张映射到教学标注的支持点。' : scenarioId === 'no-evidence' ? '无证据：应拒答或澄清。' : !citation.sourcesRetrieved ? '引用不在本次检索结果中，不能展示为已验证引用。' : '引用存在，但不支持该预设主张；应拒绝这项结论或重新核验。'}</div> : <p>运行后检查引用是否位于候选集并支持对应主张。</p>}</section>
    </div>
    {!submitted && <p className="small-note">选择任一预设场景后运行。检索匹配和结果标识都只在本机计算。</p>}
  </div>;
}

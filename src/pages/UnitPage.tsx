import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { allUnits } from '../data/courses';
import { lessonPresentation } from '../data/lessonPresentation';
import { lessons } from '../data/lessons';
import { deleteHighlight, getExercise, getHighlights, saveExercise, saveHighlight } from '../storage/db';
import { scoreQuiz } from '../domain/learning';
import type { ExerciseRecord, MasteryStatus, TextHighlight } from '../domain/types';
import type { useAcademy } from '../app/useAcademy';
import { ArchitectureLab, ContextLab, PromptLab, SamplingLab } from '../components/Experiments';
import { ApiDebugLab, RagFlowLab, StructuredOutputLab, ToolCallingLab } from '../components/ExperimentsBatch2';
import { EmphasizedText, HighlightedParagraph } from '../components/StudyText';

type FloatingAction = { mode: 'add' | 'remove' | 'invalid'; left: number; top: number; highlightId?: string };
type SavedSelection = { unitId: string; passageId: string; quote: string; startOffset: number; endOffset: number; passageText: string; range: Range };
function floatingPosition(rect: DOMRect) {
  const width = 132;
  const left = Math.max(8, Math.min(window.innerWidth - width - 8, (rect.left + rect.right) / 2 - width / 2));
  const preferredTop = rect.top >= 56 ? rect.top - 48 : rect.bottom + 8;
  return { left, top: Math.max(8, Math.min(window.innerHeight - 48, preferredTop)) };
}

export function UnitPage({ a }: { a: ReturnType<typeof useAcademy> }) {
  const { id = '' } = useParams();
  const unit = allUnits.find(item => item.id === id);
  const lesson = lessons[id];
  const presentation = lessonPresentation[id];
  const current = a.progress.find(item => item.unitId === id);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [exerciseLoadedFor, setExerciseLoadedFor] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scenarioAnswer, setScenarioAnswer] = useState('');
  const [rubric, setRubric] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [highlightMessage, setHighlightMessage] = useState('');
  const [highlightLoadError, setHighlightLoadError] = useState('');
  const [floating, setFloating] = useState<FloatingAction | null>(null);
  const savedSelection = useRef<SavedSelection | null>(null);
  const toolbarPointerActive = useRef(false);

  useEffect(() => {
    savedSelection.current = null;
    toolbarPointerActive.current = false;
    setFloating(null);
    if (!lesson) return;
    let active = true;
    setExerciseLoadedFor('');
    setHighlights([]);
    setHighlightMessage('');
    setHighlightLoadError('');
    Promise.all([getExercise(id), getHighlights(id)]).then(([exercise, marks]) => {
      if (!active) return;
      setHighlights(marks);
      if (exercise) {
        setAnswers(exercise.quizAnswers);
        setSubmitted(!!exercise.quizSubmitted);
        setScenarioAnswer(exercise.scenarioAnswer);
        setRubric(exercise.rubricScores);
      } else {
        setAnswers({});
        setSubmitted(false);
        setScenarioAnswer('');
        setRubric({});
      }
      setExerciseLoadedFor(id);
    }).catch(error => {
      if (!active) return;
      const message = error instanceof Error ? error.message : '本地学习记录读取失败。';
      setHighlightLoadError(message);
      setHighlightMessage(message);
      setSaved(false);
      setExerciseLoadedFor(id);
    });
    return () => { active = false; };
  }, [id, lesson]);

  useEffect(() => {
    const selectionChanged = (event?: Event) => {
      const eventTarget = event?.target instanceof Element ? event.target : null;
      if (eventTarget?.closest('.selection-popover') || toolbarPointerActive.current) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        savedSelection.current = null;
        setFloating(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const elementFor = (node: Node): Element | null => node.nodeType === Node.ELEMENT_NODE ? node as Element : node.parentElement;
      const startElement = elementFor(range.startContainer);
      const endElement = elementFor(range.endContainer);
      const blocked = '.experiment, .lab, .quiz-item, button, input, textarea, select, pre, code, [contenteditable="true"]';
      if (startElement?.closest(blocked) || endElement?.closest(blocked)) {
        setFloating(null);
        return;
      }
      const startTarget = startElement?.closest<HTMLElement>('[data-highlight-target]');
      const endTarget = endElement?.closest<HTMLElement>('[data-highlight-target]');
      if (!startTarget && !endTarget) {
        savedSelection.current = null;
        setFloating(null);
        return;
      }
      const position = floatingPosition(range.getBoundingClientRect());
      if (!startTarget || startTarget !== endTarget || !startTarget.closest('.lesson-section, .lesson-case')) {
        savedSelection.current = null;
        setFloating({ mode: 'invalid', ...position });
        return;
      }
      const passageText = startTarget.textContent ?? '';
      const startRange = document.createRange();
      startRange.selectNodeContents(startTarget);
      startRange.setEnd(range.startContainer, range.startOffset);
      const endRange = document.createRange();
      endRange.selectNodeContents(startTarget);
      endRange.setEnd(range.endContainer, range.endOffset);
      const quote = range.toString();
      savedSelection.current = {
        unitId: id,
        passageId: startTarget.dataset.highlightTarget ?? '',
        quote,
        startOffset: startRange.toString().length,
        endOffset: endRange.toString().length,
        passageText,
        range: range.cloneRange(),
      };
      setFloating({ mode: 'add', ...position });
    };
    const clickedOutside = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('.selection-popover, .study-highlight')) return;
      toolbarPointerActive.current = false;
      savedSelection.current = null;
      setFloating(null);
      window.getSelection()?.removeAllRanges();
    };
    document.addEventListener('selectionchange', selectionChanged);
    document.addEventListener('mouseup', selectionChanged);
    document.addEventListener('touchend', selectionChanged);
    window.addEventListener('scroll', selectionChanged, true);
    document.addEventListener('click', clickedOutside);
    return () => {
      document.removeEventListener('selectionchange', selectionChanged);
      document.removeEventListener('mouseup', selectionChanged);
      document.removeEventListener('touchend', selectionChanged);
      window.removeEventListener('scroll', selectionChanged, true);
      document.removeEventListener('click', clickedOutside);
    };
  }, [id, lesson]);

  if (!unit) return <section className="panel unit-detail"><h1>没有找到该课程</h1><Link to="/courses">返回课程地图</Link></section>;
  if (!lesson || unit.releaseStatus !== 'published') return <section className="panel unit-detail"><div className="eyebrow">{unit.moduleId} · {id}</div><h1>{unit.title}</h1><div className="notice">本单元尚未发布，当前为课程结构预览。课程内容发布后才能开始学习。</div><h2>学习目标</h2><ul>{unit.objectives.map(item => <li key={item}>{item}</li>)}</ul><h2>前置知识</h2><p>{unit.prerequisites.length ? unit.prerequisites.join('、') : '暂无前置要求'}</p><span className="planned">计划中</span><p><Link to="/courses">返回课程地图</Link></p></section>;

  const persist = async (extra: Partial<ExerciseRecord> = {}) => {
    const result = scoreQuiz(lesson.quiz, answers);
    const record: ExerciseRecord = { unitId: id, quizAnswers: answers, quizSubmitted: submitted, quizScore: submitted ? result.percent : undefined, scenarioAnswer, rubricScores: rubric, updatedAt: new Date().toISOString(), ...extra };
    try { await saveExercise(record); setSaved(true); }
    catch { setSaved(false); }
  };
  const addSelectedHighlight = async () => {
    const snapshot = savedSelection.current;
    if (!snapshot || snapshot.unitId !== id) { setHighlightMessage('选区已失效，请重新选中课程正文后再试。'); return; }
    const { quote, passageText, startOffset, endOffset, passageId } = snapshot;
    if (!quote.trim()) { setHighlightMessage('没有检测到可标记的文字。'); return; }
    if (snapshot.range.toString() !== quote) { savedSelection.current = null; setHighlightMessage('选中文本已经变化，请重新选择后再试。'); return; }
    if (highlights.some(mark => mark.passageId === passageId && mark.passageText === passageText && startOffset < mark.endOffset && endOffset > mark.startOffset)) {
      setHighlightMessage('这段文字与已有高亮重叠；请选取未标记的内容。');
      return;
    }
    const record: TextHighlight = {
      id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()) + '-' + Math.random().toString(36).slice(2),
      unitId: snapshot.unitId,
      passageId,
      quote,
      passageText,
      startOffset,
      endOffset,
      createdAt: new Date().toISOString()
    };
    try {
      await saveHighlight(record);
      setHighlights(previous => [...previous, record]);
      setHighlightMessage('高亮已保存在本机。');
      savedSelection.current = null;
      setFloating(null);
      window.getSelection()?.removeAllRanges();
    } catch (error) {
      setHighlightMessage(error instanceof Error ? error.message : '高亮保存失败，请检查本机存储后重试。');
    }
  };
  const openRemoveToolbar = (markId: string, rect: DOMRect) => {
    setFloating({ mode: 'remove', highlightId: markId, ...floatingPosition(rect) });
  };
  const removeHighlight = async (markId: string) => {
    try {
      await deleteHighlight(markId);
      setHighlights(previous => previous.filter(item => item.id !== markId));
      setHighlightMessage('已取消这处高亮。');
      setFloating(null);
    } catch (error) {
      setHighlightMessage(error instanceof Error ? error.message : '取消高亮失败，请稍后重试。');
    }
  };

  const passageTexts = new Map<string, string>();
  lesson.sections.forEach((section, sectionIndex) => section.body.forEach((text, paragraphIndex) => passageTexts.set(id + ':section:' + sectionIndex + ':paragraph:' + paragraphIndex, text)));
  lesson.caseStudy.body.forEach((text, index) => passageTexts.set(id + ':case:' + index, text));
  const staleHighlights = highlights.filter(mark => {
    const currentText = passageTexts.get(mark.passageId);
    return currentText !== mark.passageText || currentText?.slice(mark.startOffset, mark.endOffset) !== mark.quote;
  });
  const result = scoreQuiz(lesson.quiz, answers);
  const masteryLabels: Record<Exclude<MasteryStatus, 'verified'>, string> = { unassessed: '未评估', needs_review: '自评需要复习', understood: '自评基本理解' };

  return <article className="lesson">
    <Link className="back-link" to="/courses">← 课程地图</Link>
    <header className="lesson-header">
      <div className="eyebrow">{unit.moduleId} · {id} · 已发布</div>
      <h1>{unit.title}</h1>
      <p><EmphasizedText text={lesson.lead} emphasis={presentation.emphasis.lead}/></p>
    </header>
    <section className="highlight-info panel" aria-label="课程高亮">
      <div><strong>课程划重点</strong><span>选中正文同一段中的文字，高亮工具会出现在选区旁。</span></div>
      <span className="highlight-count">已保存 {highlights.length} 处</span>
      {highlightLoadError && <p className="highlight-message error-text" role="alert">{highlightLoadError}，高亮状态未能加载。</p>}
      {highlightMessage && !highlightLoadError && <p className="highlight-message" role="status">{highlightMessage}</p>}
      {staleHighlights.length > 0 && <p className="highlight-message warning-text" role="status">{staleHighlights.length} 处高亮对应的正文已更新，已暂不显示；原记录仍保留，你可以在下方移除。</p>}
      {highlights.length > 0 && <details className="highlight-list"><summary>查看已保存高亮</summary><ul>{highlights.map(mark => <li key={mark.id}><span>“{mark.quote.slice(0, 70)}{mark.quote.length > 70 ? '…' : ''}”{staleHighlights.some(item => item.id === mark.id) && <small>（正文版本已变化，未应用）</small>}</span><button className="text-button" onClick={() => void removeHighlight(mark.id)}>移除</button></li>)}</ul></details>}
    </section>
    <section className="panel">
      <h2>学习目标</h2><ul>{lesson.goals.map((text, index) => <li key={text}><EmphasizedText text={text} emphasis={presentation.emphasis['goal' + index]}/></li>)}</ul>
      <h3>前置知识</h3><ul>{lesson.prerequisites.map((text, index) => <li key={text}><EmphasizedText text={text} emphasis={presentation.emphasis['prerequisite' + index]}/></li>)}</ul>
    </section>
    {lesson.sections.map((section, sectionIndex) => <section className="panel lesson-section" key={section.title}>
      <div className="eyebrow">概念 {String(sectionIndex + 1).padStart(2, '0')}</div>
      <h2>{section.title}</h2>
      {section.body.map((text, paragraphIndex) => <HighlightedParagraph key={paragraphIndex} passageId={id + ':section:' + sectionIndex + ':paragraph:' + paragraphIndex} text={text} highlights={highlights} emphasis={presentation.emphasis['s' + sectionIndex + 'p' + paragraphIndex]} onHighlightClick={openRemoveToolbar}/>)}
      <div className="section-takeaway"><strong>本节重点</strong><span>{presentation.takeaways[sectionIndex]}</span></div>
      {section.diagram && <div className="diagram" role="img" aria-label={section.title + '流程'}>{section.diagram}</div>}
      {section.code && <pre>{section.code}</pre>}
    </section>)}
    <section className="panel lesson-case"><div className="eyebrow">产品案例</div><h2>{lesson.caseStudy.title}</h2>{lesson.caseStudy.body.map((text, index) => <HighlightedParagraph key={index} passageId={id + ':case:' + index} text={text} highlights={highlights} emphasis={presentation.emphasis['case' + index]} onHighlightClick={openRemoveToolbar}/>)}</section>
    <section className="panel"><h2>AI 产品经理视角</h2><ul>{lesson.pm.map((text, index) => <li key={text}><EmphasizedText text={text} emphasis={presentation.emphasis['pm' + index]}/></li>)}</ul><h2>FDE / AI 应用工程视角</h2><ul>{lesson.engineering.map((text, index) => <li key={text}><EmphasizedText text={text} emphasis={presentation.emphasis['eng' + index]}/></li>)}</ul></section>
    <section className="panel experiment"><div className="eyebrow">可重复实验 · 本地运行</div><h2>{id === 'U01' ? 'AI 应用架构搭建器' : id === 'U02' ? 'Token 与上下文预算模拟器' : id === 'U03' ? 'Prompt 版本对比实验室' : id === 'U04' ? '采样参数可视化' : id === 'U05' ? '结构化输出验证器' : id === 'U06' ? '模拟 API 调试台' : id === 'U07' ? '工具调用模拟器' : 'RAG 流程可视化'}</h2>{id === 'U01' ? <ArchitectureLab/> : id === 'U02' ? <ContextLab/> : id === 'U03' ? <PromptLab/> : id === 'U04' ? <SamplingLab/> : id === 'U05' ? <StructuredOutputLab/> : id === 'U06' ? <ApiDebugLab/> : id === 'U07' ? <ToolCallingLab/> : <RagFlowLab/>}</section>
    <section className="panel">
      <h2>知识理解题</h2><p>选择后提交判分；答题结果保存到本机 IndexedDB。阅读或答题不会自动把掌握度标记为通过。</p>
      {exerciseLoadedFor !== id && <p className="save-status" role="status">正在读取本机练习记录…</p>}
      {lesson.quiz.map((question, index) => <fieldset className="quiz-item" key={question.id}><legend>{index + 1}. {question.question}</legend>{question.choices.map((choice, choiceIndex) => <label className="choice" key={choice}><input type="radio" name={id + '-' + question.id} disabled={exerciseLoadedFor !== id} checked={answers[question.id] === choiceIndex} onChange={() => setAnswers(previous => ({ ...previous, [question.id]: choiceIndex }))}/>{choice}</label>)}{submitted && <div className={answers[question.id] === question.answer ? 'feedback success' : 'feedback warning'}>{answers[question.id] === question.answer ? '回答正确。' : '尚未答对。'}{question.explanation}</div>}</fieldset>)}
      <button className="button" disabled={exerciseLoadedFor !== id} onClick={() => { setSubmitted(true); void persist({ quizSubmitted: true, quizScore: result.percent }); }}>提交并判分</button>{submitted && <strong className="quiz-result">得分 {result.correct}/{result.total}（{result.percent}%）</strong>}
    </section>
    <section className="panel">
      <h2>业务场景练习与自评</h2><p>{lesson.scenario.prompt}</p><label className="field">你的作答<textarea rows={7} disabled={exerciseLoadedFor !== id} value={scenarioAnswer} onChange={event => setScenarioAnswer(event.target.value)} placeholder="写下你的方案、依据与边界处理。"/></label><button className="button" disabled={exerciseLoadedFor !== id} onClick={() => void persist()}>保存作答</button>
      <h3>Rubric 自评（每项 0–2）</h3>{lesson.scenario.rubric.map(item => <label className="rubric-row" key={item.id}><span><b>{item.label}</b><small>{item.description}</small></span><select disabled={exerciseLoadedFor !== id} value={rubric[item.id] ?? 0} onChange={event => { const next = { ...rubric, [item.id]: +event.target.value }; setRubric(next); void persist({ rubricScores: next }); }}><option value={0}>0 · 尚未体现</option><option value={1}>1 · 部分体现</option><option value={2}>2 · 充分体现</option></select></label>)}
      <details><summary>查看参考答案与常见错误</summary><h4>参考答案</h4><p>{lesson.scenario.reference}</p><h4>常见错误</h4><ul>{lesson.scenario.commonErrors.map(item => <li key={item}>{item}</li>)}</ul></details>
      <p className="save-status" role="status">{saved ? '练习记录已保存在本机。' : '修改后请保存作答；数据仅保存在本机。'}</p>
    </section>
    <section className="panel"><h2>常见误区</h2>{lesson.misconceptions.map(item => <div className="misconception" key={item.claim}><strong>误区：{item.claim}</strong><p>校正：{item.correction}</p></div>)}</section>
    <section className="panel"><h2>官方参考资料</h2><ul className="references">{lesson.references.map(reference => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title}</a> — {reference.topic}</li>)}</ul></section>
    <section className="panel">
      <h2>能力验收标准</h2><ul>{lesson.acceptance.map(item => <li key={item}>{item}</li>)}</ul><p>完成课程由你主动记录；掌握度由你自评。此页面没有正式能力验收机制，因此不会将状态设为“已通过验收”。</p>
      <div className="lesson-actions"><span>学习状态：{current?.learningStatus === 'completed' ? '已完成' : current?.learningStatus === 'in_progress' ? '学习中' : '未开始'}</span><button className="button secondary" onClick={() => void a.setStatus(id, 'in_progress')}>开始 / 继续学习</button><button className="button" onClick={() => void a.setStatus(id, 'completed')}>标记课程完成</button></div>
      <label className="field">知识掌握自评<select value={current?.masteryStatus === 'needs_review' ? 'needs_review' : current?.masteryStatus === 'understood' ? 'understood' : 'unassessed'} onChange={event => void a.setMastery(id, event.target.value as Exclude<MasteryStatus, 'verified'>)}>{Object.entries(masteryLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      <p>学习状态与掌握度分开保存；“已通过验收”需要未来正式能力评测证据，不能通过阅读或自评获得。</p>
    </section>
    {floating && <div className="selection-popover" role={floating.mode === 'invalid' ? 'status' : 'toolbar'} aria-label="文本高亮操作" style={{ left: floating.left, top: floating.top }} onPointerEnter={() => { toolbarPointerActive.current = true; }} onPointerLeave={() => { toolbarPointerActive.current = false; }} onPointerDown={event => { toolbarPointerActive.current = true; event.preventDefault(); }} onMouseDown={event => event.preventDefault()} onClick={event => event.stopPropagation()}>{floating.mode === 'invalid' ? <span>请在同一段落中选择文字</span> : <button onClick={() => { void (async () => { if (floating.mode === 'add') await addSelectedHighlight(); else await removeHighlight(floating.highlightId ?? ''); toolbarPointerActive.current = false; })(); }}>{floating.mode === 'add' ? '高亮' : '取消高亮'}</button>}</div>}
  </article>;
}

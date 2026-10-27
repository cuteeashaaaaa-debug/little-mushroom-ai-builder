import { courseModules } from '../data/courses';
import { useAcademy } from '../app/useAcademy';

export function CoursesPage({ a }: { a: ReturnType<typeof useAcademy> }) {
  return <><div className="page-heading"><div className="eyebrow">CURRICULUM</div><h1>课程地图</h1><p>五个模块，28 个学习单元。全部课程自由学习，不设时间锁。</p></div>{courseModules.map((m,i)=><section className="panel course-module" key={m.id}><div className="module-title"><span className="module-number">0{i+1}</span><div><div className="eyebrow">{m.id} · {m.units.length} UNITS</div><h2>{m.title}</h2><p>{m.description}</p></div></div><div className="unit-grid">{m.units.map(u=>{const p=a.progress.find(x=>x.unitId===u.id);const mastery=p?.masteryStatus==='needs_review'?'需要复习':p?.masteryStatus==='understood'?'基本理解':p?.masteryStatus==='verified'?'已通过验收':'未评估';return <article className="unit" key={u.id}><div className="unit-top"><span>{u.id}</span><span className="planned">计划中</span></div><h3>{u.title}</h3><p>{u.objectives[0]}</p><div className="unit-bottom"><span>掌握度：{mastery}</span><button disabled title="课程尚未发布">课程未发布</button></div></article>})}</div></section>)}</>;
}

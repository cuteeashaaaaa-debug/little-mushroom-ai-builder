import { NavLink } from 'react-router-dom';
import { Check, ChevronRight, Flame } from 'lucide-react';
import { allUnits, courseModules } from '../data/courses';
import { checkinStats, summarizeProgress } from '../domain/learning';
import { useAcademy } from '../app/useAcademy';
import { LearningEntry } from '../components/LearningEntry';

export function HomePage({ a }: { a: ReturnType<typeof useAcademy> }) {
  const stats = summarizeProgress(allUnits, a.progress);
  const check = checkinStats(a.checks);
  const recent = [...a.progress].filter(item=>allUnits.some(unit=>unit.id===item.unitId&&unit.releaseStatus==='published')).sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)).slice(0, 4);
  return <>
    <section className="hero"><div><div className="eyebrow">YOUR AI BUILDER JOURNEY</div><h1>把 AI 学习，变成<br/><em>真正的构建能力。</em></h1><p>为企业 AI 产品、解决方案与应用工程方向设计的个人学习路径。</p><NavLink className="button" to="/courses">探索课程地图 <ChevronRight/></NavLink></div><div className="hero-art"><img src={`${import.meta.env.BASE_URL}mushroom.svg`} /><span>从理解到构建</span></div></section>
    <LearningEntry units={allUnits} progress={a.progress} ready={a.ready} error={a.error} onStart={unitId=>a.setStatus(unitId,'in_progress')}/>
    <section className="stat-grid"><article className="stat"><span>已发布单元</span><strong>{stats.publishedCount}</strong><small>共 {allUnits.length} 个规划单元</small></article><article className="stat"><span>已完成单元</span><strong>{stats.completedCount}</strong><small>仅统计已发布课程</small></article><article className="stat"><span>学习进度</span><strong>{stats.percent}%</strong><div className="progress"><i style={{width:`${stats.percent}%`}}/></div></article><article className="stat"><span>连续打卡</span><strong>{check.streak}<small> 天</small></strong><small>累计 {check.total} 天</small></article></section>
    <div className="home-columns"><section className="panel"><div className="section-heading"><div><div className="eyebrow">LEARNING PATH</div><h2>课程地图</h2></div><NavLink to="/courses">查看全部 <ChevronRight/></NavLink></div><div className="module-list">{courseModules.map((m,i)=><NavLink className="module-row" to="/courses" key={m.id}><span className="module-number">0{i+1}</span><span><b>{m.title}</b><small>{m.units.length} 个单元 · 规划中</small></span><ChevronRight/></NavLink>)}</div></section><section className="panel check-panel"><div className="eyebrow">DAILY RHYTHM</div><h2>今天也来一点进步</h2><p>持续学习靠的是节奏，不是冲刺。</p><div className="streak"><Flame/><strong>{check.streak}</strong><span>天连续</span><i/>累计 {check.total} 天</div><button className="button" onClick={a.checkin} disabled={check.checkedInToday}>{check.checkedInToday?<><Check/> 今日已打卡</>:<>完成今日打卡</>}</button><NavLink className="text-link" to="/checkin">查看打卡日历 <ChevronRight/></NavLink></section></div>
    <section className="panel recent"><div className="eyebrow">RECENT ACTIVITY</div><h2>最近学习</h2>{!a.ready?<div className="empty">正在读取本地学习记录…</div>:a.error?<div className="feedback warning" role="alert">学习记录无法读取：{a.error}</div>:recent.length?recent.map(item=>{const unit=allUnits.find(u=>u.id===item.unitId);return unit?<NavLink className="recent-row" to={`/courses/${unit.id}`} key={item.unitId}><span>{item.unitId}</span><b>{unit.title}</b><small>{item.learningStatus==='completed'?'已完成':item.learningStatus==='in_progress'?'学习中':'未开始'}</small></NavLink>:null}):<div className="empty">还没有学习记录。选择一节新课开始学习后，记录会显示在这里。</div>}</section>
  </>;
}

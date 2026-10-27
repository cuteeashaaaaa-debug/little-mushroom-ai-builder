import { useState } from 'react';
import { CalendarDays, Check, Flame } from 'lucide-react';
import { checkinStats, monthCalendar } from '../domain/learning';
import { useAcademy } from '../app/useAcademy';

export function CheckinPage({ a }: { a: ReturnType<typeof useAcademy> }) {
  const today = new Date();
  const [year,setYear] = useState(today.getFullYear());
  const [month,setMonth] = useState(today.getMonth()+1);
  const stats = checkinStats(a.checks);
  const calendar = monthCalendar(a.checks,year,month);
  const offset = new Date(year,month-1,1).getDay();
  const shift = (n:number) => { const d=new Date(year,month-1+n,1);setYear(d.getFullYear());setMonth(d.getMonth()+1); };
  return <><div className="page-heading"><div className="eyebrow">DAILY CHECK-IN</div><h1>学习打卡</h1><p>为自己的学习节奏留下一个小小的记号。</p></div><div className="check-layout"><section className="panel calendar-panel"><div className="calendar-heading"><button onClick={()=>shift(-1)}>‹</button><h2>{year}年{month}月</h2><button onClick={()=>shift(1)}>›</button></div><div className="calendar-grid">{['日','一','二','三','四','五','六'].map(d=><span className="weekday" key={d}>{d}</span>)}{Array.from({length:offset},(_,i)=><span key={`blank${i}`}/>)}{calendar.map(d=><span key={d.day} className={d.checked?'calendar-day checked':'calendar-day'}>{d.day}</span>)}</div><button className="button" onClick={a.checkin} disabled={stats.checkedInToday}>{stats.checkedInToday?<><Check/> 今天已打卡</>:<>完成今日打卡</>}</button></section><section className="panel check-summary"><div className="eyebrow">YOUR CONSISTENCY</div><div className="big-stat"><Flame/><strong>{stats.streak}</strong><span>连续打卡天数</span></div><div className="big-stat"><CalendarDays/><strong>{stats.total}</strong><span>累计打卡天数</span></div><p>打卡和课程进度彼此独立。漏打卡不会影响课程学习。</p></section></div></>;
}

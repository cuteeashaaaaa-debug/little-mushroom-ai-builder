import type { LearningStatus, UnitProgress } from './types';
export function transitionLearningStatus(current: LearningStatus, next: LearningStatus): LearningStatus { return current===next ? current : next; }
export function summarizeProgress(units: {id:string; releaseStatus:string}[], progress: UnitProgress[]) {
 const published=units.filter(u=>u.releaseStatus==='published'); const byId=new Map(progress.map(p=>[p.unitId,p])); const completed=published.filter(u=>byId.get(u.id)?.learningStatus==='completed').length;
 return { publishedCount:published.length, completedCount:completed, percent:published.length?Math.round(completed/published.length*100):0, inProgressCount:published.filter(u=>byId.get(u.id)?.learningStatus==='in_progress').length };
}
export function localDateKey(date=new Date()): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function addDays(key:string, delta:number):string { const [y,m,d]=key.split('-').map(Number); const date=new Date(y,m-1,d+delta); return localDateKey(date); }
export function checkinStats(records:{date:string}[],today=localDateKey()) { const days=new Set(records.map(r=>r.date)); let streak=0; let cursor=days.has(today)?today:addDays(today,-1); while(days.has(cursor)){streak++;cursor=addDays(cursor,-1)} return {total:days.size,streak,checkedInToday:days.has(today)}; }
export function monthCalendar(records:{date:string}[], year:number, month:number) { const marked=new Set(records.map(r=>r.date)); return Array.from({length:new Date(year,month,0).getDate()},(_,i)=>({day:i+1,checked:marked.has(`${year}-${String(month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`)})); }

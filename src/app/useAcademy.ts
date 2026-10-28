import { useEffect,useState } from 'react';
import { addCheckin, getAll, getPreference, savePreference, subscribeDatabaseStatus, updateProgress } from '../storage/db';
import { checkinStats,localDateKey } from '../domain/learning';
import type { Checkin,Preferences,UnitProgress } from '../domain/types';

export function useAcademy(){const [progress,setProgress]=useState<UnitProgress[]>([]);const [checks,setChecks]=useState<Checkin[]>([]);const [error,setError]=useState('');const [theme,setTheme]=useState<'light'|'dark'>('light');const [ready,setReady]=useState(false);
useEffect(()=>{const unsubscribe=subscribeDatabaseStatus(setError);Promise.all([getAll('progress'),getAll('checkins'),getPreference()]).then(([p,c,pref])=>{setProgress(p);setChecks(c);setError('');if(pref?.theme==='dark'||pref?.theme==='light')setTheme(pref.theme)}).catch(e=>setError(e instanceof Error?e.message:'本地学习记录读取失败')).finally(()=>setReady(true));return unsubscribe},[]);
const toggle=async()=>{const next=theme==='light'?'dark':'light';setTheme(next);try{await savePreference({key:'theme',theme:next} as Preferences)}catch(e){setError(e instanceof Error?e.message:'主题偏好保存失败')}};
const checkin=async()=>{if(!ready)return;try{setError('');await addCheckin(localDateKey());setChecks(await getAll('checkins'))}catch(e){setError(e instanceof Error?e.message:'打卡失败')}};
const setStatus=async(unitId:string,learningStatus:UnitProgress['learningStatus'])=>{await updateProgress(unitId,{learningStatus});setProgress(await getAll('progress'))};
const setMastery=async(unitId:string,masteryStatus:UnitProgress['masteryStatus'])=>{await updateProgress(unitId,{masteryStatus});setProgress(await getAll('progress'))};
return {progress,checks,error,theme,toggle,checkin,setStatus,setMastery,ready};}

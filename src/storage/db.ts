import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Checkin, Preferences, UnitProgress } from '../domain/types';
interface AcademyDB extends DBSchema { courses:{key:string;value:{id:string}}; progress:{key:string;value:UnitProgress}; checkins:{key:string;value:Checkin}; preferences:{key:string;value:Preferences} }
let connection:Promise<IDBPDatabase<AcademyDB>>|undefined;
export function database(){ if(!globalThis.indexedDB) return Promise.reject(new Error('此浏览器不支持 IndexedDB。')); if(!connection) connection=openDB<AcademyDB>('little-mushroom-academy',1,{upgrade(db){db.createObjectStore('courses',{keyPath:'id'});db.createObjectStore('progress',{keyPath:'unitId'});db.createObjectStore('checkins',{keyPath:'date'});db.createObjectStore('preferences',{keyPath:'key'});}}).catch(e=>{connection=undefined;throw new Error(`本地数据库无法打开：${e instanceof Error?e.message:String(e)}`)}); return connection; }
export async function getAll<T extends 'progress'|'checkins'|'courses'|'preferences'>(store:T):Promise<AcademyDB[T]['value'][]> { return (await database()).getAll(store) as Promise<AcademyDB[T]['value'][]>; }
export async function saveProgress(value:UnitProgress){await (await database()).put('progress',value)}
export async function addCheckin(date:string){const db=await database();const tx=db.transaction('checkins','readwrite');const existing=await tx.store.get(date);if(!existing)await tx.store.put({date});await tx.done;return !existing}
export async function saveCourses(items:{id:string}[]){const db=await database();const tx=db.transaction('courses','readwrite');for(const item of items)await tx.store.put(item);await tx.done}
export async function getPreference(){return (await database()).get('preferences','theme')}
export async function savePreference(value:Preferences){await (await database()).put('preferences',value)}

import { NavLink } from 'react-router-dom';
import { BookOpen,CalendarDays,LayoutDashboard,Moon,Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAcademy } from '../app/useAcademy';

export function Shell({children,academy}:{children:ReactNode;academy:ReturnType<typeof useAcademy>}){return <div className={academy.theme==='dark'?'app dark':'app'}><header className="topbar"><NavLink to="/" className="brand"><img src={`${import.meta.env.BASE_URL}mushroom.svg`} /><span>小蘑菇AI Builder 研究院<small>Little Mushroom · AI Builder Academy</small></span></NavLink><nav><NavLink to="/" end><LayoutDashboard/>首页</NavLink><NavLink to="/courses"><BookOpen/>课程地图</NavLink><NavLink to="/checkin"><CalendarDays/>每日打卡</NavLink></nav><button className="theme" onClick={academy.toggle} aria-label="切换深浅色">{academy.theme==='light'?<Moon/>:<Sun/>}</button></header>{academy.error&&<div className="error">本地数据暂不可用：{academy.error}</div>}<main>{children}</main><footer>小蘑菇AI Builder 研究院 <span>· 本地优先，学习记录保存在此设备</span></footer></div>}
